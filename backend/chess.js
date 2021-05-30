//Written by Max Van Raden 
//Contains classes for handling the logical implentation of chess
//The structure is as follows: a board is made up of squares, which can contain pieces.
//The board is initialized with the correct number of squares and pieces for a standard chess starting position
//The board contains the monstrous check_move function, which takes the initial square and destination square as arguments
//and ensures that the move is legal. 

//Castling and en passant still require implementation 
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
    // -1 no piece, -2 out of bounds, -3 not moving, -4 self capture, -5 pinned, -6 in check, -7 blocking piece, -8 piece-specific move rule, -9 unrecognized piece type 
    check_move(initRank, initFile, destRank, destFile, color, enPassantRank, enPassantFile) {
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
        //
        // Pin check - separated because big function
        //
        if(chessboard[initRank][initFile].myPiece.owner != 'King') { //A king cannot be pinned to itself, so skip this if the king moves 
            let kingFile = -1;
            let kingRank = -1;
            let isPinned = -1;
            for(i = 0; i < 8; i++){ //Step one, locate the same side king by iterating through board
                for(k = 0; k < 8; k++) {
                    if(chessboard[i][k].myPiece != null){
                        if(chessboard[i][k].myPiece.name == 'King' && chessboard[i][k].myPiece.owner == chessboard[initRank][initFile].myPiece.owner) { //locate same side king 
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
                    for(i = initFile+1; i < kingFile; i++){ //check if there is a piece between the king and the moving piece, if so, not pinned
                        if(chessboard[kingRank][i].myPiece != null) { //if the square is not empty, the moving piece is unpinned
                            isPinned = 0; //Not pinned
                        }
                        if(isPinned != -1) {
                            break;
                        }
                    }
                    if(isPinned == -1) { //there is not a piece in between, continue with pin check 
                        for(i = initFile-1; i >= 0; i--) { //look at the squares on the side of the piece opposite the king for enemy rooks 
                            if(chessboard[kingRank][i].myPiece != null) {
                                if((chessboard[kingRank][i].myPiece.name == 'Rook' || chessboard[kingRank][i].myPiece.name == 'Queen') && chessboard[kingRank][i].myPiece.owner != color) { //checks for enemy rook or queen
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
                        for(i = initFile-1; i > kingFile; i--){ //check if there is a piece between the king and the moving piece, if so, not pinned
                            if(chessboard[kingRank][i].myPiece != null) {//if the square is not empty, the moving piece is unpinned
                                isPinned = 0; //Not pinned
                            }
                            if(isPinned != -1) {
                                break;
                            }
                        }
                        if(isPinned == -1) { //there is not a piece in between, continue with pin check 
                            for(i = initFile+1; i < 8; i++) {//look at the squares on the side of the piece opposite the king for enemy rooks 
                                if(chessboard[kingRank][i].myPiece != null) {
                                    if((chessboard[kingRank][i].myPiece.name == 'Rook' || chessboard[kingRank][i].myPiece.name == 'Queen') && chessboard[kingRank][i].myPiece.owner != color) { //checks for enemy rook or queen
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
                    for(i = initRank+1; i < kingRank; i++){ //check if there is a piece between the king and the moving piece, if so, not pinned
                        if(chessboard[i][kingFile].myPiece != null) {//if the square is not empty, the moving piece is unpinned
                            isPinned = 0; //Not pinned
                        }
                        if(isPinned != -1) {
                            break;
                        }
                    }
                    if(isPinned == -1) { //there is not a piece in between, continue with pin check 
                        for(i = initRank-1; i >= 0; i--) {//look at the squares on the side of the piece opposite the king for enemy rooks 
                            if(chessboard[i][kingFile].myPiece != null) {
                                if((chessboard[i][kingFile].myPiece.name == 'Rook' || chessboard[i][kingFile].myPiece.name == 'Queen') && chessboard[i][kingFile].myPiece.owner != color) { //checks for enemy rook or queen
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
                        for(i = kingRank-1; i > kingRank; i--){ //check if there is a piece between the king and the moving piece, if so, not pinned
                            if(chessboard[i][kingFile].myPiece != null) {//if the square is not empty, the moving piece is unpinned
                                isPinned = 0; //Not pinned
                            }
                            if(isPinned != -1) {
                                break;
                            }
                        }
                        if(isPinned == -1) { //there is not a piece in between, continue with pin check 
                            for(i = initRank+1; i <= 7; i++) {//look at the squares on the side of the piece opposite the king for enemy rooks 
                                if(chessboard[i][kingFile].myPiece != null) {
                                    if((chessboard[i][kingFile].myPiece.name == 'Rook' || chessboard[i][kingFile].myPiece.name == 'Queen') && chessboard[i][kingFile].myPiece.owner != color) { //checks for enemy rook or queen
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
                        for(i = initRank+1; i < kingRank; ++i) {
                            for(k = initFile+1; k < kingFile; ++k) {
                                if(chessboard[i][k].myPiece != null) { // there is a piece on the diagonal between the king and the piece
                                    isPinned = 0;
                                    break;
                                }

                            }
                            if(isPinned != -1) {
                                break;
                            }
                        }
                        if(isPinned == -1) {//check the opposite diagonal direction if there's not a piece in between
                            for(i = initRank-1; i >= 0; --i) {
                                for(k = initFile-1; i >=0; --i) {
                                    if(chessboard[i][k].myPiece != null) { //check that the square is not empty
                                        if((chessboard[i][k].myPiece.name == 'Bishop' || chessboard[i][k].myPiece.name == 'Queen') && chessboard[i][k].myPiece.owner != color) {
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
                        for(i = initRank+1; i < kingRank; ++i) {
                            for(k = initFile-1; k > kingFile; --k) {
                                if(chessboard[i][k].myPiece != null) { // there is a piece on the diagonal between the king and the piece
                                    isPinned = 0;
                                    break;
                                }

                            }
                            if(isPinned != -1) {
                                break;
                            }
                        }
                        if(isPinned == -1) {//check the opposite diagonal direction if there's not a piece in between
                            for(i = initRank-1; i >= 0; --i) {
                                for(k = initFile+1; i < 8; ++i) {
                                    if(chessboard[i][k].myPiece != null) { //check that the square is not empty
                                        if((chessboard[i][k].myPiece.name == 'Bishop' || chessboard[i][k].myPiece.name == 'Queen') && chessboard[i][k].myPiece.owner != color) {
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
                        for(i = initRank-1; i > kingRank; --i) {
                            for(k = initFile+1; k < kingFile; ++k) {
                                if(chessboard[i][k].myPiece != null) { // there is a piece on the diagonal between the king and the piece
                                    isPinned = 0;
                                    break;
                                }

                            }
                            if(isPinned != -1) {
                                break;
                            }
                        }
                        if(isPinned == -1) {//check the opposite diagonal direction if there's not a piece in between
                            for(i = initRank+1; i < 8; ++i) {
                                for(k = initFile-1; i >= 0; --i) {
                                    if(chessboard[i][k].myPiece != null) { //check that the square is not empty
                                        if((chessboard[i][k].myPiece.name == 'Bishop' || chessboard[i][k].myPiece.name == 'Queen') && chessboard[i][k].myPiece.owner != color) {
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
                        for(i = initRank-1; i > kingRank; --i) {
                            for(k = initFile-1; k > kingFile; --k) {
                                if(chessboard[i][k].myPiece != null) { // there is a piece on the diagonal between the king and the piece
                                    isPinned = 0;
                                    break;
                                }

                            }
                            if(isPinned != -1) {
                                break;
                            }
                        }
                        if(isPinned == -1) {//check the opposite diagonal direction if there's not a piece in between
                            for(i = initRank+1; i < 8; ++i) {
                                for(k = initFile+1; i < 8; ++i) {
                                    if(chessboard[i][k].myPiece != null) { //check that the square is not empty
                                        if((chessboard[i][k].myPiece.name == 'Bishop' || chessboard[i][k].myPiece.name == 'Queen') && chessboard[i][k].myPiece.owner != color) {
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
        if(chessboard[initRank][initFile].myPiece.owner != 'King') {//if the piece being moved isn't a king, check that the king isn't currently in check
            let kingRank = -1;
            let kingFile = -1;
            for(i = 0; i < 8; i++) { //Step one, locate the same side king by iterating through board
                for(k = 0; k < 8; k++) {
                    if(chessboard[i][k].myPiece != null){
                        if(chessboard[i][k].myPiece.name == 'King' && chessboard[i][k].myPiece.owner == color) { //locate same side king 
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
            if(chessboard[kingRank+2][kingFile+1].myPiece.name == 'Knight' && chessboard[kingRank+2][kingFile+1].myPiece.owner != color) {
                return -6; //king is in check
            }
            if(chessboard[kingRank+2][kingFile-1].myPiece.name == 'Knight' && chessboard[kingRank+2][kingFile-1].myPiece.owner != color) {
                return -6; //king is in check
            }
            if(chessboard[kingRank-2][kingFile+1].myPiece.name == 'Knight' && chessboard[kingRank-2][kingFile+1].myPiece.owner != color) {
                return -6; //king is in check
            }
            if(chessboard[kingRank-2][kingFile-1].myPiece.name == 'Knight' && chessboard[kingRank-2][kingFile-1].myPiece.owner != color) {
                return -6; //king is in check
            }
            if(chessboard[kingRank+1][kingFile+2].myPiece.name == 'Knight' && chessboard[kingRank+1][kingFile+2].myPiece.owner != color) {
                return -6; //king is in check
            }
            if(chessboard[kingRank+1][kingFile-2].myPiece.name == 'Knight' && chessboard[kingRank+1][kingFile-2].myPiece.owner != color) {
                return -6; //king is in check
            }
            if(chessboard[kingRank-1][kingFile+2].myPiece.name == 'Knight' && chessboard[kingRank-1][kingFile+2].myPiece.owner != color) {
                return -6; //king is in check
            }
            if(chessboard[kingRank-1][kingFile-2].myPiece.name == 'Knight' && chessboard[kingRank-1][kingFile-2].myPiece.owner != color) {
                return -6; //king is in check
            }
            
            //check the rank and file directions (horizontal and vertical lines for check threats)
            for(i = kingRank+1; i < 8; ++i) {
                if(chessboard[i][kingFile].myPiece != null) {
                    if((chessboard[i][kingFile].myPiece.name == 'Rook' || chessboard[i][kingFile].myPiece.name == 'Queen') && chessboard[i][kingFile].myPiece.owner != color) {
                        return -6; //king is in check 
                    }
                    else {//king is not in check in this direction
                        break;
                    }
                }
            }
            for(i = kingRank-1; i >= 0; --i) {
                if(chessboard[i][kingFile].myPiece != null) {
                    if((chessboard[i][kingFile].myPiece.name == 'Rook' || chessboard[i][kingFile].myPiece.name == 'Queen') && chessboard[i][kingFile].myPiece.owner != color) {
                        return -6; //king is in check 
                    }
                    else {//king is not in check in this direction
                        break;
                    }
                }
            }
            for(i = kingFile+1; i < 8; ++i) {
                if(chessboard[kingRank][i].myPiece != null) {
                    if((chessboard[kingRank][i].myPiece.name == 'Rook' || chessboard[kingRank][i].myPiece.name == 'Queen') && chessboard[kingRank][i].myPiece.owner != color) {
                        return -6; //king is in check 
                    }
                    else {//king is not in check in this direction
                        break;
                    }
                }
            }
            for(i = kingFile-1; i >= 0; --i) {
                if(chessboard[kingRank][i].myPiece != null) {
                    if((chessboard[kingRank][i].myPiece.name == 'Rook' || chessboard[kingRank][i].myPiece.name == 'Queen') && chessboard[kingRank][i].myPiece.owner != color) {
                        return -6; //king is in check 
                    }
                    else {//king is not in check in this direction
                        break;
                    }
                }
            }

            //Check the diagonals 
            for(i = kingRank+1; i < 8; ++i){
                for(k = kingFile+1; k < 8; ++k) {
                    if(chessboard[i][k].myPiece != null) {
                        if((chessboard[i][k].myPiece.name == 'Bishop' || chessboard[i][k].myPiece.name == 'Queen') && chessboard[i][k].myPiece.owner != color) {
                            return -6; //king is in check 
                        }
                        //black pawn check
                        else if(chessboard[i][k].myPiece.name == 'Pawn' && chessboard[i][k].myPiece.owner != color && color == true && i == kingRank+1 && (k == kingFile+1 || k == kingFile-1)) {
                            return -6; //king is in check
                        }
                        //white pawn check
                        else if(chessboard[i][k].myPiece.name == 'Pawn' && chessboard[i][k].myPiece.owner != color && color == false && i == kingRank-1 && (k == kingFile+1 || k == kingFile-1)) {
                            return -6; //king is in check
                        }
                        else {//king is not in check in this direction
                            break;
                        }
                    }
                }
            }
            for(i = kingRank-1; i >= 0; --i){
                for(k = kingFile+1; k < 8; ++k) {
                    if(chessboard[i][k].myPiece != null) {
                        if((chessboard[i][k].myPiece.name == 'Bishop' || chessboard[i][k].myPiece.name == 'Queen') && chessboard[i][k].myPiece.owner != color) {
                            return -6; //king is in check 
                        }
                        //black pawn check
                        else if(chessboard[i][k].myPiece.name == 'Pawn' && chessboard[i][k].myPiece.owner != color && color == true && i == kingRank+1 && (k == kingFile+1 || k == kingFile-1)) {
                            return -6; //king is in check
                        }
                        //white pawn check
                        else if(chessboard[i][k].myPiece.name == 'Pawn' && chessboard[i][k].myPiece.owner != color && color == false && i == kingRank-1 && (k == kingFile+1 || k == kingFile-1)) {
                            return -6; //king is in check
                        }
                        else {//king is not in check in this direction
                            break;
                        }
                    }
                }
            }
            for(i = kingRank+1; i < 8; ++i){
                for(k = kingFile-1; k >= 0; --k) {
                    if(chessboard[i][k].myPiece != null) {
                        if((chessboard[i][k].myPiece.name == 'Bishop' || chessboard[i][k].myPiece.name == 'Queen') && chessboard[i][k].myPiece.owner != color) {
                            return -6; //king is in check 
                        }
                        //black pawn check
                        else if(chessboard[i][k].myPiece.name == 'Pawn' && chessboard[i][k].myPiece.owner != color && color == true && i == kingRank+1 && (k == kingFile+1 || k == kingFile-1)) {
                            return -6; //king is in check
                        }
                        //white pawn check
                        else if(chessboard[i][k].myPiece.name == 'Pawn' && chessboard[i][k].myPiece.owner != color && color == false && i == kingRank-1 && (k == kingFile+1 || k == kingFile-1)) {
                            return -6; //king is in check
                        }
                        else {//king is not in check in this direction
                            break;
                        }
                    }
                }
            }
            for(i = kingRank-1; i >= 0; --i){
                for(k = kingFile-1; k >= 0; --k) {
                    if(chessboard[i][k].myPiece != null) {
                        if((chessboard[i][k].myPiece.name == 'Bishop' || chessboard[i][k].myPiece.name == 'Queen') && chessboard[i][k].myPiece.owner != color) {
                            return -6; //king is in check 
                        }
                        //black pawn check
                        else if(chessboard[i][k].myPiece.name == 'Pawn' && chessboard[i][k].myPiece.owner != color && color == true && i == kingRank+1 && (k == kingFile+1 || k == kingFile-1)) {
                            return -6; //king is in check
                        }
                        //white pawn check
                        else if(chessboard[i][k].myPiece.name == 'Pawn' && chessboard[i][k].myPiece.owner != color && color == false && i == kingRank-1 && (k == kingFile+1 || k == kingFile-1)) {
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
            if(chessboard[kingRank+2][kingFile+1].myPiece.name == 'Knight' && chessboard[kingRank+2][kingFile+1].myPiece.owner != color) {
                return -6; //king is in check
            }
            if(chessboard[kingRank+2][kingFile-1].myPiece.name == 'Knight' && chessboard[kingRank+2][kingFile-1].myPiece.owner != color) {
                return -6; //king is in check
            }
            if(chessboard[kingRank-2][kingFile+1].myPiece.name == 'Knight' && chessboard[kingRank-2][kingFile+1].myPiece.owner != color) {
                return -6; //king is in check
            }
            if(chessboard[kingRank-2][kingFile-1].myPiece.name == 'Knight' && chessboard[kingRank-2][kingFile-1].myPiece.owner != color) {
                return -6; //king is in check
            }
            if(chessboard[kingRank+1][kingFile+2].myPiece.name == 'Knight' && chessboard[kingRank+1][kingFile+2].myPiece.owner != color) {
                return -6; //king is in check
            }
            if(chessboard[kingRank+1][kingFile-2].myPiece.name == 'Knight' && chessboard[kingRank+1][kingFile-2].myPiece.owner != color) {
                return -6; //king is in check
            }
            if(chessboard[kingRank-1][kingFile+2].myPiece.name == 'Knight' && chessboard[kingRank-1][kingFile+2].myPiece.owner != color) {
                return -6; //king is in check
            }
            if(chessboard[kingRank-1][kingFile-2].myPiece.name == 'Knight' && chessboard[kingRank-1][kingFile-2].myPiece.owner != color) {
                return -6; //king is in check
            }

            //check the rank and file directions (horizontal and vertical lines for check threats)
            for(i = kingRank+1; i < 8; ++i) {
                if(chessboard[i][kingFile].myPiece != null) {
                    if((chessboard[i][kingFile].myPiece.name == 'Rook' || chessboard[i][kingFile].myPiece.name == 'Queen') && chessboard[i][kingFile].myPiece.owner != color) {
                        return -6; //king is in check 
                    }
                    else {//king is not in check in this direction
                        break;
                    }
                }
            }
            for(i = kingRank-1; i >= 0; --i) {
                if(chessboard[i][kingFile].myPiece != null) {
                    if((chessboard[i][kingFile].myPiece.name == 'Rook' || chessboard[i][kingFile].myPiece.name == 'Queen') && chessboard[i][kingFile].myPiece.owner != color) {
                        return -6; //king is in check 
                    }
                    else {//king is not in check in this direction
                        break;
                    }
                }
            }
            for(i = kingFile+1; i < 8; ++i) {
                if(chessboard[kingRank][i].myPiece != null) {
                    if((chessboard[kingRank][i].myPiece.name == 'Rook' || chessboard[kingRank][i].myPiece.name == 'Queen') && chessboard[kingRank][i].myPiece.owner != color) {
                        return -6; //king is in check 
                    }
                    else {//king is not in check in this direction
                        break;
                    }
                }
            }
            for(i = kingFile-1; i >= 0; --i) {
                if(chessboard[kingRank][i].myPiece != null) {
                    if((chessboard[kingRank][i].myPiece.name == 'Rook' || chessboard[kingRank][i].myPiece.name == 'Queen') && chessboard[kingRank][i].myPiece.owner != color) {
                        return -6; //king is in check 
                    }
                    else {//king is not in check in this direction
                        break;
                    }
                }
            }

            //Check the diagonals 
            for(i = kingRank+1; i < 8; ++i){
                for(k = kingFile+1; k < 8; ++k) {
                    if(chessboard[i][k].myPiece != null) {
                        if((chessboard[i][k].myPiece.name == 'Bishop' || chessboard[i][k].myPiece.name == 'Queen') && chessboard[i][k].myPiece.owner != color) {
                            return -6; //king is in check 
                        }
                        //black pawn check
                        else if(chessboard[i][k].myPiece.name == 'Pawn' && chessboard[i][k].myPiece.owner != color && color == true && i == kingRank+1 && (k == kingFile+1 || k == kingFile-1)) {
                            return -6; //king is in check
                        }
                        //white pawn check
                        else if(chessboard[i][k].myPiece.name == 'Pawn' && chessboard[i][k].myPiece.owner != color && color == false && i == kingRank-1 && (k == kingFile+1 || k == kingFile-1)) {
                            return -6; //king is in check
                        }
                        else {//king is not in check in this direction
                            break;
                        }
                    }
                }
            }
            for(i = kingRank-1; i >= 0; --i){
                for(k = kingFile+1; k < 8; ++k) {
                    if(chessboard[i][k].myPiece != null) {
                        if((chessboard[i][k].myPiece.name == 'Bishop' || chessboard[i][k].myPiece.name == 'Queen') && chessboard[i][k].myPiece.owner != color) {
                            return -6; //king is in check 
                        }
                        //black pawn check
                        else if(chessboard[i][k].myPiece.name == 'Pawn' && chessboard[i][k].myPiece.owner != color && color == true && i == kingRank+1 && (k == kingFile+1 || k == kingFile-1)) {
                            return -6; //king is in check
                        }
                        //white pawn check
                        else if(chessboard[i][k].myPiece.name == 'Pawn' && chessboard[i][k].myPiece.owner != color && color == false && i == kingRank-1 && (k == kingFile+1 || k == kingFile-1)) {
                            return -6; //king is in check
                        }
                        else {//king is not in check in this direction
                            break;
                        }
                    }
                }
            }
            for(i = kingRank+1; i < 8; ++i){
                for(k = kingFile-1; k >= 0; --k) {
                    if(chessboard[i][k].myPiece != null) {
                        if((chessboard[i][k].myPiece.name == 'Bishop' || chessboard[i][k].myPiece.name == 'Queen') && chessboard[i][k].myPiece.owner != color) {
                            return -6; //king is in check 
                        }
                        //black pawn check
                        else if(chessboard[i][k].myPiece.name == 'Pawn' && chessboard[i][k].myPiece.owner != color && color == true && i == kingRank+1 && (k == kingFile+1 || k == kingFile-1)) {
                            return -6; //king is in check
                        }
                        //white pawn check
                        else if(chessboard[i][k].myPiece.name == 'Pawn' && chessboard[i][k].myPiece.owner != color && color == false && i == kingRank-1 && (k == kingFile+1 || k == kingFile-1)) {
                            return -6; //king is in check
                        }
                        else {//king is not in check in this direction
                            break;
                        }
                    }
                }
            }
            for(i = kingRank-1; i >= 0; --i){
                for(k = kingFile-1; k >= 0; --k) {
                    if(chessboard[i][k].myPiece != null) {
                        if((chessboard[i][k].myPiece.name == 'Bishop' || chessboard[i][k].myPiece.name == 'Queen') && chessboard[i][k].myPiece.owner != color) {
                            return -6; //king is in check 
                        }
                        //black pawn check
                        else if(chessboard[i][k].myPiece.name == 'Pawn' && chessboard[i][k].myPiece.owner != color && color == true && i == kingRank+1 && (k == kingFile+1 || k == kingFile-1)) {
                            return -6; //king is in check
                        }
                        //white pawn check
                        else if(chessboard[i][k].myPiece.name == 'Pawn' && chessboard[i][k].myPiece.owner != color && color == false && i == kingRank-1 && (k == kingFile+1 || k == kingFile-1)) {
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
        
        //Pawn move rules 
        if(chessboard[initRank][initFile].myPiece.owner == 'Pawn') {
            //white pawn
            if(chessboard[initRank][initFile].myPiece.owner == true) {
                if(destRank == initRank+2 && chessboard[initRank][initFile].myPiece.hasMoved == false) {
                    if(chessboard[initRank+1][initFile].myPiece != null) {
                        return -7; //blocking piece 
                    }
                }
                //TODO: Separate out into blocking piece and piece-movement rule errors for clarity
                else if(destRank != initRank+1 || chessboard[destRank][destFile].myPiece != null) {
                    return -8; //piece-specific movement rule error 
                }
                else if(destRank != initRank+1 || (destFile != initFile+1 || destFile != initFile-1) || chessboard[destRank][destFile].myPiece == null) {//enemy piece is on a diagonal square, valid pawn capture
                    return -8; //piece-specific move error 
                }
            }
            //black pawn
            else if(chessboard[initRank][initFile].myPiece.owner == false) {
                if(destRank == initRank-2 && chessboard[initRank][initFile].myPiece.hasMoved == false) {
                    if(chessboard[initRank-1][initFile].myPiece != null) {
                        return -7; //blocking piece 
                    }
                }
                else if(destRank != initRank+1) {
                    return -8; //piece-specific movement rule error 
                }
                else if(destRank != initRank-1 || (destFile != initFile+1 || destFile != initFile-1) || chessboard[destRank][destFile].myPiece == null) {//enemy piece is on a diagonal square, valid pawn capture
                    return -8; //piece-specific move error 
                }
            }
        }
        //knight move rules 
        else if(chessboard[initRank][initFile].myPiece.owner == 'Knight') {
            if(((destRank != initRank+2 || destRank != initRank-2) && (deskFile != initFile+1 || destFile != initFile-1)) ||  ((destRank != initRank+1 || destRank != initRank-1) && (deskFile != initFile+2 || destFile != initFile-2))) {
                return -8; //piece-specific move error 
            }
        }
        //bishop move rules
        else if(chessboard[initRank][initFile].myPiece.owner == 'Bishop') {
            rankDist == initRank - destRank;
            fileDist == initFile - destFile;
            if(rankDist != fileDist || rankDist != -fileDist) {
                return -8; //piece-specific move error 
            }
            //check for clear path
            //both positive
            if(rankDist > 0 && fileDist > 0) {
                for(i = initRank+1; i < destRank; ++i){
                    for(k == initFile+1; k < destFile; ++k) {
                        if(chessboard[i][k].myPiece != null) {
                            return -7; //blocking piece 
                        }
                    }
                }
            }
            //rank positive, file negative 
            if(rankDist > 0 && fileDist < 0) {
                for(i = initRank+1; i < destRank; ++i) {
                    for(k == initFile-1; k > destFile; --k) {
                        if(chessboard[i][k].myPiece != null) {
                            return -7; //blocking piece 
                        }
                    }
                }
            }
            //rank negative, file positive
            if(rankDist < 0 && fileDist > 0) {
                for(i = initRank-1; i > destRank; --i) {
                    for(k == initFile+1; k < destFile; ++k) {
                        if(chessboard[i][k].myPiece != null) {
                            return -7; //blocking piece 
                        }
                    }
                }
            }
            //both negative 
            if(rankDist < 0 && fileDist < 0) {
                for(i = initRank-1; i < destRank; --i) {
                    for(k == initFile-1; k < destFile; --k) {
                        if(chessboard[i][k].myPiece != null) {
                            return -7; //blocking piece 
                        }
                    }
                }
            }
        }
        //rook move rules
        else if(chessboard[initRank][initFile].myPiece.owner == 'Rook') {
            //travelling on rank
            if(destFile == initFile && destRank != initRank) {
                if(destRank - initRank > 0) {
                    for(i = initRank+1; i < destRank; i++) {
                        if(chessboard[i][initFile].myPiece != null) {
                            return -7; //blocking piece 
                        }
                    }
                }
                else {
                    for(i = initRank-1; i > destRank; i--) {
                        if(chessboard[i][initFile].myPiece != null) {
                            return -7; //blocking piece 
                        }
                    }
                }
            }
            //travelling on file 
            else if(destFile != initFile && destRank == initRank) {
                if(destFile - initFile > 0) {
                    for(i = initFile+1; i < destFile; i++) {
                        if(chessboard[initRank][i].myPiece != null) {
                            return -7; //blocking piece 
                        }
                    }
                }
                else {
                    for(i = initFile-1; i > destFile; i--) {
                        if(chessboard[initRank][i].myPiece != null) {
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
        else if(chessboard[initRank][initFile].myPiece.owner == 'Queen') {
            rankDist == initRank - destRank;
            fileDist == initFile - destFile;
            //bishop type movement
            if(rankDist == fileDist || rankDist == -fileDist) {   
                if(rankDist > 0 && fileDist > 0) {
                    for(i = initRank+1; i < destRank; ++i){
                        for(k == initFile+1; k < destFile; ++k) {
                            if(chessboard[i][k].myPiece != null) {
                                return -7; //blocking piece 
                            }
                        }
                    }
                }
                //rank positive, file negative 
                if(rankDist > 0 && fileDist < 0) {
                    for(i = initRank+1; i < destRank; ++i) {
                        for(k == initFile-1; k > destFile; --k) {
                            if(chessboard[i][k].myPiece != null) {
                                return -7; //blocking piece 
                            }
                        }
                    }
                }
                //rank negative, file positive
                if(rankDist < 0 && fileDist > 0) {
                    for(i = initRank-1; i > destRank; --i) {
                        for(k == initFile+1; k < destFile; ++k) {
                            if(chessboard[i][k].myPiece != null) {
                                return -7; //blocking piece 
                            }
                        }
                    }
                }
                //both negative 
                if(rankDist < 0 && fileDist < 0) {
                    for(i = initRank-1; i < destRank; --i) {
                        for(k == initFile-1; k < destFile; --k) {
                            if(chessboard[i][k].myPiece != null) {
                                return -7; //blocking piece 
                            }
                        }
                    }
                }
            }
            //rook type movement on Rank
            else if(destFile == initFile && destRank != initRank) { 
                if(destRank - initRank > 0) {
                    for(i = initRank+1; i < destRank; i++) {
                        if(chessboard[i][initFile].myPiece != null) {
                            return -7; //blocking piece 
                        }
                    }
                }
                else {
                    for(i = initRank-1; i > destRank; i--) {
                        if(chessboard[i][initFile].myPiece != null) {
                            return -7; //blocking piece 
                        }
                    }
                }
            }
            //rook type movement on File 
            else if(destFile != initFile && destRank == initRank) { 
                if(destFile - initFile > 0) {
                    for(i = initFile+1; i < destFile; i++) {
                        if(chessboard[initRank][i].myPiece != null) {
                            return -7; //blocking piece 
                        }
                    }
                }
                else {
                    for(i = initFile-1; i > destFile; i--) {
                        if(chessboard[initRank][i].myPiece != null) {
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
        else if(chessboard[initRank][initFile].myPiece.owner == 'King') {
            if(destRank > initRank+1 || destRank < initRank-1 || destFile > initFile+1 || destFile < initFile-1) {
                return -8; //piece-specific move error 
            }
        }
        else {
            return -9; //unrecognized piece type error
        }      
    }
}