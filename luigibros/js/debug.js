// Debug helper functions
const GameDebug = {
    init: function() {
        // Override console.error to add more visibility to errors
        const originalError = console.error;
        console.error = function() {
            // Create an error div if it doesn't exist
            if (!document.getElementById('game-error')) {
                const errorDiv = document.createElement('div');
                errorDiv.id = 'game-error';
                errorDiv.style.position = 'fixed';
                errorDiv.style.top = '0';
                errorDiv.style.left = '0';
                errorDiv.style.width = '100%';
                errorDiv.style.backgroundColor = 'rgba(255, 0, 0, 0.8)';
                errorDiv.style.color = 'white';
                errorDiv.style.padding = '10px';
                errorDiv.style.fontFamily = 'monospace';
                errorDiv.style.zIndex = '1000';
                document.body.appendChild(errorDiv);
            }
            
            // Add the error message to the div
            const errorDiv = document.getElementById('game-error');
            const errorMsg = Array.from(arguments).join(' ');
            errorDiv.innerHTML += `<div>${errorMsg}</div>`;
            
            // Call the original console.error
            originalError.apply(console, arguments);
        };

        // Add event listener for unhandled errors
        window.addEventListener('error', function(event) {
            console.error('UNHANDLED ERROR:', event.error?.message || event.message);
        });

        // Add debug overlay
        this.createDebugOverlay();
        
        console.log('Debug initialized');

        // Add volume control automatically
        document.addEventListener('DOMContentLoaded', function() {
            // Wait for game to be initialized
            setTimeout(() => {
                if (window.game) {
                    GameDebug.setupVolumeControl(window.game);
                    
                    // Set initial volume to 30%
                    if (window.game.sound) {
                        window.game.sound.volume = 0.3;
                        console.log("Setting initial game volume to 30%");
                    }
                }
            }, 2000);
        });

        // Hide the game status panel
        setTimeout(() => {
            const statusPanel = document.getElementById('game-status-panel');
            if (statusPanel) {
                statusPanel.style.display = 'none';
            }
            
            // Hide any other debug elements
            const debugElements = document.querySelectorAll('[id*="debug"]');
            debugElements.forEach(el => {
                if (el !== statusPanel) {
                    el.style.display = 'none';
                }
            });
        }, 500);
    },

    createDebugOverlay: function() {
        // Create debug overlay
        const debugOverlay = document.createElement('div');
        debugOverlay.id = 'debug-overlay';
        debugOverlay.style.position = 'fixed';
        debugOverlay.style.bottom = '0';
        debugOverlay.style.right = '0';
        debugOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        debugOverlay.style.color = 'white';
        debugOverlay.style.padding = '10px';
        debugOverlay.style.fontFamily = 'monospace';
        debugOverlay.style.fontSize = '12px';
        debugOverlay.style.zIndex = '999';
        debugOverlay.style.maxWidth = '300px';
        debugOverlay.style.maxHeight = '200px';
        debugOverlay.style.overflow = 'auto';
        document.body.appendChild(debugOverlay);
        
        // Create debug button to show/hide details
        const debugButton = document.createElement('button');
        debugButton.textContent = 'Audio Debug';
        debugButton.style.position = 'fixed';
        debugButton.style.bottom = '10px';
        debugButton.style.right = '10px';
        debugButton.style.zIndex = '1000';
        debugButton.onclick = this.toggleAudioDebug;
        document.body.appendChild(debugButton);
    },
    
    toggleAudioDebug: function() {
        // Get or create audio debug div
        let audioDebug = document.getElementById('audio-debug');
        if (!audioDebug) {
            audioDebug = document.createElement('div');
            audioDebug.id = 'audio-debug';
            audioDebug.style.position = 'fixed';
            audioDebug.style.top = '50%';
            audioDebug.style.left = '50%';
            audioDebug.style.transform = 'translate(-50%, -50%)';
            audioDebug.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
            audioDebug.style.color = 'white';
            audioDebug.style.padding = '20px';
            audioDebug.style.borderRadius = '10px';
            audioDebug.style.fontFamily = 'monospace';
            audioDebug.style.zIndex = '1001';
            audioDebug.style.width = '80%';
            audioDebug.style.maxWidth = '500px';
            document.body.appendChild(audioDebug);
            
            // Create close button
            const closeButton = document.createElement('button');
            closeButton.textContent = 'Close';
            closeButton.style.marginTop = '10px';
            closeButton.onclick = function() {
                audioDebug.style.display = 'none';
            };
            
            // Check audio context
            const game = window.game;
            let audioContent = '<h3>Audio Debug Info</h3>';
            
            if (game && game.sound && game.sound.context) {
                const context = game.sound.context;
                audioContent += `
                    <p>Audio Context State: <b>${context.state}</b></p>
                    <p>Sample Rate: ${context.sampleRate}</p>
                    <p>Base Latency: ${context.baseLatency || 'Unknown'}</p>
                    <p>Protocol: ${window.location.protocol}</p>
                `;
                
                // Add test sound buttons
                audioContent += '<div style="margin-top:15px"><button id="test-sound-btn">Test Sound</button> <button id="show-sound-panel">Show Sound Test Panel</button></div>';
                
            } else {
                audioContent += '<p>Audio context not available or game not initialized</p>';
            }
            
            audioDebug.innerHTML = audioContent;
            
            // Add event listener for test sound button
            setTimeout(() => {
                const testBtn = document.getElementById('test-sound-btn');
                if (testBtn) {
                    testBtn.onclick = function() {
                        if (game && game.sound) {
                            try {
                                // Create and play a test tone
                                const oscillator = game.sound.context.createOscillator();
                                oscillator.type = 'sine';
                                oscillator.frequency.setValueAtTime(440, game.sound.context.currentTime);
                                
                                const gainNode = game.sound.context.createGain();
                                gainNode.gain.setValueAtTime(0.1, game.sound.context.currentTime);
                                
                                oscillator.connect(gainNode);
                                gainNode.connect(game.sound.context.destination);
                                
                                oscillator.start();
                                oscillator.stop(game.sound.context.currentTime + 0.5);
                                
                                testBtn.textContent = 'Test Sound (Played)';
                            } catch (e) {
                                console.error('Error playing test sound:', e);
                                testBtn.textContent = 'Test Sound (Failed)';
                            }
                        }
                    };
                }
                
                // Add event listener for showing sound panel
                const panelBtn = document.getElementById('show-sound-panel');
                if (panelBtn && game) {
                    panelBtn.onclick = function() {
                        GameDebug.playTestSounds(game);
                    };
                }
            }, 100);
            
            audioDebug.appendChild(closeButton);
        } else {
            audioDebug.style.display = audioDebug.style.display === 'none' ? 'block' : 'none';
        }
    },

    logSceneStatus: function(game) {
        if (!game) {
            console.error('Game object not available for debugging');
            return;
        }
        
        // Store game reference for debug overlay
        window.game = game;

        console.log('Active scenes:');
        game.scene.scenes.forEach(scene => {
            console.log(`- ${scene.scene.key}: ${scene.scene.active ? 'active' : 'inactive'}`);
        });
        
        // Update debug overlay
        const debugOverlay = document.getElementById('debug-overlay');
        if (debugOverlay) {
            let content = '<b>GAME STATUS:</b><br>';
            content += `Protocol: ${window.location.protocol}<br>`;
            content += `Audio Context: ${game.sound.context.state}<br>`;
            content += '<b>SCENES:</b><br>';
            
            game.scene.scenes.forEach(scene => {
                content += `- ${scene.scene.key}: ${scene.scene.active ? 'active' : 'inactive'}<br>`;
            });
            
            debugOverlay.innerHTML = content;
        }
    },

    unlockAudio: function(game) {
        if (!game || !game.sound || !game.sound.context) return;
        
        console.log('Attempting to unlock audio...');
        
        // Create audio unlock overlay
        const unlockDiv = document.createElement('div');
        unlockDiv.id = 'audio-unlock';
        unlockDiv.style.position = 'fixed';
        unlockDiv.style.top = '0';
        unlockDiv.style.left = '0';
        unlockDiv.style.width = '100%';
        unlockDiv.style.height = '100%';
        unlockDiv.style.backgroundColor = 'rgba(0,0,0,0.7)';
        unlockDiv.style.color = 'white';
        unlockDiv.style.textAlign = 'center';
        unlockDiv.style.paddingTop = '40vh';
        unlockDiv.style.zIndex = '2000';
        unlockDiv.style.cursor = 'pointer';
        unlockDiv.innerHTML = `
            <h2>Click / Tap to Enable Sound</h2>
            <p>Browser requires user interaction to enable audio</p>
        `;
        
        document.body.appendChild(unlockDiv);
        
        // Handle click/tap to unlock audio
        unlockDiv.addEventListener('click', function() {
            if (game.sound.context.state === 'suspended') {
                game.sound.context.resume().then(() => {
                    console.log('AudioContext resumed successfully');
                    
                    // Play a silent sound to fully unlock audio on iOS
                    const silence = new Audio("data:audio/mp3;base64,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");
                    silence.play();
                    
                    // Remove the overlay
                    document.body.removeChild(unlockDiv);
                    
                    // Refresh debug info
                    if (window.game && GameDebug) {
                        GameDebug.logSceneStatus(window.game);
                    }
                });
            } else {
                console.log('Audio already unlocked');
                document.body.removeChild(unlockDiv);
            }
        });
    },

    playTestSounds: function(game) {
        console.log('Testing sounds directly...');
        
        // Create test buttons
        const buttonContainer = document.createElement('div');
        buttonContainer.style.position = 'fixed';
        buttonContainer.style.top = '100px';
        buttonContainer.style.left = '20px';
        buttonContainer.style.backgroundColor = 'rgba(0,0,0,0.7)';
        buttonContainer.style.padding = '10px';
        buttonContainer.style.borderRadius = '5px';
        buttonContainer.style.zIndex = '1000';
        document.body.appendChild(buttonContainer);
        
        // Add title
        const title = document.createElement('div');
        title.textContent = 'Sound Test';
        title.style.color = 'white';
        title.style.fontWeight = 'bold';
        title.style.marginBottom = '10px';
        buttonContainer.appendChild(title);
        
        // Function to create test buttons
        const createTestButton = function(label, soundKey) {
            const btn = document.createElement('button');
            btn.textContent = label;
            btn.style.display = 'block';
            btn.style.margin = '5px 0';
            btn.style.padding = '5px 10px';
            
            btn.onclick = function() {
                try {
                    console.log(`Attempting to play sound: ${soundKey}`);
                    
                    // Check if sound is loaded
                    const soundExists = game.cache.audio.exists(soundKey);
                    console.log(`Sound '${soundKey}' exists in cache: ${soundExists}`);
                    
                    if (soundExists) {
                        // Try to play the sound directly
                        const sound = game.sound.add(soundKey);
                        sound.play();
                        console.log(`Sound '${soundKey}' play command issued`);
                        btn.style.backgroundColor = '#4CAF50';
                        setTimeout(() => { btn.style.backgroundColor = ''; }, 500);
                    } else {
                        // Try to create the sound on the fly and play it
                        console.log(`Attempting to create and play sound: ${soundKey}`);
                        
                        // Create a simple sound object for testing
                        const sound = new Audio(`assets/sounds/${soundKey}.wav`);
                        sound.volume = 1.0;
                        sound.play();
                        console.log(`Direct Audio API play command issued for ${soundKey}`);
                        btn.style.backgroundColor = '#2196F3';
                        setTimeout(() => { btn.style.backgroundColor = ''; }, 500);
                    }
                } catch (e) {
                    console.error(`Error playing sound: ${soundKey}`, e);
                    btn.style.backgroundColor = '#F44336';
                    setTimeout(() => { btn.style.backgroundColor = ''; }, 500);
                }
            };
            
            buttonContainer.appendChild(btn);
            return btn;
        };
        
        // Create buttons for each sound
        createTestButton('Play Jump', 'jump');
        createTestButton('Play Coin', 'coin');
        createTestButton('Play Theme', 'theme');
        createTestButton('Play Game Over', 'game-over');
        
        // Create a close button
        const closeBtn = document.createElement('button');
        closeBtn.textContent = 'Close';
        closeBtn.style.display = 'block';
        closeBtn.style.margin = '10px 0 5px';
        closeBtn.style.padding = '5px 10px';
        closeBtn.onclick = function() {
            document.body.removeChild(buttonContainer);
        };
        buttonContainer.appendChild(closeBtn);
        
        return buttonContainer;
    },

    setupVolumeControl: function(game) {
        const controlPanel = document.createElement('div');
        controlPanel.style.position = 'fixed';
        controlPanel.style.top = '10px';
        controlPanel.style.right = '10px';
        controlPanel.style.backgroundColor = 'rgba(0,0,0,0.7)';
        controlPanel.style.padding = '10px';
        controlPanel.style.borderRadius = '5px';
        controlPanel.style.zIndex = '1000';
        controlPanel.style.color = 'white';
        document.body.appendChild(controlPanel);
        
        // Add title
        const title = document.createElement('div');
        title.textContent = 'Audio Controls';
        title.style.fontWeight = 'bold';
        title.style.marginBottom = '10px';
        controlPanel.appendChild(title);
        
        // Create volume slider
        const volumeControl = document.createElement('div');
        volumeControl.style.marginBottom = '10px';
        controlPanel.appendChild(volumeControl);
        
        const volumeLabel = document.createElement('label');
        volumeLabel.textContent = 'Volume: ';
        volumeLabel.style.display = 'inline-block';
        volumeLabel.style.width = '60px';
        volumeControl.appendChild(volumeLabel);
        
        const volumeSlider = document.createElement('input');
        volumeSlider.type = 'range';
        volumeSlider.min = '0';
        volumeSlider.max = '100';
        volumeSlider.value = '50'; // Start at 50%
        volumeSlider.style.width = '100px';
        volumeControl.appendChild(volumeSlider);
        
        const volumeValue = document.createElement('span');
        volumeValue.textContent = '50%';
        volumeValue.style.marginLeft = '10px';
        volumeControl.appendChild(volumeValue);
        
        // Create mute button
        const muteBtn = document.createElement('button');
        muteBtn.textContent = 'Mute';
        muteBtn.style.marginRight = '10px';
        controlPanel.appendChild(muteBtn);
        
        // Create close button
        const closeBtn = document.createElement('button');
        closeBtn.textContent = 'Close';
        closeBtn.style.marginLeft = '10px';
        controlPanel.appendChild(closeBtn);
        
        // Add event listeners
        volumeSlider.addEventListener('input', function() {
            const volume = parseInt(this.value) / 100;
            volumeValue.textContent = this.value + '%';
            
            if (game && game.sound) {
                game.sound.volume = volume;
                console.log(`