const { isAuthorized } = require("./auth");
const terminalManager = require("./terminalManager");
const storage = require("./storage");
const fsService = require("./fsService");

function registerSocketServer(io, config) {
  // Global terminal events
  terminalManager.on('output', (id, data) => {
    io.emit(`terminal:output:${id}`, { data });
  });

  terminalManager.on('exit', (id) => {
    io.emit(`terminal:exit:${id}`);
    storage.getProjects().then(projects => {
      storage.getServers().then(servers => {
        io.emit("config:sync", { projects, servers, terminals: terminalManager.getAllTerminals() });
      });
    }).catch(console.error);
  });

  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;

    const authorized = await isAuthorized(token, config.authToken);
    if (!authorized) {
      return next(new Error("Unauthorized"));
    }

    return next();
  });

  io.on("connection", async (socket) => {
    // Send initial config state
    const emitConfig = async () => {
      await storage.emitConfig(io, terminalManager);
    };

    await emitConfig();

    // Configuration Management
    socket.on("config:addProject", async (data, callback) => {
      try {
        const project = await storage.addProject(data);
        await emitConfig();
        if (callback) callback({ success: true, project });
      } catch (err) {
        if (callback) callback({ success: false, error: err.message });
      }
    });

    socket.on("config:addServer", async (data, callback) => {
      try {
        const server = await storage.addServer(data);
        await emitConfig();
        if (callback) callback({ success: true, server });
      } catch (err) {
        if (callback) callback({ success: false, error: err.message });
      }
    });

    socket.on("config:editProject", async (data, callback) => {
      try {
        const { id, ...updates } = data;
        const project = await storage.editProject(id, updates);
        await emitConfig();
        if (callback) callback({ success: true, project });
      } catch (err) {
        if (callback) callback({ success: false, error: err.message });
      }
    });

    socket.on("config:editServer", async (data, callback) => {
      try {
        const { id, ...updates } = data;
        const server = await storage.editServer(id, updates);
        await emitConfig();
        if (callback) callback({ success: true, server });
      } catch (err) {
        if (callback) callback({ success: false, error: err.message });
      }
    });

    socket.on("config:removeProject", async ({ id }, callback) => {
      try {
        await storage.removeProject(id);
        await emitConfig();
        if (callback) callback({ success: true });
      } catch (err) {
        if (callback) callback({ success: false, error: err.message });
      }
    });

    socket.on("config:removeServer", async ({ id }, callback) => {
      try {
        await storage.removeServer(id);
        await emitConfig();
        if (callback) callback({ success: true });
      } catch (err) {
        if (callback) callback({ success: false, error: err.message });
      }
    });

    socket.on("config:addUser", async (data, callback) => {
      try {
        const user = await storage.addUser(data.token, data.role);
        await storage.logActivity("auth", `New access token generated for role: ${data.role || "admin"}`);
        await emitConfig();
        if (callback) callback({ success: true, user });
      } catch (err) {
        if (callback) callback({ success: false, error: err.message });
      }
    });

    socket.on("config:removeUser", async ({ id }, callback) => {
      try {
        await storage.removeUser(id);
        await storage.logActivity("auth", `Access token revoked.`);
        await emitConfig();
        if (callback) callback({ success: true });
      } catch (err) {
        if (callback) callback({ success: false, error: err.message });
      }
    });

    // Terminal Management
    socket.on("terminal:create", async (options, callback) => {
      try {
        const terminal = await terminalManager.createTerminal(options);
        await storage.logActivity("terminal", `Session created: ${terminal.name}`);
        await emitConfig();
        if (callback) callback({ success: true, terminalId: terminal.id });
      } catch (err) {
        console.error("Failed to create terminal:", err);
        if (callback) callback({ success: false, error: err.message });
      }
    });

    socket.on("terminal:requestHistory", ({ terminalId }) => {
      if (terminalId) {
        const history = terminalManager.getHistory(terminalId);
        if (history) {
          socket.emit(`terminal:output:${terminalId}`, { data: history });
        }
      }
    });

    socket.on("terminal:input", ({ terminalId, data }) => {
      if (typeof data === "string" && terminalId) {
        terminalManager.writeTerminal(terminalId, data);
      }
    });

    socket.on("terminal:resize", ({ terminalId, cols, rows }) => {
      if (terminalId && Number.isInteger(cols) && Number.isInteger(rows)) {
        terminalManager.resizeTerminal(terminalId, cols, rows);
      }
    });

    socket.on("terminal:kill", async ({ terminalId }) => {
      const termInfo = terminalManager.getAllTerminals().find(t => t.id === terminalId);
      if (termInfo) {
        await storage.logActivity("terminal", `Session terminated: ${termInfo.name}`);
      }
      terminalManager.killTerminal(terminalId);
      emitConfig();
    });

    socket.on("terminal:rename", async ({ terminalId, name }) => {
      console.log("RECEIVED terminal:rename", { terminalId, name });
      if (terminalId && name) {
        terminalManager.renameTerminal(terminalId, name);
        await storage.logActivity("terminal", `Session renamed: ${name}`);
        emitConfig();
      }
    });

    // File System Management
    socket.on("fs:list", async ({ serverId, dirPath }, callback) => {
      try {
        const result = await fsService.listDir(serverId, dirPath);
        if (callback) callback({ success: true, ...result });
      } catch (err) {
        if (callback) callback({ success: false, error: err.message });
      }
    });

    socket.on("fs:read", async ({ serverId, filePath }, callback) => {
      try {
        const result = await fsService.readFile(serverId, filePath);
        if (callback) callback({ success: true, ...result });
      } catch (err) {
        if (callback) callback({ success: false, error: err.message });
      }
    });

    socket.on("fs:write", async ({ serverId, filePath, content }, callback) => {
      try {
        const result = await fsService.writeFile(serverId, filePath, content);
        if (callback) callback({ success: true, ...result });
      } catch (err) {
        if (callback) callback({ success: false, error: err.message });
      }
    });

    socket.on("fs:delete", async ({ serverId, filePath }, callback) => {
      try {
        const result = await fsService.deleteFile(serverId, filePath);
        if (callback) callback({ success: true, ...result });
      } catch (err) {
        if (callback) callback({ success: false, error: err.message });
      }
    });

    socket.on("fs:rename", async ({ serverId, oldPath, newPath }, callback) => {
      try {
        const result = await fsService.renameItem(serverId, oldPath, newPath);
        if (callback) callback({ success: true, ...result });
      } catch (err) {
        if (callback) callback({ success: false, error: err.message });
      }
    });

    socket.on("fs:mkdir", async ({ serverId, dirPath }, callback) => {
      try {
        const result = await fsService.mkDir(serverId, dirPath);
        if (callback) callback({ success: true, ...result });
      } catch (err) {
        if (callback) callback({ success: false, error: err.message });
      }
    });

    // We don't automatically kill terminals on socket disconnect anymore, 
    // to allow them to persist as background tasks!
    socket.on("disconnect", () => {
      // no-op, terminals survive disconnects!
    });
  });
}

module.exports = { registerSocketServer };
