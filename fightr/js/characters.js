// Character class definition
class Character {
    constructor(config) {
        this.name = config.name;
        this.sprite = config.sprite;
        this.width = config.width || 100;
        this.height = config.height || 200;
        this.health = 100;
        this.maxHealth = 100;
        this.x = config.x || 0;
        this.y = config.y || 0;
        this.speed = config.speed || 5;
        this.jumpPower = config.jumpPower || 15;
        this.gravity = 0.8;
        this.velocityY = 0;
        this.velocityX = 0; // Horizontal velocity
        this.isJumping = false;
        this.isGrounded = true;
        this.isBlocking = false;
        this.isFacingRight = config.isFacingRight || true;
        this.isAttacking = false;
        this.attackCooldown = 0;
        this.specialCooldown = 0;
        this.hitboxes = config.hitboxes || {
            punch: { x: 50, y: 50, width: 50, height: 30 },
            kick: { x: 50, y: 100, width: 60, height: 40 },
            special: { x: 0, y: 50, width: 100, height: 100 }
        };
        
        // Animation states
        this.currentState = 'idle';
        this.frameCount = 0;
        this.frameTick = 0;
        this.frameDelay = 5;  // Frames to wait before updating animation
        
        // Attack properties
        this.attacks = {
            punch: {
                damage: config.attacks?.punch?.damage || 5,
                frameCount: config.attacks?.punch?.frameCount || 5,
                hitFrame: config.attacks?.punch?.hitFrame || 2,
                cooldown: config.attacks?.punch?.cooldown || 10
            },
            kick: {
                damage: config.attacks?.kick?.damage || 8,
                frameCount: config.attacks?.kick?.frameCount || 8,
                hitFrame: config.attacks?.kick?.hitFrame || 4,
                cooldown: config.attacks?.kick?.cooldown || 15
            },
            special: {
                damage: config.attacks?.special?.damage || 15,
                frameCount: config.attacks?.special?.frameCount || 12,
                hitFrame: config.attacks?.special?.hitFrame || 6,
                cooldown: config.attacks?.special?.cooldown || 30
            }
        };
        
        // Load sprites
        this.sprites = {
            idle: [],
            walk: [],
            jump: [],
            fall: [],
            punch: [],
            kick: [],
            special: [],
            block: [],
            hit: [],
            win: [],
            lose: []
        };
        
        // This would normally load images, but we'll use placeholders for now
        this.loadSprites();
    }
    
    loadSprites() {
        // In a real implementation, this would load sprite images
        // For now, we'll just create placeholders
        const states = ['idle', 'walk', 'jump', 'fall', 'punch', 'kick', 'special', 'block', 'hit', 'win', 'lose'];
        
        // For each animation state, create a placeholder array of colors
        states.forEach(state => {
            const frameCount = state === 'punch' ? this.attacks.punch.frameCount :
                              state === 'kick' ? this.attacks.kick.frameCount :
                              state === 'special' ? this.attacks.special.frameCount : 6;
                              
            this.sprites[state] = Array(frameCount).fill().map(() => this.getRandomColor());
        });
    }
    
    getRandomColor() {
        // For placeholder sprites, generate random colors
        return `#${Math.floor(Math.random()*16777215).toString(16)}`;
    }
    
    update() {
        // Apply gravity
        if (!this.isGrounded) {
            this.velocityY += this.gravity;
            this.y += this.velocityY;
            
            // Check if landed
            if (this.y >= 350) {  // Ground level
                this.y = 350;
                this.isGrounded = true;
                this.isJumping = false;
                this.velocityY = 0;
            }
        }
        
        // Apply horizontal movement
        this.x += this.velocityX;
        
        // Update animation frame
        this.frameTick++;
        if (this.frameTick >= this.frameDelay) {
            this.frameTick = 0;
            this.frameCount = (this.frameCount + 1) % this.sprites[this.currentState].length;
            
            // If an attack animation completes, return to idle
            if (this.isAttacking && this.currentState.match(/punch|kick|special/) && 
                this.frameCount === 0) {
                this.isAttacking = false;
                console.log(`${this.name} finished attack animation, can move again`);
            }
        }
        
        // Update attack cooldowns
        if (this.attackCooldown > 0) {
            this.attackCooldown--;
            if (this.attackCooldown === 0 && !this.isAttacking) {
                this.isAttacking = false;
            }
        }
        
        if (this.specialCooldown > 0) {
            this.specialCooldown--;
        }
        
        // Update animation state
        this.updateAnimationState();
    }
    
    updateAnimationState() {
        // Track previous state for debugging
        const previousState = this.currentState;
        
        // Determine current animation state based on character state
        if (this.isAttacking) {
            // Keep current attack animation running until completed
            // Don't change state while attacking
            return;
        }
        
        if (this.isBlocking) {
            this.currentState = 'block';
        } else if (!this.isGrounded) {
            this.currentState = this.velocityY < 0 ? 'jump' : 'fall';
        } else if (Math.abs(this.velocityX) > 0) {
            this.currentState = 'walk';
        } else {
            this.currentState = 'idle';
        }
        
        // Debug state changes
        if (previousState !== this.currentState) {
            console.log(`${this.name} state change: ${previousState} -> ${this.currentState}`);
        }
    }
    
    moveLeft() {
        if (this.isAttacking || this.isBlocking) {
            console.log(`${this.name} can't move left: ${this.isAttacking ? 'attacking' : 'blocking'}`);
            return;
        }
        console.log(`${this.name} moving left`);
        this.x -= this.speed;
        this.isFacingRight = false;
        this.velocityX = -this.speed;
    }
    
    moveRight() {
        if (this.isAttacking || this.isBlocking) {
            console.log(`${this.name} can't move right: ${this.isAttacking ? 'attacking' : 'blocking'}`);
            return;
        }
        console.log(`${this.name} moving right`);
        this.x += this.speed;
        this.isFacingRight = true;
        this.velocityX = this.speed;
    }
    
    stopMoving() {
        this.velocityX = 0;
    }
    
    jump() {
        if (this.isGrounded && !this.isAttacking && !this.isBlocking) {
            this.velocityY = -this.jumpPower;
            this.isGrounded = false;
            this.isJumping = true;
        }
    }
    
    startBlock() {
        if (!this.isAttacking && this.isGrounded) {
            this.isBlocking = true;
            this.currentState = 'block';
        }
    }
    
    endBlock() {
        this.isBlocking = false;
    }
    
    punch() {
        if (!this.isAttacking && !this.isBlocking && this.attackCooldown === 0) {
            this.isAttacking = true;
            this.currentState = 'punch';
            this.frameCount = 0;
            this.attackCooldown = this.attacks.punch.cooldown;
            
            // Safety timeout to ensure isAttacking flag gets cleared
            setTimeout(() => {
                if (this.isAttacking && this.currentState === 'punch') {
                    console.log(`${this.name} punch safety timeout triggered`);
                    this.isAttacking = false;
                }
            }, 500); // 500ms should be enough for any attack animation
        }
    }
    
    kick() {
        if (!this.isAttacking && !this.isBlocking && this.attackCooldown === 0) {
            this.isAttacking = true;
            this.currentState = 'kick';
            this.frameCount = 0;
            this.attackCooldown = this.attacks.kick.cooldown;
            
            // Safety timeout to ensure isAttacking flag gets cleared
            setTimeout(() => {
                if (this.isAttacking && this.currentState === 'kick') {
                    console.log(`${this.name} kick safety timeout triggered`);
                    this.isAttacking = false;
                }
            }, 500);
        }
    }
    
    special() {
        if (!this.isAttacking && !this.isBlocking && this.attackCooldown === 0 && this.specialCooldown === 0) {
            this.isAttacking = true;
            this.currentState = 'special';
            this.frameCount = 0;
            this.attackCooldown = this.attacks.special.cooldown;
            this.specialCooldown = 60;  // 1 second at 60 FPS
            
            // Safety timeout to ensure isAttacking flag gets cleared
            setTimeout(() => {
                if (this.isAttacking && this.currentState === 'special') {
                    console.log(`${this.name} special attack safety timeout triggered`);
                    this.isAttacking = false;
                }
            }, 1000); // 1000ms for special which may be longer
        }
    }
    
    takeDamage(amount, isBlocked = false) {
        if (isBlocked) {
            amount = Math.floor(amount / 5);  // Blocked attacks do 20% damage
            console.log(`${this.name} BLOCKED damage, only taking ${amount} damage`);
        } else {
            console.log(`${this.name} taking ${amount} damage`);
        }
        
        this.health = Math.max(0, this.health - amount);
        
        if (!isBlocked) {
            // Set hit state briefly
            this.currentState = 'hit';
            this.isAttacking = false; // Cancel any attack in progress
            
            // Ensure hit state is cleared after a short time
            setTimeout(() => {
                if (this.currentState === 'hit') {
                    console.log(`${this.name} recovering from hit state`);
                    this.currentState = 'idle';
                }
            }, 300);
        }
        
        return this.health;
    }
    
    reset(x) {
        console.log(`Resetting character: ${this.name}`);
        
        // Reset position
        this.x = x;
        this.y = 350;  // Ground level
        
        // Reset health
        this.health = this.maxHealth;
        
        // Reset state flags
        this.isGrounded = true;
        this.isJumping = false;
        this.isBlocking = false;
        this.isAttacking = false;
        
        // Reset velocities
        this.velocityX = 0;
        this.velocityY = 0;
        
        // Reset cooldowns
        this.attackCooldown = 0;
        this.specialCooldown = 0;
        
        // Reset animation state
        this.currentState = 'idle';
        this.frameCount = 0;
        this.frameTick = 0;
        
        console.log(`Character ${this.name} reset complete`);
    }
    
    drawHitbox(ctx, hitbox) {
        if (!this.isAttacking) return;
        
        // Only show hitbox on hit frames
        let isHitFrame = false;
        if (this.currentState === 'punch' && this.frameCount === this.attacks.punch.hitFrame) {
            isHitFrame = true;
        } else if (this.currentState === 'kick' && this.frameCount === this.attacks.kick.hitFrame) {
            isHitFrame = true;
        } else if (this.currentState === 'special' && this.frameCount === this.attacks.special.hitFrame) {
            isHitFrame = true;
        }
        
        if (!isHitFrame) return;
        
        // Draw hitbox (for debugging)
        const flipMultiplier = this.isFacingRight ? 1 : -1;
        const hitboxX = this.x + (this.isFacingRight ? hitbox.x : -hitbox.x - hitbox.width);
        
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.7)';
        ctx.lineWidth = 2;
        ctx.strokeRect(hitboxX, this.y + hitbox.y, hitbox.width, hitbox.height);
    }
    
    getCurrentHitbox() {
        if (!this.isAttacking) return null;
        
        // Only return hitbox on hit frames
        let hitbox = null;
        let isHitFrame = false;
        
        if (this.currentState === 'punch' && this.frameCount === this.attacks.punch.hitFrame) {
            hitbox = this.hitboxes.punch;
            isHitFrame = true;
        } else if (this.currentState === 'kick' && this.frameCount === this.attacks.kick.hitFrame) {
            hitbox = this.hitboxes.kick;
            isHitFrame = true;
        } else if (this.currentState === 'special' && this.frameCount === this.attacks.special.hitFrame) {
            hitbox = this.hitboxes.special;
            isHitFrame = true;
        }
        
        if (!isHitFrame) return null;
        
        // Return hitbox with world coordinates
        const baseX = this.isFacingRight ? this.x : this.x - this.width;
        
        return {
            x: baseX + (this.isFacingRight ? hitbox.x : this.width - hitbox.x - hitbox.width),
            y: this.y + hitbox.y,
            width: hitbox.width,
            height: hitbox.height,
            damage: this.currentState === 'punch' ? this.attacks.punch.damage :
                    this.currentState === 'kick' ? this.attacks.kick.damage :
                    this.attacks.special.damage
        };
    }
    
    draw(ctx) {
        // Get current sprite color
        const color = this.sprites[this.currentState][this.frameCount];
        
        // Draw character
        ctx.fillStyle = color;
        const width = this.width;
        const height = this.height;
        
        // Draw with proper facing
        const baseX = this.isFacingRight ? this.x : this.x - width;
        ctx.fillRect(baseX, this.y, width, height);
        
        // Draw character outline for visibility
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.strokeRect(baseX, this.y, width, height);
        
        // Draw a center point for reference
        ctx.fillStyle = 'yellow';
        ctx.beginPath();
        ctx.arc(this.x, this.y + height/2, 5, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw hitboxes for debug purposes
        if (this.isAttacking) {
            const hitbox = this.hitboxes[this.currentState === 'punch' ? 'punch' :
                                        this.currentState === 'kick' ? 'kick' : 'special'];
                                        
            // Get the current hitbox with world coordinates
            const currentHitbox = this.getCurrentHitbox();
            
            if (currentHitbox) {
                // Draw the attack hitbox
                ctx.strokeStyle = 'rgba(255, 0, 0, 0.7)';
                ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
                ctx.lineWidth = 2;
                ctx.strokeRect(currentHitbox.x, currentHitbox.y, currentHitbox.width, currentHitbox.height);
                ctx.fillRect(currentHitbox.x, currentHitbox.y, currentHitbox.width, currentHitbox.height);
                
                // Draw a label for the damage
                ctx.fillStyle = 'white';
                ctx.font = '14px Arial';
                ctx.fillText(`${currentHitbox.damage}`, currentHitbox.x + currentHitbox.width/2 - 5, 
                            currentHitbox.y - 5);
            }
        }
        
        // Draw state label
        ctx.fillStyle = 'white';
        ctx.font = '12px Arial';
        ctx.fillText(this.currentState, baseX + width/2 - 15, this.y - 10);
        
        // Draw health for debugging
        ctx.fillStyle = this.health > 50 ? 'lime' : 'red';
        ctx.font = '14px Arial';
        ctx.fillText(`HP: ${Math.floor(this.health)}`, baseX + width/2 - 20, this.y - 25);
    }
}

// Define the characters
const CHARACTERS = {
    ninja: {
        name: 'Ninja',
        sprite: 'ninja',
        width: 70,
        height: 180,
        speed: 6,
        jumpPower: 18,
        attacks: {
            punch: { damage: 4, frameCount: 5, hitFrame: 2, cooldown: 8 },
            kick: { damage: 7, frameCount: 6, hitFrame: 3, cooldown: 12 },
            special: { damage: 14, frameCount: 10, hitFrame: 5, cooldown: 24 }
        },
        hitboxes: {
            punch: { x: 35, y: 50, width: 40, height: 20 },
            kick: { x: 40, y: 120, width: 50, height: 25 },
            special: { x: 0, y: 0, width: 120, height: 180 }
        }
    },
    samurai: {
        name: 'Samurai',
        sprite: 'samurai',
        width: 85,
        height: 190,
        speed: 4,
        jumpPower: 15,
        attacks: {
            punch: { damage: 6, frameCount: 6, hitFrame: 3, cooldown: 10 },
            kick: { damage: 9, frameCount: 8, hitFrame: 4, cooldown: 15 },
            special: { damage: 18, frameCount: 12, hitFrame: 7, cooldown: 30 }
        },
        hitboxes: {
            punch: { x: 45, y: 60, width: 55, height: 30 },
            kick: { x: 50, y: 130, width: 60, height: 35 },
            special: { x: 0, y: 50, width: 150, height: 80 }
        }
    },
    monk: {
        name: 'Monk',
        sprite: 'monk',
        width: 75,
        height: 175,
        speed: 5,
        jumpPower: 20,
        attacks: {
            punch: { damage: 5, frameCount: 4, hitFrame: 2, cooldown: 7 },
            kick: { damage: 8, frameCount: 5, hitFrame: 3, cooldown: 10 },
            special: { damage: 12, frameCount: 8, hitFrame: 4, cooldown: 20 }
        },
        hitboxes: {
            punch: { x: 40, y: 55, width: 35, height: 25 },
            kick: { x: 45, y: 110, width: 45, height: 30 },
            special: { x: 20, y: 40, width: 100, height: 100 }
        }
    },
    ronin: {
        name: 'Ronin',
        sprite: 'ronin',
        width: 80,
        height: 185,
        speed: 5.5,
        jumpPower: 16,
        attacks: {
            punch: { damage: 5, frameCount: 5, hitFrame: 2, cooldown: 9 },
            kick: { damage: 8, frameCount: 7, hitFrame: 3, cooldown: 13 },
            special: { damage: 16, frameCount: 10, hitFrame: 6, cooldown: 28 }
        },
        hitboxes: {
            punch: { x: 40, y: 55, width: 45, height: 25 },
            kick: { x: 45, y: 120, width: 55, height: 30 },
            special: { x: 10, y: 30, width: 130, height: 70 }
        }
    }
}; 