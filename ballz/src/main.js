import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Audio setup
const audioListener = new THREE.AudioListener();
const backgroundMusic = new THREE.Audio(audioListener);
const audioLoader = new THREE.AudioLoader();

// Load background music
audioLoader.load('../bounce.mp3', function(buffer) {
    backgroundMusic.setBuffer(buffer);
    backgroundMusic.setLoop(true);
    backgroundMusic.setVolume(0.5);
});

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB); // Sky blue background

// Camera setup
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 8, 12); // Move the camera higher and further back
camera.add(audioListener); // Add audio listener to the camera

// Renderer setup
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.getElementById('game-container').appendChild(renderer.domElement);

// Controls setup
const orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.enableDamping = true;
orbitControls.dampingFactor = 0.05;
orbitControls.screenSpacePanning = false;
orbitControls.minDistance = 5;
orbitControls.maxDistance = 100; // Increased for the taller level
orbitControls.maxPolarAngle = Math.PI / 2; // Restrict to not go below horizon
orbitControls.minPolarAngle = Math.PI / 6; // Restrict to not go too high (almost top-down)
orbitControls.rotateSpeed = 0.7; // Adjust rotate speed for better mouse control

// Enable mouse rotation
orbitControls.enableRotate = true;
orbitControls.autoRotate = false;

// Disable keyboard navigation in OrbitControls since we handle it ourselves
orbitControls.enableKeys = false;

// Lights setup
const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
scene.add(ambientLight);

// Add a hemisphere light for more natural environmental lighting
const hemisphereLight = new THREE.HemisphereLight(0xffffbb, 0x080820, 0.5);
scene.add(hemisphereLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(5, 10, 7.5);
directionalLight.castShadow = true;
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 50;
directionalLight.shadow.camera.left = -20;
directionalLight.shadow.camera.right = 20;
directionalLight.shadow.camera.top = 20;
directionalLight.shadow.camera.bottom = -20;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
scene.add(directionalLight);

// Add a subtle fill light from the opposite direction
const fillLight = new THREE.DirectionalLight(0xffddcc, 0.3);
fillLight.position.set(-5, 8, -7);
scene.add(fillLight);

// Optional: Add a point light for more dynamic lighting
const pointLight = new THREE.PointLight(0xffffee, 0.5, 20);
pointLight.position.set(0, 8, 0);
scene.add(pointLight);

// Ground setup
const groundGeometry = new THREE.PlaneGeometry(50, 50);
const groundMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x3a7e4d,
    roughness: 0.8,
    metalness: 0.2
});
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
ground.position.y = -2;
scene.add(ground);

// Player (ball) setup
const ballRadius = 0.5;
const ballGeometry = new THREE.SphereGeometry(ballRadius, 32, 32);

// Create a textured ball material with grid pattern to visualize rotation
function createBallTexture() {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext('2d');
    
    // Fill background
    context.fillStyle = '#FF0000';
    context.fillRect(0, 0, size, size);
    
    // Draw grid lines
    context.strokeStyle = '#FFFFFF';
    context.lineWidth = 6;
    
    // Draw longitude lines
    for (let i = 0; i < 5; i++) {
        context.beginPath();
        context.moveTo(i * (size / 4), 0);
        context.lineTo(i * (size / 4), size);
        context.stroke();
    }
    
    // Draw latitude lines
    for (let i = 0; i < 5; i++) {
        context.beginPath();
        context.moveTo(0, i * (size / 4));
        context.lineTo(size, i * (size / 4));
        context.stroke();
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    return texture;
}

const ballTexture = createBallTexture();
const ballMaterial = new THREE.MeshStandardMaterial({ 
    map: ballTexture,
    roughness: 0.5,
    metalness: 0.7
});

const ball = new THREE.Mesh(ballGeometry, ballMaterial);
ball.position.set(0, 1, 0);
ball.castShadow = true;
ball.receiveShadow = true;
scene.add(ball);

// Physics and movement variables
const gravity = 0.015;
const movementSpeed = 0.15; // Increased from 0.1 for tighter control
const jumpForce = 0.35;
const friction = 0.85; // Increased friction (lower value = more friction)
const acceleration = 0.05; // Reduced acceleration for more precise control
let velocity = new THREE.Vector3(0, 0, 0);
let isOnGround = false;
let canDoubleJump = false;
let jumpCount = 0;

// Particle system for double jump effect
class ParticleSystem {
    constructor(position, color = 0xFFFFFF, count = 30, lifetime = 60) {
        this.particles = [];
        this.active = false;
        this.lifetime = lifetime;
        this.age = 0;
        
        const particleGeometry = new THREE.SphereGeometry(0.05, 8, 8);
        const particleMaterial = new THREE.MeshBasicMaterial({ 
            color: color,
            transparent: true,
            opacity: 1.0
        });
        
        // Create particles
        for (let i = 0; i < count; i++) {
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            particle.position.copy(position);
            particle.velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 0.2,
                (Math.random()) * 0.2,
                (Math.random() - 0.5) * 0.2
            );
            particle.scale.set(Math.random() * 0.5 + 0.5, Math.random() * 0.5 + 0.5, Math.random() * 0.5 + 0.5);
            scene.add(particle);
            this.particles.push(particle);
        }
    }
    
    activate(position) {
        this.active = true;
        this.age = 0;
        
        // Reset particles
        this.particles.forEach(particle => {
            particle.position.copy(position);
            particle.velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 0.2,
                (Math.random()) * 0.2,
                (Math.random() - 0.5) * 0.2
            );
            particle.visible = true;
            particle.scale.set(Math.random() * 0.5 + 0.5, Math.random() * 0.5 + 0.5, Math.random() * 0.5 + 0.5);
        });
    }
    
    update() {
        if (!this.active) return;
        
        this.age++;
        
        if (this.age > this.lifetime) {
            this.active = false;
            this.particles.forEach(particle => {
                particle.visible = false;
            });
            return;
        }
        
        const lifeProgress = this.age / this.lifetime;
        
        this.particles.forEach(particle => {
            // Update position
            particle.position.add(particle.velocity);
            
            // Apply gravity
            particle.velocity.y -= 0.005;
            
            // Fade out particles as they age
            particle.material.opacity = 1 - lifeProgress;
            
            // Shrink particles as they age
            const scale = 1 - lifeProgress * 0.8;
            particle.scale.set(scale, scale, scale);
        });
    }
    
    dispose() {
        this.particles.forEach(particle => {
            scene.remove(particle);
            particle.geometry.dispose();
            particle.material.dispose();
        });
    }
}

// Create particle system for double jumps
const doubleJumpParticles = new ParticleSystem(new THREE.Vector3(), 0x00FFFF, 30, 60);

// Platforms setup
function createPlatform(x, y, z, width, depth, color, movementAxis, movementRange) {
    const geometry = new THREE.BoxGeometry(width, 0.5, depth);
    
    // Create a checkerboard pattern material
    const checkerboardTexture = createCheckerboardTexture();
    const material = new THREE.MeshStandardMaterial({ 
        map: checkerboardTexture,
        color: color || 0xFFFFFF // Use white as base color to preserve checkerboard pattern
    });
    
    const platform = new THREE.Mesh(geometry, material);
    platform.position.set(x, y, z);
    platform.castShadow = true;
    platform.receiveShadow = true;
    platform.userData = { 
        isPlatform: true,
        originalPosition: new THREE.Vector3(x, y, z),
        movementAxis: movementAxis || null, // 'x', 'y', or 'z'
        movementRange: movementRange || 0,  // How far to move
        movementSpeed: 0.02, // Standardized speed for all platforms
        movementDirection: 1 // 1 or -1 for direction
    };
    scene.add(platform);
    return platform;
}

// Create a checkerboard texture
function createCheckerboardTexture() {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext('2d');
    
    // Draw checkerboard pattern
    const tileSize = size / 8; // 8x8 checkerboard
    for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
            context.fillStyle = (x + y) % 2 === 0 ? '#663300' : '#996633'; // Dark and light brown
            context.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
        }
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 1);
    
    return texture;
}

// Create some initial platforms - more platforms going upward with varied movement
const platforms = [
    // Base level platforms
    createPlatform(0, 0, 0, 4, 4, null, null, 0), // Base platform - stationary
    
    // Lower section - layer with 3 platforms side by side (spaced further apart)
    createPlatform(-4, 3, 0, 2, 2, null, 'x', 0.8),
    createPlatform(0, 3, 0, 2, 2, null, null, 0), // Center platform - stationary
    createPlatform(4, 3, 0, 2, 2, null, 'x', 0.8),
    
    // Mid-low section
    createPlatform(0, 6, 0, 3, 3, null, 'y', 1),
    
    // Middle section - layer with 2 platforms
    createPlatform(-4, 9, 0, 2, 2, null, null, 0), // Left platform - stationary
    createPlatform(4, 9, 0, 2, 2, null, 'z', 1),  // Right platform - moving
    
    // Middle-upper section - staggered arrangement
    createPlatform(0, 12, -3, 2, 2, null, null, 0), // Back platform - stationary
    createPlatform(0, 12, 3, 2, 2, null, 'x', 1),   // Front platform - moving
    
    // Upper section - layer with 3 platforms in triangle formation
    createPlatform(0, 15, 0, 2, 2, null, 'y', 0.8),  // Center
    createPlatform(-3, 15, -3, 1.8, 1.8, null, null, 0), // Back left - stationary
    createPlatform(3, 15, -3, 1.8, 1.8, null, 'z', 0.8), // Back right
    
    // Higher section - zigzag pattern
    createPlatform(-4, 18, 0, 2, 2, null, 'x', 1), // Left
    createPlatform(0, 21, 0, 2, 2, null, 'y', 0.8), // Center
    createPlatform(4, 24, 0, 2, 2, null, 'z', 0.8), // Right
    
    // Even higher section - side to side
    createPlatform(-3, 27, 0, 2, 2, null, null, 0), // Left - stationary
    createPlatform(3, 30, 0, 2, 2, null, 'x', 0.8), // Right
    
    // Top section - layer with split path
    createPlatform(0, 33, 0, 2, 2, null, 'y', 0.8), // Center
    createPlatform(-4, 33, -4, 1.5, 1.5, null, 'z', 0.8), // Left corner
    createPlatform(4, 33, -4, 1.5, 1.5, null, 'x', 0.8), // Right corner
    
    // Upper challenge section
    createPlatform(0, 36, -5, 1.8, 1.8, null, 'z', 0.8), // Back
    createPlatform(-3, 39, 0, 1.5, 1.5, null, null, 0), // Left - stationary
    createPlatform(3, 39, 0, 1.5, 1.5, null, 'x', 0.8), // Right
    
    // Near the top
    createPlatform(0, 42, 0, 1.8, 1.8, null, 'y', 0.6), // Center moving up/down
    createPlatform(-3, 45, 3, 1.5, 1.5, null, 'z', 0.8), // Left corner
    createPlatform(3, 45, 3, 1.5, 1.5, null, 'x', 0.8), // Right corner
    
    // Top challenge - spaced stepping stones
    createPlatform(-2, 48, 0, 1.2, 1.2, null, null, 0), // Left - stationary
    createPlatform(0, 49, 0, 1.2, 1.2, null, 'y', 0.4), // Middle - moving
    createPlatform(2, 50, 0, 1.2, 1.2, null, null, 0), // Right - stationary
    
    // Final platform
    createPlatform(0, 54, 0, 2.5, 2.5, 0xFFD700, null, 0) // Gold color stationary platform
];

// Input handling
const keyStates = {};
let musicStarted = false; // Flag to track if music has started
let userHasMoved = false;
let controlsHideTimeout = null;

// Function to start background music
function startBackgroundMusic() {
    if (!musicStarted && backgroundMusic.buffer) {
        backgroundMusic.play();
        musicStarted = true;
        
        // Update music toggle button to show the correct state
        const musicToggleBtn = document.getElementById('music-toggle');
        musicToggleBtn.innerHTML = '🔊 Music On';
    }
}

// Controls visibility functions
function showControls() {
    const infoElement = document.getElementById('info');
    infoElement.style.opacity = '1';
    
    const controlsToggleBtn = document.getElementById('controls-toggle');
    controlsToggleBtn.innerHTML = '📋 Hide Controls';
}

function hideControls() {
    const infoElement = document.getElementById('info');
    infoElement.style.opacity = '0';
    
    const controlsToggleBtn = document.getElementById('controls-toggle');
    controlsToggleBtn.innerHTML = '📋 Show Controls';
}

function scheduleControlsHide() {
    if (!userHasMoved) {
        userHasMoved = true;
        if (controlsHideTimeout) {
            clearTimeout(controlsHideTimeout);
        }
        controlsHideTimeout = setTimeout(hideControls, 5000); // Hide after 5 seconds
    }
}

window.addEventListener('keydown', (event) => {
    keyStates[event.code] = true;
    
    // Start background music on first interaction
    startBackgroundMusic();
    
    // Schedule controls to hide after movement keys are pressed
    if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)) {
        scheduleControlsHide();
    }
    
    // Jump handling
    if (event.code === 'Space') {
        if (isOnGround) {
            velocity.y = jumpForce;
            isOnGround = false;
            jumpCount = 1;
            canDoubleJump = true;
            
            // Add forward spin when jumping
            const spinAxis = new THREE.Vector3(1, 0, 0);
            ball.rotateOnAxis(spinAxis, Math.PI * 0.5); // 90 degree rotation
        } else if (canDoubleJump && jumpCount === 1) {
            velocity.y = jumpForce * 0.9;
            jumpCount = 2;
            canDoubleJump = false;
            
            // Add more dramatic spin for double jump
            const spinAxis = new THREE.Vector3(
                Math.random() - 0.5,
                Math.random() - 0.5,
                Math.random() - 0.5
            ).normalize();
            ball.rotateOnAxis(spinAxis, Math.PI * 2); // 360 degree rotation
            
            // Activate particle effect
            doubleJumpParticles.activate(ball.position.clone());
        }
    }
});

window.addEventListener('keyup', (event) => {
    keyStates[event.code] = false;
});

// Check collisions with platforms
function checkPlatformCollisions() {
    const ballPosition = ball.position.clone();
    
    // Assume not on ground unless proven otherwise
    let wasOnGround = isOnGround;
    isOnGround = false;
    
    // Track which platform the ball is on (if any)
    let currentPlatform = null;
    
    // Check if ball is on ground plane
    if (ballPosition.y - ballRadius <= ground.position.y && velocity.y <= 0) {
        isOnGround = true;
        velocity.y = 0;
        ball.position.y = ground.position.y + ballRadius;
        jumpCount = 0;
        return;
    }
    
    // Check collisions with platforms
    for (const platform of platforms) {
        const platformWidth = platform.geometry.parameters.width;
        const platformHeight = platform.geometry.parameters.height;
        const platformDepth = platform.geometry.parameters.depth;
        
        const platformMinX = platform.position.x - platformWidth / 2;
        const platformMaxX = platform.position.x + platformWidth / 2;
        const platformMinZ = platform.position.z - platformDepth / 2;
        const platformMaxZ = platform.position.z + platformDepth / 2;
        const platformY = platform.position.y + platformHeight / 2;
        
        // Check if ball is above the platform
        if (ballPosition.x >= platformMinX && ballPosition.x <= platformMaxX &&
            ballPosition.z >= platformMinZ && ballPosition.z <= platformMaxZ) {
            
            // Coming from above and landing on the platform
            if (ballPosition.y - ballRadius <= platformY && 
                ballPosition.y >= platformY && 
                velocity.y <= 0) {
                isOnGround = true;
                velocity.y = 0;
                ball.position.y = platformY + ballRadius;
                jumpCount = 0;
                
                // Track which platform the ball is on
                currentPlatform = platform;
                
                // Apply platform movement to the ball if this is a moving platform
                if (platform.userData.movementAxis) {
                    // Move ball along with the platform
                    const axis = platform.userData.movementAxis;
                    const speed = platform.userData.movementSpeed;
                    const direction = platform.userData.movementDirection;
                    
                    // Apply platform movement to ball
                    if (axis === 'x') {
                        ball.position.x += speed * direction;
                    } else if (axis === 'z') {
                        ball.position.z += speed * direction;
                    }
                    // y-axis movement is handled by the platform pushing the ball up
                }
                
                break;
            }
        }
    }
    
    // If we were on ground before but aren't now, and we're not jumping, add a small downward velocity
    if (wasOnGround && !isOnGround && velocity.y >= 0) {
        velocity.y = -0.01; // Small initial downward velocity to start falling
    }
}

// Game loop
function animate() {
    requestAnimationFrame(animate);
    
    // Update particle effects
    doubleJumpParticles.update();
    
    // Update platform positions
    platforms.forEach(platform => {
        if (platform.userData.movementAxis && platform.userData.movementRange > 0) {
            const axis = platform.userData.movementAxis;
            const originalPos = platform.userData.originalPosition[axis];
            const range = platform.userData.movementRange;
            const speed = platform.userData.movementSpeed;
            const direction = platform.userData.movementDirection;
            
            // Move platform
            platform.position[axis] += speed * direction;
            
            // Check if need to change direction
            if (platform.position[axis] > originalPos + range || 
                platform.position[axis] < originalPos - range) {
                platform.userData.movementDirection *= -1;
            }
        }
    });
    
    // Movement controls
    const direction = new THREE.Vector3(0, 0, 0);
    
    if (keyStates['KeyW'] || keyStates['ArrowUp']) {
        direction.z = -1;
    }
    if (keyStates['KeyS'] || keyStates['ArrowDown']) {
        direction.z = 1;
    }
    if (keyStates['KeyA'] || keyStates['ArrowLeft']) {
        direction.x = -1;
    }
    if (keyStates['KeyD'] || keyStates['ArrowRight']) {
        direction.x = 1;
    }
    
    // Normalize direction vector to ensure consistent speed in all directions
    if (direction.length() > 0) {
        direction.normalize();
    }
    
    // Get camera direction
    const cameraDirection = new THREE.Vector3();
    camera.getWorldDirection(cameraDirection);
    cameraDirection.y = 0; // Keep movement on the horizontal plane
    cameraDirection.normalize();
    
    // Get camera's right vector (perpendicular to direction)
    const cameraRight = new THREE.Vector3(-cameraDirection.z, 0, cameraDirection.x);
    
    // Calculate movement direction relative to camera
    const moveDirection = new THREE.Vector3();
    
    // Forward/backward movement along camera direction
    if (direction.z !== 0) {
        moveDirection.add(cameraDirection.clone().multiplyScalar(-direction.z));
    }
    
    // Left/right movement perpendicular to camera direction
    if (direction.x !== 0) {
        moveDirection.add(cameraRight.clone().multiplyScalar(direction.x));
    }
    
    // Normalize the final direction
    if (moveDirection.length() > 0) {
        moveDirection.normalize();
        // Apply movement with reduced acceleration
        velocity.x += moveDirection.x * movementSpeed * acceleration;
        velocity.z += moveDirection.z * movementSpeed * acceleration;
        
        // Cap max speed
        const maxHorizontalSpeed = movementSpeed;
        const horizontalSpeed = Math.sqrt(velocity.x * velocity.x + velocity.z * velocity.z);
        if (horizontalSpeed > maxHorizontalSpeed) {
            const scale = maxHorizontalSpeed / horizontalSpeed;
            velocity.x *= scale;
            velocity.z *= scale;
        }
    }
    
    // Apply higher friction
    if (isOnGround) {
        velocity.x *= friction;
        velocity.z *= friction;
        
        // If velocity is very small, set it to zero to prevent sliding
        if (Math.abs(velocity.x) < 0.003) velocity.x = 0;
        if (Math.abs(velocity.z) < 0.003) velocity.z = 0;
    }
    
    // Apply gravity
    if (!isOnGround) {
        velocity.y -= gravity;
    }
    
    // Update position
    ball.position.add(velocity);
    
    // Rotate the ball based on its movement
    if (isOnGround && (velocity.x !== 0 || velocity.z !== 0)) {
        // Calculate rotation axis (perpendicular to movement direction)
        const movementDir = new THREE.Vector3(velocity.x, 0, velocity.z).normalize();
        const rotationAxis = new THREE.Vector3(movementDir.z, 0, -movementDir.x);
        
        // Calculate rotation amount (based on distance traveled)
        const distance = Math.sqrt(velocity.x * velocity.x + velocity.z * velocity.z);
        const rotationAngle = distance / ballRadius;
        
        // Apply rotation
        ball.rotateOnAxis(rotationAxis, rotationAngle);
    }
    
    // Check collisions
    checkPlatformCollisions();
    
    // Simple boundary check
    if (ball.position.y < -20) { // Increased fall distance before reset
        ball.position.set(0, 3, 0); // Reset to starting position
        velocity.set(0, 0, 0);
    }
    
    // Update camera to follow the ball
    // Store the current distance from camera to target
    const currentDistance = camera.position.distanceTo(orbitControls.target);
    // Update the target to the ball position
    orbitControls.target.copy(ball.position);
    // Calculate direction from target to camera
    const directionFromTarget = new THREE.Vector3().subVectors(camera.position, orbitControls.target).normalize();
    // Set camera position to target + direction * distance
    camera.position.copy(orbitControls.target).add(directionFromTarget.multiplyScalar(currentDistance));
    orbitControls.update();
    
    renderer.render(scene, camera);
}

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Music toggle functionality
const musicToggleBtn = document.getElementById('music-toggle');
musicToggleBtn.addEventListener('click', () => {
    if (musicStarted) {
        if (backgroundMusic.isPlaying) {
            backgroundMusic.pause();
            musicToggleBtn.innerHTML = '🔇 Music Off';
        } else {
            backgroundMusic.play();
            musicToggleBtn.innerHTML = '🔊 Music On';
        }
    } else {
        startBackgroundMusic();
        musicToggleBtn.innerHTML = '🔊 Music On';
    }
});

// Controls toggle functionality
const controlsToggleBtn = document.getElementById('controls-toggle');
controlsToggleBtn.addEventListener('click', () => {
    const infoElement = document.getElementById('info');
    if (infoElement.style.opacity === '0') {
        showControls();
    } else {
        hideControls();
    }
});

// Make sure controls are visible at the start
showControls();

// Add some UI instructions for camera rotation
const infoElement = document.getElementById('info');
if (infoElement) {
    const cameraControlsInfo = document.createElement('p');
    cameraControlsInfo.textContent = 'Use mouse drag to rotate camera, scroll to zoom';
    infoElement.appendChild(cameraControlsInfo);
}

// Start the game
animate(); 