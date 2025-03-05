// Sprite generation utility
// This creates actual sprite images that the game can use

// Character colors
const characterColors = {
    ninja: '#3498db',    // Blue
    samurai: '#e74c3c',  // Red
    monk: '#f1c40f',     // Yellow
    ronin: '#2ecc71'     // Green
};

// Create HTML elements to hold our generation canvas
const spriteContainer = document.createElement('div');
spriteContainer.style.display = 'none';
spriteContainer.id = 'sprite-generator';
document.body.appendChild(spriteContainer);

// Generate character portraits - create them as data URLs
function generatePortraits() {
    const characters = ['ninja', 'samurai', 'monk', 'ronin'];
    
    characters.forEach(char => {
        const canvas = document.createElement('canvas');
        canvas.width = 100;
        canvas.height = 100;
        const ctx = canvas.getContext('2d');
        
        // Background color
        ctx.fillStyle = characterColors[char];
        ctx.fillRect(0, 0, 100, 100);
        
        // Border
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 3;
        ctx.strokeRect(5, 5, 90, 90);
        
        // Character initial
        ctx.fillStyle = 'white';
        ctx.font = '48px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(char[0].toUpperCase(), 50, 50);
        
        // Save as image and make directly available to <img> tags
        const img = new Image();
        img.src = canvas.toDataURL('image/png');
        img.id = `${char}-portrait`;
        spriteContainer.appendChild(img);
        
        // Replace image src in the HTML to use our generated image
        setTimeout(() => {
            const portraitImg = document.querySelector(`img[src="assets/${char}_portrait.png"]`);
            if (portraitImg) {
                console.log(`Replacing portrait image for ${char}`);
                portraitImg.src = img.src;
            }
        }, 100);
        
        // Make available globally
        window.gameAssets = window.gameAssets || {};
        window.gameAssets[`${char}_portrait.png`] = img;
    });
    
    console.log('Generated character portraits');
}

// Generate sprite sheets for characters
function generateSpriteSheets() {
    const characters = ['ninja', 'samurai', 'monk', 'ronin'];
    const states = ['idle', 'walk', 'jump', 'fall', 'punch', 'kick', 'special', 'block', 'hit', 'win', 'lose'];
    
    characters.forEach(character => {
        // Create sprite directory for this character
        const charDir = `assets/sprites/${character}`;
        window.gameAssets[charDir] = {};
        
        states.forEach(state => {
            generateSpriteSheet(character, state);
        });
    });
    
    console.log('Generated all sprite sheets');
}

// Generate a single sprite sheet
function generateSpriteSheet(character, state) {
    const color = characterColors[character];
    const darkColor = darkenColor(color, 0.3);
    
    // Different frame counts for different states
    let frameCount = 6;
    if (state === 'punch') frameCount = 5;
    if (state === 'kick') frameCount = 6;
    if (state === 'special') frameCount = 8;
    if (state === 'hit') frameCount = 3;
    
    // Create canvas for sprite sheet
    const frameWidth = 80;
    const frameHeight = 150;
    const canvas = document.createElement('canvas');
    canvas.width = frameWidth * frameCount;
    canvas.height = frameHeight;
    const ctx = canvas.getContext('2d');
    
    // Draw each frame
    for (let i = 0; i < frameCount; i++) {
        const x = i * frameWidth;
        
        // Create a stronger, more visible character shape
        // Background/character outline
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(x + 8, 18, 64, 124); // Slightly larger shadow
        
        // Base character shape - make larger and more visible
        ctx.fillStyle = color;
        ctx.fillRect(x + 10, 20, 60, 120);
        
        // Head outline
        ctx.fillStyle = 'black';
        ctx.fillRect(x + 19, 19, 42, 27);
        
        // Head
        ctx.fillStyle = darkColor;
        ctx.fillRect(x + 20, 20, 40, 25);
        
        // Draw different poses based on state
        switch(state) {
            case 'idle':
                // Slight bobbing animation
                const bobOffset = Math.sin(i/frameCount * Math.PI) * 3;
                
                // Eyes - always visible for better recognition
                ctx.fillStyle = 'white';
                ctx.fillRect(x + 30, 30 + bobOffset, 8, 8); // Left eye
                ctx.fillRect(x + 45, 30 + bobOffset, 8, 8); // Right eye
                
                // Body
                ctx.fillStyle = color;
                ctx.fillRect(x + 20, 45 + bobOffset, 40, 95); // Torso
                break;
                
            case 'walk':
                // Eyes
                ctx.fillStyle = 'white';
                ctx.fillRect(x + 30, 30, 8, 8); // Left eye
                ctx.fillRect(x + 45, 30, 8, 8); // Right eye
                
                // Moving legs
                const legOffset = Math.sin(i/frameCount * Math.PI * 2) * 10;
                
                // Torso
                ctx.fillStyle = color;
                ctx.fillRect(x + 20, 45, 40, 50); // Upper body
                
                // Legs
                ctx.fillStyle = darkenColor(color, 0.2);
                ctx.fillRect(x + 20, 95, 20, 45 + legOffset); // Left leg
                ctx.fillRect(x + 40, 95, 20, 45 - legOffset); // Right leg
                break;
                
            case 'jump':
                // Eyes
                ctx.fillStyle = 'white';
                ctx.fillRect(x + 30, 30, 8, 8);
                ctx.fillRect(x + 45, 30, 8, 8);
                
                // Body in jump pose
                ctx.fillStyle = color;
                ctx.fillRect(x + 20, 45, 40, 40); // Shortened torso
                
                // Bent legs
                ctx.fillStyle = darkenColor(color, 0.2);
                ctx.fillRect(x + 15, 85, 50, 40); // Bent legs
                break;
                
            case 'fall':
                // Eyes
                ctx.fillStyle = 'white';
                ctx.fillRect(x + 30, 30, 8, 8);
                ctx.fillRect(x + 45, 30, 8, 8);
                
                // Body in fall pose
                ctx.fillStyle = color;
                ctx.fillRect(x + 20, 45, 40, 50); // Body
                
                // Tucked legs
                ctx.fillStyle = darkenColor(color, 0.2);
                ctx.fillRect(x + 15, 95, 50, 30); // Legs tucked
                break;
                
            case 'punch':
                // Eyes
                ctx.fillStyle = 'white';
                ctx.fillRect(x + 30, 30, 8, 8);
                ctx.fillRect(x + 45, 30, 8, 8);
                
                // Body
                ctx.fillStyle = color;
                ctx.fillRect(x + 20, 45, 40, 95); // Body
                
                // Punching arm extends
                const punchExtend = (i / (frameCount-1)) * 30;
                
                // Punching arm - make it more obvious with high contrast
                ctx.fillStyle = 'rgba(255, 50, 50, 0.9)'; // Bright red
                ctx.fillRect(x + 60, 50, 10 + punchExtend, 15); // Arm
                
                // Fist - add on later frames
                if (i >= 2) {
                    ctx.fillStyle = 'rgba(255, 0, 0, 1)'; // Pure red for the fist
                    ctx.fillRect(x + 70 + punchExtend, 45, 15, 25); // Bigger fist
                }
                break;
                
            case 'kick':
                // Eyes
                ctx.fillStyle = 'white';
                ctx.fillRect(x + 30, 30, 8, 8);
                ctx.fillRect(x + 45, 30, 8, 8);
                
                // Body
                ctx.fillStyle = color;
                ctx.fillRect(x + 20, 45, 40, 65); // Upper body only
                
                // Kicking leg extends
                const kickExtend = (i / (frameCount-1)) * 35;
                
                // Normal leg
                ctx.fillStyle = darkenColor(color, 0.2);
                ctx.fillRect(x + 20, 110, 20, 30); // Standing leg
                
                // Kicking leg - make it more obvious with high contrast
                ctx.fillStyle = 'rgba(255, 50, 50, 0.9)'; // Bright red
                ctx.fillRect(x + 40, 100, 20 + kickExtend, 20); // Leg
                
                // Foot (only visible in later frames)
                if (i >= 3) {
                    ctx.fillStyle = 'rgba(255, 0, 0, 1)'; // Pure red
                    ctx.fillRect(x + 60 + kickExtend, 95, 15, 30); // Foot
                }
                break;
                
            case 'special':
                // Eyes (glowing)
                ctx.fillStyle = 'rgba(255, 255, 255, 0.8 + (i/frameCount) * 0.2)';
                ctx.fillRect(x + 30, 30, 8, 8);
                ctx.fillRect(x + 45, 30, 8, 8);
                
                // Special attack animation (glowing effect)
                ctx.fillStyle = brightenColor(color, i/frameCount);
                ctx.fillRect(x + 20, 45, 40, 95); // Body glowing
                
                // Energy effect
                ctx.strokeStyle = 'white';
                ctx.lineWidth = 2;
                ctx.beginPath();
                for (let j = 0; j < 8; j++) {
                    const angle = j / 8 * Math.PI * 2;
                    const radius = 30 + (i/frameCount) * 30;
                    ctx.moveTo(x + 40, 80);
                    ctx.lineTo(
                        x + 40 + Math.cos(angle) * radius,
                        80 + Math.sin(angle) * radius
                    );
                }
                ctx.stroke();
                
                // Additional energy glow
                ctx.fillStyle = 'rgba(255, 255, 255, ' + (0.2 + (i/frameCount) * 0.4) + ')';
                ctx.beginPath();
                ctx.arc(x + 40, 80, 20 + (i/frameCount) * 15, 0, Math.PI * 2);
                ctx.fill();
                break;
                
            case 'block':
                // Eyes
                ctx.fillStyle = 'white';
                ctx.fillRect(x + 30, 30, 8, 8);
                ctx.fillRect(x + 45, 30, 8, 8);
                
                // Body
                ctx.fillStyle = color;
                ctx.fillRect(x + 20, 45, 40, 95); // Main body
                
                // Arms up blocking - make it more obvious
                ctx.fillStyle = 'rgba(100, 100, 255, 0.8)'; // Blue for defense
                ctx.fillRect(x + 10, 50, 60, 20); // Arms blocking
                break;
                
            case 'hit':
                // Hit reaction
                ctx.fillStyle = brightenColor(color, 0.5);
                ctx.fillRect(x + 20, 45, 40, 95); // Flashing body
                
                // Eyes (showing pain)
                ctx.fillStyle = 'white';
                ctx.fillRect(x + 30, 30, 8, 8);
                ctx.fillRect(x + 45, 30, 8, 8);
                
                // X eyes on hit
                ctx.strokeStyle = 'red';
                ctx.lineWidth = 2;
                ctx.beginPath();
                // Left eye X
                ctx.moveTo(x + 30, 30);
                ctx.lineTo(x + 38, 38);
                ctx.moveTo(x + 38, 30);
                ctx.lineTo(x + 30, 38);
                // Right eye X
                ctx.moveTo(x + 45, 30);
                ctx.lineTo(x + 53, 38);
                ctx.moveTo(x + 53, 30);
                ctx.lineTo(x + 45, 38);
                ctx.stroke();
                
                // Recoil
                const hitOffset = 10 - (i / (frameCount-1)) * 10;
                ctx.translate(x + hitOffset, 0);
                ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform
                break;
                
            case 'win':
                // Eyes
                ctx.fillStyle = 'white';
                ctx.fillRect(x + 30, 30, 8, 8);
                ctx.fillRect(x + 45, 30, 8, 8);
                
                // Big smile
                ctx.fillStyle = 'white';
                ctx.beginPath();
                ctx.arc(x + 40, 38, 15, 0, Math.PI, false);
                ctx.fill();
                
                // Body
                ctx.fillStyle = color;
                ctx.fillRect(x + 20, 45, 40, 95); // Body
                
                // Victory arm raise
                const armRaise = Math.sin(i/frameCount * Math.PI) * 20;
                ctx.fillStyle = 'rgba(100, 255, 100, 0.8)'; // Green for victory
                ctx.fillRect(x + 15, 50 - armRaise, 15, 40 + armRaise); // Raising arm
                break;
                
            case 'lose':
                // Defeated pose
                
                // Sad eyes
                ctx.fillStyle = 'white';
                ctx.fillRect(x + 30, 33, 8, 5); // Eyes drooping
                ctx.fillRect(x + 45, 33, 8, 5);
                
                // Frown
                ctx.strokeStyle = 'white';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(x + 40, 45, 10, Math.PI, 2 * Math.PI, false);
                ctx.stroke();
                
                // Body slumped
                ctx.fillStyle = color;
                ctx.fillRect(x + 20, 45, 40, 60); // Upper body
                
                // Slumped lower body
                ctx.fillStyle = darkenColor(color, 0.2);
                ctx.fillRect(x + 10, 105, 60, 30); // Legs on ground
                ctx.fillRect(x + 20, 90, 40, 20); // Hunched over
                break;
        }
        
        // Character outline for all states - thicker for better visibility
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 3;
        ctx.strokeRect(x + 10, 20, 60, 120);
    }
    
    // Convert to data URL
    const img = new Image();
    img.src = canvas.toDataURL('image/png');
    img.id = `${character}-${state}-sprite`;
    spriteContainer.appendChild(img);
    
    // Store in window for access
    window.gameAssets = window.gameAssets || {};
    window.gameAssets[`${character}_${state}`] = img;
    
    // Also save to a virtual path that the character class can access
    const virtualPath = `assets/sprites/${character}/${state}.png`;
    window.gameAssets[virtualPath] = img;
    
    console.log(`Generated sprite sheet: ${character}_${state}`);
    return img;
}

// Generate dojo background
function generateBackground() {
    console.log("Generating dojo background");
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');
    
    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, 600);
    gradient.addColorStop(0, '#222');
    gradient.addColorStop(1, '#111');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 800, 600);
    
    // Floor
    ctx.fillStyle = '#333';
    ctx.fillRect(0, 400, 800, 200);
    
    // Grid lines
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 1;
    
    // Vertical grid
    for (let x = 0; x < 800; x += 50) {
        ctx.beginPath();
        ctx.moveTo(x, 400);
        ctx.lineTo(x, 600);
        ctx.stroke();
    }
    
    // Horizontal grid
    for (let y = 400; y < 600; y += 50) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(800, y);
        ctx.stroke();
    }
    
    // Wall decorations
    ctx.fillStyle = '#555';
    ctx.fillRect(100, 100, 600, 20); // Shelf
    
    // Dojo wall decorations
    for (let i = 0; i < 3; i++) {
        const x = 150 + i * 250;
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 3;
        ctx.strokeRect(x, 150, 100, 150);
    }
    
    // Convert to data URL
    const img = new Image();
    img.src = canvas.toDataURL('image/png');
    img.id = 'dojo-bg';
    spriteContainer.appendChild(img);
    
    // Store in window for access - make sure path is correct
    window.gameAssets = window.gameAssets || {};
    window.gameAssets['dojo_bg.png'] = img;
    
    console.log('Generated dojo background successfully');
    return img;
}

// Utility functions for colors
function darkenColor(color, factor) {
    const r = parseInt(color.substr(1, 2), 16);
    const g = parseInt(color.substr(3, 2), 16);
    const b = parseInt(color.substr(5, 2), 16);
    
    const newR = Math.floor(r * (1 - factor));
    const newG = Math.floor(g * (1 - factor));
    const newB = Math.floor(b * (1 - factor));
    
    return `rgb(${newR}, ${newG}, ${newB})`;
}

function brightenColor(color, factor) {
    const r = parseInt(color.substr(1, 2), 16);
    const g = parseInt(color.substr(3, 2), 16);
    const b = parseInt(color.substr(5, 2), 16);
    
    const newR = Math.min(255, Math.floor(r + (255 - r) * factor));
    const newG = Math.min(255, Math.floor(g + (255 - g) * factor));
    const newB = Math.min(255, Math.floor(b + (255 - b) * factor));
    
    return `rgb(${newR}, ${newG}, ${newB})`;
}

// Generate all sprites needed for the game
function generateAllSprites() {
    console.log('🔄 GENERATING ALL SPRITES');
    
    // Create sprite container if it doesn't exist
    if (!document.getElementById('sprite-container')) {
        console.log('Creating sprite container');
        const spriteContainer = document.createElement('div');
        spriteContainer.id = 'sprite-container';
        spriteContainer.style.display = 'none';
        document.body.appendChild(spriteContainer);
    }
    
    // Ensure window.gameAssets exists
    window.gameAssets = window.gameAssets || {};
    
    // Generate portraits for character selection
    console.log('Generating character portraits');
    generatePortraits();
    
    // Generate sprite sheets for each character and animation state
    console.log('Generating sprite sheets');
    generateSpriteSheets();
    
    // Generate background
    console.log('Generating game background');
    generateBackground();
    
    // Log the generated assets
    console.log('✅ Sprite generation complete. Assets:', Object.keys(window.gameAssets));
    
    // Force an alert to confirm generation is complete (for debugging)
    alert('Sprites generated! Click OK to continue playing.');
}

// Generate sprites when the document is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM content loaded, generating sprites...");
    setTimeout(generateAllSprites, 100); // Small delay to ensure document is ready
});

// Fix for portrait images - dynamically replace portrait images once loaded
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        console.log("Checking for portrait images to replace...");
        const characters = ['ninja', 'samurai', 'monk', 'ronin'];
        
        characters.forEach(char => {
            const portraitImg = document.querySelector(`img[src="assets/${char}_portrait.png"]`);
            if (portraitImg && window.gameAssets && window.gameAssets[`${char}_portrait.png`]) {
                console.log(`Replacing portrait image for ${char}`);
                portraitImg.src = window.gameAssets[`${char}_portrait.png`].src;
            }
        });
    }, 500); // Give time for assets to be generated
});

// Make function available globally
window.generateAllSprites = generateAllSprites; 