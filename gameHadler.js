// Escolha do Tipo de Jogo
let pilihanGame, levelHitam, levelPutih, allMovesNow, waktuMulaiGame, lamanyaPermainan;
const pilihanGameForm = document.getElementById('pilihan-game');
const levelHitamForm = document.getElementById('level-hitam');
const levelPutihForm = document.getElementById('level-putih');
const tombolMulai = document.getElementById('tombol-mulai');
const tombolMenyerah = document.getElementById('tombol-menyerah');
const tombolhentikan = document.getElementById('tombol-hentikan');
const giliran = document.getElementById('giliran');
const pemenang = document.getElementById('pemenang');
const listHistory = document.getElementById('list-history');
const lamaBermain = document.querySelector('.lama-bermain');

// Variáveis Para o Jogo
let turn, backMove, hasHighlight, squareHighlighted, history, positionNow, twoComputer, jumlahNode, timeOut;
const tagBoard = "board";
const turnComputer = "black";
const initialPosition = '1p1p1p1p/p1p1p1p1/1p1p1p1p/8/8/P1P1P1P1/1P1P1P1P/P1P1P1P1';
// const initialPosition = "1Q5Q/8/7P/8/8/p7/8/q5q1";

// Função para Selecionar o Jogo
const checkTombolMulai = () => {
    if (levelHitam && pilihanGame == "lawan")
        tombolMulai.disabled = false;
    else if (pilihanGame == "komputer" && levelHitam && levelPutih)
        tombolMulai.disabled = false;
    else
        tombolMulai.disabled = true;
}

pilihanGameForm.addEventListener('change', () => {
    pilihanGame = pilihanGameForm.value;
    if (pilihanGame == 'lawan') {
        levelHitamForm.classList.remove('d-none');
        levelPutihForm.classList.add('d-none');
    } else if (pilihanGame == 'komputer') {
        levelHitamForm.classList.remove('d-none');
        levelPutihForm.classList.remove('d-none');
    } else {
        levelHitamForm.classList.add('d-none');
        levelPutihForm.classList.add('d-none');
        tombolMulai.disabled = true;
    }
    checkTombolMulai();
});

levelHitamForm.addEventListener('change', () => {
    levelHitam = parseInt(levelHitamForm.value);
    checkTombolMulai();
});

levelPutihForm.addEventListener('change', () => {
    levelPutih = parseInt(levelPutihForm.value);
    checkTombolMulai();
});

const downloadHistory = () => {
    var a = document.createElement("a");
    var file = new Blob([JSON.stringify(history)], { type: 'application/json' });
    a.href = URL.createObjectURL(file);
    a.download = "history.json";
    a.click();
}

const hentikanGame = (adaPemenang = false) => {
    tombolMenyerah.classList.add('d-none');
    tombolhentikan.classList.add('d-none');
    turn = null;
    tombolMulai.disabled = false;
    if (adaPemenang) {
        Swal.fire(
            'Jogo Concluído'
        )
    } else {
        Swal.fire(
            'Jogo Interrompido'
        )
    }
    lamanyaPermainan = (new Date().getTime()) - waktuMulaiGame;
    lamaBermain.textContent = `(Jogo durou ${lamanyaPermainan / 1000} segundos)`;

    pilihanGameForm.disabled = false;
    levelHitamForm.disabled = false;
    levelPutihForm.disabled = false;
    clearTimeout(timeOut);
};

tombolMenyerah.addEventListener('click', () => {
    Swal.fire({
        title: 'Tem certeza que deseja desistir?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sim, desistir',
        cancelButtonText: 'Não'
    }).then((result) => {
        if (result.isConfirmed) {
            hentikanGame();
            pemenang.innerHTML = `Peça Preta (AI Profundidade ${levelHitam})`
        }
    });
});

tombolhentikan.addEventListener('click', () => {
    Swal.fire({
        title: 'Tem certeza que deseja interromper o jogo?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sim',
        cancelButtonText: 'Não'
    }).then((result) => {
        if (result.isConfirmed) {
            hentikanGame();
        }
    });
});

// Função para Manipuladores de Evento
const onDrop = (source, target, piece, newPos, oldPos, orientation) => {
    if (Chessboard.objToFen(newPos) !== Chessboard.objToFen(oldPos)) {
        const moves = [...allMovesNow];
        if (!isValidMove(source, target, moves))
            return 'snapback';

        const move = moves.filter(m => m.to == target && m.from == source)[0];
        const newPosition = movePiece(move, oldPos);
        positionNow = newPosition;
        board.position(newPosition, false);
        history.push(move);

        removeGreySquares();
        if (move['remove']) {
            if (!hasAnotherEat(target, piece))
                changeTurn();
            else
                allMovesNow = getAllMoves(turn, positionNow).filter(m => m.from == target);
        } else
            changeTurn();

        listHistory.innerHTML = `<li class="list-group-item">Peça Branca: ${move.from} para ${move.to}` +
            listHistory.innerHTML;
        return 'trash';
    }
}

const onDragStart = (source, piece, position, orientation) => canMove(piece);

const onMouseoverSquare = (square, piece) => {
    if (piece && canMove(piece)) {
        const moves = allMovesNow.filter(m => m.from == square);
        if (moves.length > 0) {
            greySquare(square);
            moves.forEach(m => greySquare(m.to));
        }
    }
}

const onMouseoutSquare = () => {
    removeGreySquares();
}

const onSnapbackEnd = () => {
    Swal.fire(
        'Movimento Inválido'
    )
}

const changeTurn = () => {
    if (turn == "white") {
        turn = "black";
        giliran.textContent = "Peça Preta";
    } else if (turn == "black") {
        turn = "white";
        giliran.textContent = "Peça Branca";
    }

    allMovesNow = getAllMoves(turn, positionNow);

    removeHighlightSquare();
    allMovesNow.forEach(m => {
        if ("remove" in m)
            highlightSquare(m.from);
    })

    if (allMovesNow.length == 0) {
        if (turn == "white")
            pemenang.textContent = `Peça Preta (AI Profundidade ${levelHitam})`;
        else if (turn == "black") {
            if (twoComputer)
                pemenang.textContent = `Peça Branca (AI Profundidade ${levelPutih})`;
            else
                pemenang.textContent = "Peça Branca";
        }
        hentikanGame(true);
    } else if (turn == turnComputer || twoComputer)
        timeOut = window.setTimeout(playComputer, 500);
}

const playComputer = () => {
    jumlahNode = 0;
    let move, value, lamaMikir;
    let perpindahan = "";
    const position = positionNow;
    const alpha = Number.NEGATIVE_INFINITY;
    const beta = Number.POSITIVE_INFINITY;

    lamaMikir = new Date().getTime();
    if (turn == "white") {
        [move, value] = minmax(positionNow, levelPutih, alpha, beta, true, 0, turn, turn);
        perpindahan += '<li class="list-group-item">Peça Branca: '
    } else {
        [move, value] = minmax(positionNow, levelHitam, alpha, beta, true, 0, turn, turn);
        perpindahan +=
            '<li class="list-group-item list-group-item-dark">Peça Preta: '
    }
    lamaMikir = (new Date().getTime()) - lamaMikir;

    let newPos = {
        ...position
    };

    move['jumlahNode'] = jumlahNode;
    move['waktu'] = lamaMikir;

    while ("nextEat" in move) {
        let nextEat = move["nextEat"];
        perpindahan += `${move.from} para ${move.to} || `;
        delete move.nextEat;
        newPos = movePiece(move, newPos)
        board.position(newPos);
        history.push(move);
        move = nextEat;
    }

    perpindahan += `${move.from} para ${move.to} `;
    newPos = movePiece(move, newPos);
    positionNow = newPos;
    board.position(newPos);
    history.push(move);

    perpindahan += `(${jumlahNode} Nó Avaliado ${lamaMikir / 1000} segundos)</li>`;
    listHistory.innerHTML = perpindahan + listHistory.innerHTML;

    if (jumlahNode > 600000) {
        levelHitam -= 2;
        levelPutih -= 2;
        Swal.fire(
            'Nível da IA Diminuído'
        )
    }
    changeTurn();
}


// Configuração do Jogo
const config = {
    position: initialPosition,
    draggable: true,
    onDragStart: onDragStart,
    onDrop: onDrop,
    onMouseoverSquare: onMouseoverSquare,
    onMouseoutSquare: onMouseoutSquare,
    onSnapbackEnd: onSnapbackEnd
}

const board = Chessboard(tagBoard, config);
positionNow = board.position();

tombolMulai.addEventListener('click', () => {
    giliran.textContent = "Peça Branca";
    tombolMulai.disabled = true;
    if (pilihanGame == "lawan") {
        tombolMenyerah.classList.remove('d-none');
        twoComputer = false;
    } else if (pilihanGame == "komputer") {
        twoComputer = true;
        tombolhentikan.classList.remove('d-none');
    }
    listHistory.innerHTML = "";
    pemenang.innerHTML = "-";

    // Configuração do Jogo
    turn = "white";
    history = [];
    backMove = false;
    hasHighlight = false;
    squareHighlighted = null;
    board.position(initialPosition);
    positionNow = board.position();
    allMovesNow = getAllMoves(turn, positionNow);

    pilihanGameForm.disabled = true;
    levelHitamForm.disabled = true;
    levelPutihForm.disabled = true;

    lamaBermain.textContent = "";
    waktuMulaiGame = new Date().getTime();

    if (twoComputer)
        timeOut = window.setTimeout(playComputer, 500);
});
