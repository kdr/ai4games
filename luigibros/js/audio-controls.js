// Audio Controls UI
window.AudioControls = {
    init: function() {
        // Create audio control panel
        const panel = document.createElement('div');
        panel.style.position = 'fixed';
        panel.style.top = '10px';
        panel.style.right = '10px';
        panel.style.backgroundColor = 'rgba(0,0,0,0.7)';
        panel.style.padding = '10px';
        panel.style.borderRadius = '5px';
        panel.style.zIndex = '1000';
        panel.style.color = 'white';
        document.body.appendChild(panel);
        
        // Add title
        const title = document.createElement('div');
        title.textContent = 'Audio Controls';
        title.style.fontWeight = 'bold';
        title.style.marginBottom = '8px';
        panel.appendChild(title);
        
        // Create volume slider
        const volumeControl = document.createElement('div');
        volumeControl.style.marginBottom = '8px';
        panel.appendChild(volumeControl);
        
        const volumeLabel = document.createElement('label');
        volumeLabel.textContent = 'Volume: ';
        volumeControl.appendChild(volumeLabel);
        
        const volumeSlider = document.createElement('input');
        volumeSlider.type = 'range';
        volumeSlider.min = '0';
        volumeSlider.max = '100';
        volumeSlider.value = '30'; // Start at 30%
        volumeSlider.style.width = '100px';
        volumeControl.appendChild(volumeSlider);
        
        const volumeValue = document.createElement('span');
        volumeValue.textContent = '30%';
        volumeValue.style.marginLeft = '5px';
        volumeControl.appendChild(volumeValue);
        
        // Create sound test buttons
        const soundTestDiv = document.createElement('div');
        soundTestDiv.style.marginBottom = '8px';
        panel.appendChild(soundTestDiv);
        
        ['jump', 'coin', 'theme', 'game-over'].forEach(sound => {
            const btn = document.createElement('button');
            btn.textContent = sound;
            btn.style.marginRight = '5px';
            btn.style.marginBottom = '5px';
            btn.onclick = () => {
                if (window.CustomAudio) {
                    const isTheme = sound === 'theme';
                    const soundInstance = window.CustomAudio.sounds[sound].play(isTheme);
                    
                    // Change button color briefly
                    btn.style.backgroundColor = '#4CAF50';
                    setTimeout(() => {
                        btn.style.backgroundColor = '';
                    }, 200);
                    
                    // Stop theme after a few seconds
                    if (isTheme && soundInstance) {
                        setTimeout(() => {
                            soundInstance.stop();
                        }, 3000);
                    }
                }
            };
            soundTestDiv.appendChild(btn);
        });
        
        // Create mute button
        const muteBtn = document.createElement('button');
        muteBtn.textContent = 'Mute';
        muteBtn.style.marginRight = '5px';
        panel.appendChild(muteBtn);
        
        // Create close button
        const closeBtn = document.createElement('button');
        closeBtn.textContent = 'Close';
        closeBtn.onclick = () => {
            document.body.removeChild(panel);
        };
        panel.appendChild(closeBtn);
        
        // Add event listeners
        volumeSlider.addEventListener('input', function() {
            const volume = parseInt(this.value) / 100;
            volumeValue.textContent = this.value + '%';
            
            if (window.CustomAudio) {
                window.CustomAudio.setVolume(volume);
                
                // Update mute button text
                if (volume > 0 && muteBtn.textContent === 'Unmute') {
                    muteBtn.textContent = 'Mute';
                } else if (volume === 0) {
                    muteBtn.textContent = 'Unmute';
                }
            }
        });
        
        muteBtn.addEventListener('click', function() {
            if (window.CustomAudio) {
                const isMuted = window.CustomAudio.toggleMute();
                muteBtn.textContent = isMuted ? 'Unmute' : 'Mute';
            }
        });
        
        return panel;
    }
}; 