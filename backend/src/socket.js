const { isAuthorized } = require("./auth");
const terminalManager = require("./terminalManager");
const storage = require("./storage");
const fsService = require("./fsService");

function registerSocketServer(io, config) {
  // Global terminal events
  terminalManager.on('output', (id, data) => {
    const term = terminalManager.getTerminal(id);
    if (term) {
      io.to(`user:${term.userId}`).emit(`terminal:output:${id}`, { data });
    }
  });

  terminalManager.on('exit', (id, userId) => {
    if (userId) {
      io.to(`user:${userId}`).emit(`terminal:exit:${id}`);
      storage.emitConfig(io, terminalManager, userId).catch(console.error);
    }
  });

  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;

    const authData = await isAuthorized(token);
    if (!authData || !authData.userId) {
      return next(new Error("Unauthorized"));
    }

    socket.userId = authData.userId;
    socket.tier = authData.tier;
    socket.join(`user:${authData.userId}`);
    return next();
  });

  io.on("connection", async (socket) => {
    const userId = socket.userId;

    // Send initial config state
    const emitConfig = async () => {
      await storage.emitConfig(io, terminalManager, userId);
    };

    await emitConfig();

    // Configuration Management
    socket.on("config:addProject", async (data, callback) => {
      try {
        const project = await storage.addProject(userId, data);
        if (callback) callback({ success: true, project });
      } catch (err) {
        if (callback) callback({ success: false, error: err.message });
      }
    });

    socket.on("config:addServer", async (data, callback) => {
      try {
        const server = await storage.addServer(userId, data);
        if (callback) callback({ success: true, server });
      } catch (err) {
        if (callback) callback({ success: false, error: err.message });
      }
    });

    socket.on("config:editProject", async (data, callback) => {
      try {
        const { id, ...updates } = data;
        const project = await storage.editProject(userId, id, updates);
        if (callback) callback({ success: true, project });
      } catch (err) {
        if (callback) callback({ success: false, error: err.message });
      }
    });

    socket.on("config:editServer", async (data, callback) => {
      try {
        const { id, ...updates } = data;
        const server = await storage.editServer(userId, id, updates);
        if (callback) callback({ success: true, server });
      } catch (err) {
        if (callback) callback({ success: false, error: err.message });
      }
    });

    socket.on("config:removeProject", async ({ id }, callback) => {
      try {
        await storage.removeProject(userId, id);
        if (callback) callback({ success: true });
      } catch (err) {
        if (callback) callback({ success: false, error: err.message });
      }
    });

    socket.on("config:removeServer", async ({ id }, callback) => {
      try {
        await storage.removeServer(userId, id);
        if (callback) callback({ success: true });
      } catch (err) {
        if (callback) callback({ success: false, error: err.message });
      }
    });

    socket.on("terminal:create", async (options, callback) => {
      try {
        const terminal = await terminalManager.createTerminal({ ...options, userId, tier: socket.tier });
        await storage.logActivity(userId, "terminal", `Session created: ${terminal.options.name}`);
        if (callback) callback({ success: true, terminalId: terminal.id });
      } catch (err) {
        console.error("Failed to create terminal:", err);
        if (callback) callback({ success: false, error: err.message });
      }
    });

    socket.on("terminal:requestHistory", ({ terminalId }) => {
      if (terminalId) {
        const term = terminalManager.getTerminal(terminalId);
        if (term && term.userId === userId) {
          const history = terminalManager.getHistory(terminalId);
          if (history) {
            socket.emit(`terminal:output:${terminalId}`, { data: history });
          }
        }
      }
    });

    socket.on("terminal:input", ({ terminalId, data }) => {
      if (typeof data === "string" && terminalId) {
        if (data.length > 50000) {
          console.warn(`[Socket] Dropped oversized terminal input from user ${userId}`);
          return;
        }
        const term = terminalManager.getTerminal(terminalId);
        if (term && term.userId === userId) {
          terminalManager.writeTerminal(terminalId, data);
        }
      }
    });

    socket.on("terminal:resize", ({ terminalId, cols, rows }) => {
      if (terminalId && Number.isInteger(cols) && Number.isInteger(rows)) {
        const term = terminalManager.getTerminal(terminalId);
        if (term && term.userId === userId) {
          terminalManager.resizeTerminal(terminalId, cols, rows);
        }
      }
    });

    socket.on("terminal:kill", async ({ terminalId }) => {
      const termInfo = terminalManager.getTerminal(terminalId);
      if (termInfo && termInfo.userId === userId) {
        await storage.logActivity(userId, "terminal", `Session terminated: ${termInfo.options.name}`);
        terminalManager.killTerminal(terminalId);
      }
    });

    socket.on("terminal:rename", async ({ terminalId, name }) => {
      if (terminalId && name) {
        const termInfo = terminalManager.getTerminal(terminalId);
        if (termInfo && termInfo.userId === userId) {
          terminalManager.renameTerminal(terminalId, name);
          await storage.logActivity(userId, "terminal", `Session renamed: ${name}`);
        }
      }
    });

    // File System Management
    // Currently these take serverId but they should also verify ownership
    // By getting the server, fsService operations inherently fail if we restrict to owned servers.
    // However fsService doesn't know userId right now. 
    // Ideally, we'd verify the user owns the server here before calling fsService.
    const verifyServerOwnership = async (serverId) => {
        const servers = await storage.getServers(userId);
        return servers.some(s => s.id === serverId);
    };

    socket.on("fs:list", async ({ serverId, dirPath }, callback) => {
      try {
        if (serverId !== 'local' && !(await verifyServerOwnership(serverId))) throw new Error("Unauthorized");
        const result = await fsService.listDir(userId, serverId, dirPath);
        if (callback) callback({ success: true, ...result });
      } catch (err) {
        if (callback) callback({ success: false, error: err.message });
      }
    });

    socket.on("fs:read", async ({ serverId, filePath }, callback) => {
      try {
        if (serverId !== 'local' && !(await verifyServerOwnership(serverId))) throw new Error("Unauthorized");
        const result = await fsService.readFile(userId, serverId, filePath);
        if (callback) callback({ success: true, ...result });
      } catch (err) {
        if (callback) callback({ success: false, error: err.message });
      }
    });

    socket.on("fs:write", async ({ serverId, filePath, content }, callback) => {
      try {
        if (typeof content !== 'string') throw new Error("Invalid content type");
        if (content.length > 5 * 1024 * 1024) throw new Error("File content exceeds 5MB limit");
        if (serverId !== 'local' && !(await verifyServerOwnership(serverId))) throw new Error("Unauthorized");
        const result = await fsService.writeFile(userId, serverId, filePath, content);
        if (callback) callback({ success: true, ...result });
      } catch (err) {
        if (callback) callback({ success: false, error: err.message });
      }
    });

    socket.on("fs:delete", async ({ serverId, filePath }, callback) => {
      try {
        if (serverId !== 'local' && !(await verifyServerOwnership(serverId))) throw new Error("Unauthorized");
        const result = await fsService.deleteFile(userId, serverId, filePath);
        if (callback) callback({ success: true, ...result });
      } catch (err) {
        if (callback) callback({ success: false, error: err.message });
      }
    });

    socket.on("fs:rename", async ({ serverId, oldPath, newPath }, callback) => {
      try {
        if (serverId !== 'local' && !(await verifyServerOwnership(serverId))) throw new Error("Unauthorized");
        const result = await fsService.renameItem(userId, serverId, oldPath, newPath);
        if (callback) callback({ success: true, ...result });
      } catch (err) {
        if (callback) callback({ success: false, error: err.message });
      }
    });

    socket.on("fs:mkdir", async ({ serverId, dirPath }, callback) => {
      try {
        if (serverId !== 'local' && !(await verifyServerOwnership(serverId))) throw new Error("Unauthorized");
        const result = await fsService.mkDir(userId, serverId, dirPath);
        if (callback) callback({ success: true, ...result });
      } catch (err) {
        if (callback) callback({ success: false, error: err.message });
      }
    });

    socket.on("disconnect", () => {
      // no-op
    });
  });
}

module.exports = { registerSocketServer };
