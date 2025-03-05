// Initialize the game
try {
    console.log('Starting game initialization...');
    
    // First check if we're running on a server or file protocol
    if (window.location.protocol === 'file:') {
        console.warn('Running from file:// protocol. Sound may not work properly.');
        // Add a visible warning
        const gameContainer = document.getElementById('game-container');
        const warningEl = document.createElement('div');
        warningEl.style.position = 'absolute';
        warningEl.style.top = '10px';
        warningEl.style.left = '10px';
        warningEl.style.right = '10px';
        warningEl.style.backgroundColor = 'rgba(255, 50, 50, 0.9)';
        warningEl.style.color = 'white';
        warningEl.style.padding = '10px';
        warningEl.style.borderRadius = '5px';
        warningEl.style.zIndex = '1000';
        warningEl.style.textAlign = 'center';
        warningEl.innerHTML = `
            <strong>Warning:</strong> Game is running directly from files, not a web server.<br>
            Audio will not work properly in most browsers due to security restrictions.<br>
            <a href="troubleshoot.html" style="color: white; text-decoration: underline;">See the troubleshooting guide</a> for how to run on a local server.
        `;
        gameContainer.appendChild(warningEl);
        
        // Remove the warning after 10 seconds
        setTimeout(() => {
            if (warningEl.parentNode) {
                warningEl.parentNode.removeChild(warningEl);
            }
        }, 10000);
    }
    
    // Check if Phaser is available
    if (typeof Phaser === 'undefined') {
        throw new Error('Phaser library not loaded! Check the script tag in index.html');
    }
    
    // Check if config is available
    if (typeof config === 'undefined') {
        throw new Error('Game config not found! Check if config.js is loaded correctly');
    }
    
    // Check if scene classes are defined
    if (typeof BootScene === 'undefined') {
        throw new Error('BootScene class not found! Check if BootScene.js is loaded correctly');
    }
    
    if (typeof PreloadScene === 'undefined') {
        throw new Error('PreloadScene class not found! Check if PreloadScene.js is loaded correctly');
    }
    
    if (typeof TitleScene === 'undefined') {
        throw new Error('TitleScene class not found! Check if TitleScene.js is loaded correctly');
    }
    
    if (typeof GameScene === 'undefined') {
        throw new Error('GameScene class not found! Check if GameScene.js is loaded correctly');
    }
    
    console.log('All scene classes are defined, proceeding with game creation');
    console.log('Using config:', config);
    
    const game = new Phaser.Game(config);
    
    // Add this new code to show audio unlock screen
    setTimeout(() => {
        if (game.sound.context.state === 'suspended') {
            console.log('Audio context is suspended, showing unlock screen');
            if (GameDebug && GameDebug.unlockAudio) {
                GameDebug.unlockAudio(game);
            }
        }
    }, 1000);

    // Log scene status after a short delay to ensure initialization
    setTimeout(() => {
        if (GameDebug) {
            console.log('Game initialized, logging scene status:');
            GameDebug.logSceneStatus(game);
            
            // Test that assets are accessible
            console.log('Testing asset paths:');
            const testAssets = [
                'assets/images/loading-background.png',
                'assets/images/background.png',
                'assets/images/luigi.png'
            ];
            
            testAssets.forEach(assetPath => {
                const img = new Image();
                img.onload = () => console.log(`✓ Asset loaded successfully: ${assetPath}`);
                img.onerror = () => console.error(`✗ Failed to load asset: ${assetPath}`);
                img.src = assetPath;
            });
        }
    }, 1000);

    // Add event listeners for mobile devices
    if ('ontouchstart' in window) {
        // Create touch controls
        window.addEventListener('load', () => {
            const gameScene = game.scene.getScene('GameScene');
            
            if (gameScene) {
                // Left button
                const leftBtn = document.createElement('div');
                leftBtn.style.position = 'absolute';
                leftBtn.style.bottom = '20px';
                leftBtn.style.left = '20px';
                leftBtn.style.width = '60px';
                leftBtn.style.height = '60px';
                leftBtn.style.backgroundColor = 'rgba(255, 255, 255, 0.5)';
                leftBtn.style.borderRadius = '50%';
                leftBtn.style.display = 'flex';
                leftBtn.style.justifyContent = 'center';
                leftBtn.style.alignItems = 'center';
                leftBtn.innerHTML = '←';
                leftBtn.style.fontSize = '24px';
                leftBtn.style.userSelect = 'none';
                document.getElementById('game-container').appendChild(leftBtn);
                
                // Right button
                const rightBtn = document.createElement('div');
                rightBtn.style.position = 'absolute';
                rightBtn.style.bottom = '20px';
                rightBtn.style.left = '100px';
                rightBtn.style.width = '60px';
                rightBtn.style.height = '60px';
                rightBtn.style.backgroundColor = 'rgba(255, 255, 255, 0.5)';
                rightBtn.style.borderRadius = '50%';
                rightBtn.style.display = 'flex';
                rightBtn.style.justifyContent = 'center';
                rightBtn.style.alignItems = 'center';
                rightBtn.innerHTML = '→';
                rightBtn.style.fontSize = '24px';
                rightBtn.style.userSelect = 'none';
                document.getElementById('game-container').appendChild(rightBtn);
                
                // Jump button
                const jumpBtn = document.createElement('div');
                jumpBtn.style.position = 'absolute';
                jumpBtn.style.bottom = '20px';
                jumpBtn.style.right = '20px';
                jumpBtn.style.width = '60px';
                jumpBtn.style.height = '60px';
                jumpBtn.style.backgroundColor = 'rgba(255, 255, 255, 0.5)';
                jumpBtn.style.borderRadius = '50%';
                jumpBtn.style.display = 'flex';
                jumpBtn.style.justifyContent = 'center';
                jumpBtn.style.alignItems = 'center';
                jumpBtn.innerHTML = '↑';
                jumpBtn.style.fontSize = '24px';
                jumpBtn.style.userSelect = 'none';
                document.getElementById('game-container').appendChild(jumpBtn);
                
                // Touch events
                leftBtn.addEventListener('touchstart', () => {
                    gameScene.leftPressed = true;
                });
                
                leftBtn.addEventListener('touchend', () => {
                    gameScene.leftPressed = false;
                });
                
                rightBtn.addEventListener('touchstart', () => {
                    gameScene.rightPressed = true;
                });
                
                rightBtn.addEventListener('touchend', () => {
                    gameScene.rightPressed = false;
                });
                
                jumpBtn.addEventListener('touchstart', () => {
                    gameScene.upPressed = true;
                });
                
                jumpBtn.addEventListener('touchend', () => {
                    gameScene.upPressed = false;
                });
                
                // Extend update function for touch controls
                const originalUpdate = gameScene.update;
                gameScene.update = function() {
                    // Handle touch controls
                    if (this.leftPressed) {
                        this.player.setVelocityX(-160);
                        this.player.flipX = true;
                        this.player.anims.play('luigi-run', true);
                    } else if (this.rightPressed) {
                        this.player.setVelocityX(160);
                        this.player.flipX = false;
                        this.player.anims.play('luigi-run', true);
                    } else if (!this.cursors.left.isDown && !this.cursors.right.isDown) {
                        this.player.setVelocityX(0);
                        this.player.anims.play('luigi-idle', true);
                    }
                    
                    if (this.upPressed && this.player.body.touching.down) {
                        this.player.setVelocityY(-550);
                        this.sound.play('jump');
                        this.player.anims.play('luigi-jump');
                        this.upPressed = false;
                    }
                    
                    // Call original update
                    originalUpdate.call(this);
                };
            } else {
                console.error('GameScene not found for touch controls setup');
            }
        });
    }

    // Add this after the game is created
    try {
        // Test sound initialization directly after game creation
        setTimeout(() => {
            if (game && game.sound && game.sound.context) {
                console.log("Game sound system check: context state = " + game.sound.context.state);
                
                // Try to add and play a sound directly
                const testSound = game.sound.add('coin');
                if (testSound) {
                    console.log("Test sound created successfully");
                    testSound.play({ volume: 0.3 });
                    console.log("Test sound play command issued");
                }
            }
        }, 3000); // Wait 3 seconds after game init
    } catch (e) {
        console.error("Error testing game sound:", e);
    }

    // Add this after the game is created
    try {
        // Initialize sound placeholders and volume control
        setTimeout(() => {
            if (window.game) {
                console.log("Initializing sound system...");
                
                // Create placeholders for missing sounds
                if (window.SoundPlaceholders) {
                    window.SoundPlaceholders.init(window.game);
                }
                
                // Set initial volume to 30%
                if (window.game.sound) {
                    window.game.sound.volume = 0.3;
                    console.log("Game volume set to 30%");
                }
            }
        }, 2000); // Wait for game to initialize
    } catch (e) {
        console.error("Error setting up sound system:", e);
    }

    // Add this near the top of the file, after the game is created
    // Initialize our custom audio system
    try {
        document.addEventListener('DOMContentLoaded', function() {
            // Initialize custom audio system
            if (window.CustomAudio) {
                window.CustomAudio.init();
                console.log("Custom audio system initialized");
            }
            
            // Initialize audio controls
            if (window.AudioControls) {
                window.AudioControls.init();
                console.log("Audio controls initialized");
            }
        });
    } catch (e) {
        console.error("Error initializing custom audio:", e);
    }
} catch (e) {
    console.error('Error initializing game:', e);
    
    // Display a more user-friendly error message on the page
    const gameContainer = document.getElementById('game-container');
    if (gameContainer) {
        gameContainer.innerHTML = `
            <div style="text-align: center; padding: 20px; color: #333;">
                <h2>Game failed to start</h2>
                <p>Error: ${e.message}</p>
                <p>Please check the browser console for more details (F12 or Ctrl+Shift+I).</p>
                <p><a href="asset-test.html">Run Asset Test</a> to check if game assets are loading correctly.</p>
            </div>
        `;
    }
} 