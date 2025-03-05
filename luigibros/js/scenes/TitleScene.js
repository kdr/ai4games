class TitleScene extends Phaser.Scene {
    constructor() {
        super('TitleScene');
        this.audioUnlocked = false;
    }

    create() {
        // Add background
        this.add.image(400, 240, 'background');
        
        // Add title
        this.add.image(400, 150, 'title').setScale(0.7);
        
        // Add Luigi character to title screen
        const luigi = this.add.sprite(400, 300, 'luigi');
        luigi.setScale(3);
        luigi.anims.play('luigi-idle');
        
        // Add start game text
        const startText = this.add.text(400, 400, 'PRESS SPACE TO START', {
            fontFamily: 'Arial',
            fontSize: 24,
            color: '#ffffff',
            shadow: {
                offsetX: 2,
                offsetY: 2,
                color: '#000',
                blur: 2,
                stroke: true,
                fill: true
            }
        }).setOrigin(0.5);
        
        // Add audio instructions
        const audioText = this.add.text(400, 440, 'CLICK ANYWHERE TO ENABLE SOUND', {
            fontFamily: 'Arial',
            fontSize: 16,
            color: '#ffff00',
            shadow: {
                offsetX: 1,
                offsetY: 1,
                color: '#000',
                blur: 1,
                stroke: true,
                fill: true
            }
        }).setOrigin(0.5);
        
        // Blinking effect for start text
        this.tweens.add({
            targets: startText,
            alpha: 0,
            duration: 800,
            ease: 'Power2',
            yoyo: true,
            repeat: -1
        });
        
        // Force audio unlock on any interaction
        this.input.on('pointerdown', () => {
            this.unlockAudio();
            audioText.setVisible(false);
        });
        
        // Also try unlocking on keyboard event
        this.input.keyboard.on('keydown', () => {
            this.unlockAudio();
            audioText.setVisible(false);
        });
        
        // Start game when space is pressed
        this.input.keyboard.once('keydown-SPACE', () => {
            // Make sure audio is unlocked first
            this.unlockAudio();
            
            // Try to play theme music with better error handling
            try {
                console.log("Starting game - attempting to play theme music");
                if (this.sound && this.sound.play) {
                    // The key issue might be here - let's make sure we're creating the sound properly
                    if (!this.themeMusic) {
                        this.themeMusic = this.sound.add('theme', {
                            loop: true,
                            volume: 0.5
                        });
                        console.log("Theme music created successfully");
                    }
                    
                    this.themeMusic.play();
                    console.log("Theme music started playing");
                } else {
                    console.warn("Sound system not available for theme music");
                }
            } catch (e) {
                console.error("Error playing theme music:", e);
                // Continue with game even if music fails
            }
            
            // Start game
            this.startGame();
        });
    }
    
    unlockAudio() {
        // Only try once
        if (this.audioUnlocked) return;
        
        try {
            // Try to resume audio context
            if (this.sound.context.state === 'suspended') {
                console.log('Attempting to unlock audio context...');
                
                this.sound.context.resume().then(() => {
                    console.log('Audio context resumed successfully:', this.sound.context.state);
                    
                    // Try playing a silent sound to fully unlock audio on iOS
                    const silence = this.sound.add('jump', { volume: 0 });
                    silence.play();
                    silence.stop();
                    
                    this.audioUnlocked = true;
                }).catch(e => {
                    console.warn('Error resuming audio context:', e);
                });
            } else {
                console.log('Audio context already active:', this.sound.context.state);
                this.audioUnlocked = true;
            }
        } catch (e) {
            console.warn('Error unlocking audio:', e);
        }
    }

    startGame() {
        // Use our custom audio system for theme music
        if (window.CustomAudio && window.CustomAudio.sounds.theme) {
            this.themeMusic = window.CustomAudio.sounds.theme.play(true); // true for looping
        }
        
        this.scene.start('GameScene');
    }
} 