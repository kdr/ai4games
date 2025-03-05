class FightGame {
    constructor(canvas, useAI = false) {
        try {
            console.error("FightGame constructor called");
            
            // Validate canvas
            if (!canvas) {
                console.error("Invalid canvas provided to FightGame constructor");
                throw new Error("Canvas not provided to FightGame constructor");
            }
            
            console.error("Canvas:", canvas);
            console.error(`Canvas dimensions: ${canvas.width}x${canvas.height}`);
            
            // Store canvas reference
            this.canvas = canvas;
            
            // Try to get 2D context
            try {
                this.ctx = canvas.getContext('2d');
                if (!this.ctx) {
                    throw new Error("Could not get 2D context from canvas");
                }
                console.error("Canvas 2D context acquired successfully");
            } catch (e) {
                console.error("ERROR GETTING CANVAS CONTEXT:", e);
                throw new Error("Failed to get canvas context: " + e.message);
            }
            
            // Store canvas dimensions
            this.width = canvas.width;
            this.height = canvas.height;
            
            // Make canvas more visible for debugging
            canvas.style.border = '3px solid red';
            canvas.style.backgroundColor = 'black';
            
            // TEST DRAW - ensure we can actually draw to the canvas
            try {
                this.ctx.fillStyle = 'green';
                this.ctx.fillRect(0, 0, this.width, this.height);
                console.error("Test rectangle drawn in constructor");
            } catch (e) {
                console.error("ERROR DRAWING TEST RECTANGLE:", e);
                throw new Error("Failed to draw to canvas: " + e.message);
            }
            
            // Set ground position and boundaries
            this.groundY = Math.floor(this.height * 0.8); // 80% down the canvas
            this.leftBoundary = 50;
            this.rightBoundary = this.width - 50;
            
            console.error(`Game boundaries: ground=${this.groundY}, left=${this.leftBoundary}, right=${this.rightBoundary}`);
            
            // Game settings
            this.gravity = 1;
            this.friction = 0.8;
            
            // Animation frame variables
            this.animationFrameId = null;
            this.lastTime = 0;
            this.fpsInterval = 1000 / 60; // Target 60 FPS
            
            // Timer variables
            this.timerId = null;
            this.timerInterval = null; // For backwards compatibility
            
            // Input state
            this.keys = {};
            
            // Initialize game state
            this.gameState = 'idle'; // idle, starting, fighting, paused, roundEnd, gameEnd
            this.state = 'idle';     // For backwards compatibility
            this.useAI = useAI;
            
            // Player references
            this.player1 = null;
            this.player2 = null;
            
            // Round settings
            this.currentRound = 1;
            this.maxRounds = 3;
            this.p1Wins = 0;
            this.p2Wins = 0;
            this.timeRemaining = 90; // 90 seconds per round
            this.timer = 90;         // For backwards compatibility
            
            // AI configuration
            if (this.useAI) {
                this.aiState = {
                    currentAction: 'idle',
                    attackCooldown: 0,
                    decisionCooldown: 0,
                    preferredDistance: 150
                };
                this.aiActionTimer = 0;      // For backwards compatibility
                this.aiActionDelay = 30;     // For backwards compatibility
                this.aiActionChance = 0.7;   // For backwards compatibility
                this.aiAggressiveness = 0.6; // For backwards compatibility
            }
            
            // Set up event listeners
            this.setupEventListeners();
            
            console.error("FightGame constructor completed successfully");
        } catch (e) {
            console.error("CRITICAL ERROR IN FIGHTGAME CONSTRUCTOR:", e);
            throw new Error("FightGame constructor failed: " + e.message);
        }
    }
    
    setupEventListeners() {
        // Input event listeners
        this.keys = {};
        
        window.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            
            // Debug key presses
            if (['a', 'd', 'w', 's', 'g', 'h', 'j'].includes(e.key.toLowerCase())) {
                console.log(`Key DOWN: ${e.key.toLowerCase()}`);
            }
            
            // Prevent scrolling with WASD
            if (['w', 'a', 's', 'd'].includes(e.key.toLowerCase())) {
                e.preventDefault();
            }
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
            
            // Debug key releases
            if (['a', 'd', 'w', 's', 'g', 'h', 'j'].includes(e.key.toLowerCase())) {
                console.log(`Key UP: ${e.key.toLowerCase()}`);
            }
        });
        
        // Force release keys when window loses focus
        window.addEventListener('blur', () => {
            console.log("Window lost focus, clearing all input keys");
            Object.keys(this.keys).forEach(key => {
                this.keys[key] = false;
            });
            
            // Ensure player stops moving
            if (this.player1) this.player1.stopMoving();
            if (this.player2) this.player2.stopMoving();
        });
    }
    
    setPlayers(character1 = 'ninja', character2 = 'samurai') {
        try {
            console.error(`Setting players: ${character1} vs ${character2}`);
            
            // Log canvas dimensions for reference
            console.error(`Canvas dimensions: ${this.width}x${this.height}`);
            
            // Normalize character names to lowercase
            const char1 = character1.toLowerCase();
            const char2 = character2.toLowerCase();
            console.error(`Normalized character names: ${char1} vs ${char2}`);
            
            // Define player positions based on canvas dimensions
            const player1X = Math.floor(this.width * 0.3); // Left third
            const player2X = Math.floor(this.width * 0.7); // Right third
            const playerY = this.groundY;
            
            console.error(`Player positions: P1(${player1X}, ${playerY}), P2(${player2X}, ${playerY})`);
            
            // Check if CHARACTERS is defined
            if (!window.CHARACTERS) {
                console.error("CHARACTERS object not defined! Creating default characters.");
                window.CHARACTERS = {
                    ninja: { name: 'Ninja', speed: 6, jumpPower: 17, health: 90, maxHealth: 90 },
                    samurai: { name: 'Samurai', speed: 5, jumpPower: 15, health: 110, maxHealth: 110 },
                    monk: { name: 'Monk', speed: 5.5, jumpPower: 16, health: 100, maxHealth: 100 },
                    ronin: { name: 'Ronin', speed: 6, jumpPower: 14, health: 95, maxHealth: 95 }
                };
            }
            
            // Ultra-defensive check for Character
            if (typeof Character !== 'function') {
                console.error("Character constructor is missing! Using emergency BasicCharacter class");
                this.createPlaceholderCharacters(char1, char2, player1X, player2X, playerY);
                return true;
            }
            
            try {
                // Create player 1 (always controlled by keyboard)
                console.error("Creating Player 1");
                this.player1 = new Character({
                    name: char1,
                    x: player1X,
                    y: playerY,
                    width: 80,
                    height: 150,
                    facingRight: true,
                    speed: CHARACTERS[char1].speed,
                    jumpPower: CHARACTERS[char1].jumpPower,
                    health: CHARACTERS[char1].health,
                    maxHealth: CHARACTERS[char1].maxHealth
                });
                
                // Safety check - make sure required methods exist
                if (!this.player1.update || !this.player1.draw) {
                    throw new Error("Player1 missing required methods");
                }
                
                console.error("Player 1 created:", this.player1);
                
                // Create player 2 (may be AI controlled)
                console.error("Creating Player 2");
                this.player2 = new Character({
                    name: char2,
                    x: player2X,
                    y: playerY,
                    width: 80,
                    height: 150,
                    facingRight: false,
                    speed: CHARACTERS[char2].speed,
                    jumpPower: CHARACTERS[char2].jumpPower,
                    health: CHARACTERS[char2].health,
                    maxHealth: CHARACTERS[char2].maxHealth
                });
                
                // Safety check - make sure required methods exist
                if (!this.player2.update || !this.player2.draw) {
                    throw new Error("Player2 missing required methods");
                }
                
                console.error("Player 2 created:", this.player2);
                
                // Make sure health bars are updated immediately
                this.updateHealthDisplay();
                
                // Force sprite generation if available
                if (typeof generateAllSprites === 'function' && !window.gameAssets) {
                    console.error("Forcing sprite generation");
                    generateAllSprites();
                }
                
                console.error("Players set successfully");
                return true;
            } catch (e) {
                console.error("ERROR CREATING CHARACTERS:", e);
                
                // Error recovery: Create placeholder characters if Character constructor fails
                console.error("Attempting to create placeholder characters");
                
                // Create dummy Character objects without sprite requirements
                this.createPlaceholderCharacters(char1, char2, player1X, player2X, playerY);
                return true; // Return true because we managed to create fallback characters
            }
        } catch (e) {
            console.error("CRITICAL ERROR IN setPlayers:", e);
            alert("Error setting up players: " + e.message);
            
            // Last resort - create extremely simple rectangle players
            try {
                this.player1 = {
                    name: 'EmergencyP1',
                    x: this.width * 0.3,
                    y: this.groundY,
                    width: 80,
                    height: 150,
                    facingRight: true,
                    health: 100,
                    maxHealth: 100,
                    update: function() { return true; },
                    draw: function(ctx) {
                        ctx.fillStyle = 'blue';
                        ctx.fillRect(this.x - this.width/2, this.y - this.height, this.width, this.height);
                        return true;
                    },
                    takeDamage: function() { return false; }
                };
                
                this.player2 = {
                    name: 'EmergencyP2',
                    x: this.width * 0.7,
                    y: this.groundY,
                    width: 80,
                    height: 150,
                    facingRight: false,
                    health: 100,
                    maxHealth: 100,
                    update: function() { return true; },
                    draw: function(ctx) {
                        ctx.fillStyle = 'red';
                        ctx.fillRect(this.x - this.width/2, this.y - this.height, this.width, this.height);
                        return true;
                    },
                    takeDamage: function() { return false; }
                };
                
                console.error("Created emergency minimal characters");
                return true;
            } catch (innerError) {
                console.error("CRITICAL: Even emergency minimal character creation failed:", innerError);
                return false;
            }
        }
    }
    
    // Emergency fallback if Character constructor fails
    createPlaceholderCharacters(char1, char2, player1X, player2X, playerY) {
        try {
            // Basic character object that doesn't rely on sprites
            class BasicCharacter {
                constructor(options) {
                    this.name = options.name;
                    this.x = options.x;
                    this.y = options.y;
                    this.width = options.width;
                    this.height = options.height;
                    this.facingRight = options.facingRight;
                    this.health = options.health;
                    this.maxHealth = options.maxHealth;
                    this.color = options.color || '#' + Math.floor(Math.random()*16777215).toString(16);
                }
                
                draw(ctx) {
                    // Draw simple rectangle
                    ctx.fillStyle = this.color;
                    ctx.fillRect(this.x - this.width/2, this.y - this.height, this.width, this.height);
                    
                    // Draw name
                    ctx.fillStyle = 'white';
                    ctx.font = '16px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText(this.name, this.x, this.y - this.height - 10);
                }
                
                update() {
                    // Basic empty update method
                }
                
                punch() { return true; }
                kick() { return true; }
                special() { return true; }
                takeDamage(amount) {
                    this.health -= amount;
                    if (this.health < 0) this.health = 0;
                    return this.health <= 0;
                }
            }
            
            // Create basic characters
            this.player1 = new BasicCharacter({
                name: char1,
                x: player1X,
                y: playerY,
                width: 80,
                height: 150,
                facingRight: true,
                health: 100,
                maxHealth: 100,
                color: '#0066cc'
            });
            
            this.player2 = new BasicCharacter({
                name: char2,
                x: player2X,
                y: playerY,
                width: 80,
                height: 150,
                facingRight: false,
                health: 100,
                maxHealth: 100,
                color: '#cc3300'
            });
            
            console.error("Created placeholder characters as fallback");
            return true;
        } catch (e) {
            console.error("CRITICAL: Even placeholder character creation failed:", e);
            return false;
        }
    }
    
    start() {
        console.log("STARTING NEW GAME!");
        this.debugLog("Game state before start:", this.gameState);
        
        // Clear existing timers/animation frames
        if (this.timerId) clearInterval(this.timerId);
        if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
        
        // Ensure the canvas is visible and properly sized
        if (this.canvas) {
            this.canvas.style.display = 'block';
            this.canvas.style.border = '2px solid red';
            this.canvas.style.background = '#000';
            console.log(`Canvas dimensions: ${this.width}x${this.height}`);
        }
        
        // Reset game state
        this.currentRound = 1;
        this.p1Wins = 0;
        this.p2Wins = 0;
        
        // Reset AI state if applicable
        if (this.useAI && this.aiState) {
            this.aiState.currentAction = 'idle';
            this.aiState.attackCooldown = 0;
            this.aiState.decisionCooldown = 0;
        }
        
        // Sanity check players
        if (!this.player1 || !this.player2) {
            console.error("Players not set up! Creating default characters.");
            this.setPlayers('ninja', 'samurai');
        }
        
        // Reset players to starting positions
        this.resetPlayers();
        
        // Set up timer
        this.timeRemaining = 90; // 90 seconds per round
        this.updateTimerDisplay();
        
        // Connect health elements to characters
        const p1HealthElement = document.getElementById('p1-health');
        const p2HealthElement = document.getElementById('p2-health');
        
        if (p1HealthElement && this.player1) {
            p1HealthElement.style.width = '100%';
            this.player1.healthElement = p1HealthElement;
        }
        
        if (p2HealthElement && this.player2) {
            p2HealthElement.style.width = '100%';
            this.player2.healthElement = p2HealthElement;
        }
        
        // Force a first render to make sure something is visible
        this.gameState = 'starting';
        this.draw();
        
        // Show the round announcement
        this.showAnnouncement('round');
        
        // Start the timer and game loop
        console.log("Starting timer and game loop");
        this.lastTime = performance.now();
        this.startTimer(); // Make sure the timer starts
        this.gameState = 'fighting'; // Explicitly set to fighting
        
        // Log the game state
        this.debugLog("Game state after set:", this.gameState);
        
        // Force draw again to update with game state
        this.draw();
        
        // Start the game loop
        this.fpsInterval = 1000 / 60; // Target 60 FPS
        this.animationFrameId = requestAnimationFrame(time => this.gameLoop(time));
        
        console.log("Game started successfully!");
    }
    
    resetPlayers() {
        console.log("Resetting players for new round");
        
        // Reset positions
        this.player1.reset(200);
        this.player2.reset(600);
        
        // Face players toward each other
        this.player1.isFacingRight = true;
        this.player2.isFacingRight = false;
        
        // Make sure health is set to max
        this.player1.health = this.player1.maxHealth;
        this.player2.health = this.player2.maxHealth;
        
        // Update health bars to full
        this.updateHealthDisplay();
        
        console.log("Players reset complete");
    }
    
    showAnnouncement(type) {
        try {
            console.log(`Showing announcement: ${type}`);
            
            // Check if announcement elements exist
            if (!this.announcementElement) {
                console.error("Announcement element not connected");
                return false;
            }
            
            // Get text elements
            const roundTextElement = this.roundTextElement || document.getElementById('round-text');
            const fightTextElement = this.fightTextElement || document.getElementById('fight-text');
            
            if (!roundTextElement || !fightTextElement) {
                console.error("Round or fight text elements not found");
                return false;
            }
            
            // Set the announcement text based on type
            if (type === 'round') {
                roundTextElement.textContent = `ROUND ${this.currentRound}`;
                console.log(`Set round text: ROUND ${this.currentRound}`);
            } else if (type === 'ko') {
                roundTextElement.textContent = 'K.O.';
                fightTextElement.style.display = 'none';
                console.log("Set KO text");
            } else if (type === 'draw') {
                roundTextElement.textContent = 'DRAW';
                fightTextElement.style.display = 'none';
                console.log("Set DRAW text");
            } else if (type === 'time') {
                roundTextElement.textContent = 'TIME UP';
                fightTextElement.style.display = 'none';
                console.log("Set TIME UP text");
            }
            
            // Show the announcement
            this.announcementElement.style.display = 'flex';
            this.announcementElement.classList.add('show');
            
            // Hide the fight text initially
            if (type === 'round') {
                fightTextElement.style.opacity = '0';
                fightTextElement.style.display = 'block';
            }
            
            // For round announcement, show "FIGHT!" after a delay
            if (type === 'round') {
                setTimeout(() => {
                    if (fightTextElement) {
                        fightTextElement.style.opacity = '1';
                        console.log("Showing FIGHT text");
                    }
                    
                    // Hide the announcement after another delay
                    setTimeout(() => {
                        this.announcementElement.classList.remove('show');
                        setTimeout(() => {
                            this.announcementElement.style.display = 'none';
                            
                            // Start the fight if this was a round announcement
                            if (type === 'round') {
                                this.state = 'fighting';
                                console.log("Starting fight");
                            }
                        }, 500);
                    }, 1500);
                }, 1500);
            } else {
                // For other announcements, hide after a longer delay
                setTimeout(() => {
                    this.announcementElement.classList.remove('show');
                    setTimeout(() => {
                        this.announcementElement.style.display = 'none';
                    }, 500);
                }, 3000);
            }
            
            return true;
        } catch (e) {
            console.error("Error showing announcement:", e);
            return false;
        }
    }
    
    startTimer() {
        try {
            console.log("Starting timer");
            
            // Reset timer to initial value
            this.timer = 90; // 90 seconds for a round
            
            // Update display immediately
            this.updateTimerDisplay();
            
            // Set interval to update timer every second
            this.timerInterval = setInterval(() => {
                // Decrement timer
                this.timer--;
                
                // Update the display
                this.updateTimerDisplay();
                
                // Check if timer has reached zero
                if (this.timer <= 0) {
                    // Clear interval
                    clearInterval(this.timerInterval);
                    console.log("Timer reached zero");
                    
                    // End round due to time up
                    this.handleTimeUp();
                }
            }, 1000);
            
            return true;
        } catch (e) {
            console.error("Error starting timer:", e);
            return false;
        }
    }
    
    updateTimerDisplay() {
        try {
            // Get the timer element
            if (!this.timerElement) {
                console.warn("Timer element not connected");
                return false;
            }
            
            // Update the display
            this.timerElement.textContent = this.timer;
            
            // Change color if time is running low
            if (this.timer <= 10) {
                this.timerElement.style.color = 'red';
            } else {
                this.timerElement.style.color = 'white';
            }
            
            return true;
        } catch (e) {
            console.error("Error updating timer display:", e);
            return false;
        }
    }
    
    handleInput() {
        if (this.gameState !== 'fighting') {
            console.log(`Not handling input because game state is ${this.gameState}`);
            return;
        }
        
        // Player 1 controls (WASD + GHJ)
        let movementInput = false;
        
        if (this.keys['a']) {
            this.player1.moveLeft();
            movementInput = true;
        } else if (this.keys['d']) {
            this.player1.moveRight();
            movementInput = true;
        } else {
            this.player1.stopMoving();
        }
        
        // Log movement inputs for debugging
        if (movementInput) {
            console.log(`Player 1 movement keys: A=${!!this.keys['a']}, D=${!!this.keys['d']}`);
        }
        
        if (this.keys['w']) {
            this.player1.jump();
        }
        
        if (this.keys['s']) {
            this.player1.startBlock();
        } else {
            this.player1.endBlock();
        }
        
        // Attack input logging and handling
        if (this.keys['g']) {
            console.log("G key pressed - attempting punch attack");
            const result = this.player1.punch();
            console.log(`Punch attempt result: ${result ? 'SUCCESS' : 'FAILED'}`);
        } else if (this.keys['h']) {
            console.log("H key pressed - attempting kick attack");
            const result = this.player1.kick();
            console.log(`Kick attempt result: ${result ? 'SUCCESS' : 'FAILED'}`);
        } else if (this.keys['j']) {
            console.log("J key pressed - attempting special attack");
            const result = this.player1.special();
            console.log(`Special attack attempt result: ${result ? 'SUCCESS' : 'FAILED'}`);
        }
        
        // AI controls for Player 2
        if (this.useAI) {
            this.handleAI();
        } else {
            // Original Player 2 controls (Arrows + 123)
            if (this.keys['ArrowLeft']) {
                this.player2.moveLeft();
            } else if (this.keys['ArrowRight']) {
                this.player2.moveRight();
            } else {
                this.player2.stopMoving();
            }
            
            if (this.keys['ArrowUp']) {
                this.player2.jump();
            }
            
            if (this.keys['ArrowDown']) {
                this.player2.startBlock();
            } else {
                this.player2.endBlock();
            }
            
            if (this.keys['1']) {
                this.player2.punch();
            } else if (this.keys['2']) {
                this.player2.kick();
            } else if (this.keys['3']) {
                this.player2.special();
            }
        }
    }
    
    handleAI() {
        // Basic AI logic for Player 2
        
        // Get distance to player 1
        const p1X = this.player1.isFacingRight ? this.player1.x : this.player1.x - this.player1.width;
        const p2X = this.player2.isFacingRight ? this.player2.x : this.player2.x - this.player2.width;
        
        const p1HitboxCenter = p1X + this.player1.width / 2;
        const p2HitboxCenter = p2X + this.player2.width / 2;
        
        const distance = Math.abs(p1HitboxCenter - p2HitboxCenter);
        
        // Update AI info display
        this.updateAIInfo('state', this.player2.currentState);
        this.updateAIInfo('target', `Distance: ${Math.floor(distance)}`);
        
        // Only make decisions at intervals to make AI more human-like
        this.aiActionTimer++;
        if (this.aiActionTimer < this.aiActionDelay) {
            return;
        }
        
        // Reset timer
        this.aiActionTimer = 0;
        
        // Sometimes do nothing (makes AI less predictable)
        // Reduce the chance of doing nothing to make AI more active
        if (Math.random() > 0.9) {
            this.player2.stopMoving();
            this.player2.endBlock();
            this.updateAIInfo('action', 'Waiting');
            return;
        }
        
        // Determine if player 1 is attacking
        const p1IsAttacking = this.player1.isAttacking;
        
        // AI aggressiveness increases as player health decreases
        const dynamicAggressiveness = this.aiAggressiveness * 
            (1 + (1 - this.player1.health / this.player1.maxHealth) * 0.5);
        
        // Determine what action to take
        
        // Face toward the player (always)
        if (p2HitboxCenter < p1HitboxCenter) {
            this.player2.isFacingRight = true;
        } else {
            this.player2.isFacingRight = false;
        }
        
        // If player 1 is attacking and close, high chance to block
        if (p1IsAttacking && distance < 150 && Math.random() < 0.7) {
            this.player2.startBlock();
            this.player2.stopMoving();
            this.updateAIInfo('action', 'Blocking attack');
            return;
        } else {
            this.player2.endBlock();
        }
        
        // Random chance to jump (increased chance)
        if (Math.random() < 0.15 && this.player2.isGrounded) {
            this.player2.jump();
            this.updateAIInfo('action', 'Jumping');
        }
        
        // Position management
        if (distance < 80) { // Reduced threshold to make AI more aggressive
            // Too close, move away sometimes
            if (Math.random() > dynamicAggressiveness && !this.player2.isAttacking) {
                if (p2HitboxCenter < p1HitboxCenter) {
                    this.player2.moveLeft();
                    this.updateAIInfo('action', 'Moving away (left)');
                } else {
                    this.player2.moveRight();
                    this.updateAIInfo('action', 'Moving away (right)');
                }
            } else {
                // Attack if very close
                const attackRandom = Math.random();
                
                if (attackRandom < 0.4) {
                    this.player2.punch();
                    this.updateAIInfo('action', 'Punching');
                } else if (attackRandom < 0.8) {
                    this.player2.kick();
                    this.updateAIInfo('action', 'Kicking');
                } else if (this.player2.specialCooldown === 0) {
                    this.player2.special();
                    this.updateAIInfo('action', 'Special attack');
                }
            }
        } else if (distance > 200) { // Reduced threshold to make AI more active
            // Too far, move closer
            if (p2HitboxCenter < p1HitboxCenter) {
                this.player2.moveRight();
                this.updateAIInfo('action', 'Approaching (right)');
            } else {
                this.player2.moveLeft();
                this.updateAIInfo('action', 'Approaching (left)');
            }
        } else {
            // In the preferred range
            const moveRandom = Math.random();
            
            if (moveRandom < 0.3) {
                // Sometimes move randomly even in good range
                if (moveRandom < 0.15) {
                    this.player2.moveLeft();
                    this.updateAIInfo('action', 'Positioning (left)');
                } else {
                    this.player2.moveRight();
                    this.updateAIInfo('action', 'Positioning (right)');
                }
            } else {
                this.player2.stopMoving();
                
                // Attack if in range and not already attacking
                if (!this.player2.isAttacking && !this.player2.isBlocking) {
                    const attackRandom = Math.random();
                    
                    if (attackRandom < dynamicAggressiveness) {
                        if (attackRandom < 0.33) {
                            this.player2.punch();
                            this.updateAIInfo('action', 'Punching');
                        } else if (attackRandom < 0.66) {
                            this.player2.kick();
                            this.updateAIInfo('action', 'Kicking');
                        } else if (this.player2.specialCooldown === 0) {
                            this.player2.special();
                            this.updateAIInfo('action', 'Special attack');
                        }
                    } else {
                        this.updateAIInfo('action', 'Waiting for opening');
                    }
                }
            }
        }
    }
    
    update() {
        if (this.gameState !== 'fighting') return;
        
        // Update players
        this.player1.update();
        this.player2.update();
        
        // Enforce boundaries
        this.enforceBoundaries();
        
        // Check collisions
        this.checkCollisions();
        
        // Check for KO
        if (this.player1.health <= 0 || this.player2.health <= 0) {
            clearInterval(this.timerInterval);
            this.showAnnouncement('ko');
        }
    }
    
    enforceBoundaries() {
        // Keep players within game boundaries
        if (this.player1.x < this.leftBoundary) {
            this.player1.x = this.leftBoundary;
        } else if (this.player1.x > this.rightBoundary) {
            this.player1.x = this.rightBoundary;
        }
        
        if (this.player2.x < this.leftBoundary) {
            this.player2.x = this.leftBoundary;
        } else if (this.player2.x > this.rightBoundary) {
            this.player2.x = this.rightBoundary;
        }
    }
    
    checkCollisions() {
        // Don't check for collisions if the round is over
        if (this.gameState !== 'fighting') {
            return;
        }
        
        // Check for character collisions
        const p1 = this.player1;
        const p2 = this.player2;
        
        // Get character bounding boxes
        const p1Bounds = {
            x: p1.x,
            y: p1.y,
            width: p1.width,
            height: p1.height
        };
        
        const p2Bounds = {
            x: p2.x,
            y: p2.y,
            width: p2.width,
            height: p2.height
        };
        
        // Check if characters are overlapping and push them apart
        if (this.checkOverlap(p1Bounds, p2Bounds)) {
            // Calculate how much they're overlapping
            const overlapX = Math.min(
                p1Bounds.x + p1Bounds.width - p2Bounds.x,
                p2Bounds.x + p2Bounds.width - p1Bounds.x
            );
            
            // Push both characters slightly apart
            if (p1.x < p2.x) {
                p1.x -= overlapX / 2;
                p2.x += overlapX / 2;
            } else {
                p1.x += overlapX / 2;
                p2.x -= overlapX / 2;
            }
        }
        
        // Check for attack hitboxes
        const p1Hitbox = p1.getCurrentHitbox();
        const p2Hitbox = p2.getCurrentHitbox();
        
        if (window.DEBUG) {
            if (p1Hitbox) {
                console.log(`P1 active hitbox: (${p1Hitbox.x}, ${p1Hitbox.y}) ${p1Hitbox.width}x${p1Hitbox.height}, damage: ${p1Hitbox.damage}`);
            }
            if (p2Hitbox) {
                console.log(`P2 active hitbox: (${p2Hitbox.x}, ${p2Hitbox.y}) ${p2Hitbox.width}x${p2Hitbox.height}, damage: ${p2Hitbox.damage}`);
            }
        }
        
        // Check if Player 1's attack hits Player 2
        if (p1Hitbox && this.checkOverlap(p1Hitbox, p2Bounds)) {
            console.log(`P1 ${p1.attackType} hit P2! Damage: ${p1Hitbox.damage}`);
            
            // Apply damage (reduced if blocking)
            p2.takeDamage(p1Hitbox.damage);
            
            // Update health display
            this.updateHealthDisplay();
            
            // Check if the hit defeated Player 2
            if (p2.health <= 0) {
                this.handleKO();
            }
        }
        
        // Check if Player 2's attack hits Player 1
        if (p2Hitbox && this.checkOverlap(p2Hitbox, p1Bounds)) {
            console.log(`P2 ${p2.attackType} hit P1! Damage: ${p2Hitbox.damage}`);
            
            // Apply damage (reduced if blocking)
            p1.takeDamage(p2Hitbox.damage);
            
            // Update health display
            this.updateHealthDisplay();
            
            // Check if the hit defeated Player 1
            if (p1.health <= 0) {
                this.handleKO();
            }
        }
    }
    
    // Check if two rectangles overlap
    checkOverlap(rect1, rect2) {
        return (
            rect1.x < rect2.x + rect2.width &&
            rect1.x + rect1.width > rect2.x &&
            rect1.y < rect2.y + rect2.height &&
            rect1.y + rect1.height > rect2.y
        );
    }
    
    updateHealthDisplay() {
        try {
            console.log("Updating health display");
            
            if (!this.player1 || !this.player2) {
                console.error("Cannot update health display: players not initialized");
                return false;
            }
            
            // Calculate health percentages
            const p1HealthPercent = (this.player1.health / this.player1.maxHealth) * 100;
            const p2HealthPercent = (this.player2.health / this.player2.maxHealth) * 100;
            
            // Log health values
            console.log(`Health - P1: ${this.player1.health}/${this.player1.maxHealth} (${p1HealthPercent.toFixed(1)}%), P2: ${this.player2.health}/${this.player2.maxHealth} (${p2HealthPercent.toFixed(1)}%)`);
            
            // Update health bar width for player 1
            if (this.healthBarP1) {
                this.healthBarP1.style.width = `${p1HealthPercent}%`;
                
                // Change color based on health remaining
                if (p1HealthPercent <= 20) {
                    this.healthBarP1.style.backgroundColor = 'red';
                } else if (p1HealthPercent <= 50) {
                    this.healthBarP1.style.backgroundColor = 'orange';
                } else {
                    this.healthBarP1.style.backgroundColor = '#e63946';
                }
            } else {
                console.warn("P1 health bar element not found");
            }
            
            // Update health bar width for player 2
            if (this.healthBarP2) {
                this.healthBarP2.style.width = `${p2HealthPercent}%`;
                
                // Change color based on health remaining
                if (p2HealthPercent <= 20) {
                    this.healthBarP2.style.backgroundColor = 'red';
                } else if (p2HealthPercent <= 50) {
                    this.healthBarP2.style.backgroundColor = 'orange';
                } else {
                    this.healthBarP2.style.backgroundColor = '#e63946';
                }
            } else {
                console.warn("P2 health bar element not found");
            }
            
            // Update character health elements if they're connected
            if (this.player1.healthElement) {
                this.player1.healthElement.style.width = `${p1HealthPercent}%`;
            }
            
            if (this.player2.healthElement) {
                this.player2.healthElement.style.width = `${p2HealthPercent}%`;
            }
            
            return true;
        } catch (e) {
            console.error("Error updating health display:", e);
            return false;
        }
    }
    
    endRound(winner) {
        console.log("Ending round");
        
        // Determine winner
        let winner = null;
        
        if (this.player1.health <= 0) {
            winner = 'p2';
            console.log("Player 2 (AI) won by KO");
        } else if (this.player2.health <= 0) {
            winner = 'p1';
            console.log("Player 1 won by KO");
        } else if (this.player1.health > this.player2.health) {
            winner = 'p1';
            console.log("Player 1 won by health advantage");
        } else if (this.player2.health > this.player1.health) {
            winner = 'p2';
            console.log("Player 2 (AI) won by health advantage");
        } else {
            // Draw - player 1 wins by default in case of a tie
            winner = 'p1';
            console.log("Round ended in a draw, player 1 wins by default");
        }
        
        // Proceed directly to end game
        this.endGame(winner);
    }
    
    updateRoundIndicators() {
        console.log("Updating round indicators");
        
        // Get all round indicators
        const p1Round1 = document.getElementById('p1-round-1');
        const p1Round2 = document.getElementById('p1-round-2');
        const p2Round1 = document.getElementById('p2-round-1');
        const p2Round2 = document.getElementById('p2-round-2');
        
        // Clear all indicators first
        p1Round1.classList.remove('won');
        p1Round2.classList.remove('won');
        p2Round1.classList.remove('won');
        p2Round2.classList.remove('won');
        
        // Add 'won' class based on current wins
        if (this.p1Wins >= 1) p1Round1.classList.add('won');
        if (this.p1Wins >= 2) p1Round2.classList.add('won');
        if (this.p2Wins >= 1) p2Round1.classList.add('won');
        if (this.p2Wins >= 2) p2Round2.classList.add('won');
        
        console.log(`Round indicators updated - P1: ${this.p1Wins} wins, P2: ${this.p2Wins} wins`);
    }
    
    endGame(winner) {
        console.log("Game over, showing victory screen");
        
        // Clear any active timers
        clearInterval(this.timerInterval);
        this.gameState = 'gameEnd';
        
        // Determine winner text
        const winnerText = winner === 'p1' ? 'PLAYER 1 WINS!' : 'AI OPPONENT WINS!';
        
        // Update victory screen
        document.getElementById('winner-text').textContent = winnerText;
        
        // Show victory screen
        document.getElementById('battle-screen').classList.remove('active');
        document.getElementById('victory-screen').classList.add('active');
        
        // Automatically return to character selection after 3 seconds
        setTimeout(() => {
            this.returnToCharacterSelect();
        }, 3000);
    }
    
    returnToCharacterSelect() {
        console.log("Returning to character selection");
        
        // Stop the game
        this.stop();
        
        // Hide victory screen and show character select
        document.getElementById('victory-screen').classList.remove('active');
        document.getElementById('character-select').classList.add('active');
        
        // Reset selections in the UI (we'll call this from outside)
        // The main.js file will handle this when it gets the appropriate event
        
        // Dispatch a custom event that main.js can listen for
        const event = new CustomEvent('returnToCharacterSelect');
        document.dispatchEvent(event);
    }
    
    draw() {
        try {
            // Clear the canvas
            this.ctx.clearRect(0, 0, this.width, this.height);
            
            console.error(`Drawing frame, game state: ${this.gameState}`);
            
            // Draw background (fallback first, then try image if available)
            this.drawFallbackBackground();
            
            // Draw debug elements
            if (window.DEBUG) {
                // Draw ground line
                this.ctx.strokeStyle = 'yellow';
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.moveTo(0, this.groundY);
                this.ctx.lineTo(this.width, this.groundY);
                this.ctx.stroke();
                
                // Draw boundaries
                this.ctx.strokeStyle = 'red';
                this.ctx.beginPath();
                this.ctx.moveTo(this.leftBoundary, 0);
                this.ctx.lineTo(this.leftBoundary, this.height);
                this.ctx.moveTo(this.rightBoundary, 0);
                this.ctx.lineTo(this.rightBoundary, this.height);
                this.ctx.stroke();
            }
            
            // Draw players if they exist, otherwise draw placeholders
            if (this.player1) {
                console.error("Drawing player 1:", this.player1);
                this.player1.draw(this.ctx);
            } else {
                console.error("Player 1 does not exist, drawing placeholder");
                this.drawPlayerPlaceholder(this.width * 0.25, this.groundY - 100, "PLAYER 1", "#0066cc");
            }
            
            if (this.player2) {
                console.error("Drawing player 2:", this.player2);
                this.player2.draw(this.ctx);
            } else {
                console.error("Player 2 does not exist, drawing placeholder");
                this.drawPlayerPlaceholder(this.width * 0.75, this.groundY - 100, "PLAYER 2", "#cc3300");
            }
            
            // Draw debug info if in debug mode
            if (window.DEBUG) {
                this.drawDebugInfo();
            }
            
            // Draw UI elements
            this.drawUI();
            
            console.error("Frame drawing completed");
        } catch (e) {
            console.error("ERROR IN DRAW METHOD:", e);
            
            // Emergency drawing to show something is happening
            try {
                this.ctx.fillStyle = 'red';
                this.ctx.fillRect(0, 0, this.width, this.height);
                
                this.ctx.fillStyle = 'white';
                this.ctx.font = '24px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('ERROR IN RENDERING', this.width/2, this.height/2);
                this.ctx.fillText(e.message, this.width/2, this.height/2 + 30);
            } catch (innerError) {
                console.error("CRITICAL: Even emergency drawing failed:", innerError);
            }
        }
    }
    
    drawPlayerPlaceholder(x, y, label, color) {
        // Draw a colored rectangle as placeholder for a character
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x - 40, y - 100, 80, 100);
        
        // Draw the label
        this.ctx.fillStyle = 'white';
        this.ctx.font = '16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(label, x, y - 110);
    }
    
    drawDebugInfo() {
        // Set text style
        this.ctx.font = '12px Arial';
        this.ctx.fillStyle = 'white';
        
        // Game state information
        this.ctx.fillText(`Game State: ${this.gameState}`, 10, 20);
        this.ctx.fillText(`Timer: ${this.timeRemaining}s`, 10, 40);
        
        // Player information
        this.ctx.fillText(`P1 Health: ${this.player1.health}/${this.player1.maxHealth}`, 10, 60);
        this.ctx.fillText(`P2 Health: ${this.player2.health}/${this.player2.maxHealth}`, 10, 80);
        
        // Current attack status
        this.ctx.fillText(`P1 Attacking: ${this.player1.isAttacking ? 'YES - ' + this.player1.currentAttack : 'NO'}`, 10, 100);
        this.ctx.fillText(`P2 Attacking: ${this.player2.isAttacking ? 'YES - ' + this.player2.currentAttack : 'NO'}`, 10, 120);
        
        // Current animation frame
        this.ctx.fillText(`P1 Animation: ${this.player1.currentState} (Frame ${this.player1.animationFrame})`, 10, 140);
        this.ctx.fillText(`P2 Animation: ${this.player2.currentState} (Frame ${this.player2.animationFrame})`, 10, 160);
        
        // Draw hitboxes
        const p1Hitbox = this.player1.getCurrentHitbox();
        const p2Hitbox = this.player2.getCurrentHitbox();
        
        if (p1Hitbox) {
            // Draw player 1 attack hitbox
            this.ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(p1Hitbox.x, p1Hitbox.y, p1Hitbox.width, p1Hitbox.height);
            this.ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
            this.ctx.fillRect(p1Hitbox.x, p1Hitbox.y, p1Hitbox.width, p1Hitbox.height);
            this.ctx.fillStyle = 'white';
            this.ctx.fillText(`DMG: ${p1Hitbox.damage}`, p1Hitbox.x, p1Hitbox.y - 5);
        }
        
        if (p2Hitbox) {
            // Draw player 2 attack hitbox
            this.ctx.strokeStyle = 'rgba(0, 0, 255, 0.8)';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(p2Hitbox.x, p2Hitbox.y, p2Hitbox.width, p2Hitbox.height);
            this.ctx.fillStyle = 'rgba(0, 0, 255, 0.3)';
            this.ctx.fillRect(p2Hitbox.x, p2Hitbox.y, p2Hitbox.width, p2Hitbox.height);
            this.ctx.fillStyle = 'white';
            this.ctx.fillText(`DMG: ${p2Hitbox.damage}`, p2Hitbox.x, p2Hitbox.y - 5);
        }
        
        // Draw player bounds boxes
        const p1Bounds = {
            x: this.player1.x - this.player1.width/2,
            y: this.player1.y,
            width: this.player1.width,
            height: this.player1.height
        };
        
        const p2Bounds = {
            x: this.player2.x - this.player2.width/2,
            y: this.player2.y,
            width: this.player2.width,
            height: this.player2.height
        };
        
        this.ctx.strokeStyle = 'rgba(255, 255, 0, 0.5)';
        this.ctx.strokeRect(p1Bounds.x, p1Bounds.y, p1Bounds.width, p1Bounds.height);
        this.ctx.strokeRect(p2Bounds.x, p2Bounds.y, p2Bounds.width, p2Bounds.height);
    }
    
    gameLoop(currentTime) {
        // Request the next frame
        this.animationFrameId = requestAnimationFrame((time) => this.gameLoop(time));
        
        try {
            // Check if canvas and context are valid
            if (!this.canvas || !this.ctx) {
                console.error("Canvas or context is null in gameLoop");
                this.showErrorOverlay("Canvas or drawing context is missing");
                return;
            }
            
            // Check if the players exist and have required methods
            this.validatePlayers();
            
            // Debug mode - show game state
            if (window.DEBUG) {
                console.log(`Game state: ${this.state}, Timer: ${this.timer}`);
            }
            
            // Only update the game if we're in an active state
            if (this.state === 'fighting' || this.state === 'starting') {
                // Calculate elapsed time
                const elapsed = currentTime - this.lastTime;
                
                // Debug mode - show elapsed time
                if (window.DEBUG) {
                    console.log(`Elapsed time: ${elapsed}ms, FPS Interval: ${this.fpsInterval}ms`);
                }
                
                // Only update if enough time has passed to maintain consistent FPS
                if (elapsed > this.fpsInterval) {
                    // Update last time (accounting for the excess time)
                    this.lastTime = currentTime - (elapsed % this.fpsInterval);
                    
                    try {
                        // Process input
                        this.handleInput();
                        
                        // Update game state
                        this.update();
                        
                        // Draw the current frame
                        this.draw();
                    } catch (innerError) {
                        console.error("Error in game update/draw cycle:", innerError);
                        
                        // Try to render something even if there's an error
                        try {
                            this.ctx.fillStyle = 'black';
                            this.ctx.fillRect(0, 0, this.width, this.height);
                            this.ctx.fillStyle = 'red';
                            this.ctx.font = '24px Arial';
                            this.ctx.textAlign = 'center';
                            this.ctx.fillText('ERROR IN GAME LOOP', this.width/2, this.height/2 - 20);
                            this.ctx.fillText(innerError.message, this.width/2, this.height/2 + 20);
                            
                            // Draw a simple fighting game arena anyway
                            this.drawFallbackBackground();
                            
                            // Draw placeholder characters if players exist
                            this.drawPlaceholderCharacters();
                            
                            // Draw HUD anyway
                            this.drawUI();
                        } catch (renderError) {
                            console.error("Critical render error:", renderError);
                        }
                        
                        // Show error overlay if available
                        if (typeof showErrorOverlay === 'function') {
                            showErrorOverlay(innerError);
                        }
                    }
                }
            }
        } catch (outerError) {
            console.error("Critical error in gameLoop:", outerError);
            
            // Try one last time to show an error message on screen
            try {
                this.ctx.fillStyle = 'black';
                this.ctx.fillRect(0, 0, this.width, this.height);
                this.ctx.fillStyle = 'red';
                this.ctx.font = '24px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('CRITICAL GAME ERROR', this.width/2, this.height/2 - 20);
                this.ctx.fillText(outerError.message, this.width/2, this.height/2 + 20);
                this.ctx.fillText('Press F1 for emergency reset', this.width/2, this.height/2 + 60);
            } catch (finalError) {
                // At this point, there's not much else we can do
                console.error("Unable to render error message:", finalError);
            }
            
            // Show error overlay if available
            if (typeof showErrorOverlay === 'function') {
                showErrorOverlay(outerError);
            }
        }
    }
    
    // Validate players exist and have required methods
    validatePlayers() {
        try {
            // Check if players exist
            if (!this.player1) {
                console.error("Player 1 is missing - attempting to recreate");
                // Try to recreate player 1
                this.setPlayers('ninja', this.player2 ? this.player2.name : 'samurai');
            }
            
            if (!this.player2) {
                console.error("Player 2 is missing - attempting to recreate");
                // Try to recreate player 2
                this.setPlayers(this.player1 ? this.player1.name : 'ninja', 'samurai');
            }
            
            // Check if player methods exist
            if (this.player1 && (!this.player1.update || typeof this.player1.update !== 'function')) {
                console.error("Player 1 update method is invalid");
                this.player1.update = function() { return true; };
            }
            
            if (this.player1 && (!this.player1.draw || typeof this.player1.draw !== 'function')) {
                console.error("Player 1 draw method is invalid");
                this.player1.draw = function(ctx) {
                    ctx.fillStyle = 'blue';
                    ctx.fillRect(this.x - this.width/2, this.y - this.height, this.width, this.height);
                    return true;
                };
            }
            
            if (this.player2 && (!this.player2.update || typeof this.player2.update !== 'function')) {
                console.error("Player 2 update method is invalid");
                this.player2.update = function() { return true; };
            }
            
            if (this.player2 && (!this.player2.draw || typeof this.player2.draw !== 'function')) {
                console.error("Player 2 draw method is invalid");
                this.player2.draw = function(ctx) {
                    ctx.fillStyle = 'red';
                    ctx.fillRect(this.x - this.width/2, this.y - this.height, this.width, this.height);
                    return true;
                };
            }
            
            return true;
        } catch (e) {
            console.error("Error validating players:", e);
            return false;
        }
    }
    
    // Draw placeholder characters when normal characters fail
    drawPlaceholderCharacters() {
        try {
            if (this.player1) {
                // Draw player 1
                this.ctx.fillStyle = 'blue';
                this.ctx.fillRect(
                    this.player1.x - (this.player1.width || 40)/2, 
                    this.player1.y - (this.player1.height || 150), 
                    this.player1.width || 80, 
                    this.player1.height || 150
                );
                
                // Draw name
                this.ctx.fillStyle = 'white';
                this.ctx.font = '16px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(
                    this.player1.name || 'Player 1', 
                    this.player1.x, 
                    this.player1.y - (this.player1.height || 150) - 10
                );
            }
            
            if (this.player2) {
                // Draw player 2
                this.ctx.fillStyle = 'red';
                this.ctx.fillRect(
                    this.player2.x - (this.player2.width || 40)/2, 
                    this.player2.y - (this.player2.height || 150), 
                    this.player2.width || 80, 
                    this.player2.height || 150
                );
                
                // Draw name
                this.ctx.fillStyle = 'white';
                this.ctx.font = '16px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(
                    this.player2.name || 'Player 2', 
                    this.player2.x, 
                    this.player2.y - (this.player2.height || 150) - 10
                );
            }
        } catch (e) {
            console.error("Error drawing placeholder characters:", e);
        }
    }
    
    // Draw a fallback background if the normal one doesn't load
    drawFallbackBackground() {
        try {
            // Log that we're using the fallback
            console.log("Drawing fallback background");
            
            // Fill with a dark color
            this.ctx.fillStyle = '#111';
            this.ctx.fillRect(0, 0, this.width, this.height);
            
            // Check if we have the dojo background that was generated
            if (window.gameAssets && window.gameAssets.dojo_bg) {
                console.log("Using generated dojo background");
                try {
                    this.ctx.drawImage(window.gameAssets.dojo_bg, 0, 0, this.width, this.height);
                    return;
                } catch (e) {
                    console.error("Error drawing dojo background:", e);
                }
            }
            
            // Draw a simple dojo-like background manually
            
            // Floor (tatami)
            this.ctx.fillStyle = '#8a7951';
            this.ctx.fillRect(0, this.height - 100, this.width, 100);
            
            // Background wall
            this.ctx.fillStyle = '#3b3b3b';
            this.ctx.fillRect(0, 0, this.width, this.height - 100);
            
            // Wall pattern
            this.ctx.strokeStyle = '#2a2a2a';
            this.ctx.lineWidth = 2;
            for (let i = 0; i < this.width; i += 50) {
                this.ctx.beginPath();
                this.ctx.moveTo(i, 0);
                this.ctx.lineTo(i, this.height - 100);
                this.ctx.stroke();
            }
            
            // Support beams
            this.ctx.fillStyle = '#6e4530';
            this.ctx.fillRect(this.width * 0.2, 0, 20, this.height - 100);
            this.ctx.fillRect(this.width * 0.8, 0, 20, this.height - 100);
            
            // Floor line
            this.ctx.strokeStyle = '#5a5138';
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.moveTo(0, this.height - 100);
            this.ctx.lineTo(this.width, this.height - 100);
            this.ctx.stroke();
            
            // Floor pattern
            this.ctx.strokeStyle = '#766745';
            this.ctx.lineWidth = 1;
            for (let i = 0; i < this.width; i += 100) {
                this.ctx.beginPath();
                this.ctx.moveTo(i, this.height - 100);
                this.ctx.lineTo(i, this.height);
                this.ctx.stroke();
            }
            
            // Add some dojo decorations
            
            // Banner 1
            this.ctx.fillStyle = '#942222';
            this.ctx.fillRect(this.width * 0.3, 50, 100, 60);
            this.ctx.strokeStyle = 'black';
            this.ctx.strokeRect(this.width * 0.3, 50, 100, 60);
            this.ctx.fillStyle = 'white';
            this.ctx.font = '20px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('勇気', this.width * 0.3 + 50, 85);
            
            // Banner 2
            this.ctx.fillStyle = '#223a94';
            this.ctx.fillRect(this.width * 0.6, 50, 100, 60);
            this.ctx.strokeStyle = 'black';
            this.ctx.strokeRect(this.width * 0.6, 50, 100, 60);
            this.ctx.fillStyle = 'white';
            this.ctx.font = '20px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('名誉', this.width * 0.6 + 50, 85);
            
            console.log("Fallback background drawn");
        } catch (e) {
            console.error("Error in drawFallbackBackground:", e);
            
            // Ultra-fallback - just draw a solid color
            try {
                this.ctx.fillStyle = 'black';
                this.ctx.fillRect(0, 0, this.width, this.height);
                
                // Ground line
                this.ctx.strokeStyle = 'white';
                this.ctx.lineWidth = 3;
                this.ctx.beginPath();
                this.ctx.moveTo(0, this.groundY);
                this.ctx.lineTo(this.width, this.groundY);
                this.ctx.stroke();
                
                console.log("Ultra-fallback background drawn");
            } catch (innerError) {
                console.error("Critical drawing error:", innerError);
            }
        }
    }
    
    stop() {
        console.log("Stopping game");
        
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        
        this.gameState = 'idle';
        console.log("Game stopped");
    }
    
    // Update AI info display element
    updateAIInfo(field, value) {
        if (!this.useAI) return;
        
        const aiInfo = document.getElementById('ai-info');
        const fieldElement = document.getElementById(`ai-${field}`);
        
        if (aiInfo && fieldElement) {
            // Make sure the AI info is displayed
            aiInfo.style.display = 'block';
            fieldElement.textContent = value;
        }
    }
    
    // Handle a knockout
    handleKO() {
        // Check if we're already ending the round
        if (this.gameState !== 'fighting') {
            return;
        }
        
        console.log("KO detected! Ending round");
        
        // Switch game state
        this.gameState = 'roundEnd';
        
        // Clear the timer
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        
        // Show KO announcement
        this.showAnnouncement('ko');
        
        // Determine the winner
        let winner;
        if (this.player1.health <= 0) {
            winner = 'player2';
            this.p2Wins++;
        } else {
            winner = 'player1';
            this.p1Wins++;
        }
        
        console.log(`Round winner: ${winner}`);
        
        // Set winner poses
        if (winner === 'player1') {
            this.player1.currentState = 'win';
            this.player2.currentState = 'lose';
        } else {
            this.player1.currentState = 'lose';
            this.player2.currentState = 'win';
        }
        
        // Call endRound to show victory screen after KO announcement
        setTimeout(() => {
            this.endRound(winner);
        }, 3000);
    }
    
    // Simplified UI drawing to ensure it's visible
    drawUI() {
        // Health bars are drawn in HTML, but we can add some game info
        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 20px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`Round ${this.currentRound}`, this.width / 2, 30);
        this.ctx.fillText(`Time: ${this.timeRemaining}`, this.width / 2, 60);
        
        if (window.DEBUG) {
            this.ctx.fillStyle = 'yellow';
            this.ctx.font = '12px Arial';
            this.ctx.textAlign = 'left';
            this.ctx.fillText(`Game State: ${this.gameState}`, 10, 20);
            this.ctx.fillText(`P1: ${this.player1 ? this.player1.name : 'None'}`, 10, 40);
            this.ctx.fillText(`P2: ${this.player2 ? this.player2.name : 'None'}`, 10, 60);
        }
    }
    
    // Helper method for consistent debug logging
    debugLog(...args) {
        if (window.DEBUG_MODE) {
            console.log(...args);
            
            // Update debug overlay if it exists
            if (typeof updateDebugInfo === 'function') {
                updateDebugInfo(args.join(' '));
            }
        }
    }
    
    // Connect UI elements to the game
    connect(elements) {
        console.log("Connecting UI elements:", elements);
        try {
            // Store references to UI elements
            this.uiElements = elements || {};
            
            // Connect health bars
            if (elements.healthP1) {
                this.healthBarP1 = elements.healthP1;
                console.log("Connected P1 health bar");
            }
            
            if (elements.healthP2) {
                this.healthBarP2 = elements.healthP2;
                console.log("Connected P2 health bar");
            }
            
            // Connect timer
            if (elements.timer) {
                this.timerElement = elements.timer;
                console.log("Connected timer element");
            }
            
            // Connect announcement elements
            if (elements.announcement) {
                this.announcementElement = elements.announcement;
                console.log("Connected announcement element");
            }
            
            if (elements.roundText) {
                this.roundTextElement = elements.roundText;
                console.log("Connected round text element");
            }
            
            if (elements.fightText) {
                this.fightTextElement = elements.fightText;
                console.log("Connected fight text element");
            }
            
            // Update health display immediately if players exist
            if (this.player1 && this.player2) {
                this.updateHealthDisplay();
            }
            
            return true;
        } catch (e) {
            console.error("Error connecting UI elements:", e);
            return false;
        }
    }
    
    // Handle when timer reaches zero
    handleTimeUp() {
        try {
            console.log("Time up - ending round");
            
            // Show time up announcement
            this.showAnnouncement('time');
            
            // Determine winner based on health
            let winner = null;
            
            if (this.player1.health > this.player2.health) {
                winner = this.player1;
                this.p1Wins++;
            } else if (this.player2.health > this.player1.health) {
                winner = this.player2;
                this.p2Wins++;
            } else {
                // It's a draw
                console.log("Round ended in a draw");
                this.showAnnouncement('draw');
            }
            
            // Log round result
            if (winner) {
                console.log(`Round ended due to time up. Winner: ${winner === this.player1 ? 'Player 1' : 'AI'}`);
            }
            
            // End the round after announcement
            setTimeout(() => {
                this.endRound(winner);
            }, 3000);
            
            return true;
        } catch (e) {
            console.error("Error handling time up:", e);
            return false;
        }
    }
} 