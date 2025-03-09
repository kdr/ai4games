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
orbitControls.maxDistance = 50;
orbitControls.maxPolarAngle = Math.PI / 2; // Restrict to not go below horizon
orbitControls.minPolarAngle = Math.PI / 6; // Restrict to not go too high (almost top-down)
orbitControls.rotateSpeed = 0.7; // Adjust rotate speed for better mouse control

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
const ballMaterial = new THREE.MeshStandardMaterial({ 
    color: 0xFF0000,
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
const movementSpeed = 0.1;
const jumpForce = 0.35;
let velocity = new THREE.Vector3(0, 0, 0);
let isOnGround = false;
let canDoubleJump = false;
let jumpCount = 0;

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
        movementSpeed: Math.random() * 0.02 + 0.01, // Random speed between 0.01 and 0.03
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
    // Ground level and near-ground platforms
    createPlatform(2, 0, 2, 3, 3, null, 'x', 2),
    createPlatform(-3, 1, -2, 3, 2, null, 'z', 2),
    createPlatform(0, 2, -4, 4, 3, null, 'y', 1),
    createPlatform(4, 3, -2, 2, 2, null, 'x', 1.5),
    createPlatform(-3, 4, 0, 3, 3, null, 'z', 1.8),
    
    // Mid-level platforms
    createPlatform(0, 5.5, 3, 2.5, 2, null, 'y', 1.2),
    createPlatform(3, 6, -1, 2, 2.5, null, 'x', 2),
    createPlatform(-4, 7, -3, 2, 2, null, 'z', 1.5),
    
    // Higher platforms
    createPlatform(2, 8.5, 2, 2, 2, null, 'y', 1),
    createPlatform(-2, 9, 4, 2.5, 3, null, 'x', 1.8),
    createPlatform(0, 10.5, 0, 2, 2, null, 'z', 1.4),
    createPlatform(3, 12, 3, 2, 2.5, null, 'y', 1.3),
    
    // Top-level platforms
    createPlatform(-3, 13.5, -2, 2, 2, null, 'x', 1.6),
    createPlatform(1, 15, 0, 3, 3, null, 'z', 1.5)
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
        } else if (canDoubleJump && jumpCount === 1) {
            velocity.y = jumpForce * 0.9;
            jumpCount = 2;
            canDoubleJump = false;
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
        // Apply movement
        velocity.x = moveDirection.x * movementSpeed;
        velocity.z = moveDirection.z * movementSpeed;
    } else {
        velocity.x = 0;
        velocity.z = 0;
    }
    
    // Apply gravity
    if (!isOnGround) {
        velocity.y -= gravity;
    }
    
    // Update position
    ball.position.add(velocity);
    
    // Check collisions
    checkPlatformCollisions();
    
    // Simple boundary check
    if (ball.position.y < -10) {
        ball.position.set(2, 2, 2); // Reset to the first platform position
        velocity.set(0, 0, 0);
    }
    
    // Update camera to follow the ball a bit
    orbitControls.target.copy(ball.position);
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

// Start the game
animate(); 