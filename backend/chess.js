class piece {
    constructor(owner, value, name) {
        hasMoved = false;
        const owner = owner; 
        const value = value; //point value of the piece, int
        const name = name;
    }
}
class square {
    constructor() {
        myPiece = null;
    }
    constructor(piece) {
        myPiece = piece;
    }
}
class board {
    constructor() {
        //initialize the 64 squares so that they can be accessed by chessboard[0][0] for A1, [0][1] for B1 and so on 
        chessboard = [
            [square, square, square, square, square, square, square, square],
            [square, square, square, square, square, square, square, square],
            [square, square, square, square, square, square, square, square],
            [square, square, square, square, square, square, square, square],
            [square, square, square, square, square, square, square, square],
            [square, square, square, square, square, square, square, square],
            [square, square, square, square, square, square, square, square],
            [square, square, square, square, square, square, square, square]
        ]
    }
    initialize() {//multipurpose function - clears board and resets it to default position
        for(i = 0; i < 8; ++i) {
            for(k = 0; k < 8; ++i) {
                chessboard[i][k].myPiece = null;
            }
        }
        for(i = 0; i < 8; ++i) {
            for(k = 0; k < 8; ++i) {
                if(i == 0) { //rank is 1, white backrank 
                    if(k == 0 || k == 7) { // A1 and H1, white rooks
                        chessboard[i][k].myPiece = piece(true, 5, 'Rook');
                    }
                    if(k == 1 || k == 6) { // B1 and G1, white knights
                        chessboard[i][k].myPiece = piece(true, 3, 'Knight');
                    }
                    if(k == 2 || k == 5) { // C1 and F1, white bishops
                        chessboard[i][k].myPiece = piece(true, 3, 'Bishop');
                    }
                    if(k == 3) { // D1, white queen
                        chessboard[i][k].myPiece = piece(true, 9, 'Queen');
                    }
                    if(k == 4) { // E1, white king
                        chessboard[i][k].myPiece = piece(true, Infinity, 'King');
                    }
                }
                if(i == 1) { //Rank 2, white pawns 
                    chessboard[i][k].myPiece = piece(true, 1, 'Pawn');
                }
                if(i == 6) { //Rank 7, black pawns
                    chessboard[i][k].myPiece = piece(false, 1, 'Pawn');
                }
                if(i == 7) { //rank is 8, black backrank 
                    if(k == 0 || k == 7) { // A8 and H8, black rooks
                        chessboard[i][k].myPiece = piece(false, 5, 'Rook');
                    }
                    if(k == 1 || k == 6) { // B8 and G8, black knights
                        chessboard[i][k].myPiece = piece(false, 3, 'Knight');
                    }
                    if(k == 2 || k == 5) { // C8 and F8, black bishops
                        chessboard[i][k].myPiece = piece(false, 3, 'Bishop');
                    }
                    if(k == 3) { // D8, black queen
                        chessboard[i][k].myPiece = piece(false, 9, 'Queen');
                    }
                    if(k == 4) { // E8, black king
                        chessboard[i][k].myPiece = piece(false, Infinity, 'King');
                    }
                }
            }
        }
    }
    //TODO implement pin check
    //TODO implement check check
    //TODO implement piece movement rules
    //TODO implement path checking
    //TODO implement en passant check - will require knowledge of previous move
    //TODO implement a castle check 
    
    //WHEN PASSING TO FUNCTION REMEMBER TO PASS IN THE ORDER [RANK][FILE], UNLIKE A CHESS MOVE
    //That is, the square C2 would be passed as [1][2] (because of zero indexing)

    //This function checks that a move is legal, and returns an integer response indicating why a move isn't legal
    //if that is the case 
    check_move(initRank, initFile, destRank, destFile) {
        if(!chessboard[initRank][initFile].myPiece){ //make sure that there is a piece at the initial square
            return -1; //no piece error
        }
        if(destRank > 7 || destRank < 0 || destFile > 7 || destFile < 0) {
            return -2; //out of board bounds error
        }
        if(destRank == initRank && destFile == initFile) {
            return -3; //the move isn't a move error
        }
        if(chessboard[destRank][destFile].myPiece.owner == chessboard[initRank][initFile].myPiece.owner) {
            return -4; //self-capture error - cannot capture own pieces 
        }
    }
}