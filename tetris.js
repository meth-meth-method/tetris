const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');

const colors = [
    null,
    'red',
    'blue',
    'green',
    'purple',
    'orange',
    null,
    null,
    null,
    'grey',
];

const patterns = ['line', 'LR', 'LL'];
function getRandomPattern()
{
    return createPattern(patterns[Math.random() * patterns.length | 0]);
}

function createPattern(type)
{
    const pat = new Pattern;

    pat.pos[0] = arena.matrix[0].length / 2 | 0;

    if (type === 'line') {
        pat.matrix = [
            [0, 1, 0, 0],
            [0, 1, 0, 0],
            [0, 1, 0, 0],
            [0, 1, 0, 0],
        ];
    } else if (type === 'LR') {
        pat.matrix = [
            [0, 2, 0],
            [0, 2, 0],
            [0, 2, 2],
        ];
    } else if (type === 'LL') {
        pat.matrix = [
            [0, 3, 0],
            [0, 3, 0],
            [3, 3, 0],
        ];
    }

    return pat;
}

class Arena
{
    constructor(w, h)
    {
        this.matrix = [];
        for (let x = 0; x < h; ++x) {
            const row = [];
            for (let y = 0; y < w; ++y) {
                row.push(0);
            }
            this.matrix.push(row);
        }
    }
}

class Pattern
{
    constructor()
    {
        this.pos = [0, 0];
        this.scale = 10;
        this.rotation = 0;
        this.matrix = null;
    }
    rotate(dir)
    {
        this.matrix = this.matrix[0].map((col, i) => {
            return this.matrix.map((row) => {
                return row[i];
            });
        });
        if (dir > 0) {
            this.matrix = this.matrix.map(row => row.reverse());
        } else {
            this.matrix.reverse();
        }
    }
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

const arena = new Arena(20, 20);
arena.matrix.forEach((row, y) => {
    row.forEach((v, x) => {
        if (x < 4 || x > 15 || y > 17) {
            arena.matrix[y][x] = 9;
        }
    });
});

let pat;
let scale = 20;
let dropDelay = 1;
let dropCounter = 0;

function draw() {
    context.fillStyle = 'black';
    context.fillRect(0, 0, 600, 600);

    update(1/60);
    drawMatrix(arena.matrix, [0, 0]);
    if (pat) {
        drawMatrix(pat.matrix, pat.pos);
    }
    requestAnimationFrame(draw);
}

function matrixIntersect(outer, inner, offsetX = 0, offsetY = 0)
{
    return inner.map((row, y) => {
        return row.map((v, x) => {
            return outer[y + offsetY][x + offsetX];
        });
    });
}

function collide(pattern, arena)
{
    const subset = matrixIntersect(arena.matrix, pattern.matrix,
                                   pattern.pos[0], pattern.pos[1]);
    for (let y = 0; y < subset.length; ++y) {
        for (let x = 0; x < subset[y].length; ++x) {
            if (subset[y][x] !== 0 && pattern.matrix[y][x] !== 0) {
                return true;
            }
        }
    }
    return false;
}

function merge(dest, source, offset)
{
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

function sweep(matrix)
{

}

function update(dt) {
    if (!pat) {
        pat = getRandomPattern();
    }

    dropCounter += dt;
    if (dropCounter > dropDelay) {
        pat.pos[1]++;
        dropCounter = 0;
        if (collide(pat, arena)) {
            pat.pos[1]--;
            merge(arena.matrix, pat.matrix, pat.pos);
            sweep(arena.matrix);
            pat = null;
        }
    }
}

draw();

const keyHandler = event => {
    const k = event.keyCode;
    if (event.type === 'keydown') {
        if (k === 69 || k === 81) {
            pat.rotate(k === 69 ? -1 : 1);
            let test = 1;
            while (collide(pat, arena)) {
                pat.pos[0] += test;
                test = -(test + (test > 0 ? 1 : -1));
            }
        } else if (k === 65 || k === 68) {
            const diff = k === 65 ? -1 : 1;
            pat.pos[0] += diff;
            if (collide(pat, arena)) {
                pat.pos[0] -= diff;
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
};

document.addEventListener('keydown', keyHandler);
document.addEventListener('keyup', keyHandler);
