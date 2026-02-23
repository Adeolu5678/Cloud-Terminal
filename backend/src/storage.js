const fs = require('fs/promises');
const path = require('path');
// Use crypto for IDs
const crypto = require('crypto');
function generateId() {
  return crypto.randomUUID();
}

const DATA_DIR = path.join(__dirname, '..', 'data');
const PROJECTS_FILE = path.join(DATA_DIR, 'projects.json');
const SERVERS_FILE = path.join(DATA_DIR, 'servers.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const ACTIVITY_FILE = path.join(DATA_DIR, 'activity.json');

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
      await fs.writeFile(filePath, JSON.stringify(defaultData, null, 2), 'utf8');
      return defaultData;
    }
    throw err;
  }
}

async function writeFile(filePath, data) {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
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
  await readFileOrDefault(PROJECTS_FILE, []);
  await readFileOrDefault(SERVERS_FILE, []);
  await readFileOrDefault(USERS_FILE, []);
  await readFileOrDefault(ACTIVITY_FILE, []);
}

async function getProjects() {
  return readFileOrDefault(PROJECTS_FILE, []);
}

async function getServers() {
  return readFileOrDefault(SERVERS_FILE, []);
}

async function getUsers() {
  return readFileOrDefault(USERS_FILE, []);
}

async function getActivity() {
  return readFileOrDefault(ACTIVITY_FILE, []);
}

async function logActivity(type, message) {
  return withLock(async () => {
    const logs = await getActivity();
    const newLog = {
      id: generateId(),
      type,
      message,
      createdAt: new Date().toISOString()
    };
    logs.unshift(newLog);
    // Keep only last 100 activities
    if (logs.length > 100) logs.length = 100;
    await writeFile(ACTIVITY_FILE, logs);
    return newLog;
  });
}

async function emitConfig(io, terminalManager) {
  if (!io) return;
  try {
    const projects = await getProjects();
    const servers = await getServers();
    const users = await getUsers();
    const activity = await getActivity();
    
    // terminalManager might be passed in, or we might just omit terminals if not provided
    const terminals = terminalManager ? terminalManager.getAllTerminals() : [];
    
    io.emit("config:sync", { projects, servers, users, activity, terminals });
  } catch (err) {
    console.error("Failed to emit config:", err);
  }
}

async function addProject({ name, path: projectPath, serverId }) {
  return withLock(async () => {
    const projects = await getProjects();
    const newProject = {
      id: generateId(),
      name,
      path: projectPath,
      serverId: serverId || 'local', // defaults to local
      createdAt: new Date().toISOString()
    };
    projects.push(newProject);
    await writeFile(PROJECTS_FILE, projects);
    return newProject;
  });
}

async function editProject(id, updates) {
  return withLock(async () => {
    const projects = await getProjects();
    let updatedProject = null;
    const updated = projects.map(p => {
      if (p.id === id) {
        updatedProject = { ...p, ...updates };
        return updatedProject;
      }
      return p;
    });
    if (updatedProject) {
      await writeFile(PROJECTS_FILE, updated);
    }
    return updatedProject;
  });
}

async function addServer({ name, host, user, password, port = 22 }) {
  return withLock(async () => {
    const servers = await getServers();
    const newServer = {
      id: generateId(),
      name,
      host,
      user,
      password,
      port: parseInt(port, 10),
      createdAt: new Date().toISOString()
    };
    servers.push(newServer);
    await writeFile(SERVERS_FILE, servers);
    return newServer;
  });
}

async function editServer(id, updates) {
  return withLock(async () => {
    const servers = await getServers();
    let updatedServer = null;
    const updated = servers.map(s => {
      if (s.id === id) {
        updatedServer = { ...s, ...updates };
        return updatedServer;
      }
      return s;
    });
    if (updatedServer) {
      await writeFile(SERVERS_FILE, updated);
    }
    return updatedServer;
  });
}

async function removeProject(id) {
  return withLock(async () => {
    const projects = await getProjects();
    const updated = projects.filter(p => p.id !== id);
    await writeFile(PROJECTS_FILE, updated);
  });
}

async function removeServer(id) {
  return withLock(async () => {
    const servers = await getServers();
    const updated = servers.filter(s => s.id !== id);
    await writeFile(SERVERS_FILE, updated);
  });
}

async function addUser(token, role = "admin") {
  return withLock(async () => {
    const users = await getUsers();
    const newUser = {
      id: generateId(),
      token,
      role,
      createdAt: new Date().toISOString()
    };
    users.push(newUser);
    await writeFile(USERS_FILE, users);
    return newUser;
  });
}

async function removeUser(id) {
  return withLock(async () => {
    const users = await getUsers();
    const updated = users.filter(u => u.id !== id);
    await writeFile(USERS_FILE, updated);
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
