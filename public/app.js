document.addEventListener("DOMContentLoaded", () => {
  const infoDisplay = document.querySelector("#infoMessage");
  const turnDisplay = document.querySelector("#turnMessage");
  const multiPlayerButton = document.querySelector("#multiPlayerButton");
  const startButton = document.querySelector("#startButton");
  let currentPlayer = "user";
  let gameMode = "";
  let playerNum = 0;
  let ready = false;
  let enemyReady = false;
  let pieceMoved = false;
  let isGameOver = false;

  multiPlayerButton.addEventListener("click", startMultiPlayer);

  function startMultiPlayer() {
    gameMode = "multiPlayer";
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
      if (ready) playGameMulti(socket);
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

    startButton.addEventListener("click", () => {
      playGameMulti(socket);
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

  function playGameMulti(socket) {
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
