const canvas = document.getElementById('canvas');
const ctx = canvas.getContext("2d");
const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const PIXEL_SIZE = 20;
const BIRTH_PROB = 0.2;
const FRAMERATE = 2;

const UNDERPOPULATED = 1;
const OVERPOPULATED = 4;
const REPRODUCTION = 3;

let CELLS = [];

class Cell {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.isLive = false;
    }

    kill() {
        this.isLive = false;
        return this;
    }

    birth() {
        this.isLive = true;
        return this;
    }
}

function drawGrid() {
    ctx.beginPath();
    for (let i = 0; i < WIDTH; i += PIXEL_SIZE) {
        ctx.moveTo(i, 0);
        ctx.lineTo(i, HEIGHT);
    }

    for (let j = 0; j < HEIGHT; j += PIXEL_SIZE) {
        ctx.moveTo(0, j);
        ctx.lineTo(WIDTH, j);
    }
    ctx.lineWidth = 1;
    ctx.strokeStyle = "#777777";
    ctx.stroke();
}

function drawCell(x, y) {
    ctx.beginPath();
    ctx.rect((x + 0.25) * PIXEL_SIZE, (y + 0.25) * PIXEL_SIZE, PIXEL_SIZE / 2, PIXEL_SIZE / 2);
    ctx.lineWidth = PIXEL_SIZE / 2;
    ctx.strokeStyle = "#FFFFFF";
    ctx.stroke();
}

function getMouseCoords(evt) {
    let rect = canvas.getBoundingClientRect();
    return {
        x: Math.floor((evt.clientX - rect.left) / PIXEL_SIZE),
        y: Math.floor((evt.clientY - rect.top) / PIXEL_SIZE)
    };
}

const MouseMode = { BIRTH: "birth", KILL: "kill" };
let MODE = MouseMode.BIRTH;
let MOUSE_IS_DOWN = false;
canvas.addEventListener('mousedown', function(evt) {
    const coords = getMouseCoords(evt);
    MODE = (CELLS[coords.x][coords.y].isLive) ? MouseMode.KILL : MouseMode.BIRTH;
    MOUSE_IS_DOWN = true;
    onMouseMove(evt);
}, false);
canvas.addEventListener('mouseup', function(evt) {
    MOUSE_IS_DOWN = false;
}, false);
canvas.addEventListener('mouseleave', function(evt) {
    MOUSE_IS_DOWN = false;
}, false);
canvas.addEventListener('mouseenter', function(evt) {
    MOUSE_IS_DOWN = false;
}, false);
canvas.addEventListener('mousemove', function(evt) {
    if (MOUSE_IS_DOWN) {
        onMouseMove(evt);
    }
}, false);
function onMouseMove(evt) {
    const coords = getMouseCoords(evt);
    (MODE === MouseMode.BIRTH) ? CELLS[coords.x][coords.y].birth() : CELLS[coords.x][coords.y].kill();
    draw();
}

function init() {
    CELLS = [];
    for (let i = 0; i < WIDTH / PIXEL_SIZE; i++) {
        const col = [];
        for (let j = 0; j < HEIGHT / PIXEL_SIZE; j++) {
            let newCell = new Cell(i, j);
            if (Math.random() < BIRTH_PROB) newCell.birth();
            col.push(newCell);
        }
        CELLS.push(col);
    }
}

function terminateLife() {
    CELLS.forEach(col => {
        col.forEach(cell => {
            cell.kill();
        });
    });
    draw();
}

function update() {
    if (document.getElementById("pauseGame").checked) return true;

    /** 3 rules:
     *      1- Any live cell with two or three live neighbours survives
     *      2- Any dead cell with three live neighbours becomes a live cell
     *      4- All other live CELLS dire in the next generation. Similarly, all other dead CELLS stay dead
     */

    // TODO I feel like something's wrong in the reproduction steps, as spaceships do not work
    /**   X
     *      X   This is a spaceship, but it doesn't seem to work
     *  X X X
     */

    function countCellsAround(x, y) {
        let count = 0;
        const wallAbove = y <= 0;
        const wallBelow = HEIGHT / PIXEL_SIZE <= y + 1;
        const wallWest = x <= 0;
        const wallEast = WIDTH / PIXEL_SIZE <= x + 1;

        if (!wallAbove && !wallWest) count += CELLS[x - 1][y - 1].isLive;
        if (!wallAbove) count += CELLS[x][y - 1].isLive;
        if (!wallAbove && !wallEast) count += CELLS[x + 1][y - 1].isLive;
        if (!wallWest) count += CELLS[x - 1][y].isLive;
        if (!wallEast) count += CELLS[x + 1][y].isLive;
        if (!wallBelow && !wallWest) count += CELLS[x - 1][y + 1].isLive;
        if (!wallBelow) count += CELLS[x][y + 1].isLive;
        if (!wallBelow && !wallEast) count += CELLS[x + 1][y + 1].isLive;

        return count;
    }

    const newCells = [];
    let anyCellAlive = false;
    CELLS.forEach(col => {
        const newCol = [];
        col.forEach(cell => {
            const count = countCellsAround(cell.x, cell.y);
            if (cell.isLive) {
                newCol.push((count <= UNDERPOPULATED || OVERPOPULATED <= count) ? cell.kill() : cell);
            } else {
                newCol.push((count === REPRODUCTION) ? cell.birth() : cell);
            }
            if (cell.isLive && !anyCellAlive) anyCellAlive = true;
        });
        newCells.push(newCol);
    });
    CELLS = newCells;
    return anyCellAlive;
}

function draw() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    CELLS.forEach(col => {
        col.forEach(cell => {
            if (cell.isLive) {
                drawCell(cell.x, cell.y);
            }
        });
    });
    if (document.getElementById("enableGrid").checked) drawGrid();
}

function game() {
    init();
    draw();
    setInterval(() => {
        if (update()) draw();
        else document.getElementById("pauseGame").checked = true;
    }, 1000 / FRAMERATE);
}

game();
