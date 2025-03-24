import * as THREE from 'three';

// Game constants
const ALIEN_ROWS = 5;
const ALIENS_PER_ROW = 11;
const ALIEN_SPACING = 2.5;
const ALIEN_MOVE_SPEED = 0.02;
const ALIEN_DROP_SPEED = 3.0;
const PLAYER_SPEED = 0.75;
const BULLET_SPEED = 0.5;
const SHIELD_SEGMENTS = 8; // Number of segments horizontally
const SHIELD_ROWS = 6;     // Number of segments vertically
const SHIELD_HEALTH = 5;
const SHIELD_DAMAGE_THRESHOLD = 0.4;

// Game state
let score = 0;
let aliens = [];
let bullets = [];
let shields = [];
let player;
let scene, camera, renderer;
let alienDirection = 1;
let alienDropCounter = 0;
let gameOver = false;

// Initialize the game
function init() {
    // Scene setup
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(0, 10, 0);
    scene.add(directionalLight);

    // Camera position
    camera.position.z = 15;

    // Create game objects
    createAliens();
    createPlayer();
    createShields();
    createBullets();

    // Event listeners
    window.addEventListener('resize', onWindowResize, false);
    document.addEventListener('keydown', onKeyDown, false);
}

// Create alien fleet
function createAliens() {
    const alienColors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff]; // Different colors for each row
    for (let row = 0; row < ALIEN_ROWS; row++) {
        for (let col = 0; col < ALIENS_PER_ROW; col++) {
            const geometry = new THREE.BoxGeometry(1.5, 1.5, 0.5);
            const material = new THREE.MeshPhongMaterial({ color: alienColors[row % alienColors.length] });
            const alien = new THREE.Mesh(geometry, material);
            
            alien.position.x = (col - (ALIENS_PER_ROW - 1) / 2) * ALIEN_SPACING;
            alien.position.y = 12 - row * ALIEN_SPACING;
            alien.position.z = 0;
            
            aliens.push(alien);
            scene.add(alien);
        }
    }
}

// Create player
function createPlayer() {
    const geometry = new THREE.BoxGeometry(2, 1, 0.5);
    const material = new THREE.MeshPhongMaterial({ color: 0x00ffff });
    player = new THREE.Mesh(geometry, material);
    player.position.y = -8;
    player.position.z = 0;
    scene.add(player);
}

// Create shields
function createShields() {
    for (let i = 0; i < 4; i++) {
        // Create shield segments
        const segmentWidth = 3 / SHIELD_SEGMENTS;  // Total width is 3 units
        const segmentHeight = 2 / SHIELD_ROWS;     // Total height is 2 units
        const segments = [];
        
        for (let row = 0; row < SHIELD_ROWS; row++) {
            for (let col = 0; col < SHIELD_SEGMENTS; col++) {
                const segmentGeometry = new THREE.BoxGeometry(segmentWidth, segmentHeight, 0.5);
                const segmentMaterial = new THREE.MeshPhongMaterial({ 
                    color: 0x00ff00,
                    transparent: true,
                    opacity: 1
                });
                
                const segment = new THREE.Mesh(segmentGeometry, segmentMaterial);
                
                // Position segment within shield
                segment.position.x = (i - 1.5) * 6 + (col - SHIELD_SEGMENTS/2 + 0.5) * segmentWidth;
                segment.position.y = -5 + (row - SHIELD_ROWS/2 + 0.5) * segmentHeight;
                segment.position.z = 0;
                
                // Skip middle segments at bottom to create classic shape
                if (row === 0 && (col === SHIELD_SEGMENTS/2 - 1 || col === SHIELD_SEGMENTS/2)) {
                    segment.visible = false;
                }
                
                segment.userData.health = 3; // Each segment has its own health
                segments.push(segment);
                scene.add(segment);
            }
        }
        shields.push(segments);
    }
}

// Create bullet pool
function createBullets() {
    for (let i = 0; i < 20; i++) {
        const geometry = new THREE.SphereGeometry(0.1, 8, 8);
        const material = new THREE.MeshPhongMaterial({ color: 0xffff00 });
        const bullet = new THREE.Mesh(geometry, material);
        bullet.visible = false;
        bullets.push(bullet);
        scene.add(bullet);
    }
}

// Get next available bullet
function getBullet() {
    for (let bullet of bullets) {
        if (!bullet.visible) {
            return bullet;
        }
    }
    return null;
}

// Handle window resize
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Handle keyboard input
function onKeyDown(event) {
    if (gameOver) return;

    switch(event.key) {
        case 'ArrowLeft':
            if (player.position.x > -20) {
                player.position.x -= PLAYER_SPEED;
            }
            break;
        case 'ArrowRight':
            if (player.position.x < 20) {
                player.position.x += PLAYER_SPEED;
            }
            break;
        case ' ':
            fireBullet();
            break;
    }
}

// Fire bullet from player
function fireBullet() {
    const bullet = getBullet();
    if (bullet) {
        bullet.position.copy(player.position);
        bullet.position.y += 1;
        bullet.visible = true;
        bullet.userData.direction = 1;
    }
}

// Update game state
function update() {
    if (gameOver) return;

    // Update aliens
    alienDropCounter += ALIEN_MOVE_SPEED;

    // Check if any alien has reached the boundaries
    let shouldChangeDirection = false;
    aliens.forEach(alien => {
        if (alien.visible) {
            if ((alienDirection > 0 && alien.position.x >= 20) || 
                (alienDirection < 0 && alien.position.x <= -20)) {
                shouldChangeDirection = true;
            }
        }
    });

    if (shouldChangeDirection) {
        alienDropCounter = ALIEN_DROP_SPEED; // Force a drop
    }

    if (alienDropCounter >= ALIEN_DROP_SPEED) {
        alienDropCounter = 0;
        alienDirection *= -1;
        aliens.forEach(alien => {
            alien.position.y -= 0.1;
        });
    } else {
        aliens.forEach(alien => {
            alien.position.x += ALIEN_MOVE_SPEED * alienDirection;
        });
    }

    // Check if aliens reached bottom
    aliens.forEach(alien => {
        if (alien.visible && alien.position.y <= player.position.y + 1) {
            gameOver = true;
        }
    });

    // Update bullets
    bullets.forEach(bullet => {
        if (bullet.visible) {
            bullet.position.y += BULLET_SPEED * bullet.userData.direction;

            // Check bullet collisions
            checkBulletCollisions(bullet);

            // Remove bullets that go off screen (increased upper bound)
            if (bullet.position.y > 15 || bullet.position.y < -10) {
                bullet.visible = false;
            }
        }
    });
}

// Check bullet collisions
function checkBulletCollisions(bullet) {
    // Check alien collisions
    aliens.forEach((alien, index) => {
        if (bullet.visible && alien.visible && 
            bullet.position.distanceTo(alien.position) < 1) {
            alien.visible = false;
            bullet.visible = false;
            score += 100;
            document.getElementById('score').textContent = `Score: ${score}`;
        }
    });

    // Check shield collisions
    shields.forEach(shieldSegments => {
        shieldSegments.forEach(segment => {
            if (bullet.visible && segment.visible && 
                bullet.position.distanceTo(segment.position) < 0.3) { // Reduced collision radius for more precise hits
                
                // Damage the segment
                segment.userData.health--;
                
                if (segment.userData.health <= 0) {
                    segment.visible = false;
                } else {
                    // Update segment appearance based on damage
                    segment.material.opacity = segment.userData.health / 3;
                    const damage = 1 - segment.userData.health / 3;
                    segment.material.color.setRGB(
                        damage, // More red as damage increases
                        1 - damage * 0.5, // Less green as damage increases
                        0
                    );
                }
                
                bullet.visible = false;
            }
        });
    });
}

// Game loop
function animate() {
    requestAnimationFrame(animate);
    update();
    renderer.render(scene, camera);
}

// Start the game
init();
animate(); 