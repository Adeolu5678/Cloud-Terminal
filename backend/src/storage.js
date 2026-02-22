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

// Public API
async function init() {
  await ensureDataDir();
  await readFileOrDefault(PROJECTS_FILE, []);
  await readFileOrDefault(SERVERS_FILE, []);
}

async function getProjects() {
  return readFileOrDefault(PROJECTS_FILE, []);
}

async function getServers() {
  return readFileOrDefault(SERVERS_FILE, []);
}

async function addProject({ name, path: projectPath, serverId }) {
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
}

async function editProject(id, updates) {
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
}

async function addServer({ name, host, user, password, port = 22 }) {
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
}

async function editServer(id, updates) {
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
}

async function removeProject(id) {
  const projects = await getProjects();
  const updated = projects.filter(p => p.id !== id);
  await writeFile(PROJECTS_FILE, updated);
}

async function removeServer(id) {
  const servers = await getServers();
  const updated = servers.filter(s => s.id !== id);
  await writeFile(SERVERS_FILE, updated);
}

module.exports = {
  init,
  getProjects,
  getServers,
  addProject,
  editProject,
  removeProject,
  addServer,
  editServer,
  removeServer
};
