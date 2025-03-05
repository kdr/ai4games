// Game constants
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 500;
const GRAVITY = 0.5;
const FLOOR_HEIGHT = 80;
const ROUND_TIME = 60;
const PLAYER_WIDTH = 50;
const PLAYER_HEIGHT = 100;
const LIMB_WIDTH = 20;
const LIMB_HEIGHT = 40;

// Game state variables
let canvas, ctx;
let player1, player2;
let gameActive = false;
let roundNumber = 1;
let roundsWon = { player1: 0, player2: 0 };
let timer = ROUND_TIME;
let timerInterval;
let bgMusic;

// DOM elements
const gameMessage = document.getElementById('game-message');
const restartButton = document.getElementById('restart-button');
const timerElement = document.getElementById('timer');
const player1HealthBar = document.querySelector('#player1-health .health-fill');
const player2HealthBar = document.querySelector('#player2-health .health-fill');
const roundIndicators = document.querySelectorAll('.round-indicator');

// Game initialization
window.onload = function() {
    canvas = document.getElementById('gameCanvas');
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    ctx = canvas.getContext('2d');
    
    bgMusic = document.getElementById('bgMusic');
    
    initGame();
    
    // Event listeners
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    restartButton.addEventListener('click', restartGame);
    
    // Start the game loop
    requestAnimationFrame(gameLoop);
};

// Initialize game state
function initGame() {
    // Create players with random colors
    player1 = createPlayer(200, CANVAS_HEIGHT - FLOOR_HEIGHT - PLAYER_HEIGHT, getRandomColor(), true);
    player2 = createPlayer(550, CANVAS_HEIGHT - FLOOR_HEIGHT - PLAYER_HEIGHT, getRandomColor(), false);
    
    // Reset game state
    gameActive = false;
    roundNumber = 1;
    roundsWon = { player1: 0, player2: 0 };
    timer = ROUND_TIME;
    updateTimerDisplay();
    
    // Update UI
    updateHealthBars();
    updateRoundIndicators();
    
    // Show round message
    showMessage(`ROUND ${roundNumber}`);
    
    // Start round after delay
    setTimeout(startRound, 2000);
}

// Start a new round
function startRound() {
    // Reset player positions and health
    resetPlayers();
    
    // Start the timer
    startTimer();
    
    // Play background music
    bgMusic.currentTime = 0;
    bgMusic.play();
    
    // Activate game
    gameActive = true;
    
    // Hide message
    hideMessage();
}

// Reset players for a new round
function resetPlayers() {
    player1.x = 200;
    player1.y = CANVAS_HEIGHT - FLOOR_HEIGHT - PLAYER_HEIGHT;
    player1.health = 100;
    player1.velocity = { x: 0, y: 0 };
    player1.attacking = false;
    
    player2.x = 550;
    player2.y = CANVAS_HEIGHT - FLOOR_HEIGHT - PLAYER_HEIGHT;
    player2.health = 100;
    player2.velocity = { x: 0, y: 0 };
    player2.attacking = false;
    
    updateHealthBars();
}

// Create a player object
function createPlayer(x, y, color, isPlayer1) {
    return {
        x: x,
        y: y,
        width: PLAYER_WIDTH,
        height: PLAYER_HEIGHT,
        color: color,
        health: 100,
        velocity: { x: 0, y: 0 },
        isJumping: false,
        isBlocking: false,
        attacking: false,
        attackType: null, // 'punch' or 'kick'
        attackCooldown: 0,
        isPlayer1: isPlayer1,
        keys: {
            left: false,
            right: false,
            up: false,
            block: false,
            punch: false,
            kick: false
        }
    };
}

// Game loop
function gameLoop() {
    // Clear canvas
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Draw background (dojo)
    drawBackground();
    
    // Update and draw players if game is active
    if (gameActive) {
        // Update player positions and states
        updatePlayer(player1);
        updateAI(player2);
        
        // Check for attacks and collisions
        checkAttacks();
    }
    
    // Draw players
    drawPlayer(player1);
    drawPlayer(player2);
    
    // Draw floor
    drawFloor();
    
    // Continue the game loop
    requestAnimationFrame(gameLoop);
}

// Update player state
function updatePlayer(player) {
    // Apply gravity
    player.velocity.y += GRAVITY;
    
    // Move player
    if (player.keys.left && !player.isBlocking) {
        player.velocity.x = -5;
    } else if (player.keys.right && !player.isBlocking) {
        player.velocity.x = 5;
    } else {
        player.velocity.x = 0;
    }
    
    // Jump
    if (player.keys.up && !player.isJumping && !player.isBlocking) {
        player.velocity.y = -12;
        player.isJumping = true;
    }
    
    // Block
    player.isBlocking = player.keys.block;
    
    // Attack
    if (player.attackCooldown > 0) {
        player.attackCooldown--;
    } else {
        if (player.keys.punch && !player.isBlocking) {
            player.attacking = true;
            player.attackType = 'punch';
            player.attackCooldown = 20;
            setTimeout(() => {
                player.attacking = false;
            }, 200);
        } else if (player.keys.kick && !player.isBlocking) {
            player.attacking = true;
            player.attackType = 'kick';
            player.attackCooldown = 30;
            setTimeout(() => {
                player.attacking = false;
            }, 300);
        }
    }
    
    // Update position
    player.x += player.velocity.x;
    player.y += player.velocity.y;
    
    // Keep player within boundaries
    if (player.x < 0) player.x = 0;
    if (player.x + player.width > CANVAS_WIDTH) player.x = CANVAS_WIDTH - player.width;
    
    // Handle floor collision
    if (player.y + player.height > CANVAS_HEIGHT - FLOOR_HEIGHT) {
        player.y = CANVAS_HEIGHT - FLOOR_HEIGHT - player.height;
        player.velocity.y = 0;
        player.isJumping = false;
    }
}

// Simple AI for player 2
function updateAI(ai) {
    // For now, AI is static and just stands in place
    // We'll add more complex behavior later
    ai.velocity.y += GRAVITY;
    
    // Occasional random attacks
    if (Math.random() < 0.01 && ai.attackCooldown === 0) {
        ai.attacking = true;
        ai.attackType = Math.random() < 0.5 ? 'punch' : 'kick';
        ai.attackCooldown = 30;
        setTimeout(() => {
            ai.attacking = false;
        }, 300);
    }
    
    // Update position (just vertical for now)
    ai.y += ai.velocity.y;
    
    // Handle floor collision
    if (ai.y + ai.height > CANVAS_HEIGHT - FLOOR_HEIGHT) {
        ai.y = CANVAS_HEIGHT - FLOOR_HEIGHT - ai.height;
        ai.velocity.y = 0;
        ai.isJumping = false;
    }
}

// Check for attacks and their impacts
function checkAttacks() {
    // Check player1 attacking player2
    if (player1.attacking && arePlayersInRange(player1, player2)) {
        if (!player2.isBlocking) {
            // Apply damage based on attack type
            const damage = player1.attackType === 'punch' ? 5 : 10;
            player2.health -= damage;
            
            // Knockback
            player2.velocity.x = 8;
            
            // Check for round end
            if (player2.health <= 0) {
                player2.health = 0;
                endRound('player1');
            }
        }
        
        // End attack after hit
        player1.attacking = false;
    }
    
    // Check player2 attacking player1
    if (player2.attacking && arePlayersInRange(player2, player1)) {
        if (!player1.isBlocking) {
            // Apply damage based on attack type
            const damage = player2.attackType === 'punch' ? 5 : 10;
            player1.health -= damage;
            
            // Knockback
            player1.velocity.x = -8;
            
            // Check for round end
            if (player1.health <= 0) {
                player1.health = 0;
                endRound('player2');
            }
        }
        
        // End attack after hit
        player2.attacking = false;
    }
    
    // Update UI
    updateHealthBars();
}

// Check if players are in attack range
function arePlayersInRange(attacker, defender) {
    const attackRange = attacker.width + 30; // Body width plus some extra range
    const distance = Math.abs((attacker.x + attacker.width / 2) - (defender.x + defender.width / 2));
    return distance < attackRange;
}

// Draw the background
function drawBackground() {
    // Simple dojo background
    ctx.fillStyle = '#8B4513'; // Brown wooden floor
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Wall
    ctx.fillStyle = '#D2B48C'; // Tan wall
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT - FLOOR_HEIGHT);
    
    // Decorative elements
    ctx.fillStyle = '#000';
    ctx.fillRect(400, 50, 5, 200); // Hanging scroll
    
    // Windows
    ctx.fillStyle = '#87CEEB'; // Sky blue
    ctx.fillRect(100, 50, 100, 80);
    ctx.fillRect(600, 50, 100, 80);
}

// Draw the floor
function drawFloor() {
    ctx.fillStyle = '#8B4513'; // Brown wooden floor
    ctx.fillRect(0, CANVAS_HEIGHT - FLOOR_HEIGHT, CANVAS_WIDTH, FLOOR_HEIGHT);
    
    // Floor lines
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    for (let i = 0; i < CANVAS_WIDTH; i += 50) {
        ctx.beginPath();
        ctx.moveTo(i, CANVAS_HEIGHT - FLOOR_HEIGHT);
        ctx.lineTo(i + 30, CANVAS_HEIGHT - FLOOR_HEIGHT);
        ctx.stroke();
    }
}

// Draw a player
function drawPlayer(player) {
    // Draw body
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.width, player.height);
    
    // Draw head
    ctx.fillRect(player.x + player.width/4, player.y - 20, player.width/2, 20);
    
    // Draw blocking stance
    if (player.isBlocking) {
        ctx.fillStyle = '#888';
        const blockX = player.isPlayer1 ? player.x + player.width : player.x - 10;
        ctx.fillRect(blockX, player.y + 20, 10, 60);
        return; // Don't draw limbs when blocking
    }
    
    // Draw attacking limbs
    if (player.attacking) {
        ctx.fillStyle = '#FF0';
        
        if (player.attackType === 'punch') {
            // Punch (arm extension)
            const punchX = player.isPlayer1 ? player.x + player.width : player.x - LIMB_WIDTH;
            ctx.fillRect(punchX, player.y + 20, LIMB_WIDTH, LIMB_HEIGHT/2);
        } else if (player.attackType === 'kick') {
            // Kick (leg extension)
            const kickX = player.isPlayer1 ? player.x + player.width : player.x - LIMB_WIDTH;
            ctx.fillRect(kickX, player.y + 70, LIMB_WIDTH, LIMB_HEIGHT/2);
        }
    }
}

// Handle key down events
function handleKeyDown(event) {
    switch(event.key) {
        // Player 1 controls
        case 'a': player1.keys.left = true; break;
        case 'd': player1.keys.right = true; break;
        case 'w': player1.keys.up = true; break;
        case 's': player1.keys.block = true; break;
        case 'f': player1.keys.punch = true; break;
        case 'g': player1.keys.kick = true; break;
    }
}

// Handle key up events
function handleKeyUp(event) {
    switch(event.key) {
        // Player 1 controls
        case 'a': player1.keys.left = false; break;
        case 'd': player1.keys.right = false; break;
        case 'w': player1.keys.up = false; break;
        case 's': player1.keys.block = false; break;
        case 'f': player1.keys.punch = false; break;
        case 'g': player1.keys.kick = false; break;
    }
}

// Start the round timer
function startTimer() {
    clearInterval(timerInterval);
    timer = ROUND_TIME;
    updateTimerDisplay();
    
    timerInterval = setInterval(() => {
        timer--;
        updateTimerDisplay();
        
        if (timer <= 0) {
            clearInterval(timerInterval);
            
            // Determine winner based on health
            if (player1.health > player2.health) {
                endRound('player1');
            } else if (player2.health > player1.health) {
                endRound('player2');
            } else {
                endRound('draw');
            }
        }
    }, 1000);
}

// Update timer display
function updateTimerDisplay() {
    timerElement.textContent = timer;
}

// End the current round
function endRound(winner) {
    gameActive = false;
    clearInterval(timerInterval);
    
    if (winner === 'player1' || winner === 'player2') {
        roundsWon[winner]++;
    }
    
    updateRoundIndicators();
    
    if (roundsWon.player1 >= 2 || roundsWon.player2 >= 2) {
        // Game over
        const gameWinner = roundsWon.player1 >= 2 ? 'PLAYER 1' : 'PLAYER 2';
        showMessage(`${gameWinner} WINS!`);
        restartButton.style.display = 'block';
        bgMusic.pause();
    } else {
        // Next round
        roundNumber++;
        showMessage(`ROUND ${roundNumber}`);
        setTimeout(startRound, 2000);
    }
}

// Update health bars
function updateHealthBars() {
    player1HealthBar.style.width = `${player1.health}%`;
    player2HealthBar.style.width = `${player2.health}%`;
}

// Update round indicators
function updateRoundIndicators() {
    // Reset indicators
    roundIndicators.forEach(indicator => {
        indicator.classList.remove('won');
    });
    
    // Update based on rounds won
    for (let i = 0; i < roundsWon.player1; i++) {
        document.querySelector(`.round-indicator.player1:nth-child(${i+1})`).classList.add('won');
    }
    
    for (let i = 0; i < roundsWon.player2; i++) {
        document.querySelector(`.round-indicator.player2:nth-child(${i+1})`).classList.add('won');
    }
}

// Show game message
function showMessage(text) {
    gameMessage.textContent = text;
    gameMessage.classList.add('show');
}

// Hide game message
function hideMessage() {
    gameMessage.classList.remove('show');
}

// Restart the game
function restartGame() {
    restartButton.style.display = 'none';
    initGame();
}

// Generate a random color
function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
} 