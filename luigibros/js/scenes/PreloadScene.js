class PreloadScene extends Phaser.Scene {
    constructor() {
        super('PreloadScene');
        this.loadingFailed = false;
    }

    preload() {
        // Display loading progress
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Create loading bar
        const progressBar = this.add.graphics();
        const progressBox = this.add.graphics();
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(width / 2 - 160, height / 2 - 10, 320, 50);
        
        // Loading progress events
        this.load.on('progress', (value) => {
            progressBar.clear();
            progressBar.fillStyle(0x00ff00, 1);
            progressBar.fillRect(width / 2 - 150, height / 2, 300 * value, 30);
        });
        
        this.load.on('complete', () => {
            progressBar.destroy();
            progressBox.destroy();
        });

        // Error handling for file loading
        this.load.on('loaderror', (file) => {
            console.warn(`Error loading file: ${file.key} (${file.url})`);
            // We'll continue even if some assets fail to load
            if (file.type === 'audio') {
                console.warn('Audio file failed to load. Game will continue without sounds.');
            }
        });

        // Load all game assets
        this.load.spritesheet('luigi', 'assets/images/luigi.png', { frameWidth: 32, frameHeight: 64 });
        this.load.image('ground', 'assets/images/ground.png');
        this.load.image('brick', 'assets/images/brick.png');
        this.load.image('coin', 'assets/images/coin.png');
        this.load.image('pipe', 'assets/images/pipe.png');
        this.load.image('goomba', 'assets/images/goomba.png');
        this.load.image('background', 'assets/images/background.png');
        this.load.image('title', 'assets/images/title.png');
        
        // Add detailed logging for sound loading
        console.log("PreloadScene: Beginning to load audio files");
        
        // Check if asset files exist before trying to load them
        this.checkAudioFiles(['jump', 'coin', 'theme', 'game-over']);
        
        // Try multiple formats with more robust error handling
        try {
            // List all file paths to try (we'll try multiple formats for each sound)
            const soundPaths = {
                'jump': ['assets/sounds/jump.mp3', 'assets/sounds/jump.wav', 'assets/sounds/jump.ogg'],
                'coin': ['assets/sounds/coin.mp3', 'assets/sounds/coin.wav', 'assets/sounds/coin.ogg'],
                'theme': ['assets/sounds/theme.mp3', 'assets/sounds/theme.wav', 'assets/sounds/theme.ogg'],
                'game-over': ['assets/sounds/game-over.mp3', 'assets/sounds/game-over.wav', 'assets/sounds/game-over.ogg']
            };
            
            // Try to load each sound in multiple formats
            for (const [key, paths] of Object.entries(soundPaths)) {
                console.log(`Attempting to load sound: ${key}`);
                
                // Try each path for this sound
                for (const path of paths) {
                    this.load.audio(key, path);
                    console.log(`Added ${path} to load queue`);
                }
            }
            
            // Listen for specific file load success
            this.load.on('filecomplete', (key, type, data) => {
                if (type === 'audio') {
                    console.log(`Successfully loaded audio: ${key}`);
                }
            });
            
            // Listen for specific file load errors
            this.load.on('loaderror', (file) => {
                console.warn(`Failed to load file: ${file.key} (${file.url})`);
                
                // If it's an audio file, we'll try a fallback approach
                if (file.type === 'audio') {
                    console.warn(`Audio file ${file.key} failed to load from ${file.url}`);
                }
            });
        } catch (e) {
            console.error("Error in PreloadScene audio loading:", e);
        }
    }

    create() {
        // If audio loading failed, show a warning
        if (this.loadingFailed) {
            const text = this.add.text(this.cameras.main.width / 2, 100, 
                'Audio files could not be loaded.\nGame will continue without sound.', {
                fontSize: '18px',
                fill: '#ff0000',
                align: 'center'
            }).setOrigin(0.5);
            
            // Display the message briefly
            this.time.delayedCall(3000, () => {
                text.destroy();
            });
        }
        
        // Create animations
        this.anims.create({
            key: 'luigi-idle',
            frames: this.anims.generateFrameNumbers('luigi', { start: 0, end: 0 }),
            frameRate: 10,
            repeat: -1
        });

        this.anims.create({
            key: 'luigi-run',
            frames: this.anims.generateFrameNumbers('luigi', { start: 1, end: 3 }),
            frameRate: 10,
            repeat: -1
        });

        this.anims.create({
            key: 'luigi-jump',
            frames: this.anims.generateFrameNumbers('luigi', { start: 4, end: 4 }),
            frameRate: 10,
            repeat: 0
        });

        console.log("PreloadScene: Assets loaded, transitioning to TitleScene");
        // Create a simple way to create missing sounds if they weren't loaded
        this.checkAndCreateMissingSounds();
        
        this.scene.start('TitleScene');
    }

    checkAudioFiles(soundNames) {
        console.log("Checking for audio files in assets/sounds/ directory");
        
        // Create a helper function to check if files exist
        const checkFile = (url) => {
            const xhr = new XMLHttpRequest();
            xhr.open('HEAD', url, false);
            try {
                xhr.send();
                return xhr.status !== 404;
            } catch (e) {
                console.warn(`Error checking file ${url}:`, e);
                return false;
            }
        };
        
        // Check each sound in each format
        for (const sound of soundNames) {
            const mp3Exists = checkFile(`assets/sounds/${sound}.mp3`);
            const wavExists = checkFile(`assets/sounds/${sound}.wav`);
            const oggExists = checkFile(`assets/sounds/${sound}.ogg`);
            
            console.log(`Sound "${sound}": MP3 exists: ${mp3Exists}, WAV exists: ${wavExists}, OGG exists: ${oggExists}`);
            
            if (!mp3Exists && !wavExists && !oggExists) {
                console.error(`No audio files found for "${sound}" - this will cause errors when playing`);
            }
        }
    }

    checkAndCreateMissingSounds() {
        const sounds = ['jump', 'coin', 'theme', 'game-over'];
        
        for (const sound of sounds) {
            const exists = this.cache.audio.exists(sound);
            console.log(`Sound "${sound}" exists in cache: ${exists}`);
            
            if (!exists) {
                console.warn(`Creating empty sound for "${sound}" to prevent errors`);
                // Create a silent sound as a placeholder to prevent errors
                try {
                    // Create a silent sound buffer
                    const audioContext = this.sound.context;
                    const buffer = audioContext.createBuffer(1, 44100, 44100);
                    
                    // Create a sound object with this buffer
                    this.cache.audio.add(sound, buffer);
                    
                    console.log(`Created placeholder for "${sound}"`);
                } catch (e) {
                    console.error(`Failed to create placeholder for "${sound}":`, e);
                }
            }
        }
    }
} 