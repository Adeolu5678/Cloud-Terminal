const fs = require('fs/promises');
const path = require('path');
const os = require('os');
const { Client } = require('ssh2');
const storage = require('./storage');

// Utility to get an SSH client and SFTP session
const getSftp = async (serverId) => {
  return new Promise(async (resolve, reject) => {
    try {
      const servers = await storage.getServers();
      const server = servers.find(s => s.id === serverId);
      if (!server) return reject(new Error("Server not found"));

      const conn = new Client();
      conn.on('ready', () => {
        conn.sftp((err, sftp) => {
          if (err) {
            conn.end();
            return reject(err);
          }
          resolve({ conn, sftp });
        });
      }).on('error', (err) => {
        reject(err);
      }).connect({
        host: server.host,
        port: server.port,
        username: server.user,
        password: server.password,
        readyTimeout: 20000
      });
    } catch (err) {
      reject(err);
    }
  });
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

class FsService {
  async listDir(serverId, dirPath) {
    if (!serverId || serverId === 'local') {
      const targetPath = dirPath || os.homedir();
      const files = await fs.readdir(targetPath, { withFileTypes: true });
      const results = [];
      for (const file of files) {
        results.push({
          name: file.name,
          path: path.join(targetPath, file.name),
          isDirectory: file.isDirectory(),
          size: 0,
          mtime: 0
        });
      }
      return { path: targetPath, files: results.sort((a,b) => b.isDirectory - a.isDirectory || a.name.localeCompare(b.name)) };
    } else {
      let { conn, sftp } = await getSftp(serverId);
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
            if (err) {
              conn.end();
              return reject(err);
            }
            const files = list
              .filter(f => f.filename !== '.' && f.filename !== '..')
              .map(f => mapSftpAttrs(f, targetPath))
              .sort((a,b) => b.isDirectory - a.isDirectory || a.name.localeCompare(b.name));
            
            conn.end();
            resolve({ path: targetPath, files });
          });
        });
      });
    }
  }

  async readFile(serverId, filePath) {
    if (!serverId || serverId === 'local') {
      const content = await fs.readFile(filePath, 'utf8');
      return { path: filePath, content };
    } else {
      const { conn, sftp } = await getSftp(serverId);
      return new Promise((resolve, reject) => {
        sftp.readFile(filePath, 'utf8', (err, content) => {
          conn.end();
          if (err) return reject(err);
          resolve({ path: filePath, content });
        });
      });
    }
  }

  async writeFile(serverId, filePath, content) {
    if (!serverId || serverId === 'local') {
      await fs.writeFile(filePath, content, 'utf8');
      return { path: filePath, success: true };
    } else {
      const { conn, sftp } = await getSftp(serverId);
      return new Promise((resolve, reject) => {
        sftp.writeFile(filePath, content, 'utf8', (err) => {
          conn.end();
          if (err) return reject(err);
          resolve({ path: filePath, success: true });
        });
      });
    }
  }

  async deleteFile(serverId, filePath) {
    if (!serverId || serverId === 'local') {
      const stat = await fs.stat(filePath);
      if (stat.isDirectory()) {
        await fs.rm(filePath, { recursive: true, force: true });
      } else {
        await fs.unlink(filePath);
      }
      return { path: filePath, success: true };
    } else {
      const { conn, sftp } = await getSftp(serverId);
      return new Promise((resolve, reject) => {
        sftp.stat(filePath, (err, stats) => {
          if (err) { conn.end(); return reject(err); }
          const isDir = (stats.mode & 0o40000) === 0o40000;
          
          if (isDir) {
            // SFTP rmdir only works on empty dirs. Use exec for recursive delete.
            conn.exec(`rm -rf "${filePath}"`, (err, stream) => {
              if (err) { conn.end(); return reject(err); }
              stream.on('close', () => { conn.end(); resolve({ path: filePath, success: true }); });
            });
          } else {
            sftp.unlink(filePath, (err) => {
              conn.end();
              if (err) return reject(err);
              resolve({ path: filePath, success: true });
            });
          }
        });
      });
    }
  }

  async renameItem(serverId, oldPath, newPath) {
    if (!serverId || serverId === 'local') {
      await fs.rename(oldPath, newPath);
      return { oldPath, newPath, success: true };
    } else {
      const { conn, sftp } = await getSftp(serverId);
      return new Promise((resolve, reject) => {
        sftp.rename(oldPath, newPath, (err) => {
          conn.end();
          if (err) return reject(err);
          resolve({ oldPath, newPath, success: true });
        });
      });
    }
  }

  async mkDir(serverId, dirPath) {
    if (!serverId || serverId === 'local') {
      await fs.mkdir(dirPath, { recursive: true });
      return { path: dirPath, success: true };
    } else {
      const { conn, sftp } = await getSftp(serverId);
      return new Promise((resolve, reject) => {
        // SFTP mkdir doesn't do recursive. Use exec
        conn.exec(`mkdir -p "${dirPath}"`, (err, stream) => {
          if (err) { conn.end(); return reject(err); }
          stream.on('close', () => { conn.end(); resolve({ path: dirPath, success: true }); });
        });
      });
    }
  }
}

module.exports = new FsService();
