const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');

function generateId() {
  return crypto.randomUUID();
}

const DATA_DIR = path.join(__dirname, '..', 'data');
const PROJECTS_FILE = path.join(DATA_DIR, 'projects.json');
const SERVERS_FILE = path.join(DATA_DIR, 'servers.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const ACTIVITY_FILE = path.join(DATA_DIR, 'activity.json');

// In-memory cache
let state = {
  projects: [],
  servers: [],
  users: [],
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
    return JSON.parse(data);
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
  state.users = await readFileOrDefault(USERS_FILE, []);
  state.activity = await readFileOrDefault(ACTIVITY_FILE, []);
}

async function getProjects() {
  return state.projects;
}

async function getServers() {
  return state.servers;
}

async function getUsers() {
  return state.users;
}

async function getActivity() {
  return state.activity;
}

async function logActivity(type, message) {
  return withLock(async () => {
    const newLog = {
      id: generateId(),
      type,
      message,
      createdAt: new Date().toISOString()
    };
    state.activity.unshift(newLog);
    // Keep only last 100 activities
    if (state.activity.length > 100) state.activity.length = 100;
    await writeAtomic(ACTIVITY_FILE, state.activity);
    return newLog;
  });
}

// No disk I/O in emitConfig!
async function emitConfig(io, terminalManager) {
  if (!io) return;
  try {
    const terminals = terminalManager ? terminalManager.getAllTerminals() : [];
    
    io.emit("config:sync", { 
      projects: state.projects, 
      servers: state.servers, 
      users: state.users, 
      activity: state.activity, 
      terminals 
    });
  } catch (err) {
    console.error("Failed to emit config:", err);
  }
}

async function addProject({ name, path: projectPath, serverId }) {
  return withLock(async () => {
    const newProject = {
      id: generateId(),
      name,
      path: projectPath,
      serverId: serverId || 'local', // defaults to local
      createdAt: new Date().toISOString()
    };
    state.projects.push(newProject);
    await writeAtomic(PROJECTS_FILE, state.projects);
    return newProject;
  });
}

async function editProject(id, updates) {
  return withLock(async () => {
    let updatedProject = null;
    state.projects = state.projects.map(p => {
      if (p.id === id) {
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

async function addServer({ name, host, user, password, port = 22 }) {
  return withLock(async () => {
    const newServer = {
      id: generateId(),
      name,
      host,
      user,
      password,
      port: parseInt(port, 10),
      createdAt: new Date().toISOString()
    };
    state.servers.push(newServer);
    await writeAtomic(SERVERS_FILE, state.servers);
    return newServer;
  });
}

async function editServer(id, updates) {
  return withLock(async () => {
    let updatedServer = null;
    state.servers = state.servers.map(s => {
      if (s.id === id) {
        updatedServer = { ...s, ...updates };
        return updatedServer;
      }
      return s;
    });
    if (updatedServer) {
      await writeAtomic(SERVERS_FILE, state.servers);
    }
    return updatedServer;
  });
}

async function removeProject(id) {
  return withLock(async () => {
    state.projects = state.projects.filter(p => p.id !== id);
    await writeAtomic(PROJECTS_FILE, state.projects);
  });
}

async function removeServer(id) {
  return withLock(async () => {
    state.servers = state.servers.filter(s => s.id !== id);
    await writeAtomic(SERVERS_FILE, state.servers);
  });
}

async function addUser(token, role = "admin") {
  return withLock(async () => {
    const newUser = {
      id: generateId(),
      token,
      role,
      createdAt: new Date().toISOString()
    };
    state.users.push(newUser);
    await writeAtomic(USERS_FILE, state.users);
    return newUser;
  });
}

async function removeUser(id) {
  return withLock(async () => {
    state.users = state.users.filter(u => u.id !== id);
    await writeAtomic(USERS_FILE, state.users);
  });
}

module.exports = {
  init,
  getProjects,
  getServers,
  getUsers,
  getActivity,
  addProject,
  editProject,
  removeProject,
  addServer,
  editServer,
  removeServer,
  addUser,
  removeUser,
  logActivity,
  emitConfig
};
