import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let scene, camera, renderer, player, platforms = [], obstacles = [], score = 0;
let gameActive = true;
const PLATFORM_WIDTH = 10;
const PLATFORM_DEPTH = 2;
const PLATFORM_GAP = 2;
const COLORS = [0x4CAF50, 0x2196F3, 0xFF9800, 0x9C27B0];

function init() {
    // Scene setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);
    
    // Camera setup
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 10, 15);
    camera.lookAt(0, 0, 0);

    // Renderer setup
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    document.body.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Create player
    createPlayer();

    // Create initial platforms
    for (let i = 0; i < 10; i++) {
        createPlatform(i * (PLATFORM_DEPTH + PLATFORM_GAP));
    }

    // Controls
    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('resize', onWindowResize);

    // Start game loop
    animate();
}

function createPlayer() {
    const geometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
    const material = new THREE.MeshPhongMaterial({ color: 0xff0000 });
    player = new THREE.Mesh(geometry, material);
    player.position.set(0, 1, 0);
    player.castShadow = true;
    scene.add(player);
}

function createPlatform(zPosition) {
    const platformGeometry = new THREE.BoxGeometry(PLATFORM_WIDTH, 0.5, PLATFORM_DEPTH);
    const platformMaterial = new THREE.MeshPhongMaterial({ 
        color: COLORS[Math.floor(Math.random() * COLORS.length)]
    });
    const platform = new THREE.Mesh(platformGeometry, platformMaterial);
    platform.position.set(0, 0, -zPosition);
    platform.receiveShadow = true;
    scene.add(platform);
    platforms.push(platform);

    // Add obstacles
    if (zPosition > 0) {  // Don't add obstacles to the first platform
        addObstacles(platform);
    }
}

function addObstacles(platform) {
    const numObstacles = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < numObstacles; i++) {
        const obstacleGeometry = new THREE.BoxGeometry(1, 1, 1);
        const obstacleMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000 });
        const obstacle = new THREE.Mesh(obstacleGeometry, obstacleMaterial);
        
        // Random position on platform
        const x = (Math.random() * (PLATFORM_WIDTH - 2)) - (PLATFORM_WIDTH / 2 - 1);
        obstacle.position.set(
            x,
            1,
            platform.position.z
        );
        obstacle.castShadow = true;
        scene.add(obstacle);
        obstacles.push(obstacle);
    }
}

function onKeyDown(event) {
    if (!gameActive) return;

    const moveDistance = PLATFORM_DEPTH + PLATFORM_GAP;
    let moved = false;

    switch(event.key) {
        case 'ArrowUp':
        case 'w':
            player.position.z -= moveDistance;
            moved = true;
            break;
        case 'ArrowLeft':
        case 'a':
            if (player.position.x > -(PLATFORM_WIDTH/2 - 1))
                player.position.x -= 1;
            break;
        case 'ArrowRight':
        case 'd':
            if (player.position.x < (PLATFORM_WIDTH/2 - 1))
                player.position.x += 1;
            break;
    }

    if (moved) {
        updateScore();
        checkCollisions();
        camera.position.z = player.position.z + 15;
    }
}

function updateScore() {
    score = Math.floor(Math.abs(player.position.z) / (PLATFORM_DEPTH + PLATFORM_GAP));
    document.getElementById('score').textContent = `Score: ${score}`;
}

function checkCollisions() {
    // Check if player fell off
    const currentPlatformZ = Math.round(player.position.z / -(PLATFORM_DEPTH + PLATFORM_GAP)) * -(PLATFORM_DEPTH + PLATFORM_GAP);
    let onPlatform = false;

    platforms.forEach(platform => {
        if (Math.abs(platform.position.z - player.position.z) < 1) {
            onPlatform = true;
        }
    });

    if (!onPlatform) {
        gameOver();
        return;
    }

    // Check collision with obstacles
    obstacles.forEach(obstacle => {
        const distance = player.position.distanceTo(obstacle.position);
        if (distance < 1) {
            gameOver();
        }
    });

    // Generate new platform if needed
    if (-player.position.z + 20 > platforms.length * (PLATFORM_DEPTH + PLATFORM_GAP)) {
        createPlatform(platforms.length * (PLATFORM_DEPTH + PLATFORM_GAP));
    }
}

function gameOver() {
    gameActive = false;
    document.getElementById('gameOver').style.display = 'block';
    document.getElementById('finalScore').textContent = score;
}

function restartGame() {
    // Reset game state
    score = 0;
    gameActive = true;
    player.position.set(0, 1, 0);
    camera.position.set(0, 10, 15);
    
    // Remove all platforms and obstacles
    platforms.forEach(platform => scene.remove(platform));
    obstacles.forEach(obstacle => scene.remove(obstacle));
    platforms = [];
    obstacles = [];
    
    // Create new platforms
    for (let i = 0; i < 10; i++) {
        createPlatform(i * (PLATFORM_DEPTH + PLATFORM_GAP));
    }
    
    // Reset UI
    document.getElementById('score').textContent = 'Score: 0';
    document.getElementById('gameOver').style.display = 'none';
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

// Start the game
init();

// Make restart function global
window.restartGame = restartGame;
