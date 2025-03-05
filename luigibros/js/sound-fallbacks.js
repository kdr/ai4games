// Create a simple sound fallback system
window.SoundFallbacks = {
    // Tracks which sounds have failed to load
    failedSounds: new Set(),
    
    // Method to register a failed sound
    registerFailedSound: function(key) {
        this.failedSounds.add(key);
        console.log(`Registered failed sound: ${key}`);
    },
    
    // Method to check if a sound has failed
    hasFailed: function(key) {
        return this.failedSounds.has(key);
    },
    
    // Method to play a sound with fallback handling
    playSound: function(scene, key, config = {}) {
        // If we already know this sound failed, don't try to play it
        if (this.hasFailed(key)) {
            console.log(`Skipping known failed sound: ${key}`);
            return null;
        }
        
        try {
            // Check if the sound exists in the cache
            if (scene.cache.audio.exists(key)) {
                // Try to play the sound
                return scene.sound.play(key, config);
            } else {
                console.warn(`Sound ${key} not found in cache`);
                this.registerFailedSound(key);
                return null;
            }
        } catch (e) {
            console.error(`Error playing sound ${key}:`, e);
            this.registerFailedSound(key);
            return null;
        }
    }
}; 