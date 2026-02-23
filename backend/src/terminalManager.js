const pty = require('node-pty');
const { Client } = require('ssh2');
const crypto = require('crypto');
const os = require('os');
const EventEmitter = require('events');
const { getProjects, getServers } = require('./storage');

const isWindows = os.platform() === 'win32';
const defaultShell = isWindows ? 'powershell.exe' : (process.env.SHELL || 'bash');

const escapeShellArg = (arg) => {
  return `'${String(arg).replace(/'/g, "'\\''")}'`;
};

class TerminalManager extends EventEmitter {
  constructor() {
    super();
    this.terminals = new Map();
  }

  // Generate a unique ID for a terminal
  generateId() {
    return crypto.randomUUID();
  }

  // Create a new terminal session
  async createTerminal(options = {}) {
    const { type, refId, cols = 120, rows = 30 } = options;
    const id = this.generateId();
    
    return new Promise(async (resolve, reject) => {
      try {
        let name = 'Local Terminal';
        let cwd = process.env.HOME || process.cwd();

        if (type === 'project' && refId) {
          const projects = await getProjects();
          const project = projects.find(p => p.id === refId);
          if (project) {
            cwd = project.path;
            name = `Project: ${project.name}`;
          } else {
            return reject(new Error("Project not found"));
          }

          if (project.serverId && project.serverId !== 'local') {
            const servers = await getServers();
            const server = servers.find(s => s.id === project.serverId);
            if (!server) {
              return reject(new Error("Associated environment not found"));
            }

            const conn = new Client();
            conn.on('ready', () => {
              conn.shell({ term: 'xterm-color', cols, rows }, (err, stream) => {
                if (err) {
                  conn.end();
                  return reject(err);
                }

                stream.write(`cd ${escapeShellArg(project.path)} && clear || cls\n`);

                const normalizedPty = {
                  onData: (cb) => {
                    stream.on('data', (d) => cb(d.toString('utf8')));
                    return { dispose: () => stream.removeAllListeners('data') };
                  },
                  onExit: (cb) => {
                    stream.on('close', cb);
                    conn.on('end', cb);
                    return { dispose: () => {} };
                  },
                  write: (data) => stream.write(data),
                  resize: (c, r) => stream.setWindow(r, c, 0, 0),
                  kill: () => conn.end()
                };

                const terminal = {
                  id,
                  pty: normalizedPty,
                  options: { type, refId, name, cwd },
                  createdAt: new Date().toISOString(),
                  lastActive: new Date().toISOString(),
                  history: '',
                };

                this.terminals.set(id, terminal);

                normalizedPty.onData((data) => {
                  terminal.history += data;
                  if (terminal.history.length > 100000) terminal.history = terminal.history.slice(-50000);
                  this.emit('output', id, data);
                });

                normalizedPty.onExit(() => {
                  this.emit('exit', id);
                  this.killTerminal(id);
                });

                resolve(terminal);
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
            return;
          }

          // Spawn locally
          const ptyProcess = pty.spawn(defaultShell, [], {
            name: 'xterm-color',
            cols,
            rows,
            cwd,
            env: process.env,
          });

          const terminal = {
            id,
            pty: ptyProcess,
            options: { type, refId, name, cwd },
            createdAt: new Date().toISOString(),
            lastActive: new Date().toISOString(),
            history: '',
          };

          this.terminals.set(id, terminal);

          ptyProcess.onData((data) => {
            terminal.history += data;
            if (terminal.history.length > 100000) terminal.history = terminal.history.slice(-50000);
            this.emit('output', id, data);
          });

          ptyProcess.onExit(() => {
            this.emit('exit', id);
            this.killTerminal(id);
          });

          return resolve(terminal);

        } else if (type === 'server' && refId) {
          const servers = await getServers();
          const server = servers.find(s => s.id === refId);
          if (!server) {
            return reject(new Error("Server not found"));
          }

          name = `Server: ${server.name}`;
          const conn = new Client();

          conn.on('ready', () => {
            conn.shell({ term: 'xterm-color', cols, rows }, (err, stream) => {
              if (err) {
                conn.end();
                return reject(err);
              }

              // Normalize ssh2 stream to match node-pty interface
              const normalizedPty = {
                onData: (cb) => {
                  stream.on('data', (d) => cb(d.toString('utf8')));
                  return { dispose: () => stream.removeAllListeners('data') };
                },
                onExit: (cb) => {
                  stream.on('close', cb);
                  conn.on('end', cb);
                  return { dispose: () => {} };
                },
                write: (data) => stream.write(data),
                resize: (c, r) => stream.setWindow(r, c, 0, 0),
                kill: () => conn.end()
              };

              const terminal = {
                id,
                pty: normalizedPty,
                options: { type, refId, name, cwd: '' },
                createdAt: new Date().toISOString(),
                lastActive: new Date().toISOString(),
                history: '',
              };

              this.terminals.set(id, terminal);

              normalizedPty.onData((data) => {
                terminal.history += data;
                if (terminal.history.length > 100000) terminal.history = terminal.history.slice(-50000);
                this.emit('output', id, data);
              });

              normalizedPty.onExit(() => {
                this.emit('exit', id);
                this.killTerminal(id);
              });

              resolve(terminal);
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
        } else {
          // Default raw local terminal without project
          const ptyProcess = pty.spawn(defaultShell, [], {
            name: 'xterm-color',
            cols,
            rows,
            cwd,
            env: process.env,
          });

          const terminal = {
            id,
            pty: ptyProcess,
            options: { type: 'local', refId: null, name, cwd },
            createdAt: new Date().toISOString(),
            lastActive: new Date().toISOString(),
            history: '',
          };

          this.terminals.set(id, terminal);

          ptyProcess.onData((data) => {
            terminal.history += data;
            if (terminal.history.length > 100000) terminal.history = terminal.history.slice(-50000);
            this.emit('output', id, data);
          });

          ptyProcess.onExit(() => {
            this.emit('exit', id);
            this.killTerminal(id);
          });

          return resolve(terminal);
        }
      } catch (err) {
        reject(err);
      }
    });
  }

  getTerminal(id) {
    return this.terminals.get(id);
  }

  getHistory(id) {
    const terminal = this.terminals.get(id);
    return terminal ? terminal.history : '';
  }

  getAllTerminals() {
    return Array.from(this.terminals.values()).map(t => ({
      id: t.id,
      name: t.options.name,
      type: t.options.type,
      refId: t.options.refId,
      createdAt: t.createdAt,
      lastActive: t.lastActive
    }));
  }

  killTerminal(id) {
    const terminal = this.terminals.get(id);
    if (terminal) {
      terminal.pty.kill();
      this.terminals.delete(id);
    }
  }

  resizeTerminal(id, cols, rows) {
    const terminal = this.terminals.get(id);
    if (terminal && Number.isInteger(cols) && Number.isInteger(rows)) {
      terminal.pty.resize(cols, rows);
    }
  }

  writeTerminal(id, data) {
    const terminal = this.terminals.get(id);
    if (terminal) {
      terminal.lastActive = new Date().toISOString();
      terminal.pty.write(data);
    }
  }

  renameTerminal(id, newName) {
    const terminal = this.terminals.get(id);
    if (terminal) {
      terminal.options.name = newName;
      return true;
    }
    return false;
  }
}

// Singleton instance
const terminalManager = new TerminalManager();

module.exports = terminalManager;
