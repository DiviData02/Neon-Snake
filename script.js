const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreElement = document.getElementById("score");
const highScoreElement = document.getElementById("highScore");
const levelElement = document.getElementById("level");

const startScreen = document.getElementById("startScreen");
const gameOverScreen = document.getElementById("gameOverScreen");
const pauseScreen = document.getElementById("pauseScreen");

const startBtn = document.getElementById("startBtn");
const restartBtn = document.getElementById("restartBtn");
const pauseBtn = document.getElementById("pauseBtn");
const resumeBtn = document.getElementById("resumeBtn");

const finalScore = document.getElementById("finalScore");
const newRecord = document.getElementById("newRecord");

const GRID = 24;

let cellSize;

let snake = [];
let food = {};

let direction = { x: 1, y: 0 };
let nextDirection = { x: 1, y: 0 };

let score = 0;
let highScore = Number(localStorage.getItem("neonSnakeHighScore")) || 0;

let level = 1;
let speed = 130;

let gameRunning = false;
let paused = false;

let lastTime = 0;
let animationFrame;

let particles = [];

highScoreElement.textContent = highScore;

function resizeCanvas() {
    const size = canvas.getBoundingClientRect().width;

    const pixelRatio = window.devicePixelRatio || 1;

    canvas.width = size * pixelRatio;
    canvas.height = size * pixelRatio;

    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

    cellSize = size / GRID;
}

window.addEventListener("resize", resizeCanvas);

resizeCanvas();

function createSnake() {
    snake = [
        { x: 12, y: 12 },
        { x: 11, y: 12 },
        { x: 10, y: 12 },
        { x: 9, y: 12 }
    ];
}

function createFood() {
    let validPosition = false;

    while (!validPosition) {
        food = {
            x: Math.floor(Math.random() * GRID),
            y: Math.floor(Math.random() * GRID)
        };

        validPosition = !snake.some(
            segment =>
                segment.x === food.x &&
                segment.y === food.y
        );
    }
}

function resetGame() {
    createSnake();
    createFood();

    score = 0;
    level = 1;
    speed = 130;

    direction = { x: 1, y: 0 };
    nextDirection = { x: 1, y: 0 };

    particles = [];

    updateStats();
}

function updateStats() {
    scoreElement.textContent = score;
    highScoreElement.textContent = highScore;
    levelElement.textContent = level;
}

function startGame() {
    resetGame();

    gameRunning = true;
    paused = false;

    startScreen.classList.add("hidden");
    gameOverScreen.classList.add("hidden");
    pauseScreen.classList.add("hidden");

    lastTime = performance.now();

    cancelAnimationFrame(animationFrame);
    animationFrame = requestAnimationFrame(gameLoop);
}

function gameLoop(timestamp) {

    if (!gameRunning) {
        draw();
        return;
    }

    if (!paused) {

        if (timestamp - lastTime >= speed) {
            update();
            lastTime = timestamp;
        }

        updateParticles();
        draw();
    }

    animationFrame = requestAnimationFrame(gameLoop);
}

function update() {

    direction = nextDirection;

    const head = snake[0];

    const newHead = {
        x: head.x + direction.x,
        y: head.y + direction.y
    };

    if (checkCollision(newHead)) {
        endGame();
        return;
    }

    snake.unshift(newHead);

    if (
        newHead.x === food.x &&
        newHead.y === food.y
    ) {
        score++;

        createParticles(
            food.x * cellSize + cellSize / 2,
            food.y * cellSize + cellSize / 2
        );

        updateDifficulty();
        createFood();

    } else {
        snake.pop();
    }

    updateStats();
}

function checkCollision(head) {

    if (
        head.x < 0 ||
        head.x >= GRID ||
        head.y < 0 ||
        head.y >= GRID
    ) {
        return true;
    }

    return snake.some(
        segment =>
            segment.x === head.x &&
            segment.y === head.y
    );
}

function updateDifficulty() {

    level = Math.floor(score / 5) + 1;

    speed = Math.max(
        55,
        130 - (level - 1) * 10
    );
}

function draw() {

    const size = canvas.getBoundingClientRect().width;

    ctx.clearRect(0, 0, size, size);

    drawBackground(size);
    drawGrid(size);
    drawFood();
    drawSnake();
    drawParticles();
}

function drawBackground(size) {

    ctx.fillStyle = "#07100b";
    ctx.fillRect(0, 0, size, size);

    const gradient = ctx.createRadialGradient(
        size / 2,
        size / 2,
        20,
        size / 2,
        size / 2,
        size / 1.2
    );

    gradient.addColorStop(
        0,
        "rgba(57, 255, 136, 0.035)"
    );

    gradient.addColorStop(
        1,
        "rgba(0, 0, 0, 0)"
    );

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
}

function drawGrid(size) {

    ctx.strokeStyle = "rgba(57, 255, 136, 0.035)";
    ctx.lineWidth = 1;

    for (let i = 0; i <= GRID; i++) {

        const position = i * cellSize;

        ctx.beginPath();
        ctx.moveTo(position, 0);
        ctx.lineTo(position, size);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, position);
        ctx.lineTo(size, position);
        ctx.stroke();
    }
}

function drawSnake() {

    snake.forEach((segment, index) => {

        const padding = index === 0 ? 1 : 2;

        const x =
            segment.x * cellSize + padding;

        const y =
            segment.y * cellSize + padding;

        const size =
            cellSize - padding * 2;

        const gradient = ctx.createLinearGradient(
            x,
            y,
            x + size,
            y + size
        );

        gradient.addColorStop(
            0,
            index === 0 ? "#8affb8" : "#42ff8c"
        );

        gradient.addColorStop(
            1,
            "#079447"
        );

        ctx.shadowColor = "rgba(57, 255, 136, 0.65)";
        ctx.shadowBlur = index === 0 ? 16 : 8;

        ctx.fillStyle = gradient;

        roundRect(
            ctx,
            x,
            y,
            size,
            size,
            index === 0 ? 7 : 5
        );

        ctx.fill();

        ctx.shadowBlur = 0;

        if (index === 0) {
            drawEyes(x, y, size);
        }
    });
}

function drawEyes(x, y, size) {

    ctx.fillStyle = "#031008";

    let eye1;
    let eye2;

    if (direction.x === 1) {

        eye1 = {
            x: x + size * 0.7,
            y: y + size * 0.3
        };

        eye2 = {
            x: x + size * 0.7,
            y: y + size * 0.7
        };

    } else if (direction.x === -1) {

        eye1 = {
            x: x + size * 0.3,
            y: y + size * 0.3
        };

        eye2 = {
            x: x + size * 0.3,
            y: y + size * 0.7
        };

    } else if (direction.y === -1) {

        eye1 = {
            x: x + size * 0.3,
            y: y + size * 0.3
        };

        eye2 = {
            x: x + size * 0.7,
            y: y + size * 0.3
        };

    } else {

        eye1 = {
            x: x + size * 0.3,
            y: y + size * 0.7
        };

        eye2 = {
            x: x + size * 0.7,
            y: y + size * 0.7
        };
    }

    ctx.beginPath();
    ctx.arc(
        eye1.x,
        eye1.y,
        size * 0.07,
        0,
        Math.PI * 2
    );
    ctx.fill();

    ctx.beginPath();
    ctx.arc(
        eye2.x,
        eye2.y,
        size * 0.07,
        0,
        Math.PI * 2
    );
    ctx.fill();
}

function drawFood() {

    const centerX =
        food.x * cellSize + cellSize / 2;

    const centerY =
        food.y * cellSize + cellSize / 2;

    const pulse =
        1 + Math.sin(performance.now() / 160) * 0.08;

    const radius =
        cellSize * 0.27 * pulse;

    ctx.shadowColor = "#ff304f";
    ctx.shadowBlur = 25;

    const gradient = ctx.createRadialGradient(
        centerX - radius * 0.3,
        centerY - radius * 0.3,
        1,
        centerX,
        centerY,
        radius
    );

    gradient.addColorStop(0, "#ffb0bb");
    gradient.addColorStop(0.35, "#ff526b");
    gradient.addColorStop(1, "#c9002d");

    ctx.fillStyle = gradient;

    ctx.beginPath();

    ctx.arc(
        centerX,
        centerY,
        radius,
        0,
        Math.PI * 2
    );

    ctx.fill();

    ctx.shadowBlur = 0;
}

function createParticles(x, y) {

    for (let i = 0; i < 18; i++) {

        particles.push({
            x,
            y,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            life: 1,
            size: Math.random() * 3 + 1
        });
    }
}

function updateParticles() {

    particles.forEach(particle => {

        particle.x += particle.vx;
        particle.y += particle.vy;

        particle.life -= 0.035;
    });

    particles = particles.filter(
        particle => particle.life > 0
    );
}

function drawParticles() {

    particles.forEach(particle => {

        ctx.globalAlpha = particle.life;

        ctx.fillStyle = "#ff526b";

        ctx.beginPath();

        ctx.arc(
            particle.x,
            particle.y,
            particle.size,
            0,
            Math.PI * 2
        );

        ctx.fill();
    });

    ctx.globalAlpha = 1;
}

function roundRect(
    context,
    x,
    y,
    width,
    height,
    radius
) {

    context.beginPath();

    context.moveTo(x + radius, y);

    context.lineTo(x + width - radius, y);

    context.quadraticCurveTo(
        x + width,
        y,
        x + width,
        y + radius
    );

    context.lineTo(
        x + width,
        y + height - radius
    );

    context.quadraticCurveTo(
        x + width,
        y + height,
        x + width - radius,
        y + height
    );

    context.lineTo(
        x + radius,
        y + height
    );

    context.quadraticCurveTo(
        x,
        y + height,
        x,
        y + height - radius
    );

    context.lineTo(
        x,
        y + radius
    );

    context.quadraticCurveTo(
        x,
        y,
        x + radius,
        y
    );

    context.closePath();
}

function endGame() {

    gameRunning = false;

    const previousHighScore = highScore;

    if (score > highScore) {

        highScore = score;

        localStorage.setItem(
            "neonSnakeHighScore",
            highScore
        );
    }

    finalScore.textContent = score;

    if (score > previousHighScore) {
        newRecord.classList.remove("hidden");
    } else {
        newRecord.classList.add("hidden");
    }

    gameOverScreen.classList.remove("hidden");

    updateStats();
}

function togglePause() {

    if (!gameRunning) {
        return;
    }

    paused = !paused;

    if (paused) {
        pauseScreen.classList.remove("hidden");
        pauseBtn.textContent = "▶";
    } else {
        pauseScreen.classList.add("hidden");
        pauseBtn.textContent = "Ⅱ";
        lastTime = performance.now();
    }
}

function changeDirection(newDirection) {

    const opposite =
        direction.x + newDirection.x === 0 &&
        direction.y + newDirection.y === 0;

    if (!opposite) {
        nextDirection = newDirection;
    }
}

document.addEventListener("keydown", event => {

    const key = event.key.toLowerCase();

    if (
        [
            "arrowup",
            "arrowdown",
            "arrowleft",
            "arrowright",
            "w",
            "a",
            "s",
            "d",
            " "
        ].includes(key)
    ) {
        event.preventDefault();
    }

    if (key === "arrowup" || key === "w") {
        changeDirection({ x: 0, y: -1 });
    }

    if (key === "arrowdown" || key === "s") {
        changeDirection({ x: 0, y: 1 });
    }

    if (key === "arrowleft" || key === "a") {
        changeDirection({ x: -1, y: 0 });
    }

    if (key === "arrowright" || key === "d") {
        changeDirection({ x: 1, y: 0 });
    }

    if (key === " ") {
        togglePause();
    }
});

document
    .querySelectorAll(".mobile-controls button")
    .forEach(button => {

        button.addEventListener("click", () => {

            const directionName =
                button.dataset.direction;

            const directions = {
                up: { x: 0, y: -1 },
                down: { x: 0, y: 1 },
                left: { x: -1, y: 0 },
                right: { x: 1, y: 0 }
            };

            changeDirection(
                directions[directionName]
            );
        });
    });

startBtn.addEventListener("click", startGame);
restartBtn.addEventListener("click", startGame);

pauseBtn.addEventListener("click", togglePause);
resumeBtn.addEventListener("click", togglePause);

createSnake();
createFood();
draw();
