// Custom Audio System that works independently of Phaser
window.CustomAudio = {
    // Store sound objects
    sounds: {},
    
    // Master volume
    volume: 0.3,
    
    // Muted state
    muted: false,
    
    // Initialize the audio system
    init: function() {
        console.log("Initializing Custom Audio System");
        
        // Create an audio context
        try {
            this.context = new (window.AudioContext || window.webkitAudioContext)();
            console.log("Audio context created:", this.context.state);
            
            // Create master gain node for volume control
            this.masterGain = this.context.createGain();
            this.masterGain.gain.value = this.volume;
            this.masterGain.connect(this.context.destination);
            
            // Create all the sounds
            this.createSounds();
            
            // Unlock audio context on first user interaction
            this.setupUnlockEvents();
            
            return true;
        } catch (e) {
            console.error("Failed to initialize audio system:", e);
            return false;
        }
    },
    
    // Create all game sounds using oscillators (no files needed)
    createSounds: function() {
        // Jump sound - short high-pitched beep
        this.createSynthSound('jump', [{
            type: 'sine',
            frequency: 800,
            duration: 0.1,
            attack: 0.01,
            decay: 0.1,
            volume: 0.3
        }]);
        
        // Coin sound - two ascending tones
        this.createSynthSound('coin', [
            {
                type: 'sine',
                frequency: 600,
                duration: 0.1,
                attack: 0.01,
                decay: 0.1,
                volume: 0.3
            },
            {
                type: 'sine',
                frequency: 800,
                duration: 0.1,
                attack: 0.01,
                decay: 0.1,
                volume: 0.3,
                startTime: 0.08
            }
        ]);
        
        // Game over sound - descending tones
        this.createSynthSound('game-over', [
            {
                type: 'sine',
                frequency: 400,
                duration: 0.2,
                attack: 0.01,
                decay: 0.2,
                volume: 0.3
            },
            {
                type: 'sine',
                frequency: 300,
                duration: 0.2,
                attack: 0.01,
                decay: 0.2,
                volume: 0.3,
                startTime: 0.2
            },
            {
                type: 'sine',
                frequency: 200,
                duration: 0.3,
                attack: 0.01,
                decay: 0.3,
                volume: 0.3,
                startTime: 0.4
            }
        ]);
        
        // Theme music - try to load from file, fallback to simple loop
        this.loadSoundFile('theme', 'assets/sounds/theme.mp3');
        
        console.log("All sounds created in custom audio system");
    },
    
    // Create a synthesized sound (no file needed)
    createSynthSound: function(name, tones) {
        console.log(`Creating synthetic sound: ${name}`);
        
        this.sounds[name] = {
            synthetic: true,
            tones: tones,
            play: () => this.playSynthSound(name)
        };
    },
    
    // Load a sound from file
    loadSoundFile: function(name, url) {
        console.log(`Attempting to load sound file: ${url}`);
        
        // Create a placeholder until file loads
        this.sounds[name] = {
            loaded: false,
            buffer: null,
            play: (loop = false) => this.playSound(name, loop)
        };
        
        // Try to fetch the file
        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Failed to load ${url}: ${response.status} ${response.statusText}`);
                }
                return response.arrayBuffer();
            })
            .then(arrayBuffer => this.context.decodeAudioData(arrayBuffer))
            .then(audioBuffer => {
                console.log(`Sound loaded successfully: ${name}`);
                this.sounds[name].buffer = audioBuffer;
                this.sounds[name].loaded = true;
            })
            .catch(error => {
                console.warn(`Failed to load sound ${name}:`, error);
                // Create fallback synthetic sound
                if (name === 'theme') {
                    this.createThemeFallback();
                }
            });
    },
    
    // Create a fallback theme music if file loading fails
    createThemeFallback: function() {
        console.log("Creating fallback theme music");
        
        // Simple repeated pattern for theme music
        const pattern = [
            { note: 'C4', duration: 0.2 },
            { note: 'E4', duration: 0.2 },
            { note: 'G4', duration: 0.2 },
            { note: 'C5', duration: 0.2 },
            { note: 'G4', duration: 0.2 },
            { note: 'E4', duration: 0.2 }
        ];
        
        // Convert notes to frequencies
        const noteToFreq = (note) => {
            const notes = { 'C': 261.63, 'D': 293.66, 'E': 329.63, 'F': 349.23, 'G': 392.00, 'A': 440.00, 'B': 493.88 };
            const octave = parseInt(note.slice(-1));
            const noteName = note.slice(0, -1);
            return notes[noteName] * Math.pow(2, octave - 4);
        };
        
        // Create tones from pattern
        const tones = [];
        let startTime = 0;
        
        // Create a repeating pattern (3 repetitions)
        for (let i = 0; i < 3; i++) {
            pattern.forEach(item => {
                tones.push({
                    type: 'sine',
                    frequency: noteToFreq(item.note),
                    duration: item.duration,
                    attack: 0.02,
                    decay: item.duration,
                    volume: 0.2,
                    startTime: startTime
                });
                startTime += item.duration;
            });
        }
        
        // Update the theme sound
        this.sounds['theme'] = {
            synthetic: true,
            tones: tones,
            play: (loop = true) => this.playSynthSound('theme', loop)
        };
    },
    
    // Play a synthetic sound
    playSynthSound: function(name, loop = false) {
        if (!this.sounds[name] || !this.sounds[name].synthetic) {
            console.warn(`Sound ${name} not found or not synthetic`);
            return null;
        }
        
        // Make sure audio context is running
        this.resumeAudioContext();
        
        const sound = this.sounds[name];
        const tones = sound.tones;
        const maxDuration = tones.reduce((max, tone) => 
            Math.max(max, (tone.startTime || 0) + tone.duration), 0);
        
        // Function to schedule all oscillators for the sound
        const scheduleSound = (startTime) => {
            const oscillators = [];
            
            tones.forEach(tone => {
                const oscillator = this.context.createOscillator();
                oscillator.type = tone.type || 'sine';
                oscillator.frequency.value = tone.frequency;
                
                const gainNode = this.context.createGain();
                gainNode.gain.value = 0;
                
                // Apply attack
                gainNode.gain.setValueAtTime(0, startTime + (tone.startTime || 0));
                gainNode.gain.linearRampToValueAtTime(
                    tone.volume, 
                    startTime + (tone.startTime || 0) + (tone.attack || 0.01)
                );
                
                // Apply decay
                gainNode.gain.linearRampToValueAtTime(
                    0,
                    startTime + (tone.startTime || 0) + tone.duration
                );
                
                oscillator.connect(gainNode);
                gainNode.connect(this.masterGain);
                
                oscillator.start(startTime + (tone.startTime || 0));
                oscillator.stop(startTime + (tone.startTime || 0) + tone.duration);
                
                oscillators.push({ oscillator, gainNode });
            });
            
            return {
                oscillators,
                endTime: startTime + maxDuration
            };
        };
        
        // Initial play
        const startTime = this.context.currentTime;
        const soundInstance = scheduleSound(startTime);
        
        // Handle looping if needed
        if (loop) {
            const loopInterval = setInterval(() => {
                if (this.muted) return;
                
                scheduleSound(soundInstance.endTime);
                soundInstance.endTime += maxDuration;
            }, maxDuration * 1000);
            
            return {
                stop: () => {
                    clearInterval(loopInterval);
                    soundInstance.oscillators.forEach(({ oscillator, gainNode }) => {
                        gainNode.gain.cancelScheduledValues(this.context.currentTime);
                        gainNode.gain.linearRampToValueAtTime(0, this.context.currentTime + 0.1);
                        setTimeout(() => oscillator.stop(), 100);
                    });
                }
            };
        }
        
        return null;
    },
    
    // Play a loaded sound
    playSound: function(name, loop = false) {
        const sound = this.sounds[name];
        
        if (!sound) {
            console.warn(`Sound ${name} not found`);
            return null;
        }
        
        // If the sound is synthetic, use playSynthSound
        if (sound.synthetic) {
            return this.playSynthSound(name, loop);
        }
        
        // If the sound hasn't loaded yet, do nothing
        if (!sound.loaded || !sound.buffer) {
            console.warn(`Sound ${name} hasn't loaded yet`);
            return null;
        }
        
        // Make sure audio context is running
        this.resumeAudioContext();
        
        // Create source node
        const source = this.context.createBufferSource();
        source.buffer = sound.buffer;
        source.loop = loop;
        
        // Create gain node for this sound
        const gainNode = this.context.createGain();
        gainNode.gain.value = this.muted ? 0 : 1;
        
        source.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        source.start();
        
        return {
            stop: () => {
                try {
                    source.stop();
                } catch (e) {
                    console.warn(`Error stopping sound ${name}:`, e);
                }
            }
        };
    },
    
    // Set the volume (0-1)
    setVolume: function(value) {
        this.volume = Math.max(0, Math.min(1, value));
        
        if (this.masterGain) {
            this.masterGain.gain.value = this.muted ? 0 : this.volume;
        }
        
        console.log(`Volume set to ${this.volume}`);
    },
    
    // Toggle mute state
    toggleMute: function() {
        this.muted = !this.muted;
        
        if (this.masterGain) {
            this.masterGain.gain.value = this.muted ? 0 : this.volume;
        }
        
        console.log(`Audio ${this.muted ? 'muted' : 'unmuted'}`);
        return this.muted;
    },
    
    // Ensure audio context is running
    resumeAudioContext: function() {
        if (this.context && this.context.state !== 'running') {
            this.context.resume().then(() => {
                console.log("Audio context resumed successfully");
            }).catch(err => {
                console.error("Failed to resume audio context:", err);
            });
        }
    },
    
    // Setup events to unlock audio on first user interaction
    setupUnlockEvents: function() {
        const unlockAudio = () => {
            console.log("Unlocking audio context on user interaction");
            this.resumeAudioContext();
            
            // Clean up after first interaction
            ['touchstart', 'touchend', 'mousedown', 'keydown'].forEach(event => {
                document.removeEventListener(event, unlockAudio);
            });
        };
        
        ['touchstart', 'touchend', 'mousedown', 'keydown'].forEach(event => {
            document.addEventListener(event, unlockAudio);
        });
    }
}; 