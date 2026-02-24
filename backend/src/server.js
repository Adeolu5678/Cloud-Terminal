const http = require("node:http");
const path = require("node:path");
const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const { Server } = require("socket.io");
const dotenv = require("dotenv");
const { init } = require("./storage");
const { registerSocketServer } = require("./socket");

dotenv.config({ path: path.resolve(process.cwd(), "../.env") });

const app = express();

// Initialize JSON database
init().catch(console.error);
const defaultOrigins = ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"];
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",")
      .map((origin) => origin.trim())
      .filter((origin) => origin.length > 0)
  : defaultOrigins;

app.use(cors({ origin: allowedOrigins }));

app.set('trust proxy', 1);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per window
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: allowedOrigins },
});

registerSocketServer(io, {
  tmuxSessionName: process.env.TMUX_SESSION_NAME || "cloud-term",
});

const port = Number(process.env.PORT || 3000);
server.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Cloud Terminal backend listening on :${port}`);
});
