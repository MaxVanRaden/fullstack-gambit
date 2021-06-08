document.addEventListener("DOMContentLoaded", () => {
  const grid = document.querySelector(".grid");
  const infoDisplay = document.querySelector("#infoMessage");
  const turnDisplay = document.querySelector("#turnMessage");
  const joinGameButton = document.querySelector("#joinGameButton");
  const readyButton = document.querySelector("#readyButton");
  const resetButton = document.querySelector("#resetButton");
  const squares = [];
  const width = 8;
  let currentPlayer = "user";
  let playerNum = -1; // 0 (white/true) - 1 (black/false)
  let ready = false;
  let enemyReady = false;
  let isGameOver = false;
  let firstClick = -1;
  let secondClick = -1;
  const gameboard = new board();
  gameboard.initialize();

  joinGameButton.addEventListener("click", start);

  function start() {
    //If the player is already playing and has connected, do not start another connection
    if(playerNum != -1) return;
    
    //Start the socket connection
    const socket = io();

    //Sockets for player connection
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

    //When the player clicks ready start the game.
    readyButton.addEventListener("click", () => {
        playGame(socket);
    });

    //When the player clicks Concede and Reset
    resetButton.addEventListener("click", () =>{
        if(currentPlayer === "user" && ready && enemyReady){
            window.alert("You have conceded. Board is reset");
            resetBoard();
            socket.emit("reset");
        }else{
            window.alert("Cant reset yet");
        }
    });

    socket.on("reset", () => {
        window.alert("The other player has conceded. Board is reset.")
        resetBoard();
    });

    function resetBoard() {
        gameboard.initialize();
        updateBoard();
    }

    //Add event listeners to each square to know what move the user wants.
    squares.forEach(square => {
        square.addEventListener('click', () => {
            if(currentPlayer === 'user' && ready && enemyReady){
                if(firstClick === -1){
                    firstClick = square.dataset.id;
                    squares[firstClick].classList.add("clicked");
                    return;
                }
                if(square.dataset.id === firstClick){
                    squares[firstClick].classList.remove("clicked");
                    firstClick = -1;
                    return;
                }
                secondClick = square.dataset.id;

                let initRank = parseInt(squares[firstClick].dataset.rank);
                let initFile = parseInt(squares[firstClick].dataset.file);
                let destRank = parseInt(squares[secondClick].dataset.rank);
                let destFile = parseInt(squares[secondClick].dataset.file);
                let color = (playerNum === 0 ? true : false);

                let result = gameboard.move(initRank, initFile, destRank, destFile, color);

                if(result === 1){
                    let clicks = [firstClick, secondClick];
                    updateBoard();
                    socket.emit("move", clicks);
                }else{
                    switch(result){
                        case -1:
                            window.alert("You do not have a piece selected");
                            break;
                        case -2:
                            window.alert("The destination or origin square is out of bounds");
                            break;
                        case -3:
                            window.alert("You cannot move a piece to the square it is currently on");
                            break;
                        case -4:
                            window.alert("You cannot capture your own piece");
                            break;
                        case -5:
                            window.alert("You cannot move a piece that is pinned to your King");
                            break;
                        case -6:
                            window.alert("Your king is either in check, or this move would place it in check");
                            break;
                        case -7:
                            window.alert("Your piece's path to that square is blocked by another piece");
                            break;
                        case -8:
                            window.alert("That is not how that piece moves");
                            break;
                        case -9:
                            window.alert("Unrecognized piece type");
                            break;
                        case -10:
                            window.alert("You cannot move the other player's piece");
                            break;
                        default:
                            console.log(result);
                            window.alert("Unknown Error");
                            break;
                    }
                }
                squares[firstClick].classList.remove("clicked");
                firstClick = -1;
                secondClick = -1;
            }
        })
    });

    socket.on("move", (clicks) => {
        let initRank = parseInt(squares[clicks[0]].dataset.rank);
        let initFile = parseInt(squares[clicks[0]].dataset.file);
        let destRank = parseInt(squares[clicks[1]].dataset.rank);
        let destFile = parseInt(squares[clicks[1]].dataset.file);
        let color = (playerNum != 0 ? true : false);
        let result = gameboard.move(initRank, initFile, destRank, destFile, color);
        if(result != 1){
            window.alert("SOMETHING WENT VERY VERY WRONG");
        }
        updateBoard();
        currentPlayer = "user";
        turnDisplay.innerHTML = "Your Move";
        socket.emit("move-reply");
        playGame(socket);
    });

    socket.on("move-reply", () => {
        updateBoard();
        currentPlayer = "enemy";
        playGame(socket);
    });

    function playerConnectedOrDisconnected(num) {
      let player = `.p${parseInt(num) + 1}`;
      document
        .querySelector(`${player} .connected span`)
        .classList.toggle("green");
      if (parseInt(num) === playerNum){
        document.querySelector(player).style.fontWeight = "bold";
        }
    }
  }

  //Create the chess board
  function createBoard(grid, squares){
    for(let i = width-1; i >= 0; i--){
        let pos = i;
        for(let j = 0; j < width; j++){
            const square = document.createElement('div');
            const piece = gameboard.chessboard[i][j].myPiece
            square.dataset.id = (i*width) + j;
            square.dataset.rank = i;
            square.dataset.file = j;
            if(piece != null){
                square.classList.add(piece.name);
            }
            if(pos%2!=0){
                square.classList.add("white");
            }else{
                square.classList.add("black");
            }
            if(piece != null){
                if(piece.owner){
                    square.classList.add("player1");
                }else{
                    square.classList.add("player2");
                }
            }   

            pos++;
            grid.appendChild(square);
            squares.push(square);
            squares.sort(function(a, b){return a.dataset.id - b.dataset.id});
        }
    }
  }
  createBoard(grid, squares);

  function updateBoard(){
      for(let i = 0; i < width; i++){
          let pos = i;
          for(let j = 0; j < width; j++){
                let index = (i*width) + j;
                let piece = gameboard.chessboard[i][j].myPiece
                let curr = squares[index];
                curr.className = '';
                if(pos%2!=0){
                    curr.classList.add("white");
                }else{
                    curr.classList.add("black");
                }
                if(piece != null){
                    curr.classList.add(piece.name);
                    if(piece.owner){
                        curr.classList.add("player1");
                    }else{
                        curr.classList.add("player2");
                    }
                }  
                pos++; 
          }
      }
  }

  //Main function to play game
  function playGame(socket) {
    if (isGameOver) return;
    if (!ready) {
      socket.emit("player-ready");
      ready = true;
      playerReady(playerNum);
    }

    if (enemyReady) {
      if (currentPlayer === "user") {
        turnDisplay.innerHTML = "It is your turn";
      }
      if (currentPlayer === "enemy") {
        turnDisplay.innerHTML = "It is your enemy's turn";
      }
    }
  }

  function playerReady(num) {
    let player = `.p${parseInt(num) + 1}`;
    document.querySelector(`${player} .ready span`).classList.toggle("green");
  }
});




//------------------------------------------------------------------------------------------------------
//Written by Max Van Raden 
//Contains classes for handling the logical implentation of chess
//The structure is as follows: a board is made up of squares, which can contain pieces.
//The board is initialized with the correct number of squares and pieces for a standard chess starting position
//The board contains the monstrous check_move function, which takes the initial square and destination square as arguments
//and ensures that the move is legal. 

//Castling and en passant still require implementation 
class piece {
  constructor(owner, value, name) {
    this.hasMoved = false;
    this.owner = owner; 
    this.value = value; //point value of the piece, int
    this.name = name;
  }
}
class square {
  constructor() {
      this.myPiece = null;
  }
}
class board {
  constructor() {
      //initialize the 64 squares so that they can be accessed by this.chessboard[0][0] for A1, [0][1] for B1 and so on 
      this.chessboard = [
          [new square,  new square,  new square,  new square,  new square,  new square,  new square,  new square],
          [ new square,  new square,  new square,  new square,  new square,  new square,  new square,  new square],
          [ new square,  new square,  new square,  new square,  new square,  new square,  new square,  new square],
          [ new square,  new square,  new square,  new square,  new square,  new square,  new square,  new square],
          [ new square,  new square,  new square,  new square,  new square,  new square,  new square,  new square],
          [ new square,  new square,  new square,  new square,  new square,  new square,  new square,  new square],
          [ new square,  new square,  new square,  new square,  new square,  new square,  new square,  new square],
          [ new square,  new square,  new square,  new square,  new square,  new square,  new square,  new square]
      ]
  }
  initialize() {//multipurpose function - clears board and resets it to default position
       for(let i = 0; i < 8; ++i) {
           for(let k = 0; k < 8; ++k) {
               this.chessboard[i][k].myPiece = null;
           }
       }
      for(let i = 0; i < 8; i++) {
          for(let k = 0; k < 8; k++) {
              if(i == 0) { //rank is 1, white backrank 
                  if(k == 0 || k == 7) { // A1 and H1, white rooks
                      this.chessboard[i][k].myPiece = new piece(true, 5, 'Rook');
                  }
                  if(k == 1 || k == 6) { // B1 and G1, white knights
                      this.chessboard[i][k].myPiece = new piece(true, 3, 'Knight');
                  }
                  if(k == 2 || k == 5) { // C1 and F1, white bishops
                      this.chessboard[i][k].myPiece = new piece(true, 3, 'Bishop');
                  }
                  if(k == 3) { // D1, white queen
                      this.chessboard[i][k].myPiece = new piece(true, 9, 'Queen');
                  }
                  if(k == 4) { // E1, white king
                      this.chessboard[i][k].myPiece = new piece(true, Infinity, 'King');
                  }
              }
              else if(i == 1) { //Rank 2, white pawns 
                  this.chessboard[i][k].myPiece = new piece(true, 1, 'Pawn');
              }
              else if(i == 6) { //Rank 7, black pawns
                  this.chessboard[i][k].myPiece = new piece(false, 1, 'Pawn');
              }
              else if(i == 7) { //rank is 8, black backrank 
                  if(k == 0 || k == 7) { // A8 and H8, black rooks
                      this.chessboard[i][k].myPiece = new piece(false, 5, 'Rook');
                  }
                  if(k == 1 || k == 6) { // B8 and G8, black knights
                      this.chessboard[i][k].myPiece = new piece(false, 3, 'Knight');
                  }
                  if(k == 2 || k == 5) { // C8 and F8, black bishops
                      this.chessboard[i][k].myPiece = new piece(false, 3, 'Bishop');
                  }
                  if(k == 3) { // D8, black queen
                      this.chessboard[i][k].myPiece = new piece(false, 9, 'Queen');
                  }
                  if(k == 4) { // E8, black king
                      this.chessboard[i][k].myPiece = new piece(false, Infinity, 'King');
                  }
              }else{
                this.chessboard[i][k].myPiece = null;
              }
          }
      }
  }
  //TODO implement pin check - Done
  //TODO implement check check - Done
  //TODO implement piece movement rules - Done
  //TODO implement path checking - Done 
  //TODO implement en passant check - will require knowledge of previous move
  //TODO implement a castle check 
  
  //WHEN PASSING TO FUNCTION REMEMBER TO PASS IN THE ORDER [RANK][FILE], UNLIKE A CHESS MOVE
  //That is, the square C2 would be passed as [1][2] (because of zero indexing, C is 2 and 2 is 1)

  //This function checks that a move is legal, and returns an integer response indicating why a move isn't legal
  //if that is the case

  //initRank and initFile describe origin point of moving piece, destRank and destFile describe intended location
  //color represents the color of the player that is making the move, and enPassantRank and enPassantFile indicate
  //the position of a pawn that is valid for en passant capture 

  // RETURN ERROR CODES
  // -1 no piece, -2 out of bounds, -3 not moving, -4 self capture, -5 pinned, -6 in check, -7 blocking piece, -8 piece-specific move rule, -9 unrecognized piece type, -10 other player's piece 
  check_move(initRank, initFile, destRank, destFile, color, enPassantRank, enPassantFile) {  
      if(destRank > 7 || destRank < 0 || destFile > 7 || destFile < 0 || initRank > 7 || initRank < 0 || initFile > 7 || initFile < 0) {
          return -2; //out of board bounds error
      }
      if(!this.chessboard[initRank][initFile].myPiece){ //make sure that there is a piece at the initial square
          return -1; //no piece error
      }
      if(color != this.chessboard[initRank][initFile].myPiece.owner) {
          return -10; // Other players piece error
      }
      if(destRank == initRank && destFile == initFile) {
          return -3; //the move isn't a move error
      }
      if(this.chessboard[destRank][destFile].myPiece) {
          if(this.chessboard[destRank][destFile].myPiece.owner == this.chessboard[initRank][initFile].myPiece.owner) {
              return -4; //self-capture error - cannot capture own pieces 
          }
      }
      //
      // Pin check - separated because big function 
      // SEEMS TO BE UNNECCESSARY AFTER ADJUSTMENTS TO THE CHECK FUNCTION
      /*
      if(this.chessboard[initRank][initFile].myPiece.owner != 'King') { //A king cannot be pinned to itself, so skip this if the king moves 
          let kingFile = -1;
          let kingRank = -1;
          let isPinned = -1;
          for(let i = 0; i < 8; i++){ //Step one, locate the same side king by iterating through board
              for(let k = 0; k < 8; k++) {
                  if(this.chessboard[i][k].myPiece != null){
                      if(this.chessboard[i][k].myPiece.name == 'King' && this.chessboard[i][k].myPiece.owner == this.chessboard[initRank][initFile].myPiece.owner) { //locate same side king 
                          kingRank = i;
                          kingFile = k; 
                          break;       
                      }
                  }
              }
              if(kingFile != -1) {//stop looping once king is found
                  break;
              }
          }

          if(kingRank == initRank) { //king and piece on the same rank
              if(kingFile > initFile) {
                  for(let i = initFile+1; i < kingFile; i++){ //check if there is a piece between the king and the moving piece, if so, not pinned
                      if(this.chessboard[kingRank][i].myPiece != null) { //if the square is not empty, the moving piece is unpinned
                          isPinned = 0; //Not pinned
                      }
                      if(isPinned != -1) {
                          break;
                      }
                  }
                  if(isPinned == -1) { //there is not a piece in between, continue with pin check 
                      for(let i = initFile-1; i >= 0; i--) { //look at the squares on the side of the piece opposite the king for enemy rooks 
                          if(this.chessboard[kingRank][i].myPiece != null) {
                              if((this.chessboard[kingRank][i].myPiece.name == 'Rook' || this.chessboard[kingRank][i].myPiece.name == 'Queen') && this.chessboard[kingRank][i].myPiece.owner != color) { //checks for enemy rook or queen
                                  return -5; //piece is pinned, move invalid 
                              }
                              else {
                                  isPinned = 0; //a non-rook or queen piece is blocking line of sight from any potential rooks or queens, piece is not pinned 
                              }
                          }
                      }
                  }
              }
              if(kingFile < initFile) {
                      for(let i = initFile-1; i > kingFile; i--){ //check if there is a piece between the king and the moving piece, if so, not pinned
                          if(this.chessboard[kingRank][i].myPiece != null) {//if the square is not empty, the moving piece is unpinned
                              isPinned = 0; //Not pinned
                          }
                          if(isPinned != -1) {
                              break;
                          }
                      }
                      if(isPinned == -1) { //there is not a piece in between, continue with pin check 
                          for(let i = initFile+1; i < 8; i++) {//look at the squares on the side of the piece opposite the king for enemy rooks 
                              if(this.chessboard[kingRank][i].myPiece != null) {
                                  if((this.chessboard[kingRank][i].myPiece.name == 'Rook' || this.chessboard[kingRank][i].myPiece.name == 'Queen') && this.chessboard[kingRank][i].myPiece.owner != color) { //checks for enemy rook or queen
                                      return -5; //piece is pinned, move invalid 
                                  }
                                  else {
                                      isPinned = 0; //a non-rook or queen piece is blocking line of sight from any potential rooks or queens, piece is not pinned 
                                  }
                              }
                          }
                      }
              }
              

          }

          else if(kingFile == initFile && isPinned == -1) { //king and piece on the same file
              if(kingRank > initRank) {
                  for(let i = initRank+1; i < kingRank; i++){ //check if there is a piece between the king and the moving piece, if so, not pinned
                      if(this.chessboard[i][kingFile].myPiece != null) {//if the square is not empty, the moving piece is unpinned
                          isPinned = 0; //Not pinned
                      }
                      if(isPinned != -1) {
                          break;
                      }
                  }
                  if(isPinned == -1) { //there is not a piece in between, continue with pin check 
                      for(let i = initRank-1; i >= 0; i--) {//look at the squares on the side of the piece opposite the king for enemy rooks 
                          if(this.chessboard[i][kingFile].myPiece != null) {
                              if((this.chessboard[i][kingFile].myPiece.name == 'Rook' || this.chessboard[i][kingFile].myPiece.name == 'Queen') && this.chessboard[i][kingFile].myPiece.owner != color) { //checks for enemy rook or queen
                                  return -5; //piece is pinned, move invalid 
                              }
                              else {
                                  isPinned = 0; //a non-rook or queen piece is blocking line of sight from any potential rooks or queens, piece is not pinned 
                              }
                          }
                      }
                  }
              }
              if(kingRank < initRank) {
                      for(let i = kingRank-1; i > kingRank; i--){ //check if there is a piece between the king and the moving piece, if so, not pinned
                          if(this.chessboard[i][kingFile].myPiece != null) {//if the square is not empty, the moving piece is unpinned
                              isPinned = 0; //Not pinned
                          }
                          if(isPinned != -1) {
                              break;
                          }
                      }
                      if(isPinned == -1) { //there is not a piece in between, continue with pin check 
                          for(let i = initRank+1; i <= 7; i++) {//look at the squares on the side of the piece opposite the king for enemy rooks 
                              if(this.chessboard[i][kingFile].myPiece != null) {
                                  if((this.chessboard[i][kingFile].myPiece.name == 'Rook' || this.chessboard[i][kingFile].myPiece.name == 'Queen') && this.chessboard[i][kingFile].myPiece.owner != color) { //checks for enemy rook or queen
                                      return -5; //piece is pinned, move invalid 
                                  }
                                  else {
                                      isPinned = 0; //a non-rook or queen piece is blocking line of sight from any potential rooks or queens, piece is not pinned 
                                  }
                              }
                          }
                      }
                  }
      
          }

          else if(isPinned == -1) { //Now that we've checked the ranks and files, check for the king and piece sharing a diagonals, assuming the isPinned flag hasn't been triggered 
              let rankDiff = kingRank - initRank;
              let fileDiff = kingFile - initFile;
              if(rankDiff == fileDiff || rankDiff == -fileDiff) {//if the pieces are separated by the same number of squares on both rank and file, they're on a diagonal
                 
                  if(rankDiff > 0 && fileDiff > 0) { //positive rank and file diff
                      for(let i = initRank+1; i < kingRank; ++i) {
                          for(let k = initFile+1; k < kingFile; ++k) {
                              if(this.chessboard[i][k].myPiece != null) { // there is a piece on the diagonal between the king and the piece
                                  isPinned = 0;
                                  break;
                              }

                          }
                          if(isPinned != -1) {
                              break;
                          }
                      }
                      if(isPinned == -1) {//check the opposite diagonal direction if there's not a piece in between
                          for(let i = initRank-1; i >= 0; --i) {
                              for(let k = initFile-1; i >=0; --i) {
                                  if(this.chessboard[i][k].myPiece != null) { //check that the square is not empty
                                      if((this.chessboard[i][k].myPiece.name == 'Bishop' || this.chessboard[i][k].myPiece.name == 'Queen') && this.chessboard[i][k].myPiece.owner != color) {
                                          return -5; //piece is pinned 
                                      }
                                      else {
                                          isPinned = 0;
                                          break;
                                      }
                                  }
                              }
                              if(isPinned != -1) {
                                  break;
                              }
                          }
                      }
                  }
                 
                  else if(rankDiff > 0 && fileDiff < 0 && isPinned == -1) { //positive rank diff, negative file diff
                      for(let i = initRank+1; i < kingRank; ++i) {
                          for(let k = initFile-1; k > kingFile; --k) {
                              if(this.chessboard[i][k].myPiece != null) { // there is a piece on the diagonal between the king and the piece
                                  isPinned = 0;
                                  break;
                              }

                          }
                          if(isPinned != -1) {
                              break;
                          }
                      }
                      if(isPinned == -1) {//check the opposite diagonal direction if there's not a piece in between
                          for(let i = initRank-1; i >= 0; --i) {
                              for(let k = initFile+1; i < 8; ++i) {
                                  if(this.chessboard[i][k].myPiece != null) { //check that the square is not empty
                                      if((this.chessboard[i][k].myPiece.name == 'Bishop' || this.chessboard[i][k].myPiece.name == 'Queen') && this.chessboard[i][k].myPiece.owner != color) {
                                          return -5; //piece is pinned 
                                      }
                                      else {
                                          isPinned = 0;
                                          break;
                                      }
                                  }
                              }
                              if(isPinned != -1) {
                                  break;
                              }
                          }
                      }
                  }
                  
                  else if(rankDiff < 0 && fileDiff > 0 && isPinned == -1) { //negative rank diff, positive file diff
                      for(let i = initRank-1; i > kingRank; --i) {
                          for(let k = initFile+1; k < kingFile; ++k) {
                              if(this.chessboard[i][k].myPiece != null) { // there is a piece on the diagonal between the king and the piece
                                  isPinned = 0;
                                  break;
                              }

                          }
                          if(isPinned != -1) {
                              break;
                          }
                      }
                      if(isPinned == -1) {//check the opposite diagonal direction if there's not a piece in between
                          for(let i = initRank+1; i < 8; ++i) {
                              for(let k = initFile-1; i >= 0; --i) {
                                  if(this.chessboard[i][k].myPiece != null) { //check that the square is not empty
                                      if((this.chessboard[i][k].myPiece.name == 'Bishop' || this.chessboard[i][k].myPiece.name == 'Queen') && this.chessboard[i][k].myPiece.owner != color) {
                                          return -5; //piece is pinned 
                                      }
                                      else {
                                          isPinned = 0;
                                          break;
                                      }
                                  }
                              }
                              if(isPinned != -1) {
                                  break;
                              }
                          }
                      }
                  }
                 
                  else if(rankDiff < 0 && fileDiff < 0 && isPinned == -1) { //negative rank and file diff
                      for(let i = initRank-1; i > kingRank; --i) {
                          for(let k = initFile-1; k > kingFile; --k) {
                              if(this.chessboard[i][k].myPiece != null) { // there is a piece on the diagonal between the king and the piece
                                  isPinned = 0;
                                  break;
                              }

                          }
                          if(isPinned != -1) {
                              break;
                          }
                      }
                      if(isPinned == -1) {//check the opposite diagonal direction if there's not a piece in between
                          for(let i = initRank+1; i < 8; ++i) {
                              for(let k = initFile+1; i < 8; ++i) {
                                  if(this.chessboard[i][k].myPiece != null) { //check that the square is not empty
                                      if((this.chessboard[i][k].myPiece.name == 'Bishop' || this.chessboard[i][k].myPiece.name == 'Queen') && this.chessboard[i][k].myPiece.owner != color) {
                                          return -5; //piece is pinned 
                                      }
                                      else {
                                          isPinned = 0;
                                          break;
                                      }
                                  }
                              }
                              if(isPinned != -1) {
                                  break;
                              }
                          }
                      }
                  }

              }
              else {
                  isPinned = 0;
              }
          }

      }
      */
      //
      // Check check for pieces - separated because big function
      //
          let kingRank = -1;
          let kingFile = -1;
          let isKing = 0;
          let inCheck = 0; //tracks whether or not the king is in check, needed because the board is set to a temporary state and returning early would prevent me from correcting that
          if(this.chessboard[initRank][initFile].myPiece.name == 'King'){
              kingRank = destRank;
              kingFile = destFile;
              isKing = 1;
          }
          else{
            for(let i = 0; i < 8; i++) { //Step one, locate the same side king by iterating through board
                for(let k = 0; k < 8; k++) {
                    if(this.chessboard[i][k].myPiece != null){
                        if(this.chessboard[i][k].myPiece.name == 'King' && this.chessboard[i][k].myPiece.owner == color) { //locate same side king 
                            kingRank = i;
                            kingFile = k; 
                            break;       
                        }
                    }
                }
                if(kingFile != -1) {//stop looping once king is found
                    break;
                }
            }
          }
          if(!isKing) { //move the pieces temporarily so that we can check the proposed board state to see if the king is still in check
            var temp =  this.chessboard[initRank][initFile].myPiece;
            var temp2 = this.chessboard[destRank][destFile].myPiece;
            this.chessboard[destRank][destFile].myPiece = null;
            this.chessboard[destRank][destFile].myPiece = this.chessboard[initRank][initFile].myPiece;
            this.chessboard[initRank][initFile].myPiece = null;
          }

          //check for knights, includes checks for out of bounds and existing pieces to prevent null dereferences
          if(kingRank+2 <= 7 && kingFile+1 <= 7 ) {
            if(this.chessboard[kingRank+2][kingFile+1] && this.chessboard[kingRank+2][kingFile+1].myPiece != null && this.chessboard[kingRank+2][kingFile+1].myPiece.name == 'Knight' && this.chessboard[kingRank+2][kingFile+1].myPiece.owner != color) {
                inCheck = 1; //king is in check
            }
          }   
          if(kingRank+2 <= 7 && kingFile-1 >= 0 ) {
             if(this.chessboard[kingRank+2][kingFile-1].myPiece != null && this.chessboard[kingRank+2][kingFile-1].myPiece.name == 'Knight' && this.chessboard[kingRank+2][kingFile-1].myPiece.owner != color) {
                inCheck = 1; //king is in check
             }
          }
          if(kingRank-2 >= 0 && kingFile+1 <= 7) { 
             if(this.chessboard[kingRank-2][kingFile+1].myPiece != null && this.chessboard[kingRank-2][kingFile+1].myPiece.name == 'Knight' && this.chessboard[kingRank-2][kingFile+1].myPiece.owner != color) {
                inCheck = 1; //king is in check
             }
          }
          if(kingRank-2 >= 0 && kingFile-1 >= 0 ) {
            if(this.chessboard[kingRank-2][kingFile-1].myPiece != null && this.chessboard[kingRank-2][kingFile-1].myPiece.name == 'Knight' && this.chessboard[kingRank-2][kingFile-1].myPiece.owner != color) {
                 inCheck = 1; //king is in check
            }
          }
          if(kingRank+1 <= 7 && kingFile+2 <= 7) {
            if(this.chessboard[kingRank+1][kingFile+2].myPiece != null && this.chessboard[kingRank+1][kingFile+2].myPiece.name == 'Knight' && this.chessboard[kingRank+1][kingFile+2].myPiece.owner != color) {
                inCheck = 1; //king is in check
            }
          }
          if(kingRank+1 <= 7 && kingFile-2 >= 0 ) {
            if(this.chessboard[kingRank+1][kingFile-2].myPiece != null && this.chessboard[kingRank+1][kingFile-2].myPiece.name == 'Knight' && this.chessboard[kingRank+1][kingFile-2].myPiece.owner != color) {
                inCheck = 1; //king is in check
            }
          }
          if(kingRank-1 >= 0 && kingFile+2 <= 7 ) {
            if(this.chessboard[kingRank-1][kingFile+2].myPiece != null && this.chessboard[kingRank-1][kingFile+2].myPiece.name == 'Knight' && this.chessboard[kingRank-1][kingFile+2].myPiece.owner != color) {
                  inCheck = 1; //king is in check
            }
          } 
          if(kingRank-1 >= 0 && kingFile-2 >= 0 ) {
            if(this.chessboard[kingRank-1][kingFile-2].myPiece != null && this.chessboard[kingRank-1][kingFile-2].myPiece.name == 'Knight' && this.chessboard[kingRank-1][kingFile-2].myPiece.owner != color) {
                inCheck = 1; //king is in check
            }
          }
          

          //check the rank and file directions (horizontal and vertical lines for check threats)
          for(let i = kingRank+1; i < 8; ++i) {
              if(this.chessboard[i][kingFile].myPiece != null) {
                  if((this.chessboard[i][kingFile].myPiece.name == 'Rook' || this.chessboard[i][kingFile].myPiece.name == 'Queen') && this.chessboard[i][kingFile].myPiece.owner != color) {
                      inCheck = 1; //king is in check 
                  }
                  else {//king is not in check in this direction
                      break;
                  }
              }
          }
          for(let i = kingRank-1; i >= 0; --i) {
              if(this.chessboard[i][kingFile].myPiece != null) {
                  if((this.chessboard[i][kingFile].myPiece.name == 'Rook' || this.chessboard[i][kingFile].myPiece.name == 'Queen') && this.chessboard[i][kingFile].myPiece.owner != color) {
                      inCheck = 1; //king is in check 
                  }
                  else {//king is not in check in this direction
                      break;
                  }
              }
          }
          for(let i = kingFile+1; i < 8; ++i) {
              if(this.chessboard[kingRank][i].myPiece != null) {
                  if((this.chessboard[kingRank][i].myPiece.name == 'Rook' || this.chessboard[kingRank][i].myPiece.name == 'Queen') && this.chessboard[kingRank][i].myPiece.owner != color) {
                      inCheck = 1; //king is in check 
                  }
                  else {//king is not in check in this direction
                      break;
                  }
              }
          }
          for(let i = kingFile-1; i >= 0; --i) {
              if(this.chessboard[kingRank][i].myPiece != null) {
                  if((this.chessboard[kingRank][i].myPiece.name == 'Rook' || this.chessboard[kingRank][i].myPiece.name == 'Queen') && this.chessboard[kingRank][i].myPiece.owner != color) {
                      inCheck = 1; //king is in check 
                  }
                  else {//king is not in check in this direction
                      break;
                  }
              }
          }

          //Check the diagonals 
          for(let i = kingRank+1; i < 8; ++i){
              var notSafe = 1;
              for(let k = kingFile+1; k < 8; ++k) {
                  if(Math.abs(kingRank - i) == Math.abs(kingFile - k)){
                    if(this.chessboard[i][k].myPiece != null) {
                      if((this.chessboard[i][k].myPiece.name == 'Bishop' || this.chessboard[i][k].myPiece.name == 'Queen') && this.chessboard[i][k].myPiece.owner != color) {
                        inCheck = 1; //king is in check 
                      }
                      //black pawn check
                      else if(this.chessboard[i][k].myPiece.name == 'Pawn' && this.chessboard[i][k].myPiece.owner != color && color == true && i == kingRank+1 && (k == kingFile+1 || k == kingFile-1)) {
                        inCheck = 1; //king is in check
                      }
                      //white pawn check
                      else if(this.chessboard[i][k].myPiece.name == 'Pawn' && this.chessboard[i][k].myPiece.owner != color && color == false && i == kingRank-1 && (k == kingFile+1 || k == kingFile-1)) {
                        inCheck = 1; //king is in check
                      }
                      else {//king is not in check in this direction
                          notSafe = 0;
                          break;
                      }
                  }
                }
              }
              if(notSafe == 0) {
                  break;
              }
          }
          for(let i = kingRank-1; i >= 0; --i){
            var notSafe = 1;
              for(let k = kingFile+1; k < 8; ++k) {
                if(Math.abs(kingRank - i) == Math.abs(kingFile - k)){
                  if(this.chessboard[i][k].myPiece != null ) {
                      if((this.chessboard[i][k].myPiece.name == 'Bishop' || this.chessboard[i][k].myPiece.name == 'Queen') && this.chessboard[i][k].myPiece.owner != color) {
                          inCheck = 1; //king is in check 
                      }
                      //black pawn check
                      else if(this.chessboard[i][k].myPiece.name == 'Pawn' && this.chessboard[i][k].myPiece.owner != color && color == true && i == kingRank+1 && (k == kingFile+1 || k == kingFile-1)) {
                          inCheck = 1; //king is in check
                      }
                      //white pawn check
                      else if(this.chessboard[i][k].myPiece.name == 'Pawn' && this.chessboard[i][k].myPiece.owner != color && color == false && i == kingRank-1 && (k == kingFile+1 || k == kingFile-1)) {
                          inCheck = 1; //king is in check
                      }
                      else {//king is not in check in this direction
                          notSafe = 0;
                          break;
                      }
                  }
                }
              }
              if(notSafe == 0) {
                break;
              }
          }
          for(let i = kingRank+1; i < 8; ++i){
            var notSafe = 1;
              for(let k = kingFile-1; k >= 0; --k) {
                if(Math.abs(kingRank - i) == Math.abs(kingFile - k)){
                  if(this.chessboard[i][k].myPiece != null) {
                      if((this.chessboard[i][k].myPiece.name == 'Bishop' || this.chessboard[i][k].myPiece.name == 'Queen') && this.chessboard[i][k].myPiece.owner != color) {
                          inCheck = 1; //king is in check 
                      }
                      //black pawn check
                      else if(this.chessboard[i][k].myPiece.name == 'Pawn' && this.chessboard[i][k].myPiece.owner != color && color == true && i == kingRank+1 && (k == kingFile+1 || k == kingFile-1)) {
                          inCheck = 1; //king is in check
                      }
                      //white pawn check
                      else if(this.chessboard[i][k].myPiece.name == 'Pawn' && this.chessboard[i][k].myPiece.owner != color && color == false && i == kingRank-1 && (k == kingFile+1 || k == kingFile-1)) {
                          inCheck = 1; //king is in check
                      }
                      else {//king is not in check in this direction
                        notSafe = 0;  
                        break;
                      }
                  }
                }
              }
              if(notSafe == 0) {
                break;
              }
          }
          for(let i = kingRank-1; i >= 0; --i){
            var notSafe = 1;
              for(let k = kingFile-1; k >= 0; --k) {
                if(Math.abs(kingRank - i) == Math.abs(kingFile - k)){
                  if(this.chessboard[i][k].myPiece != null) {
                      if((this.chessboard[i][k].myPiece.name == 'Bishop' || this.chessboard[i][k].myPiece.name == 'Queen') && this.chessboard[i][k].myPiece.owner != color) {
                          inCheck = 1; //king is in check 
                      }
                      //black pawn check
                      else if(this.chessboard[i][k].myPiece.name == 'Pawn' && this.chessboard[i][k].myPiece.owner != color && color == true && i == kingRank+1 && (k == kingFile+1 || k == kingFile-1)) {
                          inCheck = 1; //king is in check
                      }
                      //white pawn check
                      else if(this.chessboard[i][k].myPiece.name == 'Pawn' && this.chessboard[i][k].myPiece.owner != color && color == false && i == kingRank-1 && (k == kingFile+1 || k == kingFile-1)) {
                          inCheck = 1; //king is in check
                      }
                      else {//king is not in check in this direction
                        notSafe = 0;  
                        break;
                      }
                  }
                }
              }
              if(notSafe == 0) {
                break;
              }
          }
          //Check for the other king putting the king in check
          if((kingRank+1 <= 7 && kingFile+1 <= 7 && this.chessboard[kingRank+1][kingFile+1].myPiece && this.chessboard[kingRank+1][kingFile+1].myPiece.name == "King" && this.chessboard[kingRank+1][kingFile+1].myPiece.owner != color) ||
             (kingRank+1 <= 7 && kingFile-1 >= 0 && this.chessboard[kingRank+1][kingFile-1].myPiece && this.chessboard[kingRank+1][kingFile-1].myPiece.name == "King" && this.chessboard[kingRank+1][kingFile-1].myPiece.owner != color) ||
             (kingRank+1 <= 7 && this.chessboard[kingRank+1][kingFile].myPiece && this.chessboard[kingRank+1][kingFile].myPiece.name == "King" && this.chessboard[kingRank+1][kingFile].myPiece.owner != color) ||
             (kingRank-1 >= 0 && this.chessboard[kingRank-1][kingFile].myPiece && this.chessboard[kingRank-1][kingFile].myPiece.name == "King" && this.chessboard[kingRank-1][kingFile].myPiece.owner != color) ||
             (kingRank-1 >= 0 && kingFile+1 <= 7 && this.chessboard[kingRank-1][kingFile+1].myPiece && this.chessboard[kingRank-1][kingFile+1].myPiece.name == "King" && this.chessboard[kingRank-1][kingFile+1].myPiece.owner != color) ||
             (kingRank-1 >= 0 && kingFile-1 >= 0 && this.chessboard[kingRank-1][kingFile-1].myPiece && this.chessboard[kingRank-1][kingFile-1].myPiece.name == "King" && this.chessboard[kingRank-1][kingFile-1].myPiece.owner != color) ||
             (kingFile+1 <= 7 && this.chessboard[kingRank][kingFile+1].myPiece && this.chessboard[kingRank][kingFile+1].myPiece.name == "King" && this.chessboard[kingRank][kingFile+1].myPiece.owner != color) || 
             (kingFile-1 >= 0 && this.chessboard[kingRank][kingFile-1].myPiece && this.chessboard[kingRank][kingFile-1].myPiece.name == "King" && this.chessboard[kingRank][kingFile-1].myPiece.owner != color)) {
                 inCheck = 1;
             }
          //reset board to original position
          if(!isKing) {
            this.chessboard[initRank][initFile].myPiece = temp;
            this.chessboard[destRank][destFile].myPiece = temp2;
          }
          if(inCheck) {
              return -6; //The king is in check
          }
      //TODO determine if having this separate version for the king moving is necessary or not. It may make more sense to move the "check check" to a separate function that's called as needed
      //
      // Piece specific move rules
      //
      var validPiece = 0; //flag for checking that a valid piece has been encountered
      //Pawn move rules 
      if(this.chessboard[initRank][initFile].myPiece.name == 'Pawn') {
          validPiece = 1;
          //white pawn
          
          if(this.chessboard[initRank][initFile].myPiece.owner == true) {
              if(destRank == initRank+2 && this.chessboard[initRank][initFile].myPiece.hasMoved == false) {
                  if(this.chessboard[initRank+1][initFile].myPiece != null) {
                      return -7; //blocking piece 
                  }
              }

              if(!(destRank === initRank+1 && destFile === initFile && this.chessboard[destRank][destFile].myPiece === null)
               && !(destRank === initRank+1 && Math.abs(destFile - initFile) === 1 && this.chessboard[destRank][destFile].myPiece != null)
               && !(destRank === initRank+2 && destFile === initFile && this.chessboard[destRank][destFile].myPiece === null && this.chessboard[initRank][initFile].myPiece.hasMoved === false)){
                   return -8;
               }



            //   //TODO: Separate out into blocking piece and piece-movement rule errors for clarity
            //   else if(destRank != (initRank+1) || this.chessboard[destRank][destFile].myPiece != null) {
            //     console.log("here 2", initRank, initFile, destRank, destFile);
            //       return -8; //piece-specific movement rule error 
            //   }
            //   else if((destRank != initRank+1 && (destFile != initFile+1 || destFile != initFile-1)) || this.chessboard[destRank][destFile].myPiece == null) {//enemy piece is on a diagonal square, valid pawn capture
            //     console.log("here 3", initRank, initFile, destRank, destFile);  
            //     return -8; //piece-specific move error 
            //   }
          }
          //black pawn
          else if(this.chessboard[initRank][initFile].myPiece.owner == false) {
            if(destRank == initRank-2 && this.chessboard[initRank][initFile].myPiece.hasMoved == false) {
                if(this.chessboard[initRank-1][initFile].myPiece != null) {
                    return -7; //blocking piece 
                }
            }

            if(!(destRank === initRank-1 && destFile === initFile && this.chessboard[destRank][destFile].myPiece === null)
             && !(destRank === initRank-1 && Math.abs(destFile - initFile) === 1 && this.chessboard[destRank][destFile].myPiece != null)
             && !(destRank === initRank-2 && destFile === initFile && this.chessboard[destRank][destFile].myPiece === null && this.chessboard[initRank][initFile].myPiece.hasMoved === false)){
                 return -8;
             }
          }
      }
      //knight move rules 
      else if(this.chessboard[initRank][initFile].myPiece.name == 'Knight') {
          validPiece = 1;
          if(((destRank == initRank+2 || destRank == initRank-2) && (destFile == initFile+1 || destFile == initFile-1)) || ((destRank == initRank+1 || destRank == initRank-1) && (destFile == initFile+2 || destFile == initFile-2))) { 
          }
          else {
              return -8;//piece-specific move error
          }
      }
      //bishop move rules
      else if(this.chessboard[initRank][initFile].myPiece.name == 'Bishop') {
          validPiece = 1;
          var rankDist = initRank - destRank;
          var fileDist = initFile - destFile;
          if(rankDist != fileDist && rankDist != -fileDist) {
              return -8; //piece-specific move error 
          }
          //check for clear path
          //both positive
          if(rankDist > 0 && fileDist > 0) {
              for(let i = initRank+1; i < destRank; ++i){
                  for(let k = initFile+1; k < destFile; ++k) {
                      if(this.chessboard[i][k].myPiece != null) {
                          return -7; //blocking piece 
                      }
                  }
              }
          }
          //rank positive, file negative 
          else if(rankDist > 0 && fileDist < 0) {
              for(let i = initRank+1; i < destRank; ++i) {
                  for(let k = initFile-1; k > destFile; --k) {
                      if(this.chessboard[i][k].myPiece != null) {
                          return -7; //blocking piece 
                      }
                  }
              }
          }
          //rank negative, file positive
          else if(rankDist < 0 && fileDist > 0) {
              for(let i = initRank-1; i > destRank; --i) {
                  for(let k = initFile+1; k < destFile; ++k) {
                      if(this.chessboard[i][k].myPiece != null) {
                          return -7; //blocking piece 
                      }
                  }
              }
          }
          //both negative 
          else if(rankDist < 0 && fileDist < 0) {
              for(let i = initRank-1; i > destRank; --i) {
                  for(let k = initFile-1; k > destFile; --k) {
                      if(this.chessboard[i][k].myPiece != null) {
                          return -7; //blocking piece 
                      }
                  }
              }
          }
      }
      //rook move rules
      else if(this.chessboard[initRank][initFile].myPiece.name == 'Rook') {
          validPiece = 1;
          //travelling on rank
          if(destFile == initFile && destRank != initRank) {
              if(destRank - initRank > 0) {
                  for(let i = initRank+1; i < destRank; i++) {
                      if(this.chessboard[i][initFile].myPiece != null) {
                          return -7; //blocking piece 
                      }
                  }
              }
              else {
                  for(let i = initRank-1; i > destRank; i--) {
                      if(this.chessboard[i][initFile].myPiece != null) {
                          return -7; //blocking piece 
                      }
                  }
              }
          }
          //travelling on file 
          else if(destFile != initFile && destRank == initRank) {
              if(destFile - initFile > 0) {
                  for(let i = initFile+1; i < destFile; i++) {
                      if(this.chessboard[initRank][i].myPiece != null) {
                          return -7; //blocking piece 
                      }
                  }
              }
              else {
                  for(let i = initFile-1; i > destFile; i--) {
                      if(this.chessboard[initRank][i].myPiece != null) {
                          return -7; //blocking piece 
                      }
                  }
              }
          }
          else {
              return -8; //piece-specific movement error 
          }
      }
      //queen move rules
      else if(this.chessboard[initRank][initFile].myPiece.name == 'Queen') {
          validPiece = 1;
          var rankDist = initRank - destRank;
          var fileDist = initFile - destFile;
          //bishop type movement
          if(rankDist == fileDist || rankDist == -fileDist) {   
              if(rankDist > 0 && fileDist > 0) {
                  for(let i = initRank+1; i < destRank; ++i){
                      for(let k = initFile+1; k < destFile; ++k) {
                          if(this.chessboard[i][k].myPiece != null) {
                              return -7; //blocking piece 
                          }
                      }
                  }
              }
              //rank positive, file negative 
              if(rankDist > 0 && fileDist < 0) {
                  for(let i = initRank+1; i < destRank; ++i) {
                      for(let k = initFile-1; k > destFile; --k) {
                          if(this.chessboard[i][k].myPiece != null) {
                              return -7; //blocking piece 
                          }
                      }
                  }
              }
              //rank negative, file positive
              if(rankDist < 0 && fileDist > 0) {
                  for(let i = initRank-1; i > destRank; --i) {
                      for(let k = initFile+1; k < destFile; ++k) {
                          if(this.chessboard[i][k].myPiece != null) {
                              return -7; //blocking piece 
                          }
                      }
                  }
              }
              //both negative 
              if(rankDist < 0 && fileDist < 0) {
                  for(let i = initRank-1; i > destRank; --i) {
                      for(let k = initFile-1; k > destFile; --k) {
                          if(this.chessboard[i][k].myPiece != null) {
                              return -7; //blocking piece 
                          }
                      }
                  }
              }
          }
          //rook type movement on Rank
          else if(destFile == initFile && destRank != initRank) { 
              if(destRank - initRank > 0) {
                  for(let i = initRank+1; i < destRank; i++) {
                      if(this.chessboard[i][initFile].myPiece != null) {
                          return -7; //blocking piece 
                      }
                  }
              }
              else {
                  for(let i = initRank-1; i > destRank; i--) {
                      if(this.chessboard[i][initFile].myPiece != null) {
                          return -7; //blocking piece 
                      }
                  }
              }
          }
          //rook type movement on File 
          else if(destFile != initFile && destRank == initRank) { 
              if(destFile - initFile > 0) {
                  for(let i = initFile+1; i < destFile; i++) {
                      if(this.chessboard[initRank][i].myPiece != null) {
                          return -7; //blocking piece 
                      }
                  }
              }
              else {
                  for(let i = initFile-1; i > destFile; i--) {
                      if(this.chessboard[initRank][i].myPiece != null) {
                          return -7; //blocking piece 
                      }
                  }
              }
          }
          else {
              return -8; //piece-specific movement error
          }
      }
      //king move rules 
      else if(this.chessboard[initRank][initFile].myPiece.name == 'King') {
          validPiece = 1;
          if(destRank > initRank+1 || destRank < initRank-1 || destFile > initFile+1 || destFile < initFile-1) {
              return -8; //piece-specific move error 
          }
      }
      else {
          return -9; //unrecognized piece type error
      }
        
      return 1; //valid move 
  }

  move(initRank, initFile, destRank, destFile, color) {
    let result = 0;
    result = this.check_move(initRank, initFile, destRank, destFile, color, 0, 0); // en passant not yet implemented
    console.log(result);
    if(result == 1) {
        this.chessboard[initRank][initFile].myPiece.hasMoved = true;
        this.chessboard[destRank][destFile].myPiece = null;
        this.chessboard[destRank][destFile].myPiece = this.chessboard[initRank][initFile].myPiece;
        this.chessboard[initRank][initFile].myPiece = null;
        if(this.chessboard[destRank][destFile].myPiece.name == 'Pawn' && (destRank == 7 || destRank == 0)) { //Pawns auto-promote to queens on rank 8 and 1 
            this.chessboard[destRank][destFile].myPiece.name = 'Queen';
        }
        return 1; // move valid and executed 
    }
    else if(result == 0) {
        return 0; // error with check move function
    }
    else {
        return result; // move invalid, error code returned
    }
  } 
}