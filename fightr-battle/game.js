// Game constants
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 500;
const GRAVITY = 0.5;
const FLOOR_HEIGHT = 80;
const ROUND_TIME = 60;
const PLAYER_WIDTH = 50;
const PLAYER_HEIGHT = 100;
const LIMB_WIDTH = 25;
const LIMB_HEIGHT = 50;

// Game state variables
let canvas, ctx;
let player1, player2;
let gameActive = false;
let roundNumber = 1;
let roundsWon = { player1: 0, player2: 0 };
let timer = ROUND_TIME;
let timerInterval;
let bgMusic;
let particles = []; // Array to hold visual effect particles

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
        facingRight: isPlayer1, // Default facing direction
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
    
    // Draw floor
    drawFloor();
    
    // Update and draw players if game is active
    if (gameActive) {
        // Update player positions and states
        updatePlayer(player1);
        updateAI(player2);
        
        // Check for attacks and collisions
        checkAttacks();
        
        // Update particles
        updateParticles();
    }
    
    // Draw players (bodies only)
    drawPlayer(player1);
    drawPlayer(player2);
    
    // ALWAYS draw attack limbs last to ensure visibility
    if (player1.attacking) {
        drawAttackLimb(player1);
    }
    if (player2.attacking) {
        drawAttackLimb(player2);
    }
    
    // Draw particles
    drawParticles();
    
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
        player.facingRight = false;
    } else if (player.keys.right && !player.isBlocking) {
        player.velocity.x = 5;
        player.facingRight = true;
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
            
            // Create particles for visual effect
            createAttackParticles(player, 'punch');
            
            setTimeout(() => {
                player.attacking = false;
            }, 200);
        } else if (player.keys.kick && !player.isBlocking) {
            player.attacking = true;
            player.attackType = 'kick';
            player.attackCooldown = 30;
            
            // Create particles for visual effect
            createAttackParticles(player, 'kick');
            
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
    // Apply gravity
    ai.velocity.y += GRAVITY;
    
    // AI movement logic - random movement with higher probability to move toward player
    if (ai.attackCooldown <= 10 && !ai.isBlocking && !ai.attacking) {
        // Random chance to change direction or stand still
        if (Math.random() < 0.03) {
            const moveChoice = Math.random();
            
            // 60% chance to move toward player, 20% to move away, 20% to stand still
            if (moveChoice < 0.6) {
                // Move toward player1
                if (player1.x < ai.x) {
                    ai.velocity.x = -3;
                    ai.facingRight = false;
                } else {
                    ai.velocity.x = 3;
                    ai.facingRight = true;
                }
            } else if (moveChoice < 0.8) {
                // Move away from player1
                if (player1.x < ai.x) {
                    ai.velocity.x = 3;
                    ai.facingRight = true;
                } else {
                    ai.velocity.x = -3;
                    ai.facingRight = false;
                }
            } else {
                // Stand still
                ai.velocity.x = 0;
            }
        }
        
        // Random chance to jump
        if (Math.random() < 0.005 && !ai.isJumping) {
            ai.velocity.y = -12;
            ai.isJumping = true;
        }
    } else {
        // Slow down when attacking
        ai.velocity.x *= 0.8;
    }
    
    // Random blocking
    if (Math.random() < 0.005) {
        ai.isBlocking = !ai.isBlocking;
    }
    
    // Random attacks when close to player1
    const distanceToPlayer = Math.abs((ai.x + ai.width / 2) - (player1.x + player1.width / 2));
    const attackProbability = distanceToPlayer < 150 ? 0.03 : 0.005;
    
    if (Math.random() < attackProbability && ai.attackCooldown === 0 && !ai.isBlocking) {
        ai.attacking = true;
        ai.attackType = Math.random() < 0.5 ? 'punch' : 'kick';
        ai.attackCooldown = 30;
        
        // Create particles for visual effect
        createAttackParticles(ai, ai.attackType);
        
        setTimeout(() => {
            ai.attacking = false;
        }, 300);
    }
    
    // Update position
    ai.x += ai.velocity.x;
    ai.y += ai.velocity.y;
    
    // Keep AI within boundaries
    if (ai.x < 0) ai.x = 0;
    if (ai.x + ai.width > CANVAS_WIDTH) ai.x = CANVAS_WIDTH - ai.width;
    
    // Handle floor collision
    if (ai.y + ai.height > CANVAS_HEIGHT - FLOOR_HEIGHT) {
        ai.y = CANVAS_HEIGHT - FLOOR_HEIGHT - ai.height;
        ai.velocity.y = 0;
        ai.isJumping = false;
    }
    
    // Always decrease attack cooldown
    if (ai.attackCooldown > 0) {
        ai.attackCooldown--;
    }
}

// Check for attacks and their impacts
function checkAttacks() {
    // Check player1 attacking player2
    if (player1.attacking && arePlayersInRange(player1, player2)) {
        // Check if player2 is blocking effectively
        const effectiveBlock = player2.isBlocking && isBlockingEffective(player2, player1);
        
        if (!effectiveBlock) {
            // Apply damage based on attack type
            const damage = player1.attackType === 'punch' ? 5 : 10;
            player2.health -= damage;
            
            // Knockback
            player2.velocity.x = 8;
            
            // Visual hit effect
            createHitParticles(player2.x, player2.y + player2.height/2);
            
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
        // Check if player1 is blocking effectively
        const effectiveBlock = player1.isBlocking && isBlockingEffective(player1, player2);
        
        if (!effectiveBlock) {
            // Apply damage based on attack type
            const damage = player2.attackType === 'punch' ? 5 : 10;
            player1.health -= damage;
            
            // Knockback
            player1.velocity.x = -8;
            
            // Visual hit effect
            createHitParticles(player1.x, player1.y + player1.height/2);
            
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

// Check if blocking is effective based on facing direction
function isBlockingEffective(defender, attacker) {
    // Blocking is only effective if facing toward the attacker
    if (defender.facingRight) {
        // Defender is facing right, so attacker must be on the right
        return attacker.x > defender.x;
    } else {
        // Defender is facing left, so attacker must be on the left
        return attacker.x < defender.x;
    }
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
function drawPlayer(player, drawAttacks = true) {
    // Draw body
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.width, player.height);
    
    // Draw head
    ctx.fillRect(player.x + player.width/4, player.y - 20, player.width/2, 20);
    
    // Draw indicator for facing direction (like eyes)
    const eyeSize = 8;
    ctx.fillStyle = '#000';
    if (player.facingRight) {
        // Eyes on right side
        ctx.fillRect(player.x + player.width - eyeSize - 5, player.y - 15, eyeSize, eyeSize);
    } else {
        // Eyes on left side
        ctx.fillRect(player.x + 5, player.y - 15, eyeSize, eyeSize);
    }
    
    // Draw blocking stance
    if (player.isBlocking) {
        // Calculate if block would be effective against the other player
        const otherPlayer = player.isPlayer1 ? player2 : player1;
        const effectiveBlock = isBlockingEffective(player, otherPlayer);
        
        // Use different color for effective vs ineffective block
        ctx.fillStyle = effectiveBlock ? '#4CAF50' : '#FF5722'; // Green for effective, orange for ineffective
        
        const blockX = player.facingRight ? player.x + player.width : player.x - 10;
        ctx.fillRect(blockX, player.y + 20, 10, 60);
        
        // If the block is ineffective, show a visual warning
        if (!effectiveBlock) {
            ctx.fillStyle = '#FF0000';
            const warningX = player.facingRight ? player.x - 15 : player.x + player.width + 5;
            ctx.beginPath();
            ctx.moveTo(warningX, player.y + 30);
            ctx.lineTo(warningX + 10, player.y + 40);
            ctx.lineTo(warningX, player.y + 50);
            ctx.closePath();
            ctx.fill();
        }
        
        return; // Don't draw attack limbs when blocking
    }
    
    // Draw attacking limbs - now moved to separate function
}

// Function to draw attack limbs separately
function drawAttackLimb(player) {
    // Use bright colors with outlines for limbs
    let limbX, limbY, limbWidth, limbHeight;
    
    if (player.attackType === 'punch') {
        // Punch (arm extension)
        limbWidth = LIMB_WIDTH;
        limbHeight = LIMB_HEIGHT/2;
        limbY = player.y + 20;
        limbX = player.facingRight ? player.x + player.width : player.x - limbWidth;
    } else if (player.attackType === 'kick') {
        // Kick (leg extension)
        limbWidth = LIMB_WIDTH;
        limbHeight = LIMB_HEIGHT/2;
        limbY = player.y + 70;
        limbX = player.facingRight ? player.x + player.width : player.x - limbWidth;
    } else {
        return; // No attack type specified
    }
    
    // Draw with a prominent outline
    ctx.fillStyle = player.isPlayer1 ? '#FF5000' : '#00AAFF'; // Orange for player 1, Blue for player 2
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    
    // Force limbs to be on top with higher z-index
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1.0;
    
    // Draw the filled rectangle with an outline
    ctx.fillRect(limbX, limbY, limbWidth, limbHeight);
    ctx.strokeRect(limbX, limbY, limbWidth, limbHeight);
    
    // Reset drawing settings
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1.0;
    ctx.lineWidth = 1;
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
    
    // Reset player classes to ensure proper styling
    document.querySelectorAll('.round-indicator').forEach((indicator, index) => {
        indicator.classList.remove('player1', 'player2');
        // First two indicators belong to player1, third belongs to player2
        if (index < 2) {
            indicator.classList.add('player1');
        } else {
            indicator.classList.add('player2');
        }
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

// Create particles for attack visualization
function createAttackParticles(player, attackType) {
    const particleCount = attackType === 'punch' ? 5 : 8;
    const particleSize = attackType === 'punch' ? 4 : 6;
    const particleSpeed = attackType === 'punch' ? 3 : 4;
    const particleColor = player.isPlayer1 ? '#FF5000' : '#00AAFF';
    
    // Calculate position for particles based on attack type and player direction
    let posX, posY;
    if (attackType === 'punch') {
        posY = player.y + 20 + LIMB_HEIGHT/4;
        posX = player.facingRight ? player.x + player.width + LIMB_WIDTH/2 : player.x - LIMB_WIDTH/2;
    } else { // kick
        posY = player.y + 70 + LIMB_HEIGHT/4;
        posX = player.facingRight ? player.x + player.width + LIMB_WIDTH/2 : player.x - LIMB_WIDTH/2;
    }
    
    // Create particles
    for (let i = 0; i < particleCount; i++) {
        const angle = player.facingRight ? 
            Math.random() * Math.PI/2 - Math.PI/4 : 
            Math.random() * Math.PI/2 + Math.PI/4 * 3;
        
        const speedX = Math.cos(angle) * particleSpeed * (Math.random() + 0.5);
        const speedY = Math.sin(angle) * particleSpeed * (Math.random() + 0.5);
        
        particles.push({
            x: posX,
            y: posY,
            vx: speedX,
            vy: speedY,
            size: particleSize * Math.random() + particleSize/2,
            color: particleColor,
            life: 15 + Math.random() * 10
        });
    }
}

// Create particles for hit effects
function createHitParticles(x, y) {
    const particleCount = 12;
    
    for (let i = 0; i < particleCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 3;
        
        particles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: 3 + Math.random() * 5,
            color: '#FFFFFF',
            life: 20 + Math.random() * 10
        });
    }
}

// Update particles
function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        
        // Remove dead particles
        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }
}

// Draw particles
function drawParticles() {
    for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life / 30; // Fade out as life decreases
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    }
    
    ctx.globalAlpha = 1.0; // Reset alpha
} 