const { io } = require("socket.io-client");

const socket = io("http://localhost:3000", {
  auth: { token: "change-me" },
  transports: ["websocket"],
});

socket.on("connect", () => {
  console.log("Connected to backend", socket.id);
  
  socket.emit("terminal:create", { type: "local", refId: null }, (res) => {
    console.log("Created terminal:", res);
    
    if (res.success) {
      const termId = res.terminalId;
      console.log("Renaming terminal", termId, "to 'My Renamed Term'");
      socket.emit("terminal:rename", { terminalId: termId, name: "My Renamed Term" });
    }
  });
});

let syncCount = 0;
socket.on("config:sync", (data) => {
  syncCount++;
  console.log(`config:sync (#${syncCount}) received. Terminals:`, data.terminals);
  if (syncCount === 2) { // 1 for connect, 2 for after rename (if emitted)
    console.log("Test finished.");
    process.exit(0);
  }
});

socket.on("connect_error", (err) => {
  console.error("Connection error:", err);
  process.exit(1);
});
