document.addEventListener("DOMContentLoaded", () => {
  const grid = document.querySelector(".grid");
  const infoDisplay = document.querySelector("#infoMessage");
  const turnDisplay = document.querySelector("#turnMessage");
  const joinGameButton = document.querySelector("#joinGameButton");
  const readyButton = document.querySelector("#readyButton");
  const squares = [];
  const width = 8;
  let currentPlayer = "user";
  let playerNum = -1;
  let ready = false;
  let enemyReady = false;
  let isGameOver = false;
  let clicked = -1;
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

    //Add event listeners to each square to know what move the user wants.
    squares.forEach(square => {
        square.addEventListener('click', () => {
            if(currentPlayer === 'user' && ready && enemyReady){
                clicked = square.dataset.id;
                socket.emit("move", clicked);
            }
        })
    });

    socket.on("move", (id) => {
        squares[id].classList.toggle("green");
        currentPlayer = "user";
        turnDisplay.innerHTML = "Your Go";
        socket.emit("move-reply", id);
        playGame(socket);
    });

    socket.on("move-reply", (id) => {
        squares[id].classList.toggle("green");
        currentPlayer = "enemy";
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

  //Create the chess board
  function createBoard(grid, squares){
    for(let i = 0; i < width; i++){
        let pos = i;
        for(let j = 0; j < width; j++){
            const square = document.createElement('div');
            const piece = gameboard.chessboard[i][j].myPiece
            square.dataset.id = (i*width) + j;
            if(piece != null){
                square.innerHTML = piece.name;
            }
            if(pos%2!=0){
                square.classList.toggle("black");
            }else{
                square.classList.toggle("white");
            }
            pos++;
            grid.appendChild(square);
            squares.push(square);
        }
    }
  }
  createBoard(grid, squares);

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
    //   for(let let i = 0; i < 8; ++i) {
    //       for(let let k = 0; k < 8; ++i) {
    //           this.chessboard[i][k].myPiece = null;
    //       }
    //   }
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
              if(i == 1) { //Rank 2, white pawns 
                  this.chessboard[i][k].myPiece = new piece(true, 1, 'Pawn');
              }
              if(i == 6) { //Rank 7, black pawns
                  this.chessboard[i][k].myPiece = new piece(false, 1, 'Pawn');
              }
              if(i == 7) { //rank is 8, black backrank 
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
      if(color != this.chessboard[destRank][destFile].myPiece.owner) {
          return -10; // Other players piece error
      }
      if(destRank > 7 || destRank < 0 || destFile > 7 || destFile < 0 || initRank > 7 || initRank < 0 || initFile > 7 || initFile < 0) {
          return -2; //out of board bounds error
      }
      if(!this.chessboard[initRank][initFile].myPiece){ //make sure that there is a piece at the initial square
          return -1; //no piece error
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
      //
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
      //
      // Check check for pieces - separated because big function
      //
      if(this.chessboard[initRank][initFile].myPiece.owner != 'King') {//if the piece being moved isn't a king, check that the king isn't currently in check
          let kingRank = -1;
          let kingFile = -1;
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

          //check for knights 
          if(this.chessboard[kingRank+2][kingFile+1].myPiece.name == 'Knight' && this.chessboard[kingRank+2][kingFile+1].myPiece.owner != color) {
              return -6; //king is in check
          }
          if(this.chessboard[kingRank+2][kingFile-1].myPiece.name == 'Knight' && this.chessboard[kingRank+2][kingFile-1].myPiece.owner != color) {
              return -6; //king is in check
          }
          if(this.chessboard[kingRank-2][kingFile+1].myPiece.name == 'Knight' && this.chessboard[kingRank-2][kingFile+1].myPiece.owner != color) {
              return -6; //king is in check
          }
          if(this.chessboard[kingRank-2][kingFile-1].myPiece.name == 'Knight' && this.chessboard[kingRank-2][kingFile-1].myPiece.owner != color) {
              return -6; //king is in check
          }
          if(this.chessboard[kingRank+1][kingFile+2].myPiece.name == 'Knight' && this.chessboard[kingRank+1][kingFile+2].myPiece.owner != color) {
              return -6; //king is in check
          }
          if(this.chessboard[kingRank+1][kingFile-2].myPiece.name == 'Knight' && this.chessboard[kingRank+1][kingFile-2].myPiece.owner != color) {
              return -6; //king is in check
          }
          if(this.chessboard[kingRank-1][kingFile+2].myPiece.name == 'Knight' && this.chessboard[kingRank-1][kingFile+2].myPiece.owner != color) {
              return -6; //king is in check
          }
          if(this.chessboard[kingRank-1][kingFile-2].myPiece.name == 'Knight' && this.chessboard[kingRank-1][kingFile-2].myPiece.owner != color) {
              return -6; //king is in check
          }
          
          //check the rank and file directions (horizontal and vertical lines for check threats)
          for(let i = kingRank+1; i < 8; ++i) {
              if(this.chessboard[i][kingFile].myPiece != null) {
                  if((this.chessboard[i][kingFile].myPiece.name == 'Rook' || this.chessboard[i][kingFile].myPiece.name == 'Queen') && this.chessboard[i][kingFile].myPiece.owner != color) {
                      return -6; //king is in check 
                  }
                  else {//king is not in check in this direction
                      break;
                  }
              }
          }
          for(let i = kingRank-1; i >= 0; --i) {
              if(this.chessboard[i][kingFile].myPiece != null) {
                  if((this.chessboard[i][kingFile].myPiece.name == 'Rook' || this.chessboard[i][kingFile].myPiece.name == 'Queen') && this.chessboard[i][kingFile].myPiece.owner != color) {
                      return -6; //king is in check 
                  }
                  else {//king is not in check in this direction
                      break;
                  }
              }
          }
          for(let i = kingFile+1; i < 8; ++i) {
              if(this.chessboard[kingRank][i].myPiece != null) {
                  if((this.chessboard[kingRank][i].myPiece.name == 'Rook' || this.chessboard[kingRank][i].myPiece.name == 'Queen') && this.chessboard[kingRank][i].myPiece.owner != color) {
                      return -6; //king is in check 
                  }
                  else {//king is not in check in this direction
                      break;
                  }
              }
          }
          for(let i = kingFile-1; i >= 0; --i) {
              if(this.chessboard[kingRank][i].myPiece != null) {
                  if((this.chessboard[kingRank][i].myPiece.name == 'Rook' || this.chessboard[kingRank][i].myPiece.name == 'Queen') && this.chessboard[kingRank][i].myPiece.owner != color) {
                      return -6; //king is in check 
                  }
                  else {//king is not in check in this direction
                      break;
                  }
              }
          }

          //Check the diagonals 
          for(let i = kingRank+1; i < 8; ++i){
              for(let k = kingFile+1; k < 8; ++k) {
                  if(this.chessboard[i][k].myPiece != null) {
                      if((this.chessboard[i][k].myPiece.name == 'Bishop' || this.chessboard[i][k].myPiece.name == 'Queen') && this.chessboard[i][k].myPiece.owner != color) {
                          return -6; //king is in check 
                      }
                      //black pawn check
                      else if(this.chessboard[i][k].myPiece.name == 'Pawn' && this.chessboard[i][k].myPiece.owner != color && color == true && i == kingRank+1 && (k == kingFile+1 || k == kingFile-1)) {
                          return -6; //king is in check
                      }
                      //white pawn check
                      else if(this.chessboard[i][k].myPiece.name == 'Pawn' && this.chessboard[i][k].myPiece.owner != color && color == false && i == kingRank-1 && (k == kingFile+1 || k == kingFile-1)) {
                          return -6; //king is in check
                      }
                      else {//king is not in check in this direction
                          break;
                      }
                  }
              }
          }
          for(let i = kingRank-1; i >= 0; --i){
              for(let k = kingFile+1; k < 8; ++k) {
                  if(this.chessboard[i][k].myPiece != null) {
                      if((this.chessboard[i][k].myPiece.name == 'Bishop' || this.chessboard[i][k].myPiece.name == 'Queen') && this.chessboard[i][k].myPiece.owner != color) {
                          return -6; //king is in check 
                      }
                      //black pawn check
                      else if(this.chessboard[i][k].myPiece.name == 'Pawn' && this.chessboard[i][k].myPiece.owner != color && color == true && i == kingRank+1 && (k == kingFile+1 || k == kingFile-1)) {
                          return -6; //king is in check
                      }
                      //white pawn check
                      else if(this.chessboard[i][k].myPiece.name == 'Pawn' && this.chessboard[i][k].myPiece.owner != color && color == false && i == kingRank-1 && (k == kingFile+1 || k == kingFile-1)) {
                          return -6; //king is in check
                      }
                      else {//king is not in check in this direction
                          break;
                      }
                  }
              }
          }
          for(let i = kingRank+1; i < 8; ++i){
              for(let k = kingFile-1; k >= 0; --k) {
                  if(this.chessboard[i][k].myPiece != null) {
                      if((this.chessboard[i][k].myPiece.name == 'Bishop' || this.chessboard[i][k].myPiece.name == 'Queen') && this.chessboard[i][k].myPiece.owner != color) {
                          return -6; //king is in check 
                      }
                      //black pawn check
                      else if(this.chessboard[i][k].myPiece.name == 'Pawn' && this.chessboard[i][k].myPiece.owner != color && color == true && i == kingRank+1 && (k == kingFile+1 || k == kingFile-1)) {
                          return -6; //king is in check
                      }
                      //white pawn check
                      else if(this.chessboard[i][k].myPiece.name == 'Pawn' && this.chessboard[i][k].myPiece.owner != color && color == false && i == kingRank-1 && (k == kingFile+1 || k == kingFile-1)) {
                          return -6; //king is in check
                      }
                      else {//king is not in check in this direction
                          break;
                      }
                  }
              }
          }
          for(let i = kingRank-1; i >= 0; --i){
              for(let k = kingFile-1; k >= 0; --k) {
                  if(this.chessboard[i][k].myPiece != null) {
                      if((this.chessboard[i][k].myPiece.name == 'Bishop' || this.chessboard[i][k].myPiece.name == 'Queen') && this.chessboard[i][k].myPiece.owner != color) {
                          return -6; //king is in check 
                      }
                      //black pawn check
                      else if(this.chessboard[i][k].myPiece.name == 'Pawn' && this.chessboard[i][k].myPiece.owner != color && color == true && i == kingRank+1 && (k == kingFile+1 || k == kingFile-1)) {
                          return -6; //king is in check
                      }
                      //white pawn check
                      else if(this.chessboard[i][k].myPiece.name == 'Pawn' && this.chessboard[i][k].myPiece.owner != color && color == false && i == kingRank-1 && (k == kingFile+1 || k == kingFile-1)) {
                          return -6; //king is in check
                      }
                      else {//king is not in check in this direction
                          break;
                      }
                  }
              }
          }
      }
      //TODO determine if having this separate version for the king moving is necessary or not. It may make more sense to move the "check check" to a separate function that's called as needed
      else { //if the piece being moved is the king, check that the king's new square isn't threatened 
          let kingRank = destRank;
          let kingFile = destFile;
          
          //check for knights 
          if(this.chessboard[kingRank+2][kingFile+1].myPiece.name == 'Knight' && this.chessboard[kingRank+2][kingFile+1].myPiece.owner != color) {
              return -6; //king is in check
          }
          if(this.chessboard[kingRank+2][kingFile-1].myPiece.name == 'Knight' && this.chessboard[kingRank+2][kingFile-1].myPiece.owner != color) {
              return -6; //king is in check
          }
          if(this.chessboard[kingRank-2][kingFile+1].myPiece.name == 'Knight' && this.chessboard[kingRank-2][kingFile+1].myPiece.owner != color) {
              return -6; //king is in check
          }
          if(this.chessboard[kingRank-2][kingFile-1].myPiece.name == 'Knight' && this.chessboard[kingRank-2][kingFile-1].myPiece.owner != color) {
              return -6; //king is in check
          }
          if(this.chessboard[kingRank+1][kingFile+2].myPiece.name == 'Knight' && this.chessboard[kingRank+1][kingFile+2].myPiece.owner != color) {
              return -6; //king is in check
          }
          if(this.chessboard[kingRank+1][kingFile-2].myPiece.name == 'Knight' && this.chessboard[kingRank+1][kingFile-2].myPiece.owner != color) {
              return -6; //king is in check
          }
          if(this.chessboard[kingRank-1][kingFile+2].myPiece.name == 'Knight' && this.chessboard[kingRank-1][kingFile+2].myPiece.owner != color) {
              return -6; //king is in check
          }
          if(this.chessboard[kingRank-1][kingFile-2].myPiece.name == 'Knight' && this.chessboard[kingRank-1][kingFile-2].myPiece.owner != color) {
              return -6; //king is in check
          }

          //check the rank and file directions (horizontal and vertical lines for check threats)
          for(let i = kingRank+1; i < 8; ++i) {
              if(this.chessboard[i][kingFile].myPiece != null) {
                  if((this.chessboard[i][kingFile].myPiece.name == 'Rook' || this.chessboard[i][kingFile].myPiece.name == 'Queen') && this.chessboard[i][kingFile].myPiece.owner != color) {
                      return -6; //king is in check 
                  }
                  else {//king is not in check in this direction
                      break;
                  }
              }
          }
          for(let i = kingRank-1; i >= 0; --i) {
              if(this.chessboard[i][kingFile].myPiece != null) {
                  if((this.chessboard[i][kingFile].myPiece.name == 'Rook' || this.chessboard[i][kingFile].myPiece.name == 'Queen') && this.chessboard[i][kingFile].myPiece.owner != color) {
                      return -6; //king is in check 
                  }
                  else {//king is not in check in this direction
                      break;
                  }
              }
          }
          for(let i = kingFile+1; i < 8; ++i) {
              if(this.chessboard[kingRank][i].myPiece != null) {
                  if((this.chessboard[kingRank][i].myPiece.name == 'Rook' || this.chessboard[kingRank][i].myPiece.name == 'Queen') && this.chessboard[kingRank][i].myPiece.owner != color) {
                      return -6; //king is in check 
                  }
                  else {//king is not in check in this direction
                      break;
                  }
              }
          }
          for(let i = kingFile-1; i >= 0; --i) {
              if(this.chessboard[kingRank][i].myPiece != null) {
                  if((this.chessboard[kingRank][i].myPiece.name == 'Rook' || this.chessboard[kingRank][i].myPiece.name == 'Queen') && this.chessboard[kingRank][i].myPiece.owner != color) {
                      return -6; //king is in check 
                  }
                  else {//king is not in check in this direction
                      break;
                  }
              }
          }

          //Check the diagonals 
          for(let i = kingRank+1; i < 8; ++i){
              for(let k = kingFile+1; k < 8; ++k) {
                  if(this.chessboard[i][k].myPiece != null) {
                      if((this.chessboard[i][k].myPiece.name == 'Bishop' || this.chessboard[i][k].myPiece.name == 'Queen') && this.chessboard[i][k].myPiece.owner != color) {
                          return -6; //king is in check 
                      }
                      //black pawn check
                      else if(this.chessboard[i][k].myPiece.name == 'Pawn' && this.chessboard[i][k].myPiece.owner != color && color == true && i == kingRank+1 && (k == kingFile+1 || k == kingFile-1)) {
                          return -6; //king is in check
                      }
                      //white pawn check
                      else if(this.chessboard[i][k].myPiece.name == 'Pawn' && this.chessboard[i][k].myPiece.owner != color && color == false && i == kingRank-1 && (k == kingFile+1 || k == kingFile-1)) {
                          return -6; //king is in check
                      }
                      else {//king is not in check in this direction
                          break;
                      }
                  }
              }
          }
          for(let i = kingRank-1; i >= 0; --i){
              for(let k = kingFile+1; k < 8; ++k) {
                  if(this.chessboard[i][k].myPiece != null) {
                      if((this.chessboard[i][k].myPiece.name == 'Bishop' || this.chessboard[i][k].myPiece.name == 'Queen') && this.chessboard[i][k].myPiece.owner != color) {
                          return -6; //king is in check 
                      }
                      //black pawn check
                      else if(this.chessboard[i][k].myPiece.name == 'Pawn' && this.chessboard[i][k].myPiece.owner != color && color == true && i == kingRank+1 && (k == kingFile+1 || k == kingFile-1)) {
                          return -6; //king is in check
                      }
                      //white pawn check
                      else if(this.chessboard[i][k].myPiece.name == 'Pawn' && this.chessboard[i][k].myPiece.owner != color && color == false && i == kingRank-1 && (k == kingFile+1 || k == kingFile-1)) {
                          return -6; //king is in check
                      }
                      else {//king is not in check in this direction
                          break;
                      }
                  }
              }
          }
          for(let i = kingRank+1; i < 8; ++i){
              for(let k = kingFile-1; k >= 0; --k) {
                  if(this.chessboard[i][k].myPiece != null) {
                      if((this.chessboard[i][k].myPiece.name == 'Bishop' || this.chessboard[i][k].myPiece.name == 'Queen') && this.chessboard[i][k].myPiece.owner != color) {
                          return -6; //king is in check 
                      }
                      //black pawn check
                      else if(this.chessboard[i][k].myPiece.name == 'Pawn' && this.chessboard[i][k].myPiece.owner != color && color == true && i == kingRank+1 && (k == kingFile+1 || k == kingFile-1)) {
                          return -6; //king is in check
                      }
                      //white pawn check
                      else if(this.chessboard[i][k].myPiece.name == 'Pawn' && this.chessboard[i][k].myPiece.owner != color && color == false && i == kingRank-1 && (k == kingFile+1 || k == kingFile-1)) {
                          return -6; //king is in check
                      }
                      else {//king is not in check in this direction
                          break;
                      }
                  }
              }
          }
          for(let i = kingRank-1; i >= 0; --i){
              for(let k = kingFile-1; k >= 0; --k) {
                  if(this.chessboard[i][k].myPiece != null) {
                      if((this.chessboard[i][k].myPiece.name == 'Bishop' || this.chessboard[i][k].myPiece.name == 'Queen') && this.chessboard[i][k].myPiece.owner != color) {
                          return -6; //king is in check 
                      }
                      //black pawn check
                      else if(this.chessboard[i][k].myPiece.name == 'Pawn' && this.chessboard[i][k].myPiece.owner != color && color == true && i == kingRank+1 && (k == kingFile+1 || k == kingFile-1)) {
                          return -6; //king is in check
                      }
                      //white pawn check
                      else if(this.chessboard[i][k].myPiece.name == 'Pawn' && this.chessboard[i][k].myPiece.owner != color && color == false && i == kingRank-1 && (k == kingFile+1 || k == kingFile-1)) {
                          return -6; //king is in check
                      }
                      else {//king is not in check in this direction
                          break;
                      }
                  }
              }
          }
      }
      //
      // Piece specific move rules
      //
      var validPiece = 0; //flag for checking that a valid piece has been encountered
      //Pawn move rules 
      if(this.chessboard[initRank][initFile].myPiece.owner == 'Pawn') {
          validPiece = 1;
          //white pawn
          if(this.chessboard[initRank][initFile].myPiece.owner == true) {
              if(destRank == initRank+2 && this.chessboard[initRank][initFile].myPiece.hasMoved == false) {
                  if(this.chessboard[initRank+1][initFile].myPiece != null) {
                      return -7; //blocking piece 
                  }
              }
              //TODO: Separate out into blocking piece and piece-movement rule errors for clarity
              else if(destRank != initRank+1 || this.chessboard[destRank][destFile].myPiece != null) {
                  return -8; //piece-specific movement rule error 
              }
              else if(destRank != initRank+1 || (destFile != initFile+1 || destFile != initFile-1) || this.chessboard[destRank][destFile].myPiece == null) {//enemy piece is on a diagonal square, valid pawn capture
                  return -8; //piece-specific move error 
              }
          }
          //black pawn
          else if(this.chessboard[initRank][initFile].myPiece.owner == false) {
              if(destRank == initRank-2 && this.chessboard[initRank][initFile].myPiece.hasMoved == false) {
                  if(this.chessboard[initRank-1][initFile].myPiece != null) {
                      return -7; //blocking piece 
                  }
              }
              else if(destRank != initRank+1) {
                  return -8; //piece-specific movement rule error 
              }
              else if(destRank != initRank-1 || (destFile != initFile+1 || destFile != initFile-1) || this.chessboard[destRank][destFile].myPiece == null) {//enemy piece is on a diagonal square, valid pawn capture
                  return -8; //piece-specific move error 
              }
          }
      }
      //knight move rules 
      else if(this.chessboard[initRank][initFile].myPiece.owner == 'Knight') {
          validPiece = 1;
          if(((destRank != initRank+2 || destRank != initRank-2) && (deskFile != initFile+1 || destFile != initFile-1)) ||  ((destRank != initRank+1 || destRank != initRank-1) && (deskFile != initFile+2 || destFile != initFile-2))) {
              return -8; //piece-specific move error 
          }
      }
      //bishop move rules
      else if(this.chessboard[initRank][initFile].myPiece.owner == 'Bishop') {
          validPiece = 1;
          rankDist == initRank - destRank;
          fileDist == initFile - destFile;
          if(rankDist != fileDist || rankDist != -fileDist) {
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
              for(let i = initRank-1; i < destRank; --i) {
                  for(let k = initFile-1; k < destFile; --k) {
                      if(this.chessboard[i][k].myPiece != null) {
                          return -7; //blocking piece 
                      }
                  }
              }
          }
      }
      //rook move rules
      else if(this.chessboard[initRank][initFile].myPiece.owner == 'Rook') {
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
      else if(this.chessboard[initRank][initFile].myPiece.owner == 'Queen') {
          validPiece = 1;
          rankDist == initRank - destRank;
          fileDist == initFile - destFile;
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
                  for(let i = initRank-1; i < destRank; --i) {
                      for(let k = initFile-1; k < destFile; --k) {
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
      else if(this.chessboard[initRank][initFile].myPiece.owner == 'King') {
          validPiece = 1;
          if(destRank > initRank+1 || destRank < initRank-1 || destFile > initFile+1 || destFile < initFile-1) {
              return -8; //piece-specific move error 
          }
      }
      else if (validPiece == 0){
          return -9; //unrecognized piece type error
      }
      else {
          return 1; //valid move 
      }      
  }

  move(initRank, initFile, destRank, destFile, color) {
    let result = 0;
    result = this.check_move(initRank, initFile, destRank, destFile, color, 0, 0); // en passant not yet implemented
    if(result == 1) {
        chessboard[initRank][initFile].myPiece.hasMoved = true;
        chessboard[destRank][destFile].myPiece = null;
        chessboard[destRank][destFile].myPiece = chessboard[initRank][initFile].myPiece;
        chessboard[initRank][initFile].myPiece = null;
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