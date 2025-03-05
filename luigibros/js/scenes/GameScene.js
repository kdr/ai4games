class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    create() {
        // Game variables
        this.score = 0;
        this.gameOver = false;
        
        // Create background
        this.add.image(400, 240, 'background');
        
        // Create platforms
        this.platforms = this.physics.add.staticGroup();
        
        // Create ground
        for (let i = 0; i < 25; i++) {
            this.platforms.create(i * 32, 480 - 16, 'ground').setScale(1).refreshBody();
        }
        
        // Create platforms
        this.platforms.create(400, 400, 'ground');
        this.platforms.create(600, 350, 'ground');
        this.platforms.create(50, 250, 'ground');
        this.platforms.create(550, 200, 'ground');
        this.platforms.create(300, 300, 'ground');
        
        // Create pipes
        this.pipes = this.physics.add.staticGroup();
        this.pipes.create(500, 432, 'pipe').setScale(1).refreshBody();
        this.pipes.create(200, 432, 'pipe').setScale(1).refreshBody();
        
        // Create bricks
        this.bricks = this.physics.add.staticGroup();
        for (let i = 0; i < 5; i++) {
            this.bricks.create(100 + i * 32, 350, 'brick');
        }
        for (let i = 0; i < 3; i++) {
            this.bricks.create(400 + i * 32, 250, 'brick');
        }
        
        // Create coins
        this.coins = this.physics.add.group({
            key: 'coin',
            repeat: 15,
            setXY: { x: 12, y: 0, stepX: 50 }
        });
        
        this.coins.children.iterate((child) => {
            child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
            child.setY(Phaser.Math.Between(100, 300));
        });
        
        // Create enemies
        this.goombas = this.physics.add.group();
        for (let i = 0; i < 5; i++) {
            const goomba = this.goombas.create(Phaser.Math.Between(100, 700), 0, 'goomba');
            goomba.setBounce(0.2);
            goomba.setCollideWorldBounds(true);
            goomba.setVelocityX(Phaser.Math.Between(-50, 50));
        }
        
        // Player setup
        this.player = this.physics.add.sprite(100, 450, 'player');
        this.player.setBounce(0.2);
        this.player.setCollideWorldBounds(true);
        
        // Make Luigi bigger - scale him up by 20%
        this.player.setScale(1.2);
        
        // Adjust collision body size to match new visual size
        const width = this.player.width;
        const height = this.player.height;
        this.player.body.setSize(width * 0.8, height * 0.9);
        this.player.body.setOffset(width * 0.1, height * 0.1);
        
        // Add double jump tracking variables
        this.canDoubleJump = false;
        this.hasDoubleJumped = false;
        
        // Optional: visual effect for double jump
        this.doubleJumpParticles = this.add.particles('coin'); // Reuse the coin sprite
        this.doubleJumpEmitter = this.doubleJumpParticles.createEmitter({
            scale: { start: 0.2, end: 0 },
            speed: { min: 50, max: 100 },
            angle: { min: -120, max: -60 },
            quantity: 8,
            lifespan: 400,
            on: false
        });
        
        // Camera follows player
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        this.cameras.main.setBounds(0, 0, 800, 480);
        
        // Add colliders
        this.physics.add.collider(this.player, this.platforms);
        this.physics.add.collider(this.player, this.bricks);
        this.physics.add.collider(this.player, this.pipes);
        this.physics.add.collider(this.coins, this.platforms);
        this.physics.add.collider(this.coins, this.bricks);
        this.physics.add.collider(this.goombas, this.platforms);
        this.physics.add.collider(this.goombas, this.pipes);
        
        // Coin collection
        this.physics.add.overlap(this.player, this.coins, this.collectCoin, null, this);
        
        // Enemy collision
        this.physics.add.collider(this.player, this.goombas, this.hitGoomba, null, this);
        
        // Setup controls
        this.cursors = this.input.keyboard.createCursorKeys();
        
        // Add score text
        this.scoreText = this.add.text(16, 16, 'Score: 0', {
            fontSize: '32px',
            fill: '#fff',
            fontFamily: 'Arial'
        }).setScrollFactor(0);
        
        // Initialize sound with fallbacks
        this.initSounds();
        
        // Add an instruction text for double jump
        this.jumpInstruction = this.add.text(16, 50, 'Press ↑ twice to DOUBLE JUMP!', {
            fontSize: '18px',
            fill: '#fff',
            stroke: '#000',
            strokeThickness: 4,
            fontFamily: "'Press Start 2P', 'Courier New', monospace"
        });
        this.jumpInstruction.setScrollFactor(0); // Fix to camera
        
        // Fade out instruction after 8 seconds
        this.time.delayedCall(8000, () => {
            this.tweens.add({
                targets: this.jumpInstruction,
                alpha: 0,
                duration: 1000,
                ease: 'Power2'
            });
        });
    }
    
    initSounds() {
        try {
            // Check if sounds exist in cache
            const jumpExists = this.cache.audio.exists('jump');
            const coinExists = this.cache.audio.exists('coin');
            const gameOverExists = this.cache.audio.exists('game-over');
            
            console.log(`GameScene sound check - Jump: ${jumpExists}, Coin: ${coinExists}, Game Over: ${gameOverExists}`);
            
            // Only add sounds that exist
            if (jumpExists) this.jumpSound = this.sound.add('jump');
            if (coinExists) this.coinSound = this.sound.add('coin');
            if (gameOverExists) this.gameOverSound = this.sound.add('game-over');
        } catch (e) {
            console.warn("Could not initialize all game sounds:", e);
        }
    }
    
    update() {
        if (this.gameOver) {
            return;
        }
        
        // Handle player movement
        if (this.cursors.left.isDown) {
            this.player.setVelocityX(-160);
            this.player.flipX = true;
            this.player.anims.play('luigi-run', true);
        } else if (this.cursors.right.isDown) {
            this.player.setVelocityX(160);
            this.player.flipX = false;
            this.player.anims.play('luigi-run', true);
        } else {
            this.player.setVelocityX(0);
            this.player.anims.play('luigi-idle', true);
        }
        
        // Check if player is on the ground and reset double jump ability
        if (this.player.body.touching.down) {
            this.canDoubleJump = true;
            this.hasDoubleJumped = false;
        }
        
        // Check for jump button press (using justDown for better control)
        const jumpKeyJustPressed = Phaser.Input.Keyboard.JustDown(this.cursors.up);
        
        // Handle jumping with double jump
        if (jumpKeyJustPressed) {
            if (this.player.body.touching.down) {
                // First jump (from ground)
                this.player.setVelocityY(-400);
                this.canDoubleJump = true;
                
                // Play jump sound
                if (window.CustomAudio && window.CustomAudio.sounds.jump) {
                    window.CustomAudio.sounds.jump.play();
                }
            } 
            else if (this.canDoubleJump && !this.hasDoubleJumped) {
                // Double jump (in mid-air)
                this.player.setVelocityY(-350);
                this.hasDoubleJumped = true;
                this.canDoubleJump = false;
                
                // Visual effect for double jump
                this.doubleJumpEmitter.setPosition(this.player.x, this.player.y + 20);
                this.doubleJumpEmitter.explode();
                
                // Play jump sound at higher pitch for double jump
                if (window.CustomAudio && window.CustomAudio.sounds.jump) {
                    // If we could modify pitch, we would do it here
                    window.CustomAudio.sounds.jump.play();
                }
            }
        }
        
        // Variable jump height based on button hold time
        if (this.player.body.velocity.y < 0 && !this.cursors.up.isDown) {
            // If player releases jump button while going up, reduce upward velocity
            // This creates more responsive jump control
            this.player.body.velocity.y *= 0.85;
        }
        
        // Handle enemy movement
        this.goombas.children.iterate((goomba) => {
            // Change direction when hitting world bounds
            if (goomba.body.blocked.right) {
                goomba.setVelocityX(-50);
            } else if (goomba.body.blocked.left) {
                goomba.setVelocityX(50);
            }
        });
        
        // Wall jump detection - check if player is touching a wall but not the ground
        const touchingWall = (this.player.body.touching.left || this.player.body.touching.right);
        const playerDirection = this.player.body.touching.right ? -1 : 1; // Jump away from wall
        
        if (touchingWall && !this.player.body.touching.down) {
            // Allow wall jump even if double jump was used
            this.canDoubleJump = true;
            
            // Small sliding effect when on wall
            if (this.player.body.velocity.y > 0) {
                this.player.body.velocity.y = 100; // Slow descent when on wall
            }
            
            // Wall jump
            if (jumpKeyJustPressed) {
                // Push away from wall
                this.player.setVelocityY(-350);
                this.player.setVelocityX(200 * playerDirection);
                
                // Visual effect
                this.doubleJumpEmitter.setPosition(this.player.x - (10 * playerDirection), this.player.y);
                this.doubleJumpEmitter.explode();
                
                // Play jump sound
                if (window.CustomAudio && window.CustomAudio.sounds.jump) {
                    window.CustomAudio.sounds.jump.play();
                }
            }
        }
    }
    
    collectCoin(player, coin) {
        coin.disableBody(true, true);
        this.score += 10;
        this.scoreText.setText('Score: ' + this.score);
        
        // Use our custom audio system
        if (window.CustomAudio && window.CustomAudio.sounds.coin) {
            window.CustomAudio.sounds.coin.play();
        }
        
        // Win condition
        if (this.coins.countActive(true) === 0) {
            this.add.text(400, 240, 'YOU WIN!', {
                fontSize: '64px',
                fill: '#fff',
                fontFamily: 'Arial'
            }).setOrigin(0.5).setScrollFactor(0);
            
            // Reset button
            const resetButton = this.add.text(400, 320, 'Play Again', {
                fontSize: '32px',
                fill: '#fff',
                fontFamily: 'Arial'
            }).setOrigin(0.5).setScrollFactor(0).setInteractive();
            
            resetButton.on('pointerdown', () => {
                this.scene.restart();
            });
            
            this.physics.pause();
            this.gameOver = true;
        }
    }
    
    hitGoomba(player, goomba) {
        if (player.body.touching.down && goomba.body.touching.up) {
            // Player jumped on enemy
            goomba.disableBody(true, true);
            this.score += 20;
            this.scoreText.setText('Score: ' + this.score);
            player.setVelocityY(-300);
        } else {
            // Player hit enemy
            this.physics.pause();
            
            player.setTint(0xff0000);
            player.anims.play('luigi-idle');
            
            this.gameOver = true;
            
            // Use our custom audio system
            if (window.CustomAudio && window.CustomAudio.sounds['game-over']) {
                window.CustomAudio.sounds['game-over'].play();
            }
            
            // Game over text
            this.add.text(400, 240, 'GAME OVER', {
                fontSize: '64px',
                fill: '#fff',
                fontFamily: 'Arial'
            }).setOrigin(0.5).setScrollFactor(0);
            
            // Reset button
            const resetButton = this.add.text(400, 320, 'Try Again', {
                fontSize: '32px',
                fill: '#fff',
                fontFamily: 'Arial'
            }).setOrigin(0.5).setScrollFactor(0).setInteractive();
            
            resetButton.on('pointerdown', () => {
                this.scene.restart();
                this.sound.stopAll();
            });
        }
    }
} 