//TEJAS BHADORIA
//CS-435
//PROJECT #2


const canvas = document.getElementById('tetrisCanvas');
const ctx = canvas.getContext('2d');

//Setting the canvas size to the window's size
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const blockSize = 20;   //Setting the tetriminos' sizes

//Setting the band sizes(the sum should be equal to 1 for all three)
const topBandHeight = canvas.height / 5;
const middleBandHeight = (canvas.height / 5) * 3;
const bottomBandHeight = canvas.height / 5;

let draggingTetrimino = null;
let offsetX, offsetY;

// Tetrimino shapes
const tetriminos = [
    { shape: [[1, 1], [1, 1]], color: '#FFD700' },  // piece#1
    { shape: [[1, 1, 1, 1]], color: '#00FFFF' },      // piece#2
    { shape: [[1, 0], [1, 1], [1, 0]], color: '#9400D3' }, // piece#3
    { shape: [[1, 1, 0], [0, 1, 1]], color: '#32CD32' }, // piece#4
    { shape: [[0, 1, 1], [1, 1, 0]], color: '#FF4500' },  // piece#5
    { shape: [[1, 0, 0], [1, 1, 1]], color: '#FF8C00' }, // piece#6
    { shape: [[0, 0, 1], [1, 1, 1]], color: '#1E90FF' }  // piece#7
];

const numTetriminos = tetriminos.length;
let totalTetriminoWidth = 0;

// Calculate total width of all tetriminos
tetriminos.forEach(t => {
    const tetriminoWidth = t.shape[0].length * blockSize;
    totalTetriminoWidth += tetriminoWidth;
});

// Calculate space between each tetrimino
const totalAvailableWidth = canvas.width;  // width of the canvas
const spaceBetweenTetriminos = (totalAvailableWidth - totalTetriminoWidth) / (numTetriminos + 1);  // Equal spaces between

// Store tetriminos and their positions in the top band
originals = [];
let currentX = spaceBetweenTetriminos;  // Start with initial space
tetriminos.forEach((t) => {
    originals.push({ 
        x: currentX, 
        y: 20, 
        shape: t.shape, 
        color: t.color 
    });
    currentX += (t.shape[0].length * blockSize) + spaceBetweenTetriminos;  // Move to the next position
});


let duplicates = [];

// Draw the bands
function drawBands() {
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, topBandHeight);
    ctx.lineTo(canvas.width, topBandHeight);
    ctx.moveTo(0, topBandHeight + middleBandHeight);
    ctx.lineTo(canvas.width, topBandHeight + middleBandHeight);
    ctx.stroke();
}

// Draw a tetrimino at a given position
function drawTetrimino(x, y, shape, color) {
    shape.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
            if (cell) {
                const blockX = x + colIndex * blockSize;
                const blockY = y + rowIndex * blockSize;

                // Shadow effect
                ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                ctx.fillRect(blockX + 3, blockY + 3, blockSize, blockSize);

                // Gradient for the main block
                const gradient = ctx.createLinearGradient(blockX, blockY, blockX + blockSize, blockY + blockSize);
                gradient.addColorStop(0, 'white');
                gradient.addColorStop(1, color);

                // Draw block with gradient
                ctx.fillStyle = gradient;
                ctx.fillRect(blockX, blockY, blockSize, blockSize);

                // Outline the block
                ctx.strokeStyle = 'black';
                ctx.lineWidth = 3;
                ctx.strokeRect(blockX, blockY, blockSize, blockSize);
            }
        });
    });
}


// Draw everything
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBands();
    originals.forEach(t => drawTetrimino(t.x, t.y, t.shape, t.color));
    duplicates.forEach(t => drawTetrimino(t.x, t.y, t.shape, t.color));
}

// Check if the mouse is over a tetrimino
function isMouseOverTetrimino(mouseX, mouseY, tetrimino) {
    const shapeWidth = tetrimino.shape[0].length * blockSize;
    const shapeHeight = tetrimino.shape.length * blockSize;
    return mouseX > tetrimino.x && mouseX < tetrimino.x + shapeWidth &&
           mouseY > tetrimino.y && mouseY < tetrimino.y + shapeHeight;
}

// Mouse down event (start dragging)
canvas.addEventListener('mousedown', (e) => {
    const mouseX = e.clientX;
    const mouseY = e.clientY;

    // Check if clicked on any duplicates (middle band)
    let found = false;
    duplicates.forEach(t => {
        if (isMouseOverTetrimino(mouseX, mouseY, t)) {
            draggingTetrimino = t;
            offsetX = mouseX - t.x;
            offsetY = mouseY - t.y;
            found = true;
        }
    });

    // Check if clicked on any originals (top band)
    if (!found) {
        originals.forEach((t) => {
            if (isMouseOverTetrimino(mouseX, mouseY, t)) {
                draggingTetrimino = {
                    shape: t.shape,
                    color: t.color,
                    x: t.x,
                    y: t.y
                };
                offsetX = mouseX - t.x;
                offsetY = mouseY - t.y;
                // Add the duplicate to the duplicates array
                duplicates.push(draggingTetrimino);
            }
        });
    }
});

// Mouse move event (dragging)
canvas.addEventListener('mousemove', (e) => {
    if (draggingTetrimino) {
        const mouseX = e.clientX;
        const mouseY = e.clientY;
        draggingTetrimino.x = mouseX - offsetX;
        draggingTetrimino.y = mouseY - offsetY;
        draw();
    }
});

// Mouse up event (drop or delete)
canvas.addEventListener('mouseup', () => {
    if (draggingTetrimino) {
        if (draggingTetrimino.y > topBandHeight + middleBandHeight) {
            // Delete the tetrimino if it's in the bottom band
            duplicates = duplicates.filter(t => t !== draggingTetrimino);
        }
        draggingTetrimino = null;
        draw();
    }
});

// Rotate tetrimino (Shift + Click)
canvas.addEventListener('click', (e) => {
    if (e.shiftKey) {
        const mouseX = e.clientX;
        const mouseY = e.clientY;
        duplicates.forEach(t => {
            if (isMouseOverTetrimino(mouseX, mouseY, t)) {
                const shape = t.shape;
                // Transpose and reverse the array for 90-degree counterclockwise rotation
                const newShape = shape[0].map((val, index) =>
                    shape.map(row => row[shape[0].length - 1 - index])
                );
                t.shape = newShape;
                draw();
            }
        });
    }
});

// Initial drawing
draw();

// Resize canvas to fit the window
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    draw();
});
