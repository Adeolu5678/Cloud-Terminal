const fs = require('fs/promises');
const path = require('path');
const os = require('os');
const { Client } = require('ssh2');
const storage = require('./storage');

// Utility to safely escape shell arguments
const escapeShellArg = (arg) => {
  return `'${String(arg).replace(/'/g, "'\\''")}'`;
};

const sftpPool = new Map();

// Utility to get an SSH client and SFTP session from pool
const getSftp = async (userId, serverId) => {
  const poolKey = `${userId}:${serverId}`;
  const existing = sftpPool.get(poolKey);
  
  if (existing) {
    if (existing instanceof Promise) return existing;
    clearTimeout(existing.timeout);
    existing.timeout = setTimeout(() => {
      existing.conn.end();
      sftpPool.delete(poolKey);
    }, 5 * 60 * 1000); // 5 minutes idle timeout
    return existing;
  }

  const connectPromise = new Promise(async (resolve, reject) => {
    try {
      const servers = await storage.getServers(userId, true);
      const server = servers.find(s => s.id === serverId);
      if (!server) {
        sftpPool.delete(poolKey);
        return reject(new Error("Server not found"));
      }

      const conn = new Client();
      
      const onReady = () => {
        conn.sftp((err, sftp) => {
          if (err) {
            conn.end();
            sftpPool.delete(poolKey);
            return reject(err);
          }
          
          // Reassign error handler to prevent unhandled rejections after promise resolves
          conn.removeAllListeners('error');
          conn.on('error', (err) => {
            console.error(`[SFTP Error] Pool connection ${poolKey} failed:`, err.message);
            sftpPool.delete(poolKey);
            conn.end();
          });
          conn.on('close', () => {
             sftpPool.delete(poolKey);
          });
          
          const session = { conn, sftp, timeout: null };
          session.timeout = setTimeout(() => {
            conn.end();
            sftpPool.delete(poolKey);
          }, 5 * 60 * 1000);
          
          sftpPool.set(poolKey, session);
          resolve(session);
        });
      };
      
      conn.on('ready', onReady).on('error', (err) => {
        sftpPool.delete(poolKey);
        reject(err);
      }).connect({
        host: server.host,
        port: server.port,
        username: server.user,
        password: server.password,
        readyTimeout: 20000
      });
    } catch (err) {
      sftpPool.delete(poolKey);
      reject(err);
    }
  });

  sftpPool.set(poolKey, connectPromise);
  return connectPromise;
};

const mapSftpAttrs = (file, basePath) => ({
  name: file.filename,
  path: path.posix.join(basePath, file.filename),
  isDirectory: (file.attrs.mode & 0o40000) === 0o40000,
  size: file.attrs.size,
  mtime: file.attrs.mtime * 1000 // Convert to ms
});

const mapLocalStats = (name, stats, basePath) => ({
  name,
  path: path.join(basePath, name),
  isDirectory: stats.isDirectory(),
  size: stats.size,
  mtime: stats.mtimeMs
});

async function resolveSafeLocalPath(userId, inputPath) {
  if (process.env.ALLOW_LOCAL_ENV !== 'true') {
     throw new Error("Unauthorized or local access disabled. Set ALLOW_LOCAL_ENV=true to manage the host machine.");
  }

  if (!inputPath) return os.homedir();
  const resolvedPath = path.resolve(inputPath);
  
  if (resolvedPath.indexOf('\0') !== -1) {
    throw new Error("Invalid path string");
  }

  // Allow access if path falls under user's home dir or one of their declared projects
  const allowedRoots = [path.resolve(os.homedir())];
  const projects = await storage.getProjects(userId);
  projects.forEach(p => {
    if (!p.serverId || p.serverId === 'local') {
      allowedRoots.push(path.resolve(p.path));
    }
  });

  // If the directory the user wants to access is inside an allowed root, or IS an allowed root, it's safe.
  const isAllowed = allowedRoots.some(root => 
    resolvedPath === root || resolvedPath.startsWith(root + path.sep)
  );

  if (!isAllowed) {
    throw new Error("Path traversal forbidden. Path outside of Home Directory or Project Workspaces.");
  }
  return resolvedPath;
}

class FsService {
  async listDir(userId, serverId, dirPath) {
    if (!serverId || serverId === 'local') {
      const targetPath = await resolveSafeLocalPath(userId, dirPath);
      const files = await fs.readdir(targetPath, { withFileTypes: true });
      const results = [];
      for (const file of files) {
        let size = 0;
        let mtime = 0;
        try {
          const stat = await fs.stat(path.join(targetPath, file.name));
          size = stat.size;
          mtime = stat.mtimeMs;
        } catch (e) {
          // ignore stat errors on unreadable files
        }
        results.push({
          name: file.name,
          path: path.join(targetPath, file.name),
          isDirectory: file.isDirectory(),
          size,
          mtime
        });
      }
      return { path: targetPath, files: results.sort((a,b) => b.isDirectory - a.isDirectory || a.name.localeCompare(b.name)) };
    } else {
      let { conn, sftp } = await getSftp(userId, serverId);
      return new Promise((resolve, reject) => {
        // If dirPath is empty, fetch user home env via ssh exec
        const resolvePath = dirPath ? Promise.resolve(dirPath) : new Promise((res, rej) => {
          conn.exec('pwd', (err, stream) => {
            if (err) return res('/');
            let data = '';
            stream.on('data', d => data += d.toString()).on('close', () => res(data.trim() || '/'));
          });
        });

        resolvePath.then((targetPath) => {
          sftp.readdir(targetPath, (err, list) => {
            if (err) return reject(err);
            const files = list
              .filter(f => f.filename !== '.' && f.filename !== '..')
              .map(f => mapSftpAttrs(f, targetPath))
              .sort((a,b) => b.isDirectory - a.isDirectory || a.name.localeCompare(b.name));
            
            resolve({ path: targetPath, files });
          });
        });
      });
    }
  }

  async readFile(userId, serverId, filePath) {
    if (!serverId || serverId === 'local') {
      const targetPath = await resolveSafeLocalPath(userId, filePath);
      const content = await fs.readFile(targetPath, 'utf8');
      return { path: targetPath, content };
    } else {
      const { sftp } = await getSftp(userId, serverId);
      return new Promise((resolve, reject) => {
        sftp.readFile(filePath, 'utf8', (err, content) => {
          if (err) return reject(err);
          resolve({ path: filePath, content });
        });
      });
    }
  }

  async writeFile(userId, serverId, filePath, content) {
    if (!serverId || serverId === 'local') {
      const targetPath = await resolveSafeLocalPath(userId, filePath);
      await fs.writeFile(targetPath, content, 'utf8');
      return { path: targetPath, success: true };
    } else {
      const { sftp } = await getSftp(userId, serverId);
      return new Promise((resolve, reject) => {
        sftp.writeFile(filePath, content, 'utf8', (err) => {
          if (err) return reject(err);
          resolve({ path: filePath, success: true });
        });
      });
    }
  }

  async deleteFile(userId, serverId, filePath) {
    if (!serverId || serverId === 'local') {
      const targetPath = await resolveSafeLocalPath(userId, filePath);
      const stat = await fs.stat(targetPath);
      if (stat.isDirectory()) {
        await fs.rm(targetPath, { recursive: true, force: true });
      } else {
        await fs.unlink(targetPath);
      }
      return { path: targetPath, success: true };
    } else {
      const { conn, sftp } = await getSftp(userId, serverId);
      return new Promise((resolve, reject) => {
        sftp.stat(filePath, (err, stats) => {
          if (err) return reject(err);
          const isDir = (stats.mode & 0o40000) === 0o40000;
          
          if (isDir) {
            // SFTP rmdir only works on empty dirs. Use exec for recursive delete.
            conn.exec(`rm -rf -- ${escapeShellArg(filePath)}`, (err, stream) => {
              if (err) return reject(err);
              stream.on('close', () => { resolve({ path: filePath, success: true }); });
            });
          } else {
            sftp.unlink(filePath, (err) => {
              if (err) return reject(err);
              resolve({ path: filePath, success: true });
            });
          }
        });
      });
    }
  }

  async renameItem(userId, serverId, oldPath, newPath) {
    if (!serverId || serverId === 'local') {
      const targetOldPath = await resolveSafeLocalPath(userId, oldPath);
      const targetNewPath = await resolveSafeLocalPath(userId, newPath);
      await fs.rename(targetOldPath, targetNewPath);
      return { oldPath: targetOldPath, newPath: targetNewPath, success: true };
    } else {
      const { sftp } = await getSftp(userId, serverId);
      return new Promise((resolve, reject) => {
        sftp.rename(oldPath, newPath, (err) => {
          if (err) return reject(err);
          resolve({ oldPath, newPath, success: true });
        });
      });
    }
  }

  async mkDir(userId, serverId, dirPath) {
    if (!serverId || serverId === 'local') {
      const targetPath = await resolveSafeLocalPath(userId, dirPath);
      await fs.mkdir(targetPath, { recursive: true });
      return { path: targetPath, success: true };
    } else {
      const { conn } = await getSftp(userId, serverId);
      return new Promise((resolve, reject) => {
        // SFTP mkdir doesn't do recursive. Use exec
        conn.exec(`mkdir -p -- ${escapeShellArg(dirPath)}`, (err, stream) => {
          if (err) return reject(err);
          stream.on('close', () => { resolve({ path: dirPath, success: true }); });
        });
      });
    }
  }
}

module.exports = new FsService();
