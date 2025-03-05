// Character class definition
function Character(options = {}) {
    // Set default values for properties
    this.name = options.name || 'Fighter';
    this.x = options.x || 200;
    this.y = options.y || 350;
    this.width = options.width || 80;
    this.height = options.height || 150;
    this.speed = options.speed || 5;
    this.jumpPower = options.jumpPower || 15;
    this.gravity = options.gravity || 0.8;
    this.health = options.health || 100;
    this.maxHealth = options.maxHealth || 100;
    
    // State flags
    this.isGrounded = true;
    this.isJumping = false;
    this.isBlocking = false;
    this.isFacingRight = options.isFacingRight !== undefined ? options.isFacingRight : true;
    this.isAttacking = false;
    
    // Velocity
    this.vx = 0;
    this.vy = 0;
    
    // Attack definitions
    this.attacks = {
        punch: {
            damage: 10,
            frameCount: 5,
            hitFrame: 2,
            cooldown: 30,
            hitbox: { x: 50, y: 40, width: 40, height: 20 }
        },
        
        kick: {
            damage: 15,
            frameCount: 6,
            hitFrame: 3,
            cooldown: 45,
            hitbox: { x: 40, y: 90, width: 55, height: 30 }
        },
        
        special: {
            damage: 30,
            frameCount: 8,
            hitFrame: 5,
            cooldown: 60,
            hitbox: { x: 20, y: 30, width: 80, height: 80 }
        }
    };
    
    // For backwards compatibility
    this.punch = this.attacks.punch;
    this.kick = this.attacks.kick;
    this.special = this.attacks.special;
    
    // Attack state tracking
    this.attackType = null;      // Current attack type ('punch', 'kick', 'special')
    this.attackFrame = 0;        // Current frame in attack animation
    this.attackCooldown = 0;     // Cooldown counter before next attack
    
    // Animation states
    this.currentState = 'idle';
    this.animationFrame = 0;
    this.frameCooldown = 5;
    
    // Dictionary to hold sprites
    this.sprites = {};
    this.spriteLoaded = false;
    
    // Connect to health display element
    this.healthElement = null;
    
    console.log(`Character ${this.name} created with hitboxes:`, 
                `punch: ${JSON.stringify(this.attacks.punch.hitbox)}`,
                `kick: ${JSON.stringify(this.attacks.kick.hitbox)}`,
                `special: ${JSON.stringify(this.attacks.special.hitbox)}`);
    
    // Load sprite images
    this.loadSprites();
}

Character.prototype.loadSprites = function() {
    console.log(`Loading sprites for ${this.name}...`);
    
    // Dictionary of sprites
    this.sprites = {};
    const states = ['idle', 'walk', 'jump', 'fall', 'punch', 'kick', 'special', 'block', 'hit', 'win', 'lose'];
    
    // For each animation state, load its sprite sheet
    states.forEach(state => {
        // Get correct frame count for this state
        let frameCount = 6; // Default frame count
        
        // Set specific frame counts for attack animations
        if (state === 'punch' && this.attacks.punch) {
            frameCount = this.attacks.punch.frameCount;
        } else if (state === 'kick' && this.attacks.kick) {
            frameCount = this.attacks.kick.frameCount;
        } else if (state === 'special' && this.attacks.special) {
            frameCount = this.attacks.special.frameCount;
        } else if (state === 'hit') {
            frameCount = 3;
        }
        
        console.log(`Setting up sprite for ${this.name} - ${state} (${frameCount} frames)`);
        
        // Initialize sprite object
        this.sprites[state] = {
            frameCount: frameCount,
            image: new Image(),
            frames: [],
            loaded: false
        };
        
        // Attempt to use pregenerated assets first
        if (window.gameAssets) {
            // Check for sprite directly in gameAssets
            const assetKey = `${this.name.toLowerCase()}_${state}`;
            if (window.gameAssets[assetKey]) {
                console.log(`Using pre-generated asset for ${this.name} - ${state}`);
                this.sprites[state].image = window.gameAssets[assetKey];
                this.sprites[state].loaded = true;
                return;
            }
            
            // Check using the expected file path pattern
            const assetPath = `assets/sprites/${this.name.toLowerCase()}/${state}.png`;
            if (window.gameAssets[assetPath]) {
                console.log(`Using pre-generated asset at path: ${assetPath}`);
                this.sprites[state].image = window.gameAssets[assetPath];
                this.sprites[state].loaded = true;
                return;
            }
        }
        
        // Create a fallback color for this state
        const characterNameSeed = this.name.charCodeAt(0) * 100 + this.name.length;
        let hue, saturation, lightness;
        
        switch (state) {
            case 'punch':
                hue = (characterNameSeed + 30) % 360;
                saturation = 70;
                lightness = 60;
                break;
            case 'kick':
                hue = (characterNameSeed + 90) % 360;
                saturation = 80;
                lightness = 55;
                break;
            case 'special':
                hue = (characterNameSeed + 150) % 360;
                saturation = 90;
                lightness = 50;
                break;
            case 'block':
                hue = (characterNameSeed + 210) % 360;
                saturation = 40;
                lightness = 60;
                break;
            case 'hit':
                hue = (characterNameSeed + 0) % 360;
                saturation = 80;
                lightness = 70;
                break;
            default:
                hue = characterNameSeed % 360;
                saturation = 60;
                lightness = 65;
        }
        
        const baseColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
        
        // Create fallback frames as colored rectangles
        for (let i = 0; i < frameCount; i++) {
            // Create a canvas to draw the colored rectangle
            const canvas = document.createElement('canvas');
            canvas.width = this.width;
            canvas.height = this.height;
            const ctx = canvas.getContext('2d');
            
            // Draw a colored rectangle
            ctx.fillStyle = baseColor;
            ctx.fillRect(0, 0, this.width, this.height);
            
            // Draw frame number
            ctx.fillStyle = 'white';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`${this.name}`, this.width/2, 30);
            ctx.fillText(`${state} ${i+1}/${frameCount}`, this.width/2, this.height - 20);
            
            // Save as a data URL
            this.sprites[state].frames[i] = canvas.toDataURL('image/png');
        }
        
        // Set the first frame as the default image
        const firstFrameImage = new Image();
        firstFrameImage.src = this.sprites[state].frames[0];
        this.sprites[state].image = firstFrameImage;
        this.sprites[state].loaded = true;
        
        console.log(`Created fallback frames for ${this.name} - ${state}`);
    });
    
    console.log(`Sprite loading complete for ${this.name}`);
};

// Helper method to adjust color brightness
Character.prototype.adjustColorBrightness = function(hex, factor) {
    // Convert hex to RGB
    let r = parseInt(hex.slice(1, 3), 16);
    let g = parseInt(hex.slice(3, 5), 16);
    let b = parseInt(hex.slice(5, 7), 16);
    
    // Adjust brightness
    r = Math.min(255, Math.round(r * factor));
    g = Math.min(255, Math.round(g * factor));
    b = Math.min(255, Math.round(b * factor));
    
    // Convert back to hex
    return `#${(r).toString(16).padStart(2, '0')}${(g).toString(16).padStart(2, '0')}${(b).toString(16).padStart(2, '0')}`;
}

Character.prototype.getRandomColor = function() {
    // For placeholder sprites, generate random colors
    return `#${Math.floor(Math.random()*16777215).toString(16)}`;
}

Character.prototype.update = function() {
    // Apply gravity if not on ground
    if (!this.isGrounded) {
        this.vy += this.gravity;
    }
    
    // Horizontal movement
    this.x += this.vx;
    
    // Vertical movement
    this.y += this.vy;
    
    // If we hit the ground, stop falling
    if (this.y > 350) {
        this.y = 350;
        this.vy = 0;
        this.isGrounded = true;
        this.isJumping = false;
    }
    
    // Handle attack cooldown
    if (this.attackCooldown > 0) {
        this.attackCooldown--;
    }
    
    // Handle attack animation
    if (this.isAttacking) {
        // Keep track of which frame we're on in the attack
        this.attackFrame++;
        
        // Check the attack type and get its frame count and hit frame
        const attackInfo = this.attacks[this.attackType];
        const totalFrames = attackInfo.frameCount;
        const hitFrame = attackInfo.hitFrame;
        
        // Log when we're on a hit frame
        if (this.attackFrame === hitFrame) {
            console.log(`${this.name} ${this.attackType} ACTIVE HIT FRAME`);
        }
        
        // If we've reached the end of the attack animation
        if (this.attackFrame >= totalFrames) {
            // End the attack
            this.isAttacking = false;
            this.attackType = null;
            
            console.log(`${this.name} attack animation complete`);
        }
    }
    
    // Advance animation frame
    this.frameCooldown--;
    if (this.frameCooldown <= 0) {
        this.animationFrame++;
        this.frameCooldown = 3; // Reset frame cooldown (smaller = faster animation)
    }
    
    // Update animation state based on current character state
    this.updateAnimationState();
}

Character.prototype.updateAnimationState = function() {
    let newState = 'idle';
    
    if (this.health <= 0) {
        newState = 'lose';
    } else if (this.isAttacking && this.attackType) {
        newState = this.attackType;
    } else if (this.isBlocking) {
        newState = 'block';
    } else if (this.isJumping) {
        newState = this.vy < 0 ? 'jump' : 'fall';
    } else if (this.vx !== 0) {
        newState = 'walk';
    }
    
    // Only log if state changes
    if (newState !== this.currentState) {
        console.log(`${this.name} animation state change: ${this.currentState} -> ${newState}`);
        this.currentState = newState;
    }
}

Character.prototype.moveLeft = function() {
    if (this.isAttacking || this.isBlocking) {
        console.log(`${this.name} can't move left: ${this.isAttacking ? 'attacking' : 'blocking'}`);
        return;
    }
    console.log(`${this.name} moving left`);
    this.x -= this.speed;
    this.isFacingRight = false;
    this.vx = -this.speed;
}

Character.prototype.moveRight = function() {
    if (this.isAttacking || this.isBlocking) {
        console.log(`${this.name} can't move right: ${this.isAttacking ? 'attacking' : 'blocking'}`);
        return;
    }
    console.log(`${this.name} moving right`);
    this.x += this.speed;
    this.isFacingRight = true;
    this.vx = this.speed;
}

Character.prototype.stopMoving = function() {
    this.vx = 0;
}

Character.prototype.jump = function() {
    if (this.isGrounded && !this.isAttacking && !this.isBlocking) {
        this.vy = -this.jumpPower;
        this.isGrounded = false;
        this.isJumping = true;
    }
}

Character.prototype.startBlock = function() {
    if (!this.isAttacking && this.isGrounded) {
        this.isBlocking = true;
        this.currentState = 'block';
    }
}

Character.prototype.endBlock = function() {
    this.isBlocking = false;
}

Character.prototype.punch = function() {
    // Check if we can start the attack
    if (this.isAttacking || this.isBlocking || this.attackCooldown > 0) {
        console.log(`${this.name} punch failed - already attacking, blocking, or on cooldown`);
        return false;
    }
    
    console.log(`${this.name} executing PUNCH attack`);
    
    // Set attack state
    this.isAttacking = true;
    this.attackType = 'punch';
    this.attackFrame = 0;
    this.animationFrame = 0; // Reset animation frame
    
    // Set cooldown
    this.attackCooldown = this.attacks.punch.cooldown;
    
    return true;
};

Character.prototype.kick = function() {
    // Check if we can start the attack
    if (this.isAttacking || this.isBlocking || this.attackCooldown > 0) {
        console.log(`${this.name} kick failed - already attacking, blocking, or on cooldown`);
        return false;
    }
    
    console.log(`${this.name} executing KICK attack`);
    
    // Set attack state
    this.isAttacking = true;
    this.attackType = 'kick';
    this.attackFrame = 0;
    this.animationFrame = 0; // Reset animation frame
    
    // Set cooldown
    this.attackCooldown = this.attacks.kick.cooldown;
    
    return true;
};

Character.prototype.special = function() {
    // Check if we can start the attack
    if (this.isAttacking || this.isBlocking || this.attackCooldown > 0) {
        console.log(`${this.name} special failed - already attacking, blocking, or on cooldown`);
        return false;
    }
    
    console.log(`${this.name} executing SPECIAL attack`);
    
    // Set attack state
    this.isAttacking = true;
    this.attackType = 'special';
    this.attackFrame = 0;
    this.animationFrame = 0; // Reset animation frame
    
    // Set cooldown
    this.attackCooldown = this.attacks.special.cooldown;
    
    return true;
};

Character.prototype.takeDamage = function(amount) {
    // Don't take damage if blocking (reduced damage) or attack is on cooldown
    if (this.isBlocking) {
        amount = Math.floor(amount * 0.3); // 70% damage reduction when blocking
        console.log(`${this.name} BLOCKED! Reduced damage to ${amount}`);
    }
    
    if (amount <= 0) {
        return; // No damage to apply
    }
    
    // Apply damage and update health
    this.health = Math.max(0, this.health - amount);
    
    console.log(`${this.name} took ${amount} damage! Health: ${this.health}/${this.maxHealth}`);
    
    // Update the health display
    if (this.healthElement) {
        // Update the health bar width based on current health percentage
        const healthPercent = (this.health / this.maxHealth) * 100;
        this.healthElement.style.width = healthPercent + '%';
        
        // Change color based on health remaining
        if (healthPercent < 20) {
            this.healthElement.style.backgroundColor = 'red';
        } else if (healthPercent < 50) {
            this.healthElement.style.backgroundColor = 'orange';
        }
        
        console.log(`Updated health display for ${this.name}: ${healthPercent}%`);
    } else {
        console.warn(`No health element found for ${this.name}`);
    }
    
    // Play hit animation
    this.playAnimation('hit');
    
    // Check if defeated
    if (this.health <= 0) {
        console.log(`${this.name} has been defeated!`);
        this.playAnimation('lose');
    }
}

Character.prototype.reset = function(x) {
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
    this.vx = 0;
    this.vy = 0;
    
    // Reset cooldowns
    this.frameCooldown = 0;
    
    // Reset animation state
    this.currentState = 'idle';
    this.animationFrame = 0;
    
    console.log(`Character ${this.name} reset complete`);
}

Character.prototype.drawHitbox = function(ctx, hitbox) {
    if (!this.isAttacking) return;
    
    // Only show hitbox on hit frames
    let isHitFrame = false;
    if (this.currentState === 'punch' && this.animationFrame === this.punch.hitFrame) {
        isHitFrame = true;
    } else if (this.currentState === 'kick' && this.animationFrame === this.kick.hitFrame) {
        isHitFrame = true;
    } else if (this.currentState === 'special' && this.animationFrame === this.special.hitFrame) {
        isHitFrame = true;
    }
    
    if (!isHitFrame) return;
    
    // Draw hitbox (for debugging)
    const flipMultiplier = this.isFacingRight ? 1 : -1;
    const hitboxX = this.x + (this.isFacingRight ? this.punch.hitbox.x : -this.punch.hitbox.x - this.punch.hitbox.width);
    
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.7)';
    ctx.lineWidth = 2;
    ctx.strokeRect(hitboxX, this.y + this.punch.hitbox.y, this.punch.hitbox.width, this.punch.hitbox.height);
}

Character.prototype.getCurrentHitbox = function() {
    // Only return a hitbox if we're attacking
    if (!this.isAttacking || !this.attackType) {
        return null;
    }
    
    // Get the attack information
    const attackInfo = this.attacks[this.attackType];
    
    // Check if we're on the hit frame for this attack
    if (this.attackFrame !== attackInfo.hitFrame) {
        return null;
    }
    
    console.log(`${this.name} ${this.attackType} HIT FRAME - generating hitbox`);
    
    // Get base hitbox from the attack definition
    const hitbox = attackInfo.hitbox;
    
    // Calculate world position of hitbox based on character position and facing direction
    let hitboxX;
    if (this.isFacingRight) {
        hitboxX = this.x + hitbox.x;
    } else {
        hitboxX = this.x - hitbox.x - hitbox.width;
    }
    
    // Return hitbox with world coordinates and damage
    const worldHitbox = {
        x: hitboxX,
        y: this.y + hitbox.y,
        width: hitbox.width,
        height: hitbox.height,
        damage: attackInfo.damage
    };
    
    console.log(`${this.name} hitbox at: (${worldHitbox.x}, ${worldHitbox.y}), size: ${worldHitbox.width}x${worldHitbox.height}, damage: ${worldHitbox.damage}`);
    
    return worldHitbox;
};

Character.prototype.draw = function(ctx) {
    console.log(`Drawing ${this.name} at x:${Math.round(this.x)}, y:${Math.round(this.y)}`);
    
    // GUARANTEED FALLBACK - always draw a colored rectangle regardless of sprites
    // Get a deterministic color based on character name
    let colorSeed = 0;
    for (let i = 0; i < this.name.length; i++) {
        colorSeed += this.name.charCodeAt(i);
    }
    
    const hue = (colorSeed * 137) % 360;
    const saturation = 70;
    const lightness = 50;
    
    // Draw character body
    ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    ctx.fillRect(this.x, this.y, this.width, this.height);
    
    // Draw character outline
    ctx.strokeStyle = "black";
    ctx.lineWidth = 3;
    ctx.strokeRect(this.x, this.y, this.width, this.height);
    
    // Draw character name
    ctx.fillStyle = 'white';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(this.name, this.x + this.width/2, this.y - 5);
    
    // Draw state info
    ctx.fillStyle = 'white'; 
    ctx.font = '12px Arial';
    ctx.fillText(this.currentState, this.x + this.width/2, this.y + this.height + 15);
    
    // Draw facing indicator
    const arrowLength = 20;
    const arrowX = this.x + this.width/2;
    const arrowY = this.y + this.height/2;
    const arrowEndX = arrowX + (this.isFacingRight ? arrowLength : -arrowLength);
    
    ctx.beginPath();
    ctx.moveTo(arrowX, arrowY);
    ctx.lineTo(arrowEndX, arrowY);
    ctx.strokeStyle = 'yellow';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Add arrowhead
    ctx.beginPath();
    if (this.isFacingRight) {
        ctx.moveTo(arrowEndX, arrowY);
        ctx.lineTo(arrowEndX - 5, arrowY - 5);
        ctx.lineTo(arrowEndX - 5, arrowY + 5);
    } else {
        ctx.moveTo(arrowEndX, arrowY);
        ctx.lineTo(arrowEndX + 5, arrowY - 5);
        ctx.lineTo(arrowEndX + 5, arrowY + 5);
    }
    ctx.fillStyle = 'yellow';
    ctx.fill();
    
    // Draw attack hitbox if attacking
    if (this.isAttacking && this.attackType) {
        const hitbox = this.getCurrentHitbox();
        if (hitbox) {
            ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
            ctx.fillRect(hitbox.x, hitbox.y, hitbox.width, hitbox.height);
            
            ctx.strokeStyle = 'red';
            ctx.lineWidth = 2;
            ctx.strokeRect(hitbox.x, hitbox.y, hitbox.width, hitbox.height);
            
            ctx.fillStyle = 'white';
            ctx.font = '12px Arial';
            ctx.fillText(`Damage: ${hitbox.damage}`, hitbox.x + hitbox.width/2, hitbox.y - 5);
        }
    }
    
    // Additional debug info if enabled
    if (window.DEBUG) {
        ctx.font = '10px Arial';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'left';
        const debugY = this.y + this.height + 30;
        ctx.fillText(`Health: ${this.health}/${this.maxHealth}`, this.x, debugY);
        ctx.fillText(`Position: (${Math.round(this.x)},${Math.round(this.y)})`, this.x, debugY + 15);
        ctx.fillText(`Velocity: (${Math.round(this.vx)},${Math.round(this.vy)})`, this.x, debugY + 30);
        
        if (this.isAttacking) {
            ctx.fillText(`Attack: ${this.attackType}, Frame: ${this.attackFrame}`, this.x, debugY + 45);
        }
    }
};

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