const pty = require('node-pty')
const { isAuthorized } = require('./auth')
const { ensureSession, listWindows, switchWindow } = require('./tmux')

function registerSocketServer(io, config) {
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token

    if (!isAuthorized(token, config.authToken)) {
      return next(new Error('Unauthorized'))
    }

    return next()
  })

  io.on('connection', async (socket) => {
    const cols = Number(socket.handshake.auth?.cols) || 120
    const rows = Number(socket.handshake.auth?.rows) || 30
    let term

    try {
      await ensureSession(config.tmuxSessionName)
      term = pty.spawn('tmux', ['attach', '-t', config.tmuxSessionName], {
        name: 'xterm-color',
        cols,
        rows,
        cwd: process.env.HOME,
        env: process.env,
      })
    } catch {
      term = pty.spawn(process.env.SHELL || 'bash', [], {
        name: 'xterm-color',
        cols,
        rows,
        cwd: process.env.HOME,
        env: process.env,
      })
      term.write('echo "tmux unavailable, started shell fallback."\r')
    }

    const emitWindows = async () => {
      try {
        const windows = await listWindows(config.tmuxSessionName)
        socket.emit('session:list', { windows })
      } catch {
        socket.emit('session:list', { windows: [] })
      }
    }

    term.onData((data) => socket.emit('terminal:output', { data }))
    term.onExit(() => socket.disconnect(true))

    socket.on('terminal:input', ({ data }) => {
      if (typeof data === 'string') {
        term.write(data)
      }
    })

    socket.on('terminal:resize', ({ cols: nextCols, rows: nextRows }) => {
      if (Number.isInteger(nextCols) && Number.isInteger(nextRows)) {
        term.resize(nextCols, nextRows)
      }
    })

    socket.on('session:list', emitWindows)

    socket.on('session:switch', async ({ windowIndex }) => {
      if (!Number.isInteger(windowIndex) || windowIndex < 0) return

      await switchWindow(config.tmuxSessionName, windowIndex)
      await emitWindows()
    })

    socket.on('disconnect', () => term.kill())

    await emitWindows()
  })
}

module.exports = { registerSocketServer }
