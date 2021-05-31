const express = require("express");
const path = require("path");
const http = require("http");
const PORT = process.env.PORT || 5000;
const socketio = require("socket.io");
const app = express();
const server = http.createServer(app);
const io = socketio(server);

//set static folder
app.use(express.static(path.join(__dirname, "public")));

//start server
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Handle socket
const connections = [null, null];

io.on("connection", (socket) => {
  //console.log("New socket connection");

  //Find player
  let playerIndex = -1;
  for (const i in connections) {
    if (connections[i] === null) {
      playerIndex = i;
      break;
    }
  }

  socket.emit("player-number", playerIndex);

  console.log(`Player ${playerIndex} has connected`);

  //Ignore player 3
  if (playerIndex === -1) return;

  connections[playerIndex] = false;

  socket.broadcast.emit("player-connection", playerIndex);

  socket.on("disconnect", () => {
    console.log(`Player ${playerIndex} disconnected`);
    connections[playerIndex] = null;

    socket.broadcast.emit("player-connection", playerIndex);
  });

  socket.on("player-ready", () => {
    socket.broadcast.emit("enemy-ready", playerIndex);
    connections[playerIndex] = true;
  });

  socket.on("check-players", () => {
    const players = [];
    for (const i in connections) {
      connections[i] === null
        ? players.push({ connected: false, ready: false })
        : players.push({ connected: true, ready: connections[i] });
    }
    socket.emit("check-players", players);
  });
});
