import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB); // Sky blue background

// Camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 10; // Pull back the camera slightly
camera.position.y = 5;
camera.lookAt(0, 0, 0); // Look at the center of the scene

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true }); // Enable antialiasing
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// --- Controls ---
const controls = new PointerLockControls(camera, renderer.domElement);
let isFirstPersonView = false; // Start in third-person
const thirdPersonOffset = new THREE.Vector3(0, 4, 7); // Camera offset in third-person (x, y, z)

// Lock pointer on click or V press
function tryLockPointer() {
    if (!isFirstPersonView) {
        controls.lock();
    }
}
renderer.domElement.addEventListener('click', tryLockPointer);

// Optional: Add listeners for lock/unlock events (e.g., show/hide instructions)
controls.addEventListener('lock', () => {
    console.log('Pointer Locked - First Person');
    isFirstPersonView = true;
    // You could hide an instructions overlay here
});
controls.addEventListener('unlock', () => {
    console.log('Pointer Unlocked - Third Person');
    isFirstPersonView = false;
    // You could show an instructions overlay here
});

// Add controls object to the scene so it can be positioned
// scene.add(controls.getObject()); // The camera is already added implicitly

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); // Soft white light
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(5, 10, 7.5);
// We'll configure shadows later
// directionalLight.castShadow = true;
scene.add(directionalLight);

// Ground Plane
const groundGeometry = new THREE.PlaneGeometry(50, 50); // Width, Height
const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x228B22 }); // Forest green
const groundPlane = new THREE.Mesh(groundGeometry, groundMaterial);
groundPlane.rotation.x = -Math.PI / 2; // Rotate it to be horizontal
// groundPlane.receiveShadow = true; // Allow shadows later
scene.add(groundPlane);

// --- Platforms ---
const platforms = [];
const platformGeometry = new THREE.BoxGeometry(5, 1, 5); // Example size
const platformMaterial = new THREE.MeshStandardMaterial({ color: 0xA0522D }); // Brown color

const platform1 = new THREE.Mesh(platformGeometry, platformMaterial);
platform1.position.set(5, 2, -5); // Position: x, y, z
scene.add(platform1);
platforms.push(platform1);

const platform2 = new THREE.Mesh(new THREE.BoxGeometry(3, 1, 3), platformMaterial);
platform2.position.set(-4, 3, 0);
scene.add(platform2);
platforms.push(platform2);

const platform3 = new THREE.Mesh(new THREE.BoxGeometry(4, 1, 2), platformMaterial);
platform3.position.set(0, 4, 6);
scene.add(platform3);
platforms.push(platform3);

// Array for collision detection (add ground plane as well, although it's infinite)
const collidableObjects = [groundPlane, ...platforms]; 
// Note: Treating infinite ground plane as a collidable object needs careful handling in checks

// --- NPCs ---
const npcs = [];
const npcGeometry = new THREE.BoxGeometry(0.8, 0.8, 0.8); // Slightly smaller than player
const npcMaterial = new THREE.MeshStandardMaterial({ color: 0x0000FF }); // Blue

function createNPC(position, movementAxis, movementRange) {
    const npc = new THREE.Mesh(npcGeometry, npcMaterial);
    npc.position.copy(position);
    scene.add(npc);
    // Add custom properties for movement logic
    npc.userData = {
        speed: 0.03,
        direction: 1,
        axis: movementAxis, // 'x' or 'z'
        range: movementRange, // Total distance to travel back and forth
        startPos: position.clone()
    };
    npcs.push(npc);
    return npc;
}

// Create some NPCs
createNPC(new THREE.Vector3(-5, 0.4, -5), 'x', 6);
createNPC(new THREE.Vector3(2, 0.4, 4), 'z', 8);
createNPC(new THREE.Vector3(7, 2.4, -5), 'z', 4); // NPC on platform1

// --- Player Character Model ---
const playerModel = new THREE.Group();

// Dimensions (adjust as needed)
const headSize = 0.5;
const torsoHeight = 0.75;
const torsoWidth = 0.5;
const torsoDepth = 0.25;
const armLength = 0.75;
const armWidth = 0.2;
const legHeight = 0.75;
const legWidth = 0.22; // Slightly wider than arm

// Materials (Example: Steve-like colors)
const skinMaterial = new THREE.MeshStandardMaterial({ color: 0xFFDBAC }); // Light skin tone
const torsoMaterial = new THREE.MeshStandardMaterial({ color: 0x4682B4 }); // Steel blue
const legsMaterial = new THREE.MeshStandardMaterial({ color: 0x2F4F4F });  // Dark slate gray

// Head
const headGeometry = new THREE.BoxGeometry(headSize, headSize, headSize);
const head = new THREE.Mesh(headGeometry, skinMaterial);
head.position.y = legHeight + torsoHeight + (headSize / 2);
playerModel.add(head);

// Torso
const torsoGeometry = new THREE.BoxGeometry(torsoWidth, torsoHeight, torsoDepth);
const torso = new THREE.Mesh(torsoGeometry, torsoMaterial);
torso.position.y = legHeight + (torsoHeight / 2);
playerModel.add(torso);

// Arms - Make arms accessible for animation
const armGeometry = new THREE.BoxGeometry(armWidth, armLength, armWidth);
const playerLeftArm = new THREE.Mesh(armGeometry, skinMaterial); // Renamed variable
playerLeftArm.position.x = -(torsoWidth / 2 + armWidth / 2);
playerLeftArm.position.y = legHeight + torsoHeight - (armLength / 2);
playerModel.add(playerLeftArm);

const playerRightArm = playerLeftArm.clone(); // Renamed variable
playerRightArm.position.x = torsoWidth / 2 + armWidth / 2;
playerModel.add(playerRightArm);

// Legs
const legGeometry = new THREE.BoxGeometry(legWidth, legHeight, legWidth);
const leftLeg = new THREE.Mesh(legGeometry, legsMaterial);
leftLeg.position.x = -(torsoWidth / 4);
leftLeg.position.y = legHeight / 2;
playerModel.add(leftLeg);

const rightLeg = leftLeg.clone();
rightLeg.position.x = torsoWidth / 4;
playerModel.add(rightLeg);

// Calculate original player height (used for camera and crouching)
const playerOriginalHeight = legHeight + torsoHeight + headSize;

// Add the complete model to the scene
// playerModel.castShadow = true; // Enable shadows later for the whole group
scene.add(playerModel);

// Player Physics & Controls (references playerModel now)
const playerVelocity = new THREE.Vector3(0, 0, 0);
const normalPlayerSpeed = 0.1;
const crouchPlayerSpeed = 0.05;
const jumpForce = 0.2;
const gravity = 0.01; // Added back!
let isOnGround = false;
const keysPressed = {};

// Punching state
let isPunching = false;
const punchDuration = 0.3; // seconds
let punchTimer = 0;
const rightArmOriginalPosition = playerRightArm.position.clone();
const clock = new THREE.Clock(); // Need a clock for delta time

// Crouching state
let isCrouching = false;
const crouchScale = 0.6; // Scale down to 60% height

// --- Collision Detection Helpers ---

// Get player's current AABB
function getPlayerAABB(model) {
    const playerBox = new THREE.Box3();
    // Base bounding box on the torso, slightly expanded, adjust as needed
    // This is an approximation, real Minecraft-style collision is more complex
    const torsoWorldPos = new THREE.Vector3();
    torso.getWorldPosition(torsoWorldPos);

    const halfWidth = (torsoWidth / 2) * model.scale.x;
    const halfDepth = (torsoDepth / 2) * model.scale.z;
    const currentHeight = playerOriginalHeight * model.scale.y;

    playerBox.min.set(
        model.position.x - halfWidth,
        model.position.y, // Bottom edge at model's origin y
        model.position.z - halfDepth
    );
    playerBox.max.set(
        model.position.x + halfWidth,
        model.position.y + currentHeight, // Top edge based on current height
        model.position.z + halfDepth
    );
    return playerBox;
}

// Get AABB for a static box mesh (like platforms)
function getMeshAABB(mesh) {
    return new THREE.Box3().setFromObject(mesh);
}

// Check AABB intersection
function checkAABBCollision(boxA, boxB) {
    return boxA.intersectsBox(boxB);
}

// --- End Collision Helpers ---

window.addEventListener('keydown', (event) => {
    const key = event.key.toLowerCase();
    keysPressed[key] = true;

    // Jump
    if (key === ' ' && isOnGround) {
        playerVelocity.y = jumpForce;
        isOnGround = false;
    }

    // Punch
    if (key === 'f' && !isPunching) {
        isPunching = true;
        punchTimer = 0;
    }

    // Crouch Start
    if (key === 'c' && !isCrouching && isOnGround) { // Can only crouch while on ground
        isCrouching = true;
        playerModel.scale.y = crouchScale;
        // Model origin is at feet, so no y-position adjustment needed for scaling
        // playerSpeed = crouchPlayerSpeed; // Set speed in animate loop based on state
    }

    // Toggle View
    if (key === 'v') {
        if (isFirstPersonView) {
            controls.unlock(); // Request unlock (will trigger 'unlock' event)
        } else {
            controls.lock();   // Request lock (will trigger 'lock' event)
        }
    }
});

window.addEventListener('keyup', (event) => {
    const key = event.key.toLowerCase();
    keysPressed[key] = false;

    // Crouch End
    if (key === 'c' && isCrouching) {
        // TODO: Add check here if space is clear above before standing up?
        isCrouching = false;
        playerModel.scale.y = 1;
        // playerSpeed = normalPlayerSpeed; // Set speed in animate loop based on state
    }
});

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    const deltaTime = clock.getDelta();
    isOnGround = false; // Assume not on ground until collision check proves otherwise

    // --- Physics Update ---

    // 1. Apply Gravity (Predict next Y position)
    const predictedVelocityY = playerVelocity.y - gravity;
    const playerAABB = getPlayerAABB(playerModel);
    const predictedPlayerAABB_Y = playerAABB.clone();
    predictedPlayerAABB_Y.min.y += predictedVelocityY; // Predict only Y movement
    predictedPlayerAABB_Y.max.y += predictedVelocityY;

    let verticalCollision = false;
    for (const obj of collidableObjects) {
        const objAABB = getMeshAABB(obj);
        // Special handling for infinite ground plane (PlaneGeometry)
        if (obj === groundPlane) {
            if (predictedPlayerAABB_Y.min.y <= 0) {
                verticalCollision = true;
                playerVelocity.y = 0;
                playerModel.position.y = 0; // Snap to ground
                isOnGround = true;
                break; // Stop checking after ground collision
            }
        } else { // Regular platforms
            if (checkAABBCollision(predictedPlayerAABB_Y, objAABB)) {
                 // Check if collision is from top (player landing on platform)
                 // Allow some tolerance (epsilon) for floating point comparison
                 const epsilon = 0.01; 
                 if (playerAABB.min.y >= objAABB.max.y - epsilon) { 
                    verticalCollision = true;
                    playerVelocity.y = 0;
                    playerModel.position.y = objAABB.max.y; // Snap to platform top
                    isOnGround = true;
                    break; // Stop checking after collision
                 }
            }
        }
    }

    // If no vertical collision, apply gravity
    if (!verticalCollision) {
        playerVelocity.y = predictedVelocityY;
        playerModel.position.y += playerVelocity.y;
        // No need for else { isOnGround = false; } because we reset it at the start
    }

    // 2. Horizontal Movement (Relative to Camera)
    const playerSpeed = isCrouching ? crouchPlayerSpeed : normalPlayerSpeed;
    const forward = new THREE.Vector3();
    const right = new THREE.Vector3();
    controls.getDirection(forward); // Get camera's forward direction
    right.crossVectors(controls.getObject().up, forward).normalize(); // Calculate right vector

    const horizontalMovement = new THREE.Vector3();
    if (keysPressed['w']) horizontalMovement.add(forward);
    if (keysPressed['s']) horizontalMovement.sub(forward);
    if (keysPressed['a']) horizontalMovement.sub(right); // Subtract right for left
    if (keysPressed['d']) horizontalMovement.add(right);

    horizontalMovement.normalize().multiplyScalar(playerSpeed); // Normalize and apply speed

    // Predict and check horizontal collision separately for X and Z
    // Check X movement
    const predictedPlayerAABB_X = getPlayerAABB(playerModel);
    predictedPlayerAABB_X.min.x += horizontalMovement.x;
    predictedPlayerAABB_X.max.x += horizontalMovement.x;
    let collisionX = false;
    for (const obj of platforms) { // Don't check horizontal collision with infinite ground
        const objAABB = getMeshAABB(obj);
        if (checkAABBCollision(predictedPlayerAABB_X, objAABB)) {
            collisionX = true;
            break;
        }
    }
    if (!collisionX) {
        playerModel.position.x += horizontalMovement.x;
    }

    // Check Z movement
    const predictedPlayerAABB_Z = getPlayerAABB(playerModel); // Get potentially updated AABB
    predictedPlayerAABB_Z.min.z += horizontalMovement.z;
    predictedPlayerAABB_Z.max.z += horizontalMovement.z;
    let collisionZ = false;
    for (const obj of platforms) { // Don't check horizontal collision with infinite ground
        const objAABB = getMeshAABB(obj);
        if (checkAABBCollision(predictedPlayerAABB_Z, objAABB)) {
            collisionZ = true;
            break;
        }
    }
    if (!collisionZ) {
        playerModel.position.z += horizontalMovement.z;
    }

    // --- End Physics Update ---

    // --- NPC Movement ---
    for (const npc of npcs) {
        const data = npc.userData;
        npc.position[data.axis] += data.speed * data.direction;

        // Check bounds and reverse direction
        const distanceMoved = Math.abs(npc.position[data.axis] - data.startPos[data.axis]);
        if (distanceMoved >= data.range / 2) {
            data.direction *= -1;
            // Clamp position to prevent overshooting
            const clampedPos = data.startPos[data.axis] + (data.range / 2 * data.direction);
            npc.position[data.axis] = clampedPos; 
        }
    }

    // Punch Animation
    if (isPunching) {
        punchTimer += deltaTime;
        const punchProgress = Math.min(punchTimer / punchDuration, 1);

        if (punchProgress < 0.5) {
            // Forward motion (first half)
            playerRightArm.position.z = rightArmOriginalPosition.z + 0.5 * (punchProgress / 0.5); // Move forward 0.5 units
        } else {
            // Return motion (second half)
            playerRightArm.position.z = rightArmOriginalPosition.z + 0.5 * ((1 - punchProgress) / 0.5);
        }

        if (punchProgress >= 1) {
            isPunching = false;
            playerRightArm.position.copy(rightArmOriginalPosition); // Ensure it resets perfectly
        }
    }

    // --- Camera Update ---
    const eyeLevel = playerOriginalHeight * (isCrouching ? crouchScale * 0.85 : 0.85);
    const playerHeadPosition = playerModel.position.clone().add(new THREE.Vector3(0, eyeLevel, 0));

    if (isFirstPersonView) {
        // First Person Camera Update
        controls.getObject().position.copy(playerHeadPosition);
    } else {
        // Third Person Camera Update
        const targetCameraPosition = playerHeadPosition.clone().add(thirdPersonOffset);

        // Smoothly interpolate camera position
        camera.position.lerp(targetCameraPosition, 0.1);

        // Always look slightly above the player model's base
        const lookAtPosition = playerModel.position.clone();
        lookAtPosition.y += playerOriginalHeight * 0.5 * playerModel.scale.y; // Look at center mass approx
        camera.lookAt(lookAtPosition);
    }

    renderer.render(scene, camera);
}

animate();

console.log("Three.js scene initialized"); 