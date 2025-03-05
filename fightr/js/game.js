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
        // Safety checks for AI attacks
        try {
            // Skip AI handling if game is not in fighting state
            if (this.gameState !== 'fighting') {
                return false;
            }
            
            // Safety check for player2
            if (!this.player2) {
                console.error("Can't handle AI: player2 not defined");
                return false;
            }
            
            // Check if the AI methods exist, and create them if they don't
            if (typeof this.player2.punch !== 'function') {
                console.error("AI player missing punch method - creating emergency implementation");
                this.player2.punch = function() {
                    console.log("Emergency AI punch called");
                    this.isAttacking = true;
                    this.attackType = 'punch';
                    this.attackFrame = 0;
                    return true;
                };
            }
            
            if (typeof this.player2.kick !== 'function') {
                console.error("AI player missing kick method - creating emergency implementation");
                this.player2.kick = function() {
                    console.log("Emergency AI kick called");
                    this.isAttacking = true;
                    this.attackType = 'kick';
                    this.attackFrame = 0;
                    return true;
                };
            }
            
            if (typeof this.player2.special !== 'function') {
                console.error("AI player missing special method - creating emergency implementation");
                this.player2.special = function() {
                    console.log("Emergency AI special called");
                    this.isAttacking = true;
                    this.attackType = 'special';
                    this.attackFrame = 0;
                    return true;
                };
            }
        } catch (e) {
            console.error("Error setting up AI attack methods:", e);
        }
        
        // Basic AI logic for Player 2
        // ... existing code ...
    }
    
    // Handle when timer reaches zero
    handleTimeUp() {
        try {
            console.log("Time up - ending round");
            
            // Show time up announcement
            this.showAnnouncement('time');
            
            // Determine winner based on health
            let timeWinner = null;
            
            if (this.player1.health > this.player2.health) {
                timeWinner = this.player1;
                this.p1Wins++;
            } else if (this.player2.health > this.player1.health) {
                timeWinner = this.player2;
                this.p2Wins++;
            } else {
                // Draw - player 1 wins by default
                timeWinner = this.player1;
                this.p1Wins++;
                this.showAnnouncement('draw');
                console.log("Draw - Player 1 wins by default");
            }
            
            // Log round result
            if (timeWinner) {
                console.log(`Round ended due to time up. Winner: ${timeWinner === this.player1 ? 'Player 1' : 'AI'}`);
            }
            
            // End the round after announcement
            setTimeout(() => {
                this.endRound(timeWinner);
            }, 3000);
            
            return true;
        } catch (e) {
            console.error("Error handling time up:", e);
            return false;
        }
    }
    
    // Handle displaying the round winner announcement
    displayRoundWinner(winner) {
        console.log(`Displaying round winner: ${winner}`);
        
        // Show round announcement
        const announcement = document.getElementById('round-announcement');
        const roundText = document.getElementById('round-text');
        const fightText = document.getElementById('fight-text');
        
        if (announcement && roundText) {
            // Set message text
            const winnerName = winner === 'p1' ? 'PLAYER 1' : 'AI OPPONENT';
            roundText.textContent = `${winnerName} WINS ROUND ${this.currentRound}!`;
            
            // Show announcement
            announcement.style.display = 'flex';
            roundText.style.display = 'block';
            
            // Hide fight text
            if (fightText) {
                fightText.style.display = 'none';
            }
            
            // Update round indicators
            this.updateRoundIndicators();
        }
    }
    
    // Start the next round
    startNextRound() {
        console.log("Starting next round");
        
        // Hide any announcements
        const announcement = document.getElementById('round-announcement');
        if (announcement) {
            announcement.style.display = 'none';
        }
        
        // Increment round counter
        this.currentRound++;
        
        // Reset player health and positions
        this.player1.health = this.player1.maxHealth;
        this.player2.health = this.player2.maxHealth;
        
        // Reset positions
        this.player1.x = this.width * 0.25;
        this.player2.x = this.width * 0.75;
        
        // Update health displays
        this.updateHealthDisplay();
        
        // Show round announcement and start the round
        this.showRoundAnnouncement();
    }
    
    // Add the method to handle showing end of match 
    endMatch(winner) {
        console.log(`Match ended. ${winner === 'p1' ? 'Player 1' : 'AI Opponent'} wins the match!`);
        
        // Hide round announcement if visible
        const announcement = document.getElementById('round-announcement');
        if (announcement) {
            announcement.style.display = 'none';
        }
        
        // Call endGame method to show victory screen
        this.endGame(winner);
    }
} 