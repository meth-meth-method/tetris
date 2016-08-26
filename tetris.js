const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');

const colors = [
    null,
    '#FF0D72',
    '#0DC2FF',
    '#0DFF72',
    '#F538FF',
    '#FF8E0D',
    '#FFE138',
    '#3877FF',
];

const patterns = ['SL','SR','line', 'LR', 'LL', 'box', 'T'];

function createMatrix(w, h) {
    const matrix = [];
    while(h--) {
        matrix.push(new Array(w).fill(0));
    }
    return matrix;
}


function createPattern(type)
{
    if (type === 'line') {
        return [
            [0, 1, 0, 0],
            [0, 1, 0, 0],
            [0, 1, 0, 0],
            [0, 1, 0, 0],
        ];
    } else if (type === 'LR') {
        return [
            [0, 2, 0],
            [0, 2, 0],
            [0, 2, 2],
        ];
    } else if (type === 'LL') {
        return [
            [0, 3, 0],
            [0, 3, 0],
            [3, 3, 0],
        ];
    } else if (type === 'box') {
        return [
            [4, 4],
            [4, 4],
        ];
    } else if (type === 'SL') {
        return [
            [0, 0, 0],
            [5, 5, 0],
            [0, 5, 5],
        ];
    } else if (type === 'SR') {
        return [
            [0, 0, 0],
            [0, 6, 6],
            [6, 6, 0],
        ];
    } else if (type === 'T') {
        return [
            [0, 7, 0],
            [7, 7, 7],
            [0, 0, 0],
        ];
    }
}

function collide(player, arena) {
    const subset = matrixIntersect(arena, player.matrix,
                                   player.pos[0], player.pos[1]);
    for (let y = 0; y < subset.length; ++y) {
        for (let x = 0; x < subset[y].length; ++x) {
            if (subset[y][x] !== 0 && player.matrix[y][x] !== 0) {
                return true;
            }
        }
    }
    return false;
}

function draw() {
    context.fillStyle = 'black';
    context.fillRect(0, 0, arena[0].length * scale, 600);

    update(1/60);
    drawMatrix(arena, [0, 0]);
    if (player.matrix) {
        drawMatrix(player.matrix, player.pos);
    }
    requestAnimationFrame(draw);
}

function drawMatrix(matrix, offset)
{
    matrix.forEach((row, y) => {
        row.forEach((v, x) => {
            if (colors[v] === null) {
                return;
            }
            context.fillStyle = colors[v];
            context.fillRect(x * scale + offset[0] * scale,
                             y * scale + offset[1] * scale,
                             scale,
                             scale);
        });
    });
}

function getRandomPattern()
{
    return createPattern(patterns[Math.random() * patterns.length | 0]);
}

function keyHandler(event) {
    const k = event.keyCode;
    if (event.type === 'keydown') {
        if (k === 69 || k === 81) {
            rotate(player.matrix, k === 69 ? 1 : -1);
            let test = 1;
            while (collide(player, arena)) {
                player.pos[0] += test;
                test = -(test + (test > 0 ? 1 : -1));

                if (Math.abs(test) > 5) {
                    throw new Error('Rotate offset overflow');
                }
            }
        } else if (k === 65 || k === 68) {
            const diff = k === 65 ? -1 : 1;
            player.pos[0] += diff;
            if (collide(player, arena)) {
                player.pos[0] -= diff;
            }
        }
    }

    if (k === 83) {
        if (event.type === 'keydown') {
            dropDelay = .035;
        } else {
            dropDelay = 1;
        }
    }
}

function matrixIntersect(outer, inner, offsetX = 0, offsetY = 0) {
    return inner.map((row, y) => {
        return row.map((v, x) => {
            return outer[y + offsetY] && outer[y + offsetY][x + offsetX];
        });
    });
}

function merge(dest, source, offset) {
    source.forEach((row, y) => {
        row.forEach((v, x) => {
            if (v === 0) {
                return;
            }
            const dX = x + offset[0];
            const dY = y + offset[1];
            dest[dY][dX] = v;
        });
    });
}


function rotate(matrix, dir) {
  transpose(matrix);
  if (dir > 0) {
    matrix.forEach(row => row.reverse());
  } else {
    matrix.reverse();
  }
}

function sweep(matrix)
{
    let sweepCount = 1;
    for (let y = matrix.length -1; y > 0; --y) {
        let sweepable = true;
        for (let x = 0; x < matrix[y].length; ++x) {
            if (matrix[y][x] === 0) {
                sweepable = false; break;
            }
        }
        if (sweepable) {
            const row = matrix.splice(y, 1)[0].fill(0);
            matrix.unshift(row);
            ++y;
            player.score += sweepCount * 10;
            updateScore();
            sweepCount *= 2;
        }
    }
}

function transpose(matrix) {
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
}

function update(dt) {
    if (!player.matrix) {
        updateScore();
        player.matrix = getRandomPattern();
        player.pos = [
            (arena[0].length / 2 | 0) - (player.matrix[0].length / 2 | 0),
            0,
        ];
        if (collide(player, arena)) {
            score = 0;
            arena.forEach(row => row.fill(0));
        }
    }

    dropCounter += dt;
    if (dropCounter > dropDelay) {
        player.pos[1]++;
        dropCounter = 0;
        if (collide(player, arena)) {
            player.pos[1]--;
            merge(arena, player.matrix, player.pos);
            sweep(arena);
            player.matrix = null;
        }
    }
}

function updateScore() {
    document.getElementById('score').innerText = player.score;
}

document.addEventListener('keydown', keyHandler);
document.addEventListener('keyup', keyHandler);

let dropDelay = 1;
let dropCounter = 0;

const scale = 20;
const arena = createMatrix(12, 20);
const player = {
    score: 0,
    pos: [0, 0],
    matrix: null,
}

draw();


