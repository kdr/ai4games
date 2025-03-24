import * as THREE from 'three';

// Game constants
const ALIEN_ROWS = 5;
const ALIENS_PER_ROW = 11;
const ALIEN_SPACING = 2.5;
const ALIEN_BASE_MOVE_SPEED = 0.02;
const ALIEN_STEP_SIZE = 0.5;
const ALIEN_DROP_SPEED = 3.0;
const ALIEN_MOVE_INTERVAL = 0.3;
const ALIEN_SHOOT_CHANCE = 0.06;
const ALIEN_DROP_DISTANCE = 1.2; // Increased from 0.65
const SPEED_INCREASE_FACTOR = 1.2; // Increased from 1.1 (20% faster per drop)
const EXPLOSION_PARTICLES = 15; // Number of particles per explosion
const PARTICLE_SPEED = 0.2;
const PARTICLE_LIFETIME = 1000; // milliseconds
const PLAYER_SPEED = 1.0;
const BULLET_SPEED = 0.5;
const SHIELD_SEGMENTS = 8;     // Number of segments horizontally
const SHIELD_ROWS = 3;         // Reduced from 6 to 3 for half height
const SHIELD_WIDTH = 3;        // Total shield width
const SHIELD_HEIGHT = 1;       // Total shield height (reduced from 2)
const SHIELD_HEALTH = 5;
const SHIELD_DAMAGE_THRESHOLD = 0.4;
const PLAYER_LIVES = 3;

// Game state
let score = 0;
let lives = PLAYER_LIVES;
let aliens = [];
let bullets = [];
let alienBullets = [];
let shields = [];
let particles = [];
let player;
let lifeDisplays = [];
let scene, camera, renderer;
let alienDirection = 1;
let alienDropCounter = 0;
let alienMoveCounter = 0;
let currentAlienSpeed = ALIEN_BASE_MOVE_SPEED;
let gameOver = false;
let gameWon = false;
let backgroundMusic;

// Initialize the game
function init() {
    // Scene setup
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Setup background music
    backgroundMusic = new Audio('zerog.mp3');
    backgroundMusic.loop = true;
    backgroundMusic.volume = 0.5; // Set to 50% volume

    // Start playing music on first user interaction
    document.addEventListener('click', () => {
        if (backgroundMusic.paused) {
            backgroundMusic.play().catch(e => console.log("Audio play failed:", e));
        }
    });
    document.addEventListener('keydown', () => {
        if (backgroundMusic.paused) {
            backgroundMusic.play().catch(e => console.log("Audio play failed:", e));
        }
    });

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
    createAlienBullets();
    createLifeDisplays();

    // Add victory text
    const victoryText = createVictoryText();

    // Event listeners
    window.addEventListener('resize', onWindowResize, false);
    document.addEventListener('keydown', onKeyDown, false);
}

// Create alien fleet
function createAliens() {
    const alienColors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff];
    
    for (let row = 0; row < ALIEN_ROWS; row++) {
        for (let col = 0; col < ALIENS_PER_ROW; col++) {
            let geometry;
            
            // Different shapes for each row
            switch(row) {
                case 0: // Top row - Octahedron
                    geometry = new THREE.OctahedronGeometry(0.75);
                    break;
                case 1: // Second row - Dodecahedron
                    geometry = new THREE.DodecahedronGeometry(0.75);
                    break;
                case 2: // Middle row - Box
                    geometry = new THREE.BoxGeometry(1.5, 1.5, 0.5);
                    break;
                case 3: // Fourth row - Tetrahedron
                    geometry = new THREE.TetrahedronGeometry(0.85);
                    break;
                case 4: // Bottom row - Torus
                    geometry = new THREE.TorusGeometry(0.6, 0.3, 8, 16);
                    break;
            }
            
            const material = new THREE.MeshPhongMaterial({ 
                color: alienColors[row % alienColors.length],
                flatShading: true
            });
            const alien = new THREE.Mesh(geometry, material);
            
            alien.position.x = (col - (ALIENS_PER_ROW - 1) / 2) * ALIEN_SPACING;
            alien.position.y = 12 - row * ALIEN_SPACING;
            alien.position.z = 0;
            
            // Add rotation for certain shapes
            if (row === 4) { // Rotate torus to face forward
                alien.rotation.x = Math.PI / 2;
            }
            
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
        const segmentWidth = SHIELD_WIDTH / SHIELD_SEGMENTS;
        const segmentHeight = SHIELD_HEIGHT / SHIELD_ROWS;
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
                segment.position.y = -5.5 + (row - SHIELD_ROWS/2 + 0.5) * segmentHeight; // Adjusted Y position
                segment.position.z = 0;
                
                // Skip middle segments at bottom to create classic shape
                if (row === 0 && (col === SHIELD_SEGMENTS/2 - 1 || col === SHIELD_SEGMENTS/2)) {
                    segment.visible = false;
                }
                
                segment.userData.health = 3;
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

// Create life display
function createLifeDisplays() {
    for (let i = 0; i < PLAYER_LIVES; i++) {
        const geometry = new THREE.BoxGeometry(0.8, 0.4, 0.5);
        const material = new THREE.MeshPhongMaterial({ color: 0x00ffff });
        const life = new THREE.Mesh(geometry, material);
        life.position.set(-12 + i * 1.2, -9, 0);
        lifeDisplays.push(life);
        scene.add(life);
    }
}

// Update life display
function updateLifeDisplay() {
    lifeDisplays.forEach((life, index) => {
        life.visible = index < lives;
    });
}

// Create bullet pool for alien bullets
function createAlienBullets() {
    for (let i = 0; i < 20; i++) {
        const geometry = new THREE.SphereGeometry(0.1, 8, 8);
        const material = new THREE.MeshPhongMaterial({ color: 0xff0000 }); // Red for alien bullets
        const bullet = new THREE.Mesh(geometry, material);
        bullet.visible = false;
        alienBullets.push(bullet);
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

// Get next available alien bullet
function getAlienBullet() {
    for (let bullet of alienBullets) {
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
            if (player.position.x > -25) {
                player.position.x -= PLAYER_SPEED;
            }
            break;
        case 'ArrowRight':
            if (player.position.x < 25) {
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

// Fire bullet from alien
function fireAlienBullet(alien) {
    const bullet = getAlienBullet();
    if (bullet) {
        bullet.position.copy(alien.position);
        bullet.position.y -= 0.5;
        bullet.visible = true;
        bullet.userData.direction = -1;
    }
}

// Create victory text
function createVictoryText() {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 512;
    canvas.height = 128;
    context.fillStyle = '#ffffff';
    context.font = 'bold 60px Arial';
    context.fillText('VICTORY!', 120, 80);
    
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true
    });
    const geometry = new THREE.PlaneGeometry(10, 2.5);
    const victoryMesh = new THREE.Mesh(geometry, material);
    victoryMesh.position.set(0, 0, 1);
    victoryMesh.visible = false;
    scene.add(victoryMesh);
    return victoryMesh;
}

// Handle player hit
function handlePlayerHit() {
    lives--;
    updateLifeDisplay();
    
    if (lives <= 0) {
        gameOver = true;
        // Stop music on game over
        backgroundMusic.pause();
        // Create game over text
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 512;
        canvas.height = 128;
        context.fillStyle = '#ff0000';
        context.font = 'bold 48px Arial';
        context.fillText('ALL YOUR BASE', 70, 60);
        context.fillText('ARE BELONG TO US', 40, 110);
        
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.MeshBasicMaterial({
            map: texture,
            transparent: true
        });
        const geometry = new THREE.PlaneGeometry(12, 3);
        const gameOverMesh = new THREE.Mesh(geometry, material);
        gameOverMesh.position.set(0, 0, 1);
        scene.add(gameOverMesh);
    } else {
        // Make player flash
        let flashCount = 0;
        const flashInterval = setInterval(() => {
            player.visible = !player.visible;
            flashCount++;
            if (flashCount >= 6) { // 3 flashes
                clearInterval(flashInterval);
                player.visible = true;
            }
        }, 200);
    }
}

// Get lowest visible alien in each column
function getLowestAliensInColumns() {
    const columnAliens = new Array(ALIENS_PER_ROW).fill(null);
    
    // Go through aliens from bottom to top
    for (let row = ALIEN_ROWS - 1; row >= 0; row--) {
        // Skip the first row (top row, index 0)
        if (row === 0) continue;
        
        for (let col = 0; col < ALIENS_PER_ROW; col++) {
            const alienIndex = row * ALIENS_PER_ROW + col;
            const alien = aliens[alienIndex];
            
            // If this column doesn't have a lowest alien yet and this alien is visible
            if (columnAliens[col] === null && alien.visible) {
                columnAliens[col] = alien;
            }
        }
    }
    
    return columnAliens.filter(alien => alien !== null);
}

// Create particle explosion
function createExplosion(position, color) {
    for (let i = 0; i < EXPLOSION_PARTICLES; i++) {
        const geometry = new THREE.SphereGeometry(0.1, 4, 4);
        const material = new THREE.MeshPhongMaterial({ 
            color: color,
            transparent: true,
            opacity: 1
        });
        const particle = new THREE.Mesh(geometry, material);
        
        // Set particle position to explosion center
        particle.position.copy(position);
        
        // Random velocity in all directions
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI * 2;
        const speed = PARTICLE_SPEED * (0.5 + Math.random() * 0.5);
        particle.userData.velocity = new THREE.Vector3(
            speed * Math.sin(theta) * Math.cos(phi),
            speed * Math.sin(theta) * Math.sin(phi),
            speed * Math.cos(theta)
        );
        
        // Set creation time for lifetime tracking
        particle.userData.createTime = Date.now();
        
        particles.push(particle);
        scene.add(particle);
    }
}

// Update particles
function updateParticles() {
    const currentTime = Date.now();
    for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i];
        const age = currentTime - particle.userData.createTime;
        
        if (age > PARTICLE_LIFETIME) {
            // Remove old particles
            scene.remove(particle);
            particles.splice(i, 1);
        } else {
            // Update position and opacity
            particle.position.add(particle.userData.velocity);
            particle.material.opacity = 1 - (age / PARTICLE_LIFETIME);
            particle.userData.velocity.y -= 0.01; // Add gravity effect
        }
    }
}

// Update game state
function update() {
    if (gameOver) return;

    // Update particles
    updateParticles();

    // Check for victory condition
    if (!gameWon) {
        let allAliensDestroyed = true;
        aliens.forEach(alien => {
            if (alien.visible) {
                allAliensDestroyed = false;
            }
        });
        
        if (allAliensDestroyed) {
            gameWon = true;
            // Stop music on victory
            backgroundMusic.pause();
            scene.children.forEach(child => {
                if (child.geometry && child.geometry.type === 'PlaneGeometry') {
                    child.visible = true;
                }
            });
        }
    }

    // Update aliens with step-like movement
    alienMoveCounter += currentAlienSpeed;

    // Check if it's time for next step
    if (alienMoveCounter >= ALIEN_MOVE_INTERVAL) {
        alienMoveCounter = 0;
        
        // Get lowest aliens in each column and give them a chance to shoot
        const lowestAliens = getLowestAliensInColumns();
        lowestAliens.forEach(alien => {
            if (Math.random() < ALIEN_SHOOT_CHANCE) {
                fireAlienBullet(alien);
            }
        });

        // Check if any alien has reached the boundaries
        let shouldChangeDirection = false;
        aliens.forEach(alien => {
            if (alien.visible) {
                if ((alienDirection > 0 && alien.position.x >= 25) || 
                    (alienDirection < 0 && alien.position.x <= -25)) {
                    shouldChangeDirection = true;
                }
            }
        });

        if (shouldChangeDirection) {
            alienDirection *= -1;
            // Increase speed after each drop
            currentAlienSpeed *= SPEED_INCREASE_FACTOR;
            aliens.forEach(alien => {
                alien.position.y -= ALIEN_DROP_DISTANCE;
                // Add rotation animation for certain shapes
                if (alien.geometry.type === 'OctahedronGeometry' ||
                    alien.geometry.type === 'DodecahedronGeometry' ||
                    alien.geometry.type === 'TetrahedronGeometry') {
                    alien.rotation.y += Math.PI / 4;
                }
            });
        } else {
            // Move all aliens one step
            aliens.forEach(alien => {
                alien.position.x += ALIEN_STEP_SIZE * alienDirection;
                // Add continuous rotation for certain shapes
                if (alien.geometry.type === 'TorusGeometry') {
                    alien.rotation.z += 0.1;
                }
            });
        }
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
            checkBulletCollisions(bullet);
            if (bullet.position.y > 15 || bullet.position.y < -10) {
                bullet.visible = false;
            }
        }
    });

    alienBullets.forEach(bullet => {
        if (bullet.visible) {
            bullet.position.y += BULLET_SPEED * bullet.userData.direction;
            
            // Check for collision with player
            if (bullet.position.distanceTo(player.position) < 1) {
                bullet.visible = false;
                handlePlayerHit();
            }
            
            // Check for collision with shields
            checkBulletCollisions(bullet);
            
            if (bullet.position.y < -10) {
                bullet.visible = false;
            }
        }
    });
}

// Check bullet collisions
function checkBulletCollisions(bullet) {
    // Check alien collisions only for player bullets
    if (bullet.userData.direction === 1) { // Player bullets go up
        aliens.forEach((alien, index) => {
            if (bullet.visible && alien.visible && 
                bullet.position.distanceTo(alien.position) < 1) {
                alien.visible = false;
                bullet.visible = false;
                score += 100;
                document.getElementById('score').textContent = `Score: ${score}`;
                
                // Create explosion at alien position with alien's color
                createExplosion(alien.position.clone(), alien.material.color);
            }
        });
    }

    // Check shield collisions for all bullets
    shields.forEach(shieldSegments => {
        shieldSegments.forEach(segment => {
            if (bullet.visible && segment.visible && 
                bullet.position.distanceTo(segment.position) < 0.3) {
                
                // Damage the segment
                segment.userData.health--;
                
                if (segment.userData.health <= 0) {
                    segment.visible = false;
                } else {
                    // Update segment appearance based on damage
                    segment.material.opacity = segment.userData.health / 3;
                    const damage = 1 - segment.userData.health / 3;
                    segment.material.color.setRGB(
                        damage,
                        1 - damage * 0.5,
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