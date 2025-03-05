// Game variables
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startButton = document.getElementById('startButton');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('highScore');

// Game state
let gameRunning = false;
let score = 0;
let highScore = localStorage.getItem('highScore') || 0;
highScoreElement.textContent = highScore;

// Game settings
const gravity = 0.5;
const jumpStrength = -8;
const pipeGap = 150;
const pipeWidth = 60;
const pipeSpawnRate = 120; // frames
let pipeSpeed = 2;

// Bird object
const bird = {
    x: 50,
    y: canvas.height / 2,
    width: 40,
    height: 30,
    velocity: 0,
    color: '#FFDB58', // Yellow
    draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.width / 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Bird's eye
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(this.x + 8, this.y - 8, 5, 0, Math.PI * 2);
        ctx.fill();
        
        // Bird's beak
        ctx.fillStyle = 'orange';
        ctx.beginPath();
        ctx.moveTo(this.x + 15, this.y - 5);
        ctx.lineTo(this.x + 30, this.y);
        ctx.lineTo(this.x + 15, this.y + 5);
        ctx.fill();
        
        // Bird's wing
        ctx.fillStyle = '#E8C547';
        ctx.beginPath();
        ctx.ellipse(this.x - 5, this.y + 5, 15, 10, 0, 0, Math.PI * 2);
        ctx.fill();
    },
    update() {
        // Apply gravity
        this.velocity += gravity;
        this.y += this.velocity;
        
        // Prevent bird from going off screen
        if (this.y + this.height / 2 > canvas.height) {
            this.y = canvas.height - this.height / 2;
            this.velocity = 0;
            gameOver();
        }
        
        if (this.y - this.height / 2 < 0) {
            this.y = this.height / 2;
            this.velocity = 0;
        }
    },
    jump() {
        this.velocity = jumpStrength;
    },
    reset() {
        this.y = canvas.height / 2;
        this.velocity = 0;
    }
};

// Pipes array and counter
let pipes = [];
let pipeCounter = 0;

// Background elements
const backgroundElements = {
    clouds: Array.from({ length: 5 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * 100 + 20,
        width: Math.random() * 70 + 30,
        speed: Math.random() * 0.5 + 0.1
    })),
    drawClouds() {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        for (const cloud of this.clouds) {
            ctx.beginPath();
            ctx.arc(cloud.x, cloud.y, cloud.width / 3, 0, Math.PI * 2);
            ctx.arc(cloud.x + cloud.width / 4, cloud.y - cloud.width / 6, cloud.width / 3, 0, Math.PI * 2);
            ctx.arc(cloud.x + cloud.width / 2, cloud.y, cloud.width / 3, 0, Math.PI * 2);
            ctx.fill();
            
            // Move clouds
            cloud.x -= cloud.speed;
            
            // Reset cloud position if it's off screen
            if (cloud.x + cloud.width < 0) {
                cloud.x = canvas.width + cloud.width;
                cloud.y = Math.random() * 100 + 20;
            }
        }
    },
    ground: {
        y: canvas.height - 20,
        draw() {
            ctx.fillStyle = '#5D4037'; // Brown
            ctx.fillRect(0, this.y, canvas.width, canvas.height);
            
            // Add some grass on top
            ctx.fillStyle = '#8BC34A'; // Green
            ctx.fillRect(0, this.y - 5, canvas.width, 5);
        }
    }
};

// Game functions
function createPipe() {
    const pipeGapPosition = Math.floor(Math.random() * (canvas.height - pipeGap - 120)) + 60;
    
    pipes.push({
        x: canvas.width,
        top: {
            y: 0,
            height: pipeGapPosition
        },
        bottom: {
            y: pipeGapPosition + pipeGap,
            height: canvas.height - (pipeGapPosition + pipeGap)
        },
        counted: false,
        draw() {
            // Top pipe
            drawPipe(this.x, 0, pipeWidth, this.top.height, true);
            
            // Bottom pipe
            drawPipe(this.x, this.bottom.y, pipeWidth, this.bottom.height, false);
        }
    });
}

function drawPipe(x, y, width, height, isTop) {
    const pipeColor = '#43A047'; // Green
    const pipeEdgeColor = '#2E7D32'; // Darker green
    
    // Main pipe
    ctx.fillStyle = pipeColor;
    ctx.fillRect(x, y, width, height);
    
    // Pipe edges
    ctx.fillStyle = pipeEdgeColor;
    ctx.fillRect(x - 5, isTop ? height - 20 : y, width + 10, 20);
    
    // Pipe highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(x + 5, y, 10, height);
}

function checkCollision(bird, pipe) {
    // Check collision with top pipe
    if (
        bird.x + bird.width / 2 > pipe.x &&
        bird.x - bird.width / 2 < pipe.x + pipeWidth &&
        bird.y - bird.height / 2 < pipe.top.height
    ) {
        return true;
    }
    
    // Check collision with bottom pipe
    if (
        bird.x + bird.width / 2 > pipe.x &&
        bird.x - bird.width / 2 < pipe.x + pipeWidth &&
        bird.y + bird.height / 2 > pipe.bottom.y
    ) {
        return true;
    }
    
    return false;
}

function gameOver() {
    gameRunning = false;
    startButton.textContent = 'Play Again';
    startButton.style.display = 'block';
    
    // Update high score
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('highScore', highScore);
        highScoreElement.textContent = highScore;
    }
}

function resetGame() {
    pipes = [];
    pipeCounter = 0;
    score = 0;
    scoreElement.textContent = score;
    bird.reset();
    pipeSpeed = 2;
}

function updateScore() {
    for (const pipe of pipes) {
        if (!pipe.counted && pipe.x + pipeWidth < bird.x) {
            score++;
            scoreElement.textContent = score;
            pipe.counted = true;
            
            // Increase difficulty
            if (score % 5 === 0 && pipeSpeed < 4) {
                pipeSpeed += 0.5;
            }
        }
    }
}

function gameLoop() {
    if (!gameRunning) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background
    ctx.fillStyle = '#71c5cf'; // Sky blue
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw clouds
    backgroundElements.drawClouds();
    
    // Draw ground
    backgroundElements.ground.draw();
    
    // Update and draw bird
    bird.update();
    bird.draw();
    
    // Create new pipes
    pipeCounter++;
    if (pipeCounter >= pipeSpawnRate) {
        createPipe();
        pipeCounter = 0;
    }
    
    // Update and draw pipes
    for (let i = pipes.length - 1; i >= 0; i--) {
        pipes[i].x -= pipeSpeed;
        pipes[i].draw();
        
        // Remove pipes that are off screen
        if (pipes[i].x + pipeWidth < 0) {
            pipes.splice(i, 1);
            continue;
        }
        
        // Check for collision
        if (checkCollision(bird, pipes[i])) {
            gameOver();
            return;
        }
    }
    
    // Update score
    updateScore();
    
    // Request next frame
    requestAnimationFrame(gameLoop);
}

// Event listeners
startButton.addEventListener('click', () => {
    resetGame();
    gameRunning = true;
    startButton.style.display = 'none';
    gameLoop();
});

window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && gameRunning) {
        bird.jump();
    } else if (e.code === 'Space' && !gameRunning) {
        resetGame();
        gameRunning = true;
        startButton.style.display = 'none';
        gameLoop();
    }
});

canvas.addEventListener('click', () => {
    if (gameRunning) {
        bird.jump();
    }
});

// Touch support for mobile devices
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (gameRunning) {
        bird.jump();
    }
}, { passive: false });

// Initial draw
bird.draw(); 