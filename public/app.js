import {board} from '../backend/chess.js';
document.addEventListener("DOMContentLoaded", () => {
  const grid = document.querySelector(".grid");
  const infoDisplay = document.querySelector("#infoMessage");
  const turnDisplay = document.querySelector("#turnMessage");
  const joinGameButton = document.querySelector("#joinGameButton");
  const readyButton = document.querySelector("#readyButton");
  const squares = [];
  const width = 8;
  let currentPlayer = "user";
  let playerNum = 0;
  let ready = false;
  let enemyReady = false;
  let isGameOver = false;
  const gameboard = board();
  gameboard.initialize();

  joinGameButton.addEventListener("click", start);

  function start() {
    const socket = io();

    socket.on("player-number", (num) => {
      if (num === -1) {
        infoDisplay.innerHtml = "Sorry, the server is full";
      } else {
        playerNum = parseInt(num);
        if (playerNum === 1) currentPlayer = "enemy";

        console.log(playerNum);
        socket.emit("check-players");
      }
    });

    socket.on("player-connection", (num) => {
      console.log(`Player number ${num} has connected or disconnected`);
      playerConnectedOrDisconnected(num);
    });

    socket.on("enemy-ready", (num) => {
      enemyReady = true;
      playerReady(num);
      if (ready) playGame(socket);
    });

    socket.on("check-players", (players) => {
      players.forEach((p, i) => {
        if (p.connected) playerConnectedOrDisconnected(i);
        if (p.ready) {
          playerReady(i);
          if (i != playerReady) enemyReady = true;
        }
      });
    });

    socket.on("timeout", () => {
      infoDisplay.innerHTML = "You have reached the 10 min limit";
    });

    readyButton.addEventListener("click", () => {
      playGame(socket);
    });

    function playerConnectedOrDisconnected(num) {
      let player = `.p${parseInt(num) + 1}`;
      document
        .querySelector(`${player} .connected span`)
        .classList.toggle("green");
      if (parseInt(num) === playerNum)
        document.querySelector(player).style.fontWeight = "bold";
    }
  }

  function createBoard(grid, squares){
    for(let i = 0; i < width*width; i++){
      const square = document.createElement('div');
      square.dataset.id = i;
      grid.appendChild(square);
      squares.push(square);
    }
  }
  createBoard(grid, squares);

  function playGame(socket) {
    if (isGameOver) return;
    if (!ready) {
      socket.emit("player-ready");
      ready = true;
      playerReady(playerNum);
    }

    if (enemyReady) {
      if (currentPlayer === "user") {
        turnDisplay.innerHTML = "Your Go";
      }
      if (currentPlayer === "enemy") {
        turnDisplay.innerHTML = "Enemy's Go";
      }
    }
  }

  function playerReady(num) {
    let player = `.p${parseInt(num) + 1}`;
    document.querySelector(`${player} .ready span`).classList.toggle("green");
  }
});