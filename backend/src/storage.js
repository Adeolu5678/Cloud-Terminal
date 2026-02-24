const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef';
const ALGORITHM = 'aes-256-gcm';

function encrypt(text) {
  if (!text) return null;
  const iv = crypto.randomBytes(16);
  const key = crypto.createHash('sha256').update(String(ENCRYPTION_KEY)).digest();
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${encrypted}:${authTag}`;
}

function decrypt(encryptedText) {
  if (!encryptedText) return null;
  const parts = encryptedText.split(':');
  if (parts.length !== 3) return encryptedText; // Legacy fallback
  try {
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const authTag = Buffer.from(parts[2], 'hex');
    const key = crypto.createHash('sha256').update(String(ENCRYPTION_KEY)).digest();
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    console.error("Decryption failed:", err);
    return null;
  }
}

function generateId() {
  return crypto.randomUUID();
}

const DATA_DIR = path.join(__dirname, '..', 'data');
const PROJECTS_FILE = path.join(DATA_DIR, 'projects.json');
const SERVERS_FILE = path.join(DATA_DIR, 'servers.json');
const ACTIVITY_FILE = path.join(DATA_DIR, 'activity.json');

// In-memory cache
let state = {
  projects: [],
  servers: [],
  activity: [],
};

async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR);
  } catch (err) {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

async function readFileOrDefault(filePath, defaultData) {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    const parsed = JSON.parse(data);
    // Return only items that have a userId, essentially wiping old single-user data
    if (Array.isArray(parsed)) {
      return parsed.filter(item => item.userId);
    }
    return parsed;
  } catch (err) {
    if (err.code === 'ENOENT') {
      await writeAtomic(filePath, defaultData);
      return defaultData;
    }
    throw err;
  }
}

// Atomic write to prevent file corruption
async function writeAtomic(filePath, data) {
  const tmpPath = `${filePath}.${generateId()}.tmp`;
  await fs.writeFile(tmpPath, JSON.stringify(data, null, 2), 'utf8');
  await fs.rename(tmpPath, filePath);
}

let writeMutex = Promise.resolve();
async function withLock(fn) {
  const previous = writeMutex;
  let release;
  writeMutex = new Promise(r => { release = r; });
  try {
    await previous;
    return await fn();
  } finally {
    release();
  }
}

// Public API
async function init() {
  await ensureDataDir();
  state.projects = await readFileOrDefault(PROJECTS_FILE, []);
  state.servers = await readFileOrDefault(SERVERS_FILE, []);
  state.activity = await readFileOrDefault(ACTIVITY_FILE, []);
  
  // Re-save files if we wiped old single-user data in memory
  await writeAtomic(PROJECTS_FILE, state.projects);
  await writeAtomic(SERVERS_FILE, state.servers);
  await writeAtomic(ACTIVITY_FILE, state.activity);
}

async function getProjects(userId) {
  return state.projects.filter(p => p.userId === userId);
}

async function getServers(userId, includePassword = false) {
  return state.servers.filter(s => s.userId === userId).map(s => {
    const sCopy = { ...s };
    if (includePassword) {
      if (sCopy.password) sCopy.password = decrypt(sCopy.password);
    } else {
      delete sCopy.password;
      sCopy.hasPassword = !!s.password;
    }
    return sCopy;
  });
}

async function getActivity(userId) {
  return state.activity.filter(a => a.userId === userId);
}

async function logActivity(userId, type, message) {
  return withLock(async () => {
    const newLog = {
      id: generateId(),
      userId,
      type,
      message,
      createdAt: new Date().toISOString()
    };
    state.activity.unshift(newLog);
    
    // Keep only last 500 activities PER USER
    let userCount = 0;
    const activitiesToKeep = [];
    for (let i = 0; i < state.activity.length; i++) {
       const act = state.activity[i];
       if (act.userId === userId) {
          userCount++;
          if (userCount <= 500) activitiesToKeep.push(act);
       } else {
          activitiesToKeep.push(act);
       }
    }
    state.activity = activitiesToKeep;
    
    await writeAtomic(ACTIVITY_FILE, state.activity);
    return newLog;
  });
}

// Emits config to a specific user's socket room
async function emitConfig(io, terminalManager, userId) {
  if (!io || !userId) return;
  try {
    const terminals = terminalManager ? terminalManager.getAllTerminals().filter(t => t.userId === userId) : [];
    
    io.to(`user:${userId}`).emit("config:sync", { 
      projects: await getProjects(userId), 
      servers: await getServers(userId), 
      activity: await getActivity(userId), 
      terminals 
    });
  } catch (err) {
    console.error("Failed to emit config:", err);
  }
}

async function addProject(userId, { name, path: projectPath, serverId }) {
  return withLock(async () => {
    const newProject = {
      id: generateId(),
      userId,
      name,
      path: projectPath,
      serverId: serverId || 'local', 
      createdAt: new Date().toISOString()
    };
    state.projects.push(newProject);
    await writeAtomic(PROJECTS_FILE, state.projects);
    return newProject;
  });
}

async function editProject(userId, id, updates) {
  return withLock(async () => {
    let updatedProject = null;
    state.projects = state.projects.map(p => {
      if (p.id === id && p.userId === userId) {
        updatedProject = { ...p, ...updates };
        return updatedProject;
      }
      return p;
    });
    if (updatedProject) {
      await writeAtomic(PROJECTS_FILE, state.projects);
    }
    return updatedProject;
  });
}

async function addServer(userId, { name, host, user, password, port = 22 }) {
  return withLock(async () => {
    const newServer = {
      id: generateId(),
      userId,
      name,
      host,
      user,
      password: encrypt(password),
      port: parseInt(port, 10),
      createdAt: new Date().toISOString()
    };
    state.servers.push(newServer);
    await writeAtomic(SERVERS_FILE, state.servers);
    const { password: _, ...serverWithoutPassword } = newServer;
    return serverWithoutPassword;
  });
}

async function editServer(userId, id, updates) {
  return withLock(async () => {
    let updatedServer = null;
    let safeUpdates = { ...updates };
    if (safeUpdates.password) {
      safeUpdates.password = encrypt(safeUpdates.password);
    } else {
      delete safeUpdates.password; // Do not overwrite with undefined if omitted
    }

    state.servers = state.servers.map(s => {
      if (s.id === id && s.userId === userId) {
        updatedServer = { ...s, ...safeUpdates };
        return updatedServer;
      }
      return s;
    });
    if (updatedServer) {
      await writeAtomic(SERVERS_FILE, state.servers);
      const { password: _, ...serverWithoutPassword } = updatedServer;
      return serverWithoutPassword;
    }
    return updatedServer;
  });
}

async function removeProject(userId, id) {
  return withLock(async () => {
    state.projects = state.projects.filter(p => !(p.id === id && p.userId === userId));
    await writeAtomic(PROJECTS_FILE, state.projects);
  });
}

async function removeServer(userId, id) {
  return withLock(async () => {
    const oldServersLength = state.servers.length;
    state.servers = state.servers.filter(s => !(s.id === id && s.userId === userId));
    
    if (state.servers.length !== oldServersLength) {
       await writeAtomic(SERVERS_FILE, state.servers);
       
       // Cascade delete projects referencing this server
       const oldProjectsLength = state.projects.length;
       state.projects = state.projects.filter(p => !(p.serverId === id && p.userId === userId));
       if (state.projects.length !== oldProjectsLength) {
          await writeAtomic(PROJECTS_FILE, state.projects);
       }
    }
  });
}

module.exports = {
  init,
  getProjects,
  getServers,
  getActivity,
  addProject,
  editProject,
  removeProject,
  addServer,
  editServer,
  removeServer,
  logActivity,
  emitConfig
};
