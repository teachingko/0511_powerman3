const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');
const scoreElement = document.getElementById('score');

context.scale(30, 30);

// 테트리스 블록 모양 정의
const pieces = [
    [[1, 1, 1, 1]], // I
    [[1, 1], [1, 1]], // O
    [[1, 1, 1], [0, 1, 0]], // T
    [[1, 1, 1], [1, 0, 0]], // L
    [[1, 1, 1], [0, 0, 1]], // J
    [[1, 1, 0], [0, 1, 1]], // S
    [[0, 1, 1], [1, 1, 0]]  // Z
];

// 색상 정의
const colors = [
    '#FF0D72', '#0DC2FF', '#0DFF72',
    '#F538FF', '#FF8E0D', '#FFE138', '#3877FF'
];

let score = 0;
let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;
let gameOver = false;

// 게임 보드 생성
const arena = createMatrix(10, 20);

// 현재 블록 생성
let player = {
    pos: {x: 0, y: 0},
    matrix: null,
    color: null
};

// 행렬 생성 함수
function createMatrix(w, h) {
    const matrix = [];
    while (h--) {
        matrix.push(new Array(w).fill(0));
    }
    return matrix;
}

// 충돌 감지
function collide(arena, player) {
    const [m, o] = [player.matrix, player.pos];
    for (let y = 0; y < m.length; ++y) {
        for (let x = 0; x < m[y].length; ++x) {
            if (m[y][x] !== 0 &&
                (arena[y + o.y] &&
                arena[y + o.y][x + o.x]) !== 0) {
                return true;
            }
        }
    }
    return false;
}

// 블록 회전
function rotate(matrix, dir) {
    for (let y = 0; y < matrix.length; ++y) {
        for (let x = 0; x < y; ++x) {
            [
                matrix[x][y],
                matrix[y][x],
            ] = [
                matrix[y][x],
                matrix[x][y],
            ];
        }
    }
    if (dir > 0) {
        matrix.forEach(row => row.reverse());
    } else {
        matrix.reverse();
    }
}

// 블록 생성
function playerReset() {
    const piece = pieces[Math.floor(Math.random() * pieces.length)];
    player.matrix = piece;
    player.color = colors[Math.floor(Math.random() * colors.length)];
    player.pos.y = 0;
    player.pos.x = Math.floor(arena[0].length / 2) - Math.floor(player.matrix[0].length / 2);
    
    if (collide(arena, player)) {
        gameOver = true;
    }
}

// 블록 그리기
function drawMatrix(matrix, offset, color) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                context.fillStyle = color;
                context.fillRect(x + offset.x,
                               y + offset.y,
                               1, 1);
                context.strokeStyle = '#000';
                context.strokeRect(x + offset.x,
                                 y + offset.y,
                                 1, 1);
            }
        });
    });
}

// 게임 보드 그리기
function draw() {
    context.fillStyle = '#000';
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    drawMatrix(arena, {x: 0, y: 0}, '#fff');
    drawMatrix(player.matrix, player.pos, player.color);
}

// 블록 이동
function playerMove(dir) {
    player.pos.x += dir;
    if (collide(arena, player)) {
        player.pos.x -= dir;
    }
}

// 블록 회전
function playerRotate(dir) {
    const pos = player.pos.x;
    let offset = 1;
    rotate(player.matrix, dir);
    while (collide(arena, player)) {
        player.pos.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (offset > player.matrix[0].length) {
            rotate(player.matrix, -dir);
            player.pos.x = pos;
            return;
        }
    }
}

// 블록 떨어뜨리기
function playerDrop() {
    player.pos.y++;
    if (collide(arena, player)) {
        player.pos.y--;
        merge(arena, player);
        playerReset();
        arenaSweep();
        updateScore();
    }
    dropCounter = 0;
}

// 블록 고정
function merge(arena, player) {
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                arena[y + player.pos.y][x + player.pos.x] = value;
            }
        });
    });
}

// 완성된 줄 제거
function arenaSweep() {
    let rowCount = 1;
    outer: for (let y = arena.length - 1; y > 0; --y) {
        for (let x = 0; x < arena[y].length; ++x) {
            if (arena[y][x] === 0) {
                continue outer;
            }
        }
        const row = arena.splice(y, 1)[0].fill(0);
        arena.unshift(row);
        ++y;
        score += rowCount * 100;
        rowCount *= 2;
    }
}

// 점수 업데이트
function updateScore() {
    scoreElement.textContent = score;
}

// 게임 루프
function update(time = 0) {
    if (gameOver) {
        context.fillStyle = 'rgba(0, 0, 0, 0.75)';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = '#fff';
        context.font = '1px Arial';
        context.textAlign = 'center';
        context.fillText('게임 오버!', canvas.width / 60, canvas.height / 60);
        return;
    }

    const deltaTime = time - lastTime;
    lastTime = time;
    dropCounter += deltaTime;
    if (dropCounter > dropInterval) {
        playerDrop();
    }
    draw();
    requestAnimationFrame(update);
}

// 키보드 컨트롤
document.addEventListener('keydown', event => {
    if (gameOver) return;
    
    switch (event.keyCode) {
        case 37: // 왼쪽 화살표
            playerMove(-1);
            break;
        case 39: // 오른쪽 화살표
            playerMove(1);
            break;
        case 40: // 아래쪽 화살표
            playerDrop();
            break;
        case 38: // 위쪽 화살표
            playerRotate(1);
            break;
    }
});

// 게임 시작
playerReset();
update();
