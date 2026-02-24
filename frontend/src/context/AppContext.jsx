/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

const AppContext = createContext();

export function AppProvider({ socket, children }) {
  const [projects, setProjects] = useState([]);
  const [servers, setServers] = useState([]);
  const [terminals, setTerminals] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  
  // Track if we've received the first sync
  const [isSynced, setIsSynced] = useState(false);
  const [isConnected, setIsConnected] = useState(socket ? socket.connected : false);

  useEffect(() => {
    if (!socket) return;

    const handleSync = (data) => {
      setProjects(data.projects || []);
      setServers(data.servers || []);
      setTerminals(data.terminals || []);
      setActivityLogs(data.activity || []);
      setIsSynced(true);
    };

    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('config:sync', handleSync);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('config:sync', handleSync);
    };
  }, [socket]);

  const addProject = useCallback((projectData) => {
    return new Promise((resolve, reject) => {
      if (!socket) return reject(new Error("Socket not connected"));
      socket.emit('config:addProject', projectData, (response) => {
        if (response.success) resolve(response.project);
        else reject(new Error(response.error));
      });
    });
  }, [socket]);

  const addServer = useCallback((serverData) => {
    return new Promise((resolve, reject) => {
      if (!socket) return reject(new Error("Socket not connected"));
      socket.emit('config:addServer', serverData, (response) => {
        if (response.success) resolve(response.server);
        else reject(new Error(response.error));
      });
    });
  }, [socket]);

  const removeProject = useCallback((id) => {
    return new Promise((resolve, reject) => {
      if (!socket) return reject(new Error("Socket not connected"));
      socket.emit('config:removeProject', { id }, (response) => {
        if (response.success) resolve();
        else reject(new Error(response.error));
      });
    });
  }, [socket]);

  const removeServer = useCallback((id) => {
    return new Promise((resolve, reject) => {
      if (!socket) return reject(new Error("Socket not connected"));
      socket.emit('config:removeServer', { id }, (response) => {
        if (response.success) resolve();
        else reject(new Error(response.error));
      });
    });
  }, [socket]);

  const editProject = useCallback((id, updates) => {
    return new Promise((resolve, reject) => {
      if (!socket) return reject(new Error("Socket not connected"));
      socket.emit('config:editProject', { id, ...updates }, (response) => {
        if (response.success) resolve(response.project);
        else reject(new Error(response.error));
      });
    });
  }, [socket]);

  const editServer = useCallback((id, updates) => {
    return new Promise((resolve, reject) => {
      if (!socket) return reject(new Error("Socket not connected"));
      socket.emit('config:editServer', { id, ...updates }, (response) => {
        if (response.success) resolve(response.server);
        else reject(new Error(response.error));
      });
    });
  }, [socket]);

  const createTerminal = useCallback((type, refId) => {
    return new Promise((resolve, reject) => {
      if (!socket) return reject(new Error("Socket not connected"));
      socket.emit('terminal:create', { type, refId }, (response) => {
        if (response.success) resolve(response.terminalId);
        else reject(new Error(response.error));
      });
    });
  }, [socket]);

  const killTerminal = useCallback((terminalId) => {
    if (!socket) return;
    socket.emit('terminal:kill', { terminalId });
  }, [socket]);

  // File System Operations
  const fsList = useCallback((serverId, dirPath) => {
    return new Promise((resolve, reject) => {
      if (!socket) return reject(new Error("Socket not connected"));
      socket.emit('fs:list', { serverId, dirPath }, (response) => {
        if (response.success) resolve(response);
        else reject(new Error(response.error));
      });
    });
  }, [socket]);

  const fsRead = useCallback((serverId, filePath) => {
    return new Promise((resolve, reject) => {
      if (!socket) return reject(new Error("Socket not connected"));
      socket.emit('fs:read', { serverId, filePath }, (response) => {
        if (response.success) resolve(response);
        else reject(new Error(response.error));
      });
    });
  }, [socket]);

  const fsWrite = useCallback((serverId, filePath, content) => {
    return new Promise((resolve, reject) => {
      if (!socket) return reject(new Error("Socket not connected"));
      socket.emit('fs:write', { serverId, filePath, content }, (response) => {
        if (response.success) resolve(response);
        else reject(new Error(response.error));
      });
    });
  }, [socket]);

  const fsDelete = useCallback((serverId, filePath) => {
    return new Promise((resolve, reject) => {
      if (!socket) return reject(new Error("Socket not connected"));
      socket.emit('fs:delete', { serverId, filePath }, (response) => {
        if (response.success) resolve(response);
        else reject(new Error(response.error));
      });
    });
  }, [socket]);

  const fsRename = useCallback((serverId, oldPath, newPath) => {
    return new Promise((resolve, reject) => {
      if (!socket) return reject(new Error("Socket not connected"));
      socket.emit('fs:rename', { serverId, oldPath, newPath }, (response) => {
        if (response.success) resolve(response);
        else reject(new Error(response.error));
      });
    });
  }, [socket]);

  const fsMkdir = useCallback((serverId, dirPath) => {
    return new Promise((resolve, reject) => {
      if (!socket) return reject(new Error("Socket not connected"));
      socket.emit('fs:mkdir', { serverId, dirPath }, (response) => {
        if (response.success) resolve(response);
        else reject(new Error(response.error));
      });
    });
  }, [socket]);

  const value = {
    isSynced,
    isConnected,
    socket,
    projects,
    servers,
    terminals,
    activityLogs,
    addProject,
    addServer,
    editProject,
    editServer,
    removeProject,
    removeServer,
    createTerminal,
    killTerminal,
    fsList,
    fsRead,
    fsWrite,
    fsDelete,
    fsRename,
    fsMkdir
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
}
