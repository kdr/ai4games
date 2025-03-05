import Phaser from 'phaser';

export default class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, texture) {
        super(scene, x, y, texture);
        
        // Add player to the scene
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        // Configure physics
        this.setCollideWorldBounds(true);
        this.body.setSize(16, 16);
        this.body.setOffset(8, 16);
        
        // Player state
        this.speed = 100;
        this.direction = 'down';
        this.isInteracting = false;
        
        // Input keys
        this.cursors = scene.input.keyboard.createCursorKeys();
        this.interactKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    }
    
    update() {
        if (this.isInteracting) return;
        
        // Reset velocity
        this.setVelocity(0);
        
        // Handle movement
        if (this.cursors.left.isDown) {
            this.setVelocityX(-this.speed);
            this.direction = 'left';
            this.anims.play(`${this.texture.key}_walk_left`, true);
        } else if (this.cursors.right.isDown) {
            this.setVelocityX(this.speed);
            this.direction = 'right';
            this.anims.play(`${this.texture.key}_walk_right`, true);
        } else if (this.cursors.up.isDown) {
            this.setVelocityY(-this.speed);
            this.direction = 'up';
            this.anims.play(`${this.texture.key}_walk_up`, true);
        } else if (this.cursors.down.isDown) {
            this.setVelocityY(this.speed);
            this.direction = 'down';
            this.anims.play(`${this.texture.key}_walk_down`, true);
        } else {
            // Idle animation
            this.anims.play(`${this.texture.key}_idle_${this.direction}`, true);
        }
        
        // Diagonal movement speed normalization
        if (this.body.velocity.x !== 0 && this.body.velocity.y !== 0) {
            this.body.velocity.normalize().scale(this.speed);
        }
    }
    
    startInteraction() {
        this.isInteracting = true;
        this.setVelocity(0);
        this.anims.play(`${this.texture.key}_idle_${this.direction}`, true);
    }
    
    stopInteraction() {
        this.isInteracting = false;
    }
    
    // Get interaction point (the position in front of the player)
    getInteractionPoint() {
        const x = this.x;
        const y = this.y;
        
        switch (this.direction) {
            case 'up':
                return { x, y: y - 32 };
            case 'down':
                return { x, y: y + 32 };
            case 'left':
                return { x: x - 32, y };
            case 'right':
                return { x: x + 32, y };
            default:
                return { x, y };
        }
    }
} 