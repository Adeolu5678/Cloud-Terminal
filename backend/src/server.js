const http = require('node:http')
const path = require('node:path')
const express = require('express')
const cors = require('cors')
const { Server } = require('socket.io')
const dotenv = require('dotenv')
const { registerSocketServer } = require('./socket')

dotenv.config({ path: path.resolve(process.cwd(), '../.env') })

const app = express()
const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || '*'

app.use(cors({ origin: allowedOrigins }))

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

const server = http.createServer(app)
const io = new Server(server, {
  cors: { origin: allowedOrigins },
})

registerSocketServer(io, {
  authToken: process.env.SOCKET_AUTH_TOKEN || 'change-me',
  tmuxSessionName: process.env.TMUX_SESSION_NAME || 'cloud-term',
})

const port = Number(process.env.PORT || 3000)
server.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Cloud Terminal backend listening on :${port}`)
})
