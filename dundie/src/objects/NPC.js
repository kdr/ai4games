import Phaser from 'phaser';

export default class NPC extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, texture, name, dialogues) {
        super(scene, x, y, texture);
        
        // Add NPC to the scene
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        // Configure physics
        this.body.setImmovable(false);
        this.body.setSize(16, 16);
        this.body.setOffset(8, 16);
        this.body.mass = 2;
        this.setCollideWorldBounds(true);
        this.body.setBounce(0.1);
        this.setDamping(true);
        this.body.setDrag(0.95, 0.95);
        
        // NPC properties
        this.name = name;
        this.dialogues = dialogues || [
            `Hi, I'm ${name}.`,
            `This is Dunder Mifflin.`
        ];
        this.currentDialogIndex = 0;
        
        // State
        this.direction = 'down';
        this.isInteracting = false;
        
        // Display idle animation
        this.anims.play(`${this.texture.key}_idle_${this.direction}`, true);
    }
    
    update() {
        // NPCs could have simple behaviors here, like random movement or routines
        if (!this.isInteracting) {
            // Check if NPC is being pushed/moving
            if (Math.abs(this.body.velocity.x) > 10 || Math.abs(this.body.velocity.y) > 10) {
                // Determine direction based on velocity
                if (Math.abs(this.body.velocity.x) > Math.abs(this.body.velocity.y)) {
                    this.direction = this.body.velocity.x > 0 ? 'right' : 'left';
                } else {
                    this.direction = this.body.velocity.y > 0 ? 'down' : 'up';
                }
                
                // Play walking animation in the direction of movement
                this.anims.play(`${this.texture.key}_walk_${this.direction}`, true);
            } else {
                // Just display idle animation when not moving
                this.anims.play(`${this.texture.key}_idle_${this.direction}`, true);
            }
        }
    }
    
    // When player interacts with this NPC
    interact() {
        this.isInteracting = true;
        
        // Look at the player (assume player is below NPC for now)
        this.direction = 'down';
        this.anims.play(`${this.texture.key}_idle_${this.direction}`, true);
        
        // Return current dialogue
        const dialogue = this.dialogues[this.currentDialogIndex];
        
        // Move to next dialogue for next interaction
        this.currentDialogIndex = (this.currentDialogIndex + 1) % this.dialogues.length;
        
        return dialogue;
    }
    
    stopInteraction() {
        this.isInteracting = false;
    }
    
    // Set the direction to face
    faceDirection(direction) {
        this.direction = direction;
        this.anims.play(`${this.texture.key}_idle_${this.direction}`, true);
    }
    
    // Set NPC to face another game object (like the player)
    faceObject(object) {
        const dx = object.x - this.x;
        const dy = object.y - this.y;
        
        // Determine which direction has the largest component
        if (Math.abs(dx) > Math.abs(dy)) {
            this.faceDirection(dx > 0 ? 'right' : 'left');
        } else {
            this.faceDirection(dy > 0 ? 'down' : 'up');
        }
    }
} 