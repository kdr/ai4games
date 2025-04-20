import * as THREE from 'three';
// import { OrbitControls } from 'three/addons/controls/OrbitControls.js'; // Maybe needed later for debugging

let scene, renderer;
let aimingCamera, followCamera, activeCamera;
let cannon, cannonBall, target;
let ground;

let shotsLeft = 3;
let currentScore = 0;
let totalScore = 0;

// Game states
const STATE = {
    AIMING: 'aiming',
    FIRING: 'firing',
    LANDED: 'landed',
    GAME_OVER: 'game_over'
};
let gameState = STATE.AIMING;

// Physics constants
const gravity = new THREE.Vector3(0, -9.81, 0);
const launchVelocity = 40; // Initial speed
let cannonBallVelocity = new THREE.Vector3();
const cannonBallRadius = 0.5;
const targetRadius = 2;

// Timers
let landTime = 0;
const resetDelay = 3; // seconds

// UI Elements
const shotsElement = document.getElementById('shots');
const scoreElement = document.getElementById('score');
const totalScoreElement = document.getElementById('total-score');
const launchButton = document.getElementById('launch-button');
const gameOverElement = document.getElementById('game-over');
const finalScoreElement = document.getElementById('final-score');
const restartButton = document.getElementById('restart-button');

const clock = new THREE.Clock();

// Add keyboard aiming state and handlers
const keyStates = {};
const cannonYawSpeed = THREE.MathUtils.degToRad(45); // degrees per second
// Reset pitch speed to normal
const cannonPitchSpeed = THREE.MathUtils.degToRad(30); // degrees per second

const maxCannonAngleX = Math.PI / 4; // Max horizontal rotation (45 degrees either way)
// Widen vertical range slightly and adjust base pitch
const maxCannonAngleY = Math.PI / 2.5; // Max vertical rotation (72 degrees up from horizontal)
const minCannonAngleY = -Math.PI / 18; // Min vertical rotation (10 degrees down from horizontal)

function init() {
    console.log("Initializing game...");

    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // Sky blue
    scene.fog = new THREE.Fog(0x87CEEB, 50, 300); // Adjust fog distance

    // Renderer
    renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('game-canvas'), antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;

    // Cameras
    const aspect = window.innerWidth / window.innerHeight;
    // Increase FOV slightly more
    aimingCamera = new THREE.PerspectiveCamera(70, aspect, 0.1, 1000);
    followCamera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
    activeCamera = aimingCamera;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6); // Slightly brighter ambient
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2); // Slightly stronger directional
    directionalLight.position.set(15, 30, 10); // Adjust position
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048; // Increase shadow map resolution
    directionalLight.shadow.mapSize.height = 2048;
    // Add shadow camera helper for debugging if needed
    // const shadowHelper = new THREE.CameraHelper(directionalLight.shadow.camera);
    // scene.add(shadowHelper);
    scene.add(directionalLight);

    // Ground with simple terrain
    const groundSize = 300;
    const segments = 50;
    const groundGeometry = new THREE.PlaneGeometry(groundSize, groundSize, segments, segments);
    const groundMaterial = new THREE.MeshStandardMaterial({
        color: 0x228B22, // Forest green
        wireframe: false // Set to true to see geometry
    });
    ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;

    // Displace vertices for terrain
    const vertices = groundGeometry.attributes.position;
    for (let i = 0; i < vertices.count; i++) {
        const x = vertices.getX(i);
        const y = vertices.getY(i); // Corresponds to Z in world space after rotation
        // Simple sine wave + noise for variation
        const height = (Math.sin(x * 0.1) * Math.cos(y * 0.1) * 2) + (Math.random() * 1.5);
        vertices.setZ(i, height); // Modify the Z component (which becomes Y in world space)
    }
    groundGeometry.computeVertexNormals(); // Recalculate normals for correct lighting
    scene.add(ground);


    // Cannon (Placeholder - consider making it more distinct)
    const cannonBaseGeo = new THREE.BoxGeometry(1.5, 0.5, 1.5);
    const cannonBaseMat = new THREE.MeshStandardMaterial({ color: 0x666666 });
    const cannonBase = new THREE.Mesh(cannonBaseGeo, cannonBaseMat);
    cannonBase.position.set(0, 0.25, 0); // Base sits on ground
    cannonBase.receiveShadow = true;
    scene.add(cannonBase);

    const cannonGeometry = new THREE.CylinderGeometry(0.4, 0.5, 3, 16); // Slightly thinner
    const cannonMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 }); // Darker cannon
    cannon = new THREE.Mesh(cannonGeometry, cannonMaterial);
    cannon.position.set(0, 0.7, -0.5);
    cannon.castShadow = true;
    // Initial pitch using X-axis rotation - POSITIVE for up based on observation
    cannon.rotation.x = Math.PI / 8; // Start aimed slightly up (22.5 deg)
    cannon.rotation.y = 0;
    cannon.rotation.z = 0;
    scene.add(cannon);


    // Cannonball
    const cannonBallGeometry = new THREE.SphereGeometry(cannonBallRadius, 16, 16);
    const cannonBallMaterial = new THREE.MeshStandardMaterial({ color: 0x111111 });
    cannonBall = new THREE.Mesh(cannonBallGeometry, cannonBallMaterial);
    cannonBall.castShadow = true;
    cannonBall.visible = false; // Initially hidden
    scene.add(cannonBall);

    // Target - Bullseye
    const targetColors = [0xffffff, 0x000000, 0x0000ff, 0xff0000, 0xffff00]; // White -> Yellow (center)
    const targetRadii = [targetRadius, targetRadius * 0.8, targetRadius * 0.6, targetRadius * 0.4, targetRadius * 0.2];
    const targetGroup = new THREE.Group();

    // Loop backwards to draw smallest (center) ring last (visually on top)
    for (let i = targetRadii.length - 1; i >= 0; i--) {
        const ringGeometry = new THREE.CircleGeometry(targetRadii[i], 32);
        const ringMaterial = new THREE.MeshBasicMaterial({ 
            color: targetColors[i], 
            side: THREE.DoubleSide 
        });
        // console.log(`Creating ring ${i} with color ${targetColors[i].toString(16)} using MeshBasicMaterial`); // Log material type (optional)
        const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);
        // Keep small z-offset relative to loop order (smallest ring has smallest offset)
        ringMesh.position.z = -(targetRadii.length - 1 - i) * 0.01;
        targetGroup.add(ringMesh);
    }

    target = targetGroup;

    // Position and orient the target group
    const targetX = 0;
    const targetZ = -50;
    const targetY = 5.0;
    target.position.set(targetX, targetY, targetZ);
    console.log(`Target positioned at: ${target.position.x.toFixed(2)}, ${target.position.y.toFixed(2)}, ${target.position.z.toFixed(2)}`);
    target.lookAt(cannon.position);
    scene.add(target);

    // Event Listeners
    window.addEventListener('resize', onWindowResize, false);
    launchButton.addEventListener('click', fireCannon);
    restartButton.addEventListener('click', restartGame);
    window.addEventListener('keydown', handleKeyDown, false);
    window.addEventListener('keyup', handleKeyUp, false);

    // Initial UI and Camera Update
    updateUI();
    updateAimingCamera();

    console.log("Initialization complete. Starting animation loop.");
    animate();
}

function onWindowResize() {
    const aspect = window.innerWidth / window.innerHeight;
    aimingCamera.aspect = aspect;
    aimingCamera.updateProjectionMatrix();
    followCamera.aspect = aspect;
    followCamera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function updateAimingCamera() {
    // Restore positioning camera at muzzle
    const localMuzzlePosition = new THREE.Vector3(0, 0, -1.5);
    const worldMuzzlePosition = cannon.localToWorld(localMuzzlePosition.clone());
    aimingCamera.position.copy(worldMuzzlePosition);

    // Look out along the cannon barrel
    const localLookAtPosition = new THREE.Vector3(0, 0, -10);
    const worldLookAtPosition = cannon.localToWorld(localLookAtPosition.clone());
    aimingCamera.lookAt(worldLookAtPosition);
}

function fireCannon() {
    if (gameState !== STATE.AIMING || shotsLeft <= 0) return;

    console.log("Firing cannon! Current X rot:", cannon.rotation.x.toFixed(2));
    gameState = STATE.FIRING;
    launchButton.disabled = true;
    launchButton.style.display = 'none';
    currentScore = 0;
    cannon.updateMatrixWorld();

    // Get direction from quaternion
    const directionQuat = new THREE.Vector3(0, 0, -1);
    directionQuat.applyQuaternion(cannon.quaternion);
    // console.log(`Firing Direction (Quat): X=${directionQuat.x.toFixed(2)}, Y=${directionQuat.y.toFixed(2)}, Z=${directionQuat.z.toFixed(2)}`); // Can remove log

    cannonBallVelocity.copy(directionQuat).multiplyScalar(launchVelocity);

    const localMuzzlePosition = new THREE.Vector3(0, 0, -1.7);
    const worldMuzzlePosition = cannon.localToWorld(localMuzzlePosition.clone());
    cannonBall.position.copy(worldMuzzlePosition);
    cannonBall.visible = true;
    activeCamera = followCamera;
    updateUI();
}

function updatePhysics(deltaTime) {
    if (gameState !== STATE.FIRING) return;

    // Apply gravity
    cannonBallVelocity.add(gravity.clone().multiplyScalar(deltaTime));

    // Update position
    cannonBall.position.add(cannonBallVelocity.clone().multiplyScalar(deltaTime));

    // Update follow camera
    updateFollowCamera();

    // Check for collisions
    checkCollisions();
}

function updateFollowCamera() {
    // Position camera behind and slightly above the ball
    const offset = cannonBallVelocity.clone().normalize().multiplyScalar(-5); // 5 units behind
    offset.y += 2; // 2 units above
    followCamera.position.copy(cannonBall.position).add(offset);
    followCamera.lookAt(cannonBall.position);
}

function checkCollisions() {
    // Ground collision (remains basic)
    if (cannonBall.position.y <= cannonBallRadius) {
        console.log("Hit ground (simple check)");
        cannonBall.position.y = cannonBallRadius;
        handleLanding(false, 0);
        return;
    }

    // Target Collision - Simplified 3D distance check
    const distanceToTargetCenter = cannonBall.position.distanceTo(target.position);
    const hitThreshold = targetRadius + cannonBallRadius;
    
    console.log(`Checking target collision: Distance=${distanceToTargetCenter.toFixed(2)}, Threshold=${hitThreshold.toFixed(2)}`); // Log distance check

    if (distanceToTargetCenter <= hitThreshold) {
        console.log("HIT TARGET (Simplified Check)!");
        // Calculate simple score based on distance (closer = better)
        const score = Math.max(0, Math.round((1 - (distanceToTargetCenter / hitThreshold)) * 100));
        handleLanding(true, score);
        return;
    }
}

function handleLanding(hitTarget, score) {
    if (gameState === STATE.LANDED) return; // Prevent multiple landings per shot

    gameState = STATE.LANDED;
    cannonBallVelocity.set(0, 0, 0); // Stop the ball
    landTime = clock.getElapsedTime();
    shotsLeft--;
    currentScore = score; // Assign score from this landing
    totalScore += currentScore;
    updateUI();
    console.log(`Landed. Hit Target: ${hitTarget}, Score: ${currentScore}, Shots Left: ${shotsLeft}`);
}

function resetShot() {
    console.log("Resetting for next shot or game over.");
    cannonBall.visible = false;
    cannonBall.position.set(0, -100, 0);
    currentScore = 0;

    if (shotsLeft <= 0) {
        gameState = STATE.GAME_OVER;
        console.log("Game Over.");
        gameOverElement.style.display = 'block';
        finalScoreElement.textContent = totalScore;
        launchButton.style.display = 'none';
        totalScoreElement.textContent = totalScore;
    } else {
        gameState = STATE.AIMING;
        activeCamera = aimingCamera;
        launchButton.disabled = false;
        launchButton.style.display = 'block'; // Show launch button again
        updateAimingCamera();
        totalScoreElement.textContent = '-';
    }
    updateUI();
}

function restartGame() {
    console.log("Restarting game.");
    shotsLeft = 3;
    currentScore = 0;
    totalScore = 0;
    gameState = STATE.AIMING;
    activeCamera = aimingCamera;
    launchButton.disabled = false;
    launchButton.style.display = 'block';
    gameOverElement.style.display = 'none';
    cannonBall.visible = false;
    cannonBall.position.set(0, -100, 0);
    // Reset cannon orientation using X-axis pitch (positive for up)
    cannon.rotation.x = Math.PI / 8;
    cannon.rotation.y = 0;
    cannon.rotation.z = 0;
    updateAimingCamera();
    updateUI();
}

function updateUI() {
    shotsElement.textContent = shotsLeft;
    scoreElement.textContent = currentScore;
    if (gameState === STATE.AIMING) {
        totalScoreElement.textContent = '-';
    } else if (gameState === STATE.LANDED || gameState === STATE.FIRING || gameState === STATE.GAME_OVER) {
         totalScoreElement.textContent = totalScore;
    }
    launchButton.style.display = (gameState === STATE.AIMING && shotsLeft > 0) ? 'block' : 'none';
    restartButton.style.display = (gameState === STATE.GAME_OVER) ? 'inline-block' : 'none';

    const aimingElements = document.querySelectorAll('.aiming-ui');
    console.log(`Updating UI. State: ${gameState}. Found ${aimingElements.length} aiming elements.`);
    const displayStyle = (gameState === STATE.AIMING) ? 'block' : 'none';
    aimingElements.forEach(el => {
        console.log(`Setting display of ${el.id} to ${displayStyle}`);
        el.style.display = displayStyle;
    });
}

function animate() {
    requestAnimationFrame(animate);
    const deltaTime = clock.getDelta();
    // Log deltaTime here to ensure it's non-zero
    // console.log(`Animate loop. DeltaTime: ${deltaTime.toFixed(5)}`);

    updateCannonAim(deltaTime);

    if (gameState === STATE.FIRING) {
        updatePhysics(deltaTime);
    }
    if (gameState === STATE.LANDED) {
        if (clock.getElapsedTime() - landTime > resetDelay) {
            resetShot();
        }
    }

    if (activeCamera) {
        try {
             renderer.render(scene, activeCamera);
        } catch (e) {
            console.error("Render error:", e);
        }
    } else {
        console.warn("No active camera set during animation frame!");
        if(aimingCamera) renderer.render(scene, aimingCamera);
    }
}

function handleKeyDown(event) {
    // console.log("Key down:", event.code); // Can comment out basic key log
    keyStates[event.code] = true;
    if (event.code === 'Space' && gameState === STATE.AIMING) {
        event.preventDefault();
        fireCannon();
    }
}

function handleKeyUp(event) {
    keyStates[event.code] = false;
}

function updateCannonAim(deltaTime) {
    if (gameState !== STATE.AIMING) return;
    let yawChange = 0;
    let pitchChange = 0;
    if (keyStates['ArrowLeft'] || keyStates['KeyA']) { yawChange = cannonYawSpeed * deltaTime; }
    if (keyStates['ArrowRight'] || keyStates['KeyD']) { yawChange = -cannonYawSpeed * deltaTime; }
    if (keyStates['ArrowUp'] || keyStates['KeyW']) { pitchChange = cannonPitchSpeed * deltaTime; }
    if (keyStates['ArrowDown'] || keyStates['KeyS']) { pitchChange = -cannonPitchSpeed * deltaTime; }

    if (yawChange !== 0 || pitchChange !== 0) {
        cannon.rotation.y += yawChange;
        // Apply pitch change to X-axis rotation (+= up)
        cannon.rotation.x += pitchChange;
        // Clamp X rotation (pitch) - Positive X is UP
        cannon.rotation.x = THREE.MathUtils.clamp(cannon.rotation.x, minCannonAngleY, maxCannonAngleY);

        console.log(`Cannon Yaw (Y rot)=${cannon.rotation.y.toFixed(2)}, Cannon Pitch (X rot)=${cannon.rotation.x.toFixed(2)}`);
        
        cannon.updateMatrixWorld(); 
        updateAimingCamera();
    }
}

// Start the application *after* the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOMContentLoaded event fired. Running init().");
    init();
}); 