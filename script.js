const elmt = document.querySelector(".game");
const MODS = [7, 8, 9, 1, -1, -7, -8, -9];

var board = "rnbqkbnrpppppppp                                PPPPPPPPRNBQKBNR",
castles = [true, true, true, true], //qkQK
fullMove = 1,
halfMove = 0,
enPassant = -1,
pressedX = 0,
pressedY = 0,
kingPos = [60, 4];
selected = null,
selectedPos = {x: -1, y: -1};
whiteTurn = true,
kingChecked = false,
shieldMoves = [],
possibles = [],
nails = [];
load();
kingState();

function load() {
    for(let i = 0; i < 8; i++) {
        let row = elmt.children[i];
        for(let j = 0; j < 8; j++) {
            let piece = board.charAt(i*8 + j);
            let square = row.children[j].children[0];
            square.className = "";
            if(piece != " ") 
                square.classList.add(piece);
        }
    }
}

document.addEventListener("mousedown", (e) => {
    selectedPos = mouseSquare(e);
    selected = elmt.children[selectedPos.y].children[selectedPos.x].children[0];
    selected.style.zIndex = 1;
    possibles = possibleMoves(selectedPos.y * 8 + selectedPos.x);
    for(let p of possibles)
        elmt.children[(p - p % 8) / 8].children[p % 8].style.backgroundColor = "yellow";
});


function mouseSquare(e) {
    let area = elmt.getBoundingClientRect();
    if(e.clientX > area.left && e.clientX < area.right && e.clientY > area.top && e.clientY < area.bottom) {
        pressedX = e.clientX;
        pressedY = e.clientY;
        let nY;
        let p = pressedY - area.top;
        let l = ((area.bottom - area.top) / 8);
        for(nY = 0; nY < 8; nY++) {
            if(p < l * (nY + 1) && p > l * nY)
                break;
        }
        let nX;
        p = pressedX - area.left;
        l = ((area.right - area.left) / 8);
        for(nX = 0; nX < 8; nX++) {
            if(p < l * (nX + 1) && p > l * nX)
                break;
        }
        return {x: nX, y: nY};
    }
    return null;
}

document.addEventListener("mousemove", (e) => {
    if(selected != null)
        selected.style.translate = `${e.clientX - pressedX}px ${e.clientY - pressedY}px`;
});

document.addEventListener("mouseup", (e) => {
    if(selected != null) {
        for(let p of possibles) {
            elmt.children[(p - p % 8) / 8].children[p % 8].style.backgroundColor = "";
        }
        selected.style.translate = "0 0";
        selected.style.zIndex = 0;
        let tmp = mouseSquare(e);
        if(tmp != null) {
            move(selectedPos.y * 8 + selectedPos.x, tmp.y * 8 + tmp.x, selectedPos, tmp);
        }
        selected = null;
        possibles = [];
    }
});

function isUpperCase(c) {
    return c == c.toUpperCase();
}

function setCharAt(str, index, chr) {
    if(index > str.length-1) return str;
    return str.substring(0,index) + chr + str.substring(index+1);
}

//THE GAME
function move(piecePos, pos, boardPiecePos, boardPos) {
    if(!possibles.includes(pos))
        return 0;
    let c = board.charAt(piecePos).toLowerCase();
    if(kingChecked) {
        let index = whiteTurn ? 0 : 1;
        elmt.children[(kingPos[index] - kingPos[index] % 8) / 8].children[kingPos[index] % 8].style.backgroundColor = "";
    }
    if(c == "k") {
        if(pos == piecePos + 2 || pos == piecePos + 3) {
            let area = elmt.getBoundingClientRect();
            boardCastleMovement(7, 5, 6, (area.right - area.left) / 4, piecePos);
            kingPos[whiteTurn ? 0 : 1] += 2;
            halfMove++;
        } else if(pos == piecePos - 2 || pos == piecePos - 3 || pos == piecePos - 4) {
            let area = elmt.getBoundingClientRect();
            boardCastleMovement(0, 3, 2, -((area.right - area.left) / 8) * 3, piecePos);
            kingPos[whiteTurn ? 0 : 1] -= 2;
            halfMove++;
        } else {
            boardMovement(c, pos, piecePos, boardPiecePos, boardPos);
            kingPos[whiteTurn ? 0 : 1] = pos;
        }
        let index = whiteTurn ? 2 : 0;
        castles[index] = false;
        castles[index + 1] = false;
    } else {
        boardMovement(c, pos, piecePos, boardPiecePos, boardPos);
    }
    if(c == "p") {
        let mod = whiteTurn ? -8 : 8;
        if(pos == enPassant) {
            elmt.children[(piecePos - piecePos % 8) / 8].children[enPassant % 8].children[0].className = "";
            enPassant = -1;
        }
        else if(pos == piecePos + mod * 2)
            enPassant = piecePos + mod;
        else 
            enPassant = -1;
    } else if(c == "r") {
        let index = whiteTurn ? 2 : 0;
        if(piecePos % 8 == 0) 
            castles[index] = false;
        else if(piecePos % 8 == 7)
            castles[index + 1] = false;
        enPassant = -1;
    } else
        enPassant = -1;
    whiteTurn = !whiteTurn;
    nails = [];
    if(whiteTurn)
        fullMove++;
    return kingState();
}

function kingState() { //0: nothing; 1: stalemate; 2: checkmate
    let index = whiteTurn ? 0 : 1;
    if(isSquareControlled(kingPos[index], whiteTurn, true)) {
        kingChecked = true;
        elmt.children[(kingPos[index] - kingPos[index] % 8) / 8].children[kingPos[index] % 8].style.backgroundColor = "red";
    } else {
        kingChecked = false;
    }
    if(possibleMoves(kingPos[index]).length == 0) {
        if(kingChecked) {
            checkmate: {
                for(let i = 0; i < 64; i++) {
                    if(kingPos.includes(i) || board.charAt(i) == " " || isUpperCase(board.charAt(i)) != whiteTurn)
                        continue;
                    if(possibleMoves(i).length > 0)
                        break checkmate;
                }
                return 2;
            }
        } else {
            stalemate: {
                for(let i = 0; i < 64; i++) {
                    if(kingPos[index] == i)
                        continue;
                    if(possibleMoves(i).length > 0)
                        break stalemate;
                }
                return 1;
            }
        } 
    }
    return 0;
}

function boardMovement(c, pos, piecePos, boardPiecePos, boardPos) {
    if(c == "p" || board.charAt(pos) != " ")
        halfMove = 0;
    else
        halfMove++;
    board = setCharAt(board, pos, board.charAt(piecePos));
    board = setCharAt(board, piecePos, " ");
    let piece = elmt.children[boardPiecePos.y].children[boardPiecePos.x].children[0];
    elmt.children[boardPos.y].children[boardPos.x].children[0].className = piece.className;
    piece.className = "";
}

function boardCastleMovement(rInit, rNew, kNew, trans, piecePos) {
    let row = (piecePos - piecePos % 8) / 8;
    let rook = elmt.children[row].children[rInit].children[0];
    let nRook = elmt.children[row].children[rNew].children[0];
    let king = elmt.children[row].children[4].children[0];
    elmt.children[row].children[kNew].children[0].className = king.className;
    king.className = "";
    nRook.className = rook.className;
    nRook.style.translate = `${trans}px 0`;
    rook.className = "";
    nRook.animate([
        { translate: "0 0" }
    ], { duration: 200, fill: "forwards", iterations: 1, time_func: "ease-in"});
    board = setCharAt(board, row + rNew, board.charAt(row + rInit));
    board = setCharAt(board, row + rInit, " ");
    board = setCharAt(board, row + kNew, board.charAt(piecePos));
    board = setCharAt(board, piecePos, " ");
}

function possibleMoves(pos) {
    let piece = board.charAt(pos);
    let moves = [];
    if(piece != " " && isUpperCase(piece) != whiteTurn)
        return moves;
    switch(piece.toLowerCase()) {
        case "p": {
            let mod = whiteTurn ? -8 : 8;
            let nPos = pos + mod;
            if(!outOfBounds(nPos, 0) && board.charAt(nPos) == " ") {
                moves.push(nPos);
                if(!outOfBounds(nPos + mod, 0) && board.charAt(nPos + mod) == " " && ((whiteTurn && [48,49,50,51,52,53,54,55].includes(pos)) || (!whiteTurn && [8,9,10,11,12,13,14,15].includes(pos)))) {
                    moves.push(nPos + mod);
                }
            }
            nPos = pos + mod - 1;
            if(!outOfBounds(nPos, mod - 1) && (nPos == enPassant || (whiteTurn != isUpperCase(board.charAt(nPos)) && board.charAt(nPos) != " "))) {
                moves.push(nPos);
            }
            nPos = pos + mod + 1;
            if(!outOfBounds(nPos, mod + 1) && (nPos == enPassant || (whiteTurn != isUpperCase(board.charAt(nPos)) && board.charAt(nPos) != " "))) {
                moves.push(nPos);
            }
            return nailFilter(pos, shieldMovesFilter(moves));
        }
        case "n": {
            const KNIGHT_MODS = [15, 6, -10, -17, -15, -6, 10, 17];
            for(let mod of KNIGHT_MODS) {
                if(!outOfBounds(pos + mod, mod) && ((board.charAt(pos + mod) != " " && isUpperCase(board.charAt(pos + mod)) != whiteTurn) || board.charAt(pos + mod) == " "))
                    moves.push(pos + mod);
            }
            return nailFilter(pos, shieldMovesFilter(moves));
        }
        case "b":
            return nailFilter(pos, shieldMovesFilter(rangedPiecePossibles(pos, [7, 9, -7, -9])));
        case "r":
            return nailFilter(pos, shieldMovesFilter(rangedPiecePossibles(pos, [1, -1, 8, -8])));
        case "q":
            return nailFilter(pos, shieldMovesFilter(rangedPiecePossibles(pos, MODS)));
        case "k":
            return kingPossibles(pos);
        default:
            return moves;
    }
}

function kingPossibles(pos) {
    let moves = [];
    for(let mod of MODS) {
        let nPos = pos + mod;
        if(outOfBounds(nPos, 0) || (board.charAt(nPos) != " " && isUpperCase(board.charAt(nPos)) == whiteTurn) || isSquareControlled(nPos, whiteTurn))
            continue;
        moves.push(nPos);
    }
    if(!kingChecked) {
        let index = whiteTurn ? 2 : 0;
        if(castles[index + 1] && board.charAt(pos + 1) == " " && board.charAt(pos + 2) == " " && moves.includes(pos + 1) && !isSquareControlled(pos + 2, whiteTurn)) {
            moves.push(pos + 2);
            moves.push(pos + 3);
        }
        if(castles[index] && board.charAt(pos - 1) == " " && board.charAt(pos - 2) == " " && board.charAt(pos - 3) == " " && moves.includes(pos - 1) && !isSquareControlled(pos - 2, whiteTurn) && !isSquareControlled(pos - 3, whiteTurn)) {
            moves.push(pos - 2);
            moves.push(pos - 3);
            moves.push(pos - 4);
        }
    }
    return moves;
}

function isSquareControlled(pos, turn, king = false) {
    let finish = !king;
    for(let dir of MODS) {
        let p;
        let shield = [];
        let possibleNail = -1;
        for(let i = 1; !outOfBounds(p = (pos + dir * i), dir); i++) {
            shield.push(p);
            if(board.charAt(p) != " ") {
                let c = board.charAt(p).toLowerCase();
                if(isUpperCase(board.charAt(p)) == turn && c != "k") {
                    if(king) {
                        if(possibleNail >= 0)
                            break;
                        else possibleNail = p;
                    } else
                        break;
                } else if(c == "k") {
                    continue;
                } else if(((c == "b" || (c == "p" && i == 1)) && [7, 9, -7, -9].includes(dir)) || (c == "r" && [1, -1, 8, -8].includes(dir)) || c == "q" || (c == "k" && i == 1)) {
                    if(possibleNail >= 0) {
                        if(c != "p" && c != "k")
                            nails.push({pos: possibleNail, dir: dir});
                    } else {
                        if(finish) {
                            if(king)
                                shieldMoves = [];
                            return true;
                        } else {
                            shieldMoves = shield;
                            finish = true;
                        }
                    }
                    break;
                }
            }
        }
    }
    const KNIGHT_MODS = [15, 6, -10, -17, -15, -6, 10, 17];
    for(let dir of KNIGHT_MODS) {
        let p = pos + dir;
        if(outOfBounds(p, dir) || board.charAt(p) == " " || isUpperCase(board.charAt(p)) == turn || board.charAt(p).toLowerCase() != "n")
            continue;
        if(finish) {
            if(king)
                shieldMoves = [];
            return true;
        } else {
            shieldMoves = [p];
            finish = true;
        }
    }
    if(king && finish)
        return true;
    return false;
}

function nailFilter(piecePos, moves) {
    for(let p of nails) {
        if(p.pos == piecePos) {
            let filtered = [];
            let pos;
            for(let i = -1; board.charAt(pos = (piecePos + p.dir * i)).toLowerCase() != "k" && !outOfBounds(pos = (piecePos + p.dir * i)); i--) {
                if(moves.includes(pos))
                    filtered.push(pos);
                else break;
            }
            for(let i = 1; board.charAt(pos = (piecePos + p.dir * i)).toLowerCase() != "k" && !outOfBounds(pos = (piecePos + p.dir * i)); i++) {
                if(moves.includes(pos))
                    filtered.push(pos);
                else break;
            }
            return filtered;
        }
    }
    return moves;
}

function shieldMovesFilter(moves) {
    if(kingChecked) {
        if(shieldMoves.length == 0)
            return [];
        let filtered = [];
        for(let move of moves) {
            if(shieldMoves.includes(move))
                filtered.push(move);
        }
        return filtered;
    }
    return moves;
}

function rangedPiecePossibles(pos, mods) {
    let moves = [];
    for(let mod of mods) {
        let nPos;
        for(let i = 1; !outOfBounds(nPos = (pos + mod * i), mod); i++) {
            if(board.charAt(nPos) != " ") {
                if(isUpperCase(board.charAt(nPos)) != whiteTurn)
                    moves.push(nPos);
                break;
            }
            moves.push(nPos);
        }
    }
    return moves;
}

function outOfBounds(pos, mod) {
    return pos < 0 || pos > 63 || ((pos - mod) % 8 < 2 && pos % 8 > 5) || ((pos - mod) % 8 > 5 && pos % 8 < 2);
}