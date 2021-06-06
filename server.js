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

//Only two connections for 2 players
const connections = [null, null];

//When a connection is made
io.on("connection", (socket) => {
  console.log("New socket connection");

  //Find player
  let playerIndex = -1;

  //Loop through and see if there is an open connection
  for (const i in connections) {
    if (connections[i] === null) {
      playerIndex = i;
      break;
    }
  }

  //send signal to app with player number
  socket.emit("player-number", playerIndex);

  console.log(`Player ${playerIndex} has connected`);

  //Ignore player 3 or higher, only room for 2
  if (playerIndex === -1) return;

  //Set if they are ready to false
  connections[playerIndex] = false;

  //send signal to all connections that a player has connected
  socket.broadcast.emit("player-connection", playerIndex);

  //WHen the conenction is lost
  socket.on("disconnect", () => {
    console.log(`Player ${playerIndex} disconnected`);
    connections[playerIndex] = null;

    socket.broadcast.emit("player-connection", playerIndex);
  });

  //When the server receives the player ready signal
  socket.on("player-ready", () => {
    socket.broadcast.emit("enemy-ready", playerIndex);
    connections[playerIndex] = true;
  });

  //Checks the status of other connections to update html page
  socket.on("check-players", () => {
    const players = [];
    for (const i in connections) {
      connections[i] === null
        ? players.push({ connected: false, ready: false })
        : players.push({ connected: true, ready: connections[i] });
    }
    socket.emit("check-players", players);
  });

  socket.on("move", (clicks) => {
    socket.broadcast.emit("move", clicks);
  });

  socket.on("move-reply", () => {
    socket.broadcast.emit("move-reply");
  });

  //Timeout if connection is longer than 10 minutes
  setTimeout(() => {
    connections[playerIndex] = null;
    socket.emit("timeout");
    socket.disconnect;
  }, 600000);
});
