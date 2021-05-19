class piece {
    constructor(owner, value, name) {
        has_moved = false;
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
                if(i == 0) {//rank is 1, white backrank 
                    if(k == 0 || k == 7) {// A1 and H1, white rooks
                        chessboard[i][k].myPiece = piece(true, 5, 'Rook');
                    }
                    if(k == 1 || k == 6) {// B1 and G1, white knights
                        chessboard[i][k].myPiece = piece(true, 3, 'Knight');
                    }
                    if(k == 2 || k == 5) {// C1 and F1, white bishops
                        chessboard[i][k].myPiece = piece(true, 3, 'Bishop');
                    }
                    if(k == 3) {// D1, white queen
                        chessboard[i][k].myPiece = piece(true, 9, 'Queen');
                    }
                    if(k == 4) {// E1, white king
                        chessboard[i][k].myPiece = piece(true, Infinity, 'King');
                    }
                }
            }
        }
    }
}