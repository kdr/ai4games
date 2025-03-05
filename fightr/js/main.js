// Define character data
const CHARACTERS = {
    ninja: {
        name: 'Ninja',
        speed: 6,
        jumpPower: 17,
        health: 90,
        maxHealth: 90
    },
    samurai: {
        name: 'Samurai',
        speed: 5,
        jumpPower: 15,
        health: 110,
        maxHealth: 110
    },
    monk: {
        name: 'Monk',
        speed: 5.5,
        jumpPower: 16,
        health: 100,
        maxHealth: 100
    },
    ronin: {
        name: 'Ronin',
        speed: 6,
        jumpPower: 14,
        health: 95,
        maxHealth: 95
    }
};

// Global Character class (emergency fallback if characters.js is missing)
if (typeof Character === 'undefined') {
    console.error("🔴 CHARACTER CLASS NOT FOUND - CREATING EMERGENCY CHARACTER CLASS");
    
    class Character {
        constructor(options) {
            this.name = options.name || 'unknown';
            this.x = options.x || 0;
            this.y = options.y || 0;
            this.width = options.width || 80;
            this.height = options.height || 150;
            this.facingRight = options.facingRight !== false;
            this.isFacingRight = this.facingRight; // For backwards compatibility
            this.speed = options.speed || 5;
            this.jumpPower = options.jumpPower || 15;
            this.health = options.health || 100;
            this.maxHealth = options.maxHealth || 100;
            this.color = options.color || '#' + Math.floor(Math.random()*16777215).toString(16);
            
            // Character state
            this.velocityX = 0;
            this.velocityY = 0;
            this.isJumping = false;
            this.isBlocking = false;
            this.isAttacking = false;
            this.currentAttack = null;
            this.attackCooldown = 0;
            
            // Sprites (empty placeholders)
            this.sprites = {
                idle: { frames: [], currentFrame: 0 },
                walk: { frames: [], currentFrame: 0 },
                jump: { frames: [], currentFrame: 0 },
                fall: { frames: [], currentFrame: 0 },
                punch: { frames: [], currentFrame: 0 },
                kick: { frames: [], currentFrame: 0 },
                special: { frames: [], currentFrame: 0 },
                block: { frames: [], currentFrame: 0 },
                hit: { frames: [], currentFrame: 0 },
                win: { frames: [], currentFrame: 0 },
                lose: { frames: [], currentFrame: 0 }
            };
            
            // Current animation state
            this.currentState = 'idle';
            
            console.error(`Created emergency Character: ${this.name}`);
        }
        
        update() {
            // Basic physics
            this.x += this.velocityX;
            this.y += this.velocityY;
            
            // Reduce attack cooldown
            if (this.attackCooldown > 0) this.attackCooldown--;
            
            return true;
        }
        
        draw(ctx) {
            // Draw character rectangle
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x - this.width/2, this.y - this.height, this.width, this.height);
            
            // Draw facing direction indicator
            ctx.fillStyle = this.facingRight ? 'green' : 'red';
            ctx.fillRect(
                this.facingRight ? (this.x + this.width/4) : (this.x - this.width/2), 
                this.y - this.height/2, 
                this.width/4, 
                this.height/10
            );
            
            // Draw name
            ctx.fillStyle = 'white';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(this.name.toUpperCase(), this.x, this.y - this.height - 10);
            
            // Draw state
            ctx.font = '12px Arial';
            ctx.fillText(this.currentState, this.x, this.y - this.height - 30);
            
            return true;
        }
        
        moveLeft() {
            this.velocityX = -this.speed;
            this.facingRight = false;
            this.isFacingRight = false;
            this.currentState = 'walk';
            return true;
        }
        
        moveRight() {
            this.velocityX = this.speed;
            this.facingRight = true;
            this.isFacingRight = true;
            this.currentState = 'walk';
            return true;
        }
        
        jump() {
            if (!this.isJumping) {
                this.velocityY = -this.jumpPower;
                this.isJumping = true;
                this.currentState = 'jump';
                return true;
            }
            return false;
        }
        
        punch() {
            if (this.attackCooldown <= 0 && !this.isAttacking) {
                this.isAttacking = true;
                this.currentAttack = 'punch';
                this.currentState = 'punch';
                this.attackCooldown = 30;
                setTimeout(() => {
                    this.isAttacking = false;
                    this.currentAttack = null;
                    this.currentState = 'idle';
                }, 500);
                return true;
            }
            return false;
        }
        
        kick() {
            if (this.attackCooldown <= 0 && !this.isAttacking) {
                this.isAttacking = true;
                this.currentAttack = 'kick';
                this.currentState = 'kick';
                this.attackCooldown = 45;
                setTimeout(() => {
                    this.isAttacking = false;
                    this.currentAttack = null;
                    this.currentState = 'idle';
                }, 600);
                return true;
            }
            return false;
        }
        
        special() {
            if (this.attackCooldown <= 0 && !this.isAttacking) {
                this.isAttacking = true;
                this.currentAttack = 'special';
                this.currentState = 'special';
                this.attackCooldown = 60;
                setTimeout(() => {
                    this.isAttacking = false;
                    this.currentAttack = null;
                    this.currentState = 'idle';
                }, 800);
                return true;
            }
            return false;
        }
        
        block() {
            this.isBlocking = true;
            this.currentState = 'block';
            return true;
        }
        
        stopBlock() {
            this.isBlocking = false;
            this.currentState = 'idle';
            return true;
        }
        
        takeDamage(amount) {
            // Reduce damage if blocking
            const actualDamage = this.isBlocking ? Math.ceil(amount / 2) : amount;
            
            this.health -= actualDamage;
            if (this.health < 0) this.health = 0;
            
            // Update health bar if available
            if (this.healthElement) {
                const healthPercent = (this.health / this.maxHealth) * 100;
                this.healthElement.style.width = `${healthPercent}%`;
            }
            
            this.currentState = 'hit';
            setTimeout(() => {
                if (this.currentState === 'hit') this.currentState = 'idle';
            }, 300);
            
            return this.health <= 0; // Return true if KO'd
        }
        
        getAttackBox() {
            // Different hitbox sizes based on attack type
            let width = this.width * 0.5;
            let height = this.height * 0.3;
            let offsetX = this.facingRight ? this.width * 0.6 : -this.width * 0.6;
            let offsetY = -this.height * 0.5;
            
            if (this.currentAttack === 'kick') {
                width = this.width * 0.6;
                offsetY = -this.height * 0.3;
            } else if (this.currentAttack === 'special') {
                width = this.width * 0.8;
                height = this.height * 0.5;
            }
            
            return {
                x: this.x + offsetX - width / 2,
                y: this.y + offsetY - height / 2,
                width: width,
                height: height
            };
        }
        
        reset(x, y) {
            this.x = x;
            this.y = y;
            this.velocityX = 0;
            this.velocityY = 0;
            this.isJumping = false;
            this.isBlocking = false;
            this.isAttacking = false;
            this.currentAttack = null;
            this.attackCooldown = 0;
            this.currentState = 'idle';
            this.health = this.maxHealth;
            
            // Update health bar if available
            if (this.healthElement) {
                this.healthElement.style.width = '100%';
            }
            
            return true;
        }
    }
    
    // Make globally available
    window.Character = Character;
}

// Debug mode settings
const DEBUG_MODE = true;

// Enable debug mode to show hitboxes and extra information
window.DEBUG = true;

// Validate that the Character class exists and works properly
function validateCharacterClass() {
    console.error("Validating Character class...");
    
    if (typeof Character !== 'function') {
        console.error("Character class is not defined!");
        return false;
    }
    
    try {
        // Create a test instance
        const testChar = new Character({
            name: 'test',
            x: 100,
            y: 100,
            width: 50,
            height: 100,
            facingRight: true
        });
        
        // Check for essential methods
        const requiredMethods = ['update', 'draw', 'takeDamage'];
        for (const method of requiredMethods) {
            if (typeof testChar[method] !== 'function') {
                console.error(`Character is missing required method: ${method}`);
                return false;
            }
        }
        
        console.error("Character class validation successful");
        return true;
    } catch (e) {
        console.error("Error validating Character class:", e);
        return false;
    }
}

// Game instance
let game = null;

// Define global initGame function that can be accessed from anywhere
window.initGame = function() {
    console.error("GLOBAL initGame function called");
    
    // Check if game canvas exists
    const canvas = document.getElementById('game-canvas');
    if (!canvas) {
        console.error("Game canvas not found!");
        alert("Critical error: Game canvas not found!");
        return null;
    }
    
    // Make sure canvas is visible
    canvas.style.display = 'block';
    canvas.style.border = '2px solid red';
    canvas.style.background = 'black';
    
    try {
        console.error("Creating new FightGame instance");
        // Initialize the fight game with the canvas
        const game = new FightGame(canvas, true); // true enables AI
        
        // Store a global reference to the game
        window.game = game;
        
        // Connect UI elements
        game.connect({
            healthP1: document.getElementById('p1-health'),
            healthP2: document.getElementById('p2-health'),
            timer: document.querySelector('.timer'),
            announcement: document.getElementById('round-announcement'),
            roundText: document.getElementById('round-text'),
            fightText: document.getElementById('fight-text')
        });
        
        // Return the game instance
        console.error("Game instance created successfully");
        return game;
    } catch (e) {
        console.error("Error initializing game:", e);
        alert("Failed to initialize game: " + e.message);
        return null;
    }
};

// Wait for DOM to load
try {
    document.addEventListener('DOMContentLoaded', () => {
        try {
            console.log('DOM loaded, initializing game...');
            
            // Check for Character class first
            const characterValid = validateCharacterClass();
            if (!characterValid) {
                console.error("Using emergency Character implementation instead");
            }
            
            // FORCE SPRITE GENERATION - Ensure this happens first
            if (typeof generateAllSprites === 'function') {
                console.log('Generating sprites immediately');
                try {
                    generateAllSprites();
                } catch (e) {
                    console.error('Error generating sprites', e);
                    if (typeof showErrorOverlay === 'function') {
                        showErrorOverlay("Sprite Generation Error", e.stack, "Error generating game sprites");
                    } else {
                        alert('Error generating sprites: ' + e.message);
                    }
                }
            } else {
                console.error('generateAllSprites function not available!');
                alert('Error: Sprite generation function not found!');
            }
            
            // Get DOM elements
            const startBtn = document.getElementById('start-btn');
            console.log("Start button found:", startBtn);
            const fightBtn = document.getElementById('fight-btn');
            const rematchBtn = document.getElementById('rematch-btn');
            const characterSelectBtn = document.getElementById('character-select-btn');
            const controlsBtn = document.getElementById('controls-btn');
            const closeControlsBtn = document.getElementById('close-controls');
            const controlsOverlay = document.getElementById('controls-overlay');
            const characterElements = document.querySelectorAll('.character');
            const p1Selection = document.getElementById('p1-selection');
            const p2Selection = document.getElementById('p2-selection');
            const canvas = document.getElementById('game-canvas');
            
            // Create debug overlay if in debug mode
            if (DEBUG_MODE) {
                createDebugOverlay();
            }
            
            // Function to create debug overlay
            function createDebugOverlay() {
                const debugOverlay = document.createElement('div');
                debugOverlay.id = 'debug-overlay';
                debugOverlay.style.position = 'fixed';
                debugOverlay.style.top = '50px';
                debugOverlay.style.right = '10px';
                debugOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
                debugOverlay.style.color = 'white';
                debugOverlay.style.padding = '10px';
                debugOverlay.style.borderRadius = '5px';
                debugOverlay.style.zIndex = '1000';
                debugOverlay.style.maxWidth = '300px';
                debugOverlay.style.maxHeight = '400px';
                debugOverlay.style.overflowY = 'auto';
                debugOverlay.style.fontFamily = 'monospace';
                debugOverlay.style.fontSize = '12px';
                
                // Add title
                const title = document.createElement('h3');
                title.textContent = 'Debug Controls';
                title.style.margin = '0 0 10px 0';
                debugOverlay.appendChild(title);
                
                // Add attack test buttons
                const attackTitle = document.createElement('p');
                attackTitle.textContent = 'Manual Attack Triggers:';
                attackTitle.style.margin = '10px 0 5px 0';
                attackTitle.style.fontWeight = 'bold';
                debugOverlay.appendChild(attackTitle);
                
                const testAttackButtons = document.createElement('div');
                
                const punchBtn = document.createElement('button');
                punchBtn.textContent = 'Test Punch';
                punchBtn.addEventListener('click', () => {
                    if (window.game && window.game.player1) {
                        const result = window.game.player1.punch();
                        updateDebugInfo(`Manual punch: ${result ? 'SUCCESS' : 'FAILED'}`);
                    } else {
                        updateDebugInfo('Game or player not available');
                    }
                });
                
                const kickBtn = document.createElement('button');
                kickBtn.textContent = 'Test Kick';
                kickBtn.addEventListener('click', () => {
                    if (window.game && window.game.player1) {
                        const result = window.game.player1.kick();
                        updateDebugInfo(`Manual kick: ${result ? 'SUCCESS' : 'FAILED'}`);
                    } else {
                        updateDebugInfo('Game or player not available');
                    }
                });
                
                const specialBtn = document.createElement('button');
                specialBtn.textContent = 'Test Special';
                specialBtn.addEventListener('click', () => {
                    if (window.game && window.game.player1) {
                        const result = window.game.player1.special();
                        updateDebugInfo(`Manual special: ${result ? 'SUCCESS' : 'FAILED'}`);
                    } else {
                        updateDebugInfo('Game or player not available');
                    }
                });
                
                // Button styling
                [punchBtn, kickBtn, specialBtn].forEach(btn => {
                    btn.style.margin = '5px 5px 5px 0';
                    btn.style.padding = '5px 10px';
                    btn.style.backgroundColor = '#4CAF50';
                    btn.style.border = 'none';
                    btn.style.borderRadius = '3px';
                    btn.style.color = 'white';
                    btn.style.cursor = 'pointer';
                    testAttackButtons.appendChild(btn);
                });
                
                debugOverlay.appendChild(testAttackButtons);
                
                // Add asset checker
                const assetTitle = document.createElement('p');
                assetTitle.textContent = 'Asset Status:';
                assetTitle.style.margin = '10px 0 5px 0';
                assetTitle.style.fontWeight = 'bold';
                debugOverlay.appendChild(assetTitle);
                
                const checkAssetsBtn = document.createElement('button');
                checkAssetsBtn.textContent = 'Check Assets';
                checkAssetsBtn.style.margin = '5px 0';
                checkAssetsBtn.style.padding = '5px 10px';
                checkAssetsBtn.style.backgroundColor = '#2196F3';
                checkAssetsBtn.style.border = 'none';
                checkAssetsBtn.style.borderRadius = '3px';
                checkAssetsBtn.style.color = 'white';
                checkAssetsBtn.style.cursor = 'pointer';
                
                checkAssetsBtn.addEventListener('click', () => {
                    let assetStatus = 'Asset Status:\n';
                    
                    if (!window.gameAssets) {
                        assetStatus += '- gameAssets object not found\n';
                    } else {
                        // Check key assets
                        assetStatus += `- dojo_bg.png: ${window.gameAssets['dojo_bg.png'] ? 'LOADED' : 'MISSING'}\n`;
                        
                        // Check character portraits
                        const characters = ['ninja', 'samurai', 'monk', 'ronin'];
                        characters.forEach(char => {
                            assetStatus += `- ${char}_portrait.png: ${window.gameAssets[`${char}_portrait.png`] ? 'LOADED' : 'MISSING'}\n`;
                        });
                        
                        // Check sprites
                        if (window.game && window.game.player1) {
                            const p1 = window.game.player1;
                            assetStatus += `\nPlayer 1 (${p1.name}) Sprites:\n`;
                            
                            for (const state in p1.sprites) {
                                const loaded = p1.sprites[state].image && p1.sprites[state].image.complete;
                                assetStatus += `- ${state}: ${loaded ? 'LOADED' : 'MISSING'}\n`;
                            }
                        }
                    }
                    
                    // Force regenerate assets
                    const regenerateBtn = document.createElement('button');
                    regenerateBtn.textContent = 'Regenerate All Assets';
                    regenerateBtn.style.margin = '5px 0';
                    regenerateBtn.style.padding = '5px 10px';
                    regenerateBtn.style.backgroundColor = '#F44336';
                    regenerateBtn.style.border = 'none';
                    regenerateBtn.style.borderRadius = '3px';
                    regenerateBtn.style.color = 'white';
                    regenerateBtn.style.cursor = 'pointer';
                    
                    regenerateBtn.addEventListener('click', () => {
                        if (window.generateAllSprites) {
                            window.generateAllSprites();
                            updateDebugInfo('Regenerated all sprites');
                        } else {
                            updateDebugInfo('generateAllSprites function not available');
                        }
                    });
                    
                    updateDebugInfo(assetStatus);
                    
                    const assetActions = document.createElement('div');
                    assetActions.appendChild(regenerateBtn);
                    debugOverlay.appendChild(assetActions);
                });
                
                debugOverlay.appendChild(checkAssetsBtn);
                
                // Add message log section
                const logTitle = document.createElement('p');
                logTitle.textContent = 'Debug Log:';
                logTitle.style.margin = '10px 0 5px 0';
                logTitle.style.fontWeight = 'bold';
                debugOverlay.appendChild(logTitle);
                
                const logContainer = document.createElement('div');
                logContainer.id = 'debug-log';
                logContainer.style.maxHeight = '150px';
                logContainer.style.overflowY = 'auto';
                logContainer.style.padding = '5px';
                logContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.3)';
                logContainer.style.borderRadius = '3px';
                debugOverlay.appendChild(logContainer);
                
                document.body.appendChild(debugOverlay);
                
                return debugOverlay;
            }
            
            // Character selection state
            let p1Character = null;
            let p2Character = null;
            const availableCharacters = ['ninja', 'samurai', 'monk', 'ronin'];
            
            // Initialize game
            function initGame() {
                try {
                    console.error('DETAILED GAME INITIALIZATION');
                    
                    // Find the canvas with correct ID "game-canvas"
                    const canvas = document.getElementById('game-canvas');
                    console.error('Canvas element:', canvas);
                    
                    if (!canvas) {
                        console.error('Canvas element not found! Make sure "game-canvas" exists in HTML.');
                        
                        // Create a notification banner for better visibility of error
                        const errorNotice = document.createElement('div');
                        errorNotice.style.position = 'fixed';
                        errorNotice.style.top = '50%';
                        errorNotice.style.left = '50%';
                        errorNotice.style.transform = 'translate(-50%, -50%)';
                        errorNotice.style.background = 'red';
                        errorNotice.style.color = 'white';
                        errorNotice.style.padding = '20px';
                        errorNotice.style.borderRadius = '10px';
                        errorNotice.style.zIndex = '1000';
                        errorNotice.textContent = 'Canvas with ID "game-canvas" not found! Please check HTML structure.';
                        document.body.appendChild(errorNotice);
                        
                        // Show the actual DOM structure for debugging
                        console.error('DOM structure:');
                        console.error(document.body.innerHTML);
                        
                        return null;
                    }
                    
                    // Log canvas dimensions
                    console.error(`Canvas found with dimensions: ${canvas.width}x${canvas.height}`);
                    
                    // Set canvas dimensions explicitly
                    canvas.width = 800;
                    canvas.height = 450;
                    
                    // Make canvas visible and prominent
                    canvas.style.border = '3px solid red';
                    canvas.style.background = '#000';
                    canvas.style.display = 'block';
                    
                    // Check if canvas context can be obtained
                    let ctx;
                    try {
                        ctx = canvas.getContext('2d');
                        if (!ctx) {
                            throw new Error('Could not get 2D context from canvas');
                        }
                        console.error('Canvas 2D context acquired successfully');
                        
                        // Test drawing something to the canvas
                        ctx.fillStyle = 'green';
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                        console.error('Test rectangle drawn to canvas');
                    } catch (e) {
                        console.error('Error getting canvas context:', e);
                        return null;
                    }
                    
                    // Create game instance
                    console.error('Creating game instance with canvas:', canvas);
                    
                    let gameInstance;
                    try {
                        gameInstance = new FightGame(canvas, true);
                        console.error('FightGame constructor completed successfully');
                    } catch (e) {
                        console.error('ERROR IN FIGHTGAME CONSTRUCTOR:', e);
                        alert('Error creating game: ' + e.message);
                        return null;
                    }
                    
                    // Make game globally accessible for debugging
                    window.game = gameInstance;
                    
                    console.error('Game initialized successfully:', gameInstance);
                    
                    // Add debugging event for key monitoring if in debug mode
                    if (DEBUG_MODE) {
                        window.addEventListener('keydown', (e) => {
                            console.error(`Key pressed: ${e.key}`);
                            updateDebugInfo(`Key pressed: ${e.key}`);
                        });
                    }
                    
                    return gameInstance;
                } catch (e) {
                    console.error('CRITICAL ERROR IN GAME INITIALIZATION:', e);
                    alert('Critical error initializing game: ' + e.message);
                    return null;
                }
            }
            
            // Show a specific screen
            function showScreen(screenId) {
                console.log(`Showing screen: ${screenId}`);
                document.querySelectorAll('.screen').forEach(screen => {
                    screen.classList.remove('active');
                });
                document.getElementById(screenId).classList.add('active');
            }
            
            // Update debug info
            function updateDebugInfo(message) {
                if (!DEBUG_MODE) return;
                
                console.log(`DEBUG: ${message}`);
                
                const debugDiv = document.getElementById('debug-overlay');
                if (debugDiv) {
                    const timestamp = new Date().toLocaleTimeString();
                    const msgElement = document.createElement('div');
                    msgElement.textContent = `[${timestamp}] ${message}`;
                    
                    debugDiv.appendChild(msgElement);
                    debugDiv.scrollTop = debugDiv.scrollHeight;
                    
                    // Limit to last 10 messages
                    while (debugDiv.childElementCount > 10) {
                        debugDiv.removeChild(debugDiv.firstChild);
                    }
                }
            }
            
            // Reset character selection
            function resetCharacterSelection() {
                // Reset selections
                p1Character = null;
                p2Character = null;
                
                // Clear selection displays
                p1Selection.innerHTML = '<span class="character-name">Select a character</span>';
                p2Selection.innerHTML = '<span class="character-name">AI will select...</span>';
                
                // Reset selection highlights
                document.querySelectorAll('.character').forEach(el => {
                    el.classList.remove('selected');
                });
                
                // Reset highlighting
                document.querySelector('.player-info:first-child h3').style.color = '#ff3019';
                document.querySelector('.player-info:last-child h3').style.color = '#333';
                
                // Disable fight button
                fightBtn.disabled = true;
                
                updateDebugInfo('Character selection reset');
            }
            
            // Event Listeners
            
            // Custom event for automatic return to character selection
            document.addEventListener('returnToCharacterSelect', () => {
                updateDebugInfo('Auto-returning to character selection');
                resetCharacterSelection();
            });
            
            // Start Game button (on title screen)
            startBtn.addEventListener('click', () => {
                console.log("Start button clicked!");
                
                // Check if elements exist
                const characterSelectScreen = document.getElementById('character-select');
                if (!characterSelectScreen) {
                    console.error("Character select screen element not found with ID 'character-select'");
                    alert("Error: Character select screen not found!");
                    return;
                }
                
                // Try alternative approach with direct DOM manipulation
                document.querySelectorAll('.screen').forEach(screen => {
                    console.log(`Hiding screen: ${screen.id}`);
                    screen.style.display = 'none'; 
                    screen.classList.remove('active');
                });
                
                console.log("Displaying character select screen");
                characterSelectScreen.style.display = 'flex';
                characterSelectScreen.classList.add('active');
                
                // Call the showScreen function as well (belt and suspenders)
                showScreen('character-select');
                resetCharacterSelection();
                
                // Update UI to show Player 2 is AI
                document.querySelector('.player-info:last-child h3').textContent = 'AI OPPONENT';
                updateDebugInfo('Game started, character selection screen active');
            });
            
            // Add a direct button click for debugging
            console.log("Setting up direct click handler on start button");
            document.getElementById('start-btn')?.onclick = function() {
                console.log("Start button direct onclick fired!");
                document.getElementById('title-screen')?.classList.remove('active');
                document.getElementById('character-select')?.classList.add('active');
            };
            
            // Character selection
            characterElements.forEach(charElement => {
                charElement.addEventListener('click', () => {
                    const character = charElement.getAttribute('data-character');
                    
                    // Remove previous selection
                    document.querySelectorAll('.character').forEach(el => {
                        el.classList.remove('selected');
                    });
                    
                    // Add new selection
                    charElement.classList.add('selected');
                    
                    // Set player 1's character
                    p1Character = character;
                    p1Selection.innerHTML = `
                        <img src="assets/${character}_portrait.png" alt="${character}">
                        <span class="character-name">${CHARACTERS[character].name}</span>
                    `;
                    
                    updateDebugInfo(`Player 1 selected ${CHARACTERS[character].name}`);
                    
                    // Randomly select AI character (different from player 1)
                    let availableAICharacters = availableCharacters.filter(char => char !== character);
                    p2Character = availableAICharacters[Math.floor(Math.random() * availableAICharacters.length)];
                    
                    // Update AI character display
                    p2Selection.innerHTML = `
                        <img src="assets/${p2Character}_portrait.png" alt="${p2Character}">
                        <span class="character-name">${CHARACTERS[p2Character].name}</span>
                    `;
                    
                    updateDebugInfo(`AI selected ${CHARACTERS[p2Character].name}`);
                    
                    // Highlight AI's chosen character in the grid after a delay
                    setTimeout(() => {
                        document.querySelector(`.character[data-character="${p2Character}"]`).classList.add('selected');
                        
                        // Enable fight button
                        fightBtn.disabled = false;
                    }, 1000);
                });
            });
            
            // Fight button (on character select screen)
            fightBtn.addEventListener('click', () => {
                try {
                    console.error("FIGHT BUTTON CLICKED - DETAILED DEBUG");
                    console.error("p1Character:", p1Character);
                    console.error("p2Character:", p2Character);
                    
                    if (!p1Character || !p2Character) {
                        console.error("Characters not selected!");
                        return;
                    }
                    
                    // Debug: Check screen visibility before
                    document.querySelectorAll('.screen').forEach(screen => {
                        console.error(`Before transition - Screen ${screen.id}: active=${screen.classList.contains('active')}, display=${window.getComputedStyle(screen).display}`);
                    });
                    
                    // Try multiple approaches to show battle screen
                    try {
                        // Approach 1: showScreen function
                        console.error("Showing battle screen - Approach 1");
                        showScreen('battle-screen');
                    } catch (e) {
                        console.error("Error in showScreen:", e);
                    }
                    
                    // Approach 2: Direct DOM manipulation
                    try {
                        console.error("Showing battle screen - Approach 2");
                        document.querySelectorAll('.screen').forEach(s => {
                            s.style.display = 'none';
                            s.classList.remove('active');
                        });
                        
                        const battleScreen = document.getElementById('battle-screen');
                        if (battleScreen) {
                            battleScreen.style.display = 'flex';
                            battleScreen.classList.add('active');
                            console.error("Battle screen element found and displayed");
                        } else {
                            console.error("Battle screen element NOT FOUND!");
                        }
                    } catch (e) {
                        console.error("Error in direct DOM manipulation:", e);
                    }
                    
                    // Debug: Check screen visibility after
                    document.querySelectorAll('.screen').forEach(screen => {
                        console.error(`After transition - Screen ${screen.id}: active=${screen.classList.contains('active')}, display=${window.getComputedStyle(screen).display}`);
                    });
                    
                    // Initialize the game if not already done
                    if (!game) {
                        console.error("Creating new game instance");
                        try {
                            game = initGame();
                            console.error("Game initialization result:", game ? "SUCCESS" : "FAILED");
                        } catch (e) {
                            console.error("ERROR CREATING GAME:", e);
                            alert("Error initializing game: " + e.message);
                            return;
                        }
                    } else {
                        console.error("Using existing game instance");
                    }
                    
                    if (game) {
                        // Set players and start the game with error handling
                        console.error(`Starting game with players: ${p1Character} vs ${p2Character}`);
                        
                        try {
                            console.error("Setting players");
                            game.setPlayers(p1Character, p2Character);
                        } catch (e) {
                            console.error("ERROR SETTING PLAYERS:", e);
                            alert("Error setting players: " + e.message);
                            return;
                        }
                        
                        try {
                            console.error("Starting game");
                            game.start();
                            console.error("Game.start() completed");
                            
                            // Force an update to ensure the game is rendered
                            setTimeout(() => {
                                console.error("Forcing game update after delay");
                                if (game && game.draw) {
                                    game.draw();
                                    console.error("Forced draw complete");
                                }
                            }, 500);
                        } catch (e) {
                            console.error("ERROR STARTING GAME:", e);
                            alert("Error starting game: " + e.message);
                            return;
                        }
                        
                        updateDebugInfo(`Fight started: ${CHARACTERS[p1Character].name} vs ${CHARACTERS[p2Character].name}`);
                    } else {
                        console.error("Game initialization failed!");
                        alert("Could not start game. See console for details.");
                    }
                } catch (e) {
                    console.error("CRITICAL ERROR IN FIGHT BUTTON HANDLER:", e);
                    alert("Critical error starting game: " + e.message);
                }
            });
            
            // Character select button (on victory screen) - just as a backup in case auto-transition isn't working
            characterSelectBtn.addEventListener('click', () => {
                if (game) {
                    game.stop();
                }
                
                showScreen('character-select');
                resetCharacterSelection();
                updateDebugInfo('Manually returned to character selection');
            });
            
            // Hide rematch button since we're not using it anymore
            if (rematchBtn) {
                rematchBtn.style.display = 'none';
            }
            
            // Controls button
            controlsBtn.addEventListener('click', () => {
                controlsOverlay.style.display = 'flex';
                updateDebugInfo('Controls overlay opened');
            });
            
            // Close controls button
            closeControlsBtn.addEventListener('click', () => {
                controlsOverlay.style.display = 'none';
                updateDebugInfo('Controls overlay closed');
            });
            
            // Initial screen setup - ensure start screen is shown
            showScreen('start-screen');
            updateDebugInfo('Game initialized, showing start screen');
        } catch (err) {
            console.error("Error in DOMContentLoaded handler:", err);
            alert("Initialization error: " + err.message);
        }
    });
} catch (err) {
    console.error("Error setting up DOMContentLoaded listener:", err);
    alert("Critical error setting up event listeners: " + err.message);
}

// Create placeholder assets while we don't have real images
function createPlaceholderAssets() {
    console.log('Setting up game assets and sprites...');
    // This is now handled by sprites.js
    // We're keeping this function for compatibility
    
    // Make sure we really generate all the sprites
    if (window.generateAllSprites) {
        window.generateAllSprites();
    }
    
    updateDebugInfo('Sprite assets initialized');
}

function getCharacterColor(character) {
    const colorMap = {
        ninja: '#3498db',    // Blue
        samurai: '#e74c3c',  // Red
        monk: '#f1c40f',     // Yellow
        ronin: '#2ecc71'     // Green
    };
    return colorMap[character] || '#999';
}

function createPlaceholderImage(name, width, height, bgColor) {
    console.log(`Creating placeholder image for: ${name}`);
    // This is now handled by sprites.js
    // We'll just make sure the asset exists in window.gameAssets
    
    if (!window.gameAssets) {
        window.gameAssets = {};
    }
    
    // If we don't already have this asset, create a simple one
    if (!window.gameAssets[name]) {
        // Create a simple canvas-based placeholder
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, width, height);
        
        const img = new Image();
        img.src = canvas.toDataURL('image/png');
        window.gameAssets[name] = img;
    }
    
    return window.gameAssets[name];
}

// Add debug toggle button
const debugBtn = document.createElement('button');
debugBtn.id = 'debugBtn';
debugBtn.className = 'debug-btn';
debugBtn.textContent = 'Toggle Debug Mode';
debugBtn.style.position = 'absolute';
debugBtn.style.top = '10px';
debugBtn.style.right = '10px';
debugBtn.style.zIndex = '1000';
debugBtn.style.padding = '5px 10px';
debugBtn.style.backgroundColor = '#666';
debugBtn.style.color = 'white';
debugBtn.style.border = 'none';
debugBtn.style.borderRadius = '5px';
debugBtn.style.cursor = 'pointer';
document.body.appendChild(debugBtn);

debugBtn.addEventListener('click', function() {
    window.DEBUG = !window.DEBUG;
    console.log(`Debug mode ${window.DEBUG ? 'enabled' : 'disabled'}`);
    debugBtn.style.backgroundColor = window.DEBUG ? '#4CAF50' : '#666';
});

// Add a manual sprite generator button
const spriteGenBtn = document.createElement('button');
spriteGenBtn.id = 'spriteGenBtn';
spriteGenBtn.className = 'debug-btn';
spriteGenBtn.textContent = 'Generate Sprites';
spriteGenBtn.style.position = 'absolute';
spriteGenBtn.style.top = '10px';
spriteGenBtn.style.right = '160px';
spriteGenBtn.style.zIndex = '1000';
spriteGenBtn.style.padding = '5px 10px';
spriteGenBtn.style.backgroundColor = '#2196F3';
spriteGenBtn.style.color = 'white';
spriteGenBtn.style.border = 'none';
spriteGenBtn.style.borderRadius = '5px';
spriteGenBtn.style.cursor = 'pointer';
document.body.appendChild(spriteGenBtn);

spriteGenBtn.addEventListener('click', function() {
    if (window.generateAllSprites) {
        console.log("Manually regenerating all sprites...");
        window.generateAllSprites();
        
        // Log assets after generation
        setTimeout(() => {
            console.log("Current gameAssets:", window.gameAssets);
        }, 500);
    } else {
        console.error("generateAllSprites function not available");
    }
});

// Export initGame to the global scope to ensure it's accessible from anywhere
console.log("Exporting initGame function to global scope");
window.initGame = initGame;
console.log("initGame exported successfully:", typeof window.initGame === 'function' ? 'Function available' : 'Export failed'); 