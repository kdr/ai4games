// Sound placeholder creator
window.SoundPlaceholders = {
    // Check if sounds exist and create placeholders if needed
    init: function(game) {
        if (!game || !game.sound) return;
        
        // Initialize with 30% volume
        game.sound.volume = 0.3;
        
        // List of expected sounds
        const expectedSounds = ['jump', 'coin', 'theme', 'game-over'];
        
        // Check if each sound exists in the cache
        const missingSounds = expectedSounds.filter(sound => !game.cache.audio.exists(sound));
        
        if (missingSounds.length > 0) {
            console.log(`Creating placeholders for ${missingSounds.length} missing sounds:`, missingSounds);
            this.createPlaceholders(game, missingSounds);
        }
    },
    
    // Create placeholder sounds for missing audio
    createPlaceholders: function(game, soundKeys) {
        if (!game || !game.sound || !game.sound.context) return;
        
        const audioContext = game.sound.context;
        
        for (const key of soundKeys) {
            try {
                // Create a short beep sound as a placeholder
                const buffer = audioContext.createBuffer(1, 4410, 44100);
                const channelData = buffer.getChannelData(0);
                
                // Generate a simple tone
                let frequency;
                switch (key) {
                    case 'jump': frequency = 800; break; // Higher pitch for jump
                    case 'coin': frequency = 600; break; // Medium-high for coin
                    case 'theme': frequency = 440; break; // A4 note for theme
                    case 'game-over': frequency = 200; break; // Low tone for game over
                    default: frequency = 440; break;
                }
                
                const amplitude = 0.2; // Lower volume for placeholders
                
                // Fill buffer with a simple sine wave
                for (let i = 0; i < channelData.length; i++) {
                    channelData[i] = Math.sin(2 * Math.PI * frequency * i / 44100) * amplitude;
                }
                
                // Create a Phaser sound with this buffer
                const sound = game.sound.add(key);
                sound._buffer = buffer; // Attach the buffer
                
                console.log(`Created placeholder sound for "${key}"`);
            } catch (e) {
                console.error(`Failed to create placeholder sound for "${key}":`, e);
            }
        }
    },
    
    // Safe method to play a sound
    play: function(game, key, config = {}) {
        if (!game || !game.sound) return null;
        
        try {
            if (game.cache.audio.exists(key)) {
                return game.sound.play(key, config);
            } else {
                console.warn(`Cannot play sound "${key}" - not found in cache`);
                return null;
            }
        } catch (e) {
            console.error(`Error playing sound "${key}":`, e);
            return null;
        }
    }
}; 