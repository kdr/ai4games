// Wait for DOM to load
document.addEventListener('DOMContentLoaded', () => {
    // Get DOM elements
    const startBtn = document.getElementById('start-btn');
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
    
    // Debug mode settings
    const DEBUG_MODE = true;
    
    // Create debug overlay if in debug mode
    if (DEBUG_MODE) {
        createDebugOverlay();
    }
    
    // Game instance
    let game = null;
    
    // Character selection state
    let p1Character = null;
    let p2Character = null;
    const availableCharacters = ['ninja', 'samurai', 'monk', 'ronin'];
    
    // Initialize game
    function initGame() {
        game = new FightGame(canvas, true); // Pass true to indicate Player 2 is AI
        
        // Add debugging event for key monitoring if in debug mode
        if (DEBUG_MODE) {
            window.addEventListener('keydown', (e) => {
                updateDebugInfo(`Key pressed: ${e.key}`);
            });
        }
    }
    
    // Show a specific screen
    function showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenId).classList.add('active');
    }
    
    // Create debug overlay
    function createDebugOverlay() {
        const debugDiv = document.createElement('div');
        debugDiv.id = 'debug-overlay';
        debugDiv.style.position = 'fixed';
        debugDiv.style.bottom = '10px';
        debugDiv.style.left = '10px';
        debugDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        debugDiv.style.color = '#0f0';
        debugDiv.style.padding = '10px';
        debugDiv.style.borderRadius = '5px';
        debugDiv.style.fontFamily = 'monospace';
        debugDiv.style.zIndex = '1000';
        debugDiv.style.maxHeight = '150px';
        debugDiv.style.overflowY = 'auto';
        debugDiv.style.maxWidth = '300px';
        
        // Add debug controls
        const endRoundBtn = document.createElement('button');
        endRoundBtn.textContent = 'End Round (Debug)';
        endRoundBtn.style.backgroundColor = '#ff3019';
        endRoundBtn.style.color = 'white';
        endRoundBtn.style.border = 'none';
        endRoundBtn.style.padding = '5px';
        endRoundBtn.style.marginTop = '10px';
        endRoundBtn.style.borderRadius = '3px';
        endRoundBtn.style.cursor = 'pointer';
        endRoundBtn.addEventListener('click', () => {
            if (game && game.state === 'fighting') {
                updateDebugInfo('Debug: Forcing round end');
                // Force player 2 to lose this round
                game.player2.health = 0;
                game.showAnnouncement('ko');
            }
        });
        
        debugDiv.appendChild(endRoundBtn);
        document.body.appendChild(debugDiv);
    }
    
    // Update debug information
    function updateDebugInfo(message) {
        if (!DEBUG_MODE) return;
        
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
    
    // Event Listeners
    
    // Custom event for automatic return to character selection
    document.addEventListener('returnToCharacterSelect', () => {
        updateDebugInfo('Auto-returning to character selection');
        resetCharacterSelection();
    });
    
    // Start Game button (on title screen)
    startBtn.addEventListener('click', () => {
        showScreen('character-select');
        resetCharacterSelection();
        
        // Update UI to show Player 2 is AI
        document.querySelector('.player-info:last-child h3').textContent = 'AI OPPONENT';
        updateDebugInfo('Game started, character selection screen active');
    });
    
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
    
    // Fight button (on character select screen)
    fightBtn.addEventListener('click', () => {
        if (!p1Character || !p2Character) return;
        
        showScreen('battle-screen');
        updateDebugInfo('Battle started');
        
        // Initialize the game if not already done
        if (!game) {
            initGame();
        }
        
        // Set players and start the game
        game.setPlayers(p1Character, p2Character);
        game.start();
        
        updateDebugInfo(`Fight started: ${CHARACTERS[p1Character].name} vs ${CHARACTERS[p2Character].name}`);
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
    
    // Create placeholder assets while we don't have real images
    function createPlaceholderAssets() {
        // Create assets directory if it doesn't exist
        const characters = ['ninja', 'samurai', 'monk', 'ronin'];
        
        // Create dojo background placeholder (just for visual purposes)
        createPlaceholderImage('dojo_bg.png', 800, 600, '#222');
        
        // Create character portraits
        characters.forEach(char => {
            const color = getCharacterColor(char);
            createPlaceholderImage(`${char}_portrait.png`, 100, 100, color);
        });
        
        updateDebugInfo('Placeholder assets created');
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
        // This would normally create real image files
        // For this prototype, we'll just use the color-based placeholders
        // In a real implementation, you'd use actual image assets
    }
    
    // Initialize
    createPlaceholderAssets();
    updateDebugInfo('Game initialized');
}); 