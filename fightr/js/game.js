class FightGame {
    constructor(canvas, useAI = false) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
        
        // Game state
        this.state = 'inactive';  // inactive, selection, starting, fighting, roundOver, gameOver
        this.player1 = null;
        this.player2 = null;
        this.currentRound = 1;
        this.maxRounds = 1; // Changed to 1 round only
        this.p1Wins = 0;
        this.p2Wins = 0;
        this.timer = 90;  // 90 seconds per round
        this.timerInterval = null;
        
        // Game settings
        this.groundY = this.height - 50;  // Y position of the ground
        this.gravity = 0.8;
        this.boundaryPadding = 50;  // Characters can't go beyond this padding from edges
        
        // Animation frame
        this.animationFrameId = null;
        this.lastTime = 0;
        this.fps = 60;
        this.fpsInterval = 1000 / this.fps;
        
        // Input state
        this.keys = {};
        
        // AI settings
        this.useAI = useAI;
        this.aiActionTimer = 0;
        this.aiActionDelay = 30; // Frames between AI decisions
        this.aiActionChance = 0.7; // Chance of AI taking action when timer is up
        this.aiAggressiveness = 0.6; // 0 to 1, how aggressive the AI is
        this.aiDistancePreference = 200; // AI tries to maintain this distance
        
        this.setupEventListeners();
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
    
    setPlayers(character1, character2) {
        // Create player 1
        this.player1 = new Character({
            ...CHARACTERS[character1],
            x: 200,
            y: this.groundY - CHARACTERS[character1].height,
            isFacingRight: true
        });
        
        // Create player 2
        this.player2 = new Character({
            ...CHARACTERS[character2],
            x: 600,
            y: this.groundY - CHARACTERS[character2].height,
            isFacingRight: false
        });
    }
    
    start() {
        if (!this.player1 || !this.player2) {
            console.error('Players not set');
            return;
        }
        
        console.log("Starting new game");
        
        // Clear any existing timers
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        
        // Reset game state
        this.state = 'starting';
        this.currentRound = 1; // Not really used anymore but kept for compatibility
        
        // Reset AI state
        if (this.useAI) {
            this.aiActionTimer = 0;
        }
        
        // Reset player positions and states
        this.resetPlayers();
        
        // Reset timer
        this.timer = 90;
        this.updateTimerDisplay();
        
        // Show announcement
        this.showAnnouncement('round');
        
        // Start game loop
        this.lastTime = performance.now();
        this.animationFrameId = requestAnimationFrame((time) => this.gameLoop(time));
        
        console.log("Game started successfully");
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
        const announcement = document.getElementById('round-announcement');
        const roundText = document.getElementById('round-text');
        const fightText = document.getElementById('fight-text');
        
        // Always reset the display style
        announcement.style.display = 'block';
        
        if (type === 'round') {
            console.log("Showing ready announcement");
            roundText.textContent = 'GET READY';
            roundText.style.display = 'block';
            fightText.style.display = 'none';
            
            // After 2 seconds, show FIGHT! text
            setTimeout(() => {
                roundText.style.display = 'none';
                fightText.style.display = 'block';
                fightText.textContent = 'FIGHT!';
                
                // Start the actual fight after 1 more second
                setTimeout(() => {
                    announcement.style.display = 'none';
                    this.state = 'fighting';
                    
                    // Start round timer
                    this.startTimer();
                }, 1000);
            }, 2000);
        } else if (type === 'ko') {
            console.log("Showing K.O. announcement");
            roundText.style.display = 'none';
            fightText.textContent = 'K.O.!';
            fightText.style.display = 'block';
            
            // Clear after 2 seconds
            setTimeout(() => {
                announcement.style.display = 'none';
                this.endRound();
            }, 2000);
        } else if (type === 'timeout') {
            console.log("Showing TIME UP announcement");
            roundText.style.display = 'none';
            fightText.textContent = 'TIME UP!';
            fightText.style.display = 'block';
            
            // Clear after 2 seconds
            setTimeout(() => {
                announcement.style.display = 'none';
                this.endRound();
            }, 2000);
        }
    }
    
    startTimer() {
        clearInterval(this.timerInterval);
        
        this.timerInterval = setInterval(() => {
            this.timer--;
            this.updateTimerDisplay();
            
            if (this.timer <= 0) {
                clearInterval(this.timerInterval);
                this.showAnnouncement('timeout');
            }
        }, 1000);
    }
    
    updateTimerDisplay() {
        document.querySelector('.timer').textContent = this.timer;
    }
    
    handleInput() {
        if (this.state !== 'fighting') {
            console.log(`Not handling input because game state is ${this.state}`);
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
        
        if (this.keys['g']) {
            this.player1.punch();
        } else if (this.keys['h']) {
            this.player1.kick();
        } else if (this.keys['j']) {
            this.player1.special();
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
        if (this.state !== 'fighting') return;
        
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
        if (this.player1.x < this.boundaryPadding) {
            this.player1.x = this.boundaryPadding;
        } else if (this.player1.x > this.width - this.boundaryPadding) {
            this.player1.x = this.width - this.boundaryPadding;
        }
        
        if (this.player2.x < this.boundaryPadding) {
            this.player2.x = this.boundaryPadding;
        } else if (this.player2.x > this.width - this.boundaryPadding) {
            this.player2.x = this.width - this.boundaryPadding;
        }
    }
    
    checkCollisions() {
        // Check for attacks hitting
        const p1Hitbox = this.player1.getCurrentHitbox();
        const p2Hitbox = this.player2.getCurrentHitbox();
        
        // Debug - log hitbox info when an attack is made
        if (p1Hitbox) {
            console.log("Player 1 attack hitbox:", p1Hitbox);
        }
        
        if (p2Hitbox) {
            console.log("Player 2 attack hitbox:", p2Hitbox);
        }
        
        if (p1Hitbox) {
            // Check if player 1's attack hits player 2
            const p2X = this.player2.isFacingRight ? this.player2.x : this.player2.x - this.player2.width;
            
            const p2Bounds = {
                x: p2X,
                y: this.player2.y,
                width: this.player2.width,
                height: this.player2.height
            };
            
            console.log("Player 2 bounds:", p2Bounds);
            
            if (this.checkHitboxCollision(p1Hitbox, p2Bounds)) {
                console.log("Player 1 hit player 2!");
                
                // Player 2 is hit
                const isBlocked = this.player2.isBlocking && 
                                 this.player2.isGrounded && 
                                 ((this.player2.isFacingRight && p1Hitbox.x > p2X) || 
                                  (!this.player2.isFacingRight && p1Hitbox.x < p2X));
                
                this.player2.takeDamage(p1Hitbox.damage, isBlocked);
                this.updateHealthDisplay();
            }
        }
        
        if (p2Hitbox) {
            // Check if player 2's attack hits player 1
            const p1X = this.player1.isFacingRight ? this.player1.x : this.player1.x - this.player1.width;
            
            const p1Bounds = {
                x: p1X,
                y: this.player1.y,
                width: this.player1.width,
                height: this.player1.height
            };
            
            console.log("Player 1 bounds:", p1Bounds);
            
            if (this.checkHitboxCollision(p2Hitbox, p1Bounds)) {
                console.log("Player 2 hit player 1!");
                
                // Player 1 is hit
                const isBlocked = this.player1.isBlocking && 
                                 this.player1.isGrounded && 
                                 ((this.player1.isFacingRight && p2Hitbox.x > p1X) || 
                                  (!this.player1.isFacingRight && p2Hitbox.x < p1X));
                
                this.player1.takeDamage(p2Hitbox.damage, isBlocked);
                this.updateHealthDisplay();
            }
        }
    }
    
    checkHitboxCollision(hitbox1, hitbox2) {
        return (
            hitbox1.x < hitbox2.x + hitbox2.width &&
            hitbox1.x + hitbox1.width > hitbox2.x &&
            hitbox1.y < hitbox2.y + hitbox2.height &&
            hitbox1.y + hitbox1.height > hitbox2.y
        );
    }
    
    updateHealthDisplay() {
        // Update health bars
        const p1Health = document.getElementById('p1-health');
        const p2Health = document.getElementById('p2-health');
        
        // Calculate health percentages
        const p1Percent = (this.player1.health / this.player1.maxHealth) * 100;
        const p2Percent = (this.player2.health / this.player2.maxHealth) * 100;
        
        // Apply width as percentage
        p1Health.style.width = `${p1Percent}%`;
        p2Health.style.width = `${p2Percent}%`;
        
        console.log(`Health updated - P1: ${Math.round(p1Percent)}%, P2: ${Math.round(p2Percent)}%`);
    }
    
    endRound() {
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
        this.state = 'gameOver';
        
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
    
    drawBackground() {
        // Draw ground/floor
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(0, this.groundY, this.width, this.height - this.groundY);
        
        // Draw floor markings
        this.ctx.strokeStyle = '#555';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        
        // Center line
        this.ctx.moveTo(this.width / 2, this.groundY);
        this.ctx.lineTo(this.width / 2, this.height);
        
        // Side marks
        this.ctx.moveTo(this.width / 4, this.groundY);
        this.ctx.lineTo(this.width / 4, this.groundY + 20);
        
        this.ctx.moveTo(this.width * 3 / 4, this.groundY);
        this.ctx.lineTo(this.width * 3 / 4, this.groundY + 20);
        
        this.ctx.stroke();
    }
    
    draw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        // Draw background
        this.drawBackground();
        
        // Draw players
        this.player1.draw(this.ctx);
        this.player2.draw(this.ctx);
    }
    
    gameLoop(currentTime = 0) {
        // Request next frame first to ensure smooth animation
        this.animationFrameId = requestAnimationFrame((time) => this.gameLoop(time));
        
        // If the game is inactive or between rounds, only update minimal state
        if (this.state !== 'fighting' && this.state !== 'starting') {
            return;
        }
        
        const elapsed = currentTime - this.lastTime;
        
        if (elapsed > this.fpsInterval) {
            this.lastTime = currentTime - (elapsed % this.fpsInterval);
            
            this.handleInput();
            this.update();
            this.draw();
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
        
        this.state = 'inactive';
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
} 