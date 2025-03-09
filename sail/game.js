// Sunset Sailing Adventure
// A 3D sailing game with sunset view, islands to explore, and light fog

// Main variables
let scene, camera, renderer, water, sun, boat, islands = [];
let clock = new THREE.Clock();
let boatSpeed = 0;
let maxSpeed = 15;
let boatRotationSpeed = 0.02;
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let fogEnabled = true;
let islandVisited = [];
let cameraView = 'behind'; // Default camera view

// Game state
const gameState = {
    boatSpeed: 0,
    direction: new THREE.Vector3(0, 0, 1),
    position: new THREE.Vector3(0, 0, 0),
    timeElapsed: 0
};

// Island positions
const islandPositions = [
    { x: 200, z: 200, radius: 50, name: "Palm Island" },
    { x: -180, z: 250, radius: 40, name: "Rocky Cove" },
    { x: 300, z: -150, radius: 60, name: "Treasure Island" },
    { x: -300, z: -200, radius: 45, name: "Mystic Peak" }
];

// Initialize the game
init();
animate();

// Initialize the game
function init() {
    // Create the scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);
    
    // Add light fog
    scene.fog = new THREE.FogExp2(0xdfe9f3, 0.0008);
    
    // Create the camera
    camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 1, 20000);
    camera.position.set(0, 10, -30);
    camera.lookAt(0, 0, 0);
    
    // Create the renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    document.getElementById('game-container').appendChild(renderer.domElement);
    
    // Handle window resize
    window.addEventListener('resize', onWindowResize);
    
    // Setup controls
    setupControls();
    
    // Create the sun
    createSun();
    
    // Create the water
    createWater();
    
    // Create the sky with sunset
    createSky();
    
    // Create the boat
    createBoat();
    
    // Create islands
    createIslands();
    
    // Update instructions for new controls
    updateInstructions();
    
    // Hide loading screen
    document.getElementById('loading-screen').style.display = 'none';
}

// Create the sun
function createSun() {
    sun = new THREE.Vector3();
    
    // Position the sun for sunset
    const theta = Math.PI * (0.25);
    const phi = 2 * Math.PI * (0.25);
    
    sun.x = Math.cos(phi);
    sun.y = Math.sin(phi) * Math.sin(theta);
    sun.z = Math.sin(phi) * Math.cos(theta);
    
    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0x444444);
    scene.add(ambientLight);
    
    // Add directional light from the sun
    const sunLight = new THREE.DirectionalLight(0xffffff, 1);
    sunLight.position.set(sun.x, sun.y, sun.z);
    scene.add(sunLight);
}

// Create the water
function createWater() {
    const waterGeometry = new THREE.PlaneGeometry(10000, 10000);
    
    water = new THREE.Water(waterGeometry, {
        textureWidth: 512,
        textureHeight: 512,
        waterNormals: new THREE.TextureLoader().load('https://threejs.org/examples/textures/waternormals.jpg', function(texture) {
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        }),
        sunDirection: new THREE.Vector3(sun.x, sun.y, sun.z),
        sunColor: 0xeb8934,
        waterColor: 0x0064b5,
        distortionScale: 3.7,
        fog: scene.fog !== undefined
    });
    
    water.rotation.x = -Math.PI / 2;
    scene.add(water);
}

// Create the sky with sunset colors
function createSky() {
    const sky = new THREE.Sky();
    sky.scale.setScalar(10000);
    scene.add(sky);
    
    const skyUniforms = sky.material.uniforms;
    
    skyUniforms['turbidity'].value = 10;
    skyUniforms['rayleigh'].value = 2;
    skyUniforms['mieCoefficient'].value = 0.005;
    skyUniforms['mieDirectionalG'].value = 0.8;
    
    const parameters = {
        elevation: 5,
        azimuth: 180
    };
    
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    
    function updateSun() {
        const phi = THREE.MathUtils.degToRad(90 - parameters.elevation);
        const theta = THREE.MathUtils.degToRad(parameters.azimuth);
        
        sun.setFromSphericalCoords(1, phi, theta);
        
        sky.material.uniforms['sunPosition'].value.copy(sun);
        water.material.uniforms['sunDirection'].value.copy(sun).normalize();
        
        scene.environment = pmremGenerator.fromScene(sky).texture;
    }
    
    updateSun();
}

// Create the sailing boat
function createBoat() {
    // Create a group for the entire boat
    boat = new THREE.Group();
    scene.add(boat);
    
    // Main hull - simple box
    const hullGeometry = new THREE.BoxGeometry(6, 4, 16);
    const hullMaterial = new THREE.MeshStandardMaterial({ color: 0xA0522D });
    const hull = new THREE.Mesh(hullGeometry, hullMaterial);
    hull.position.y = 1;
    boat.add(hull);
    
    // Deck - light colored
    const deckGeometry = new THREE.BoxGeometry(5.8, 0.5, 15.8);
    const deckMaterial = new THREE.MeshStandardMaterial({ color: 0xECDCB0 });
    const deck = new THREE.Mesh(deckGeometry, deckMaterial);
    deck.position.set(0, 3.2, 0);
    boat.add(deck);
    
    // Cabin at back
    const cabinGeometry = new THREE.BoxGeometry(4, 3, 3);
    const cabinMaterial = new THREE.MeshStandardMaterial({ color: 0xA0522D });
    const cabin = new THREE.Mesh(cabinGeometry, cabinMaterial);
    cabin.position.set(0, 5, 5);
    boat.add(cabin);
    
    // Yellow railings (simplified)
    const railingMaterial = new THREE.MeshStandardMaterial({ color: 0xFFD700 });
    
    // Front rail
    const frontRailGeometry = new THREE.BoxGeometry(5.8, 0.8, 0.3);
    const frontRail = new THREE.Mesh(frontRailGeometry, railingMaterial);
    frontRail.position.set(0, 3.6, -7.5);
    boat.add(frontRail);
    
    // Side rails
    const leftRailGeometry = new THREE.BoxGeometry(0.3, 0.8, 15.8);
    const leftRail = new THREE.Mesh(leftRailGeometry, railingMaterial);
    leftRail.position.set(3, 3.6, 0);
    boat.add(leftRail);
    
    const rightRail = new THREE.Mesh(leftRailGeometry, railingMaterial);
    rightRail.position.set(-3, 3.6, 0);
    boat.add(rightRail);
    
    // Back rail
    const backRailGeometry = new THREE.BoxGeometry(5.8, 0.8, 0.3);
    const backRail = new THREE.Mesh(backRailGeometry, railingMaterial);
    backRail.position.set(0, 3.6, 7.5);
    boat.add(backRail);
    
    // Main mast (central)
    const mastGeometry = new THREE.CylinderGeometry(0.3, 0.3, 20);
    const mastMaterial = new THREE.MeshStandardMaterial({ color: 0xA0522D });
    const mainMast = new THREE.Mesh(mastGeometry, mastMaterial);
    mainMast.position.set(0, 12, 0);
    boat.add(mainMast);
    
    // Crow's nest - simplified
    const crowsNestGeometry = new THREE.CylinderGeometry(1, 1, 1, 8);
    const crowsNest = new THREE.Mesh(crowsNestGeometry, cabinMaterial);
    crowsNest.position.set(0, 17, 0);
    boat.add(crowsNest);
    
    // Horizontal mast supports (yards) - three levels
    const yardGeometry = new THREE.CylinderGeometry(0.15, 0.15, 12);
    const yardMaterial = new THREE.MeshStandardMaterial({ color: 0xA0522D });
    
    // Top yard
    const topYard = new THREE.Mesh(yardGeometry, yardMaterial);
    topYard.rotation.z = Math.PI / 2;
    topYard.position.set(0, 16, 0);
    boat.add(topYard);
    
    // Middle yard
    const middleYard = new THREE.Mesh(yardGeometry, yardMaterial);
    middleYard.rotation.z = Math.PI / 2;
    middleYard.position.set(0, 13, 0);
    boat.add(middleYard);
    
    // Bottom yard
    const bottomYard = new THREE.Mesh(yardGeometry, yardMaterial);
    bottomYard.rotation.z = Math.PI / 2;
    bottomYard.position.set(0, 10, 0);
    boat.add(bottomYard);
    
    // Main sail material - white and slightly transparent
    const sailMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xFFFFFF,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.9
    });
    
    // Main sail (rectangle)
    const mainSailGeometry = new THREE.PlaneGeometry(10, 14);
    const mainSail = new THREE.Mesh(mainSailGeometry, sailMaterial);
    mainSail.position.set(0, 11.5, 0);
    mainSail.rotation.y = Math.PI / 2;
    boat.add(mainSail);
    
    // Add triangular back sail - this is visible from the side
    const backSailGeometry = new THREE.BufferGeometry();
    const backSailVertices = new Float32Array([
        0, 17, 5,   // top of mast
        0, 3.5, 12,  // bottom back
        0, 3.5, 5    // bottom front
    ]);
    backSailGeometry.setAttribute('position', new THREE.BufferAttribute(backSailVertices, 3));
    backSailGeometry.setIndex([0, 1, 2]); // Create a triangle
    backSailGeometry.computeVertexNormals();
    
    const backSail = new THREE.Mesh(backSailGeometry, sailMaterial);
    boat.add(backSail);
    
    // Add a sail perpendicular to the boat (visible from back view, similar to a spinnaker)
    const perpendicularSailGeometry = new THREE.PlaneGeometry(12, 10);
    const perpendicularSail = new THREE.Mesh(perpendicularSailGeometry, sailMaterial);
    perpendicularSail.position.set(0, 11, 7); // Position it at the back
    perpendicularSail.rotation.x = Math.PI / 12; // Tilt it slightly forward
    boat.add(perpendicularSail);
    
    // Horizontal bar for the perpendicular sail
    const sailBarGeometry = new THREE.CylinderGeometry(0.15, 0.15, 12);
    const sailBar = new THREE.Mesh(sailBarGeometry, yardMaterial);
    sailBar.rotation.z = Math.PI / 2;
    sailBar.position.set(0, 13, 7); // Place it at the back of the mast
    boat.add(sailBar);
    
    // Add rigging for the perpendicular sail
    const ropeMaterial = new THREE.MeshStandardMaterial({ color: 0xECDCB0 });
    
    // Diagonal ropes for the perpendicular sail
    for (let side = -1; side <= 1; side += 2) {
        const ropeGeometry = new THREE.CylinderGeometry(0.05, 0.05, 9);
        const rope = new THREE.Mesh(ropeGeometry, ropeMaterial);
        rope.position.set(side * 3, 8, 7);
        const angle = Math.atan2(5, 6);
        rope.rotation.z = Math.PI / 2 - angle * side;
        boat.add(rope);
    }
    
    // More diagonal ropes from mast to sides
    for (let side = -1; side <= 1; side += 2) {
        // Top diagonal rope to each side
        const topRopeGeometry = new THREE.CylinderGeometry(0.05, 0.05, 10);
        const topRope = new THREE.Mesh(topRopeGeometry, ropeMaterial);
        topRope.position.set(side * 2.5, 12, 0);
        // Calculate angle for diagonal rope
        const angle = Math.atan2(8, 5);
        topRope.rotation.z = Math.PI / 2 - angle * side;
        boat.add(topRope);
        
        // Middle diagonal rope
        const midRopeGeometry = new THREE.CylinderGeometry(0.05, 0.05, 8);
        const midRope = new THREE.Mesh(midRopeGeometry, ropeMaterial);
        midRope.position.set(side * 2, 10, 0);
        midRope.rotation.z = Math.PI / 2 - (angle * 0.8) * side;
        boat.add(midRope);
    }
    
    // Position the boat slightly above water
    boat.position.y = 1;
    
    // Position camera relative to boat
    camera.position.set(0, 10, -30);
    boat.add(camera);
}

// Create islands to explore
function createIslands() {
    islandPositions.forEach((islandData, index) => {
        createIsland(islandData.x, islandData.z, islandData.radius, islandData.name, index);
    });
}

// Create a single island
function createIsland(x, z, radius, name, index) {
    // Create island base (land)
    const islandGeometry = new THREE.ConeGeometry(radius, radius * 0.6, 32);
    const islandMaterial = new THREE.MeshStandardMaterial({ color: 0xD2B48C });
    const island = new THREE.Group();
    const islandBase = new THREE.Mesh(islandGeometry, islandMaterial);
    islandBase.rotation.x = Math.PI;
    islandBase.position.y = -radius * 0.3;
    island.add(islandBase);
    
    // Add some palm trees
    const treeCount = Math.floor(radius / 10);
    for (let i = 0; i < treeCount; i++) {
        const distance = Math.random() * (radius * 0.8);
        const angle = Math.random() * Math.PI * 2;
        const x = Math.cos(angle) * distance;
        const z = Math.sin(angle) * distance;
        
        // Tree trunk
        const trunkGeometry = new THREE.CylinderGeometry(0.5, 0.8, 10, 8);
        const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        trunk.position.set(x, 1, z);
        
        // Tree top
        const topGeometry = new THREE.ConeGeometry(5, 6, 8);
        const topMaterial = new THREE.MeshStandardMaterial({ color: 0x228B22 });
        const top = new THREE.Mesh(topGeometry, topMaterial);
        top.position.y = 8;
        trunk.add(top);
        
        island.add(trunk);
    }
    
    // Add a sign with island name
    const signGeometry = new THREE.BoxGeometry(10, 5, 1);
    const signMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
    const sign = new THREE.Mesh(signGeometry, signMaterial);
    sign.position.set(0, 10, 0);
    island.add(sign);
    
    // Position the island
    island.position.set(x, 0, z);
    scene.add(island);
    
    // Store island data
    islands.push({
        object: island,
        position: new THREE.Vector3(x, 0, z),
        radius: radius,
        name: name,
        index: index,
        visited: false
    });
}

// Handle window resize
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Setup keyboard controls
function setupControls() {
    // Keyboard controls
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    
    // Reset camera position and toggle camera views
    document.addEventListener('keydown', function(event) {
        if (event.code === 'Space') {
            toggleCameraView();
        }
    });
}

// Toggle between different camera views
function toggleCameraView() {
    // Detach camera from boat first
    boat.remove(camera);
    scene.add(camera);
    
    switch(cameraView) {
        case 'behind':
            // Change to top view
            camera.position.set(0, 50, 0);
            camera.lookAt(boat.position);
            cameraView = 'top';
            break;
        case 'top':
            // Change to side view
            camera.position.set(50, 15, 0);
            camera.lookAt(boat.position);
            cameraView = 'side';
            break;
        case 'side':
            // Change to front view
            camera.position.set(0, 10, 30);
            camera.lookAt(boat.position);
            cameraView = 'front';
            break;
        case 'front':
            // Change to sail view (from the mast)
            camera.position.set(0, 20, -5);
            camera.lookAt(new THREE.Vector3(boat.position.x, boat.position.y, boat.position.z + 50));
            cameraView = 'sail';
            break;
        case 'sail':
            // Back to default behind view
            camera.position.set(0, 10, -30);
            camera.lookAt(new THREE.Vector3(0, 0, 30));
            cameraView = 'behind';
            break;
    }
    
    // Re-attach camera to boat to move with it
    scene.remove(camera);
    boat.add(camera);
}

// Handle key down events
function onKeyDown(event) {
    switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
            moveForward = true;
            break;
        case 'ArrowDown':
        case 'KeyS':
            moveBackward = true;
            break;
        case 'ArrowLeft':
        case 'KeyA':
            moveLeft = true;
            break;
        case 'ArrowRight':
        case 'KeyD':
            moveRight = true;
            break;
        case 'KeyF':
            // Toggle fog
            fogEnabled = !fogEnabled;
            if (fogEnabled) {
                scene.fog = new THREE.FogExp2(0xdfe9f3, 0.0008);
            } else {
                scene.fog = null;
            }
            break;
        case 'KeyC':
            // Toggle camera view
            toggleCameraView();
            break;
    }
}

// Handle key up events
function onKeyUp(event) {
    switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
            moveForward = false;
            break;
        case 'ArrowDown':
        case 'KeyS':
            moveBackward = false;
            break;
        case 'ArrowLeft':
        case 'KeyA':
            moveLeft = false;
            break;
        case 'ArrowRight':
        case 'KeyD':
            moveRight = false;
            break;
    }
}

// Update boat position and rotation
function updateBoat(deltaTime) {
    // Update speed
    if (moveForward) {
        gameState.boatSpeed = Math.min(gameState.boatSpeed + 2 * deltaTime, maxSpeed);
    } else if (moveBackward) {
        gameState.boatSpeed = Math.max(gameState.boatSpeed - 4 * deltaTime, 0);
    } else {
        gameState.boatSpeed *= 0.98; // Natural slowdown
    }
    
    // Update rotation
    if (moveLeft) {
        boat.rotation.y += boatRotationSpeed;
        // Update direction vector
        gameState.direction.x = Math.sin(boat.rotation.y);
        gameState.direction.z = Math.cos(boat.rotation.y);
    }
    if (moveRight) {
        boat.rotation.y -= boatRotationSpeed;
        // Update direction vector
        gameState.direction.x = Math.sin(boat.rotation.y);
        gameState.direction.z = Math.cos(boat.rotation.y);
    }
    
    // Update position
    boat.position.x += gameState.direction.x * gameState.boatSpeed * deltaTime;
    boat.position.z += gameState.direction.z * gameState.boatSpeed * deltaTime;
    
    // Update game state
    gameState.position.copy(boat.position);
    
    // Update water movement
    water.material.uniforms['time'].value += deltaTime;
    
    // Update HUD
    document.getElementById('speed').textContent = `Speed: ${gameState.boatSpeed.toFixed(1)} knots`;
    
    // Update compass (simplified)
    const angle = (boat.rotation.y * (180 / Math.PI)) % 360;
    let direction = "N";
    if (angle > -45 && angle < 45) direction = "N";
    else if (angle >= 45 && angle < 135) direction = "E";
    else if (angle >= 135 || angle < -135) direction = "S";
    else if (angle >= -135 && angle < -45) direction = "W";
    document.getElementById('compass').textContent = direction;
    
    // Check for island proximity
    checkIslandProximity();
}

// Check if boat is near an island
function checkIslandProximity() {
    islands.forEach(island => {
        const distance = boat.position.distanceTo(island.position);
        
        // If player is near island and hasn't visited it yet
        if (distance < island.radius + 20 && !island.visited) {
            island.visited = true;
            
            // Display island discovery message
            const message = document.createElement('div');
            message.style.position = 'absolute';
            message.style.top = '50%';
            message.style.left = '50%';
            message.style.transform = 'translate(-50%, -50%)';
            message.style.color = 'white';
            message.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
            message.style.padding = '20px';
            message.style.borderRadius = '10px';
            message.style.fontSize = '24px';
            message.style.zIndex = '200';
            message.innerHTML = `<h2>Discovered: ${island.name}!</h2>`;
            document.getElementById('game-container').appendChild(message);
            
            // Remove message after 5 seconds
            setTimeout(() => {
                message.style.opacity = '0';
                message.style.transition = 'opacity 2s';
                setTimeout(() => {
                    document.getElementById('game-container').removeChild(message);
                }, 2000);
            }, 5000);
        }
    });
}

// Update instructions in the HTML to include new controls
function updateInstructions() {
    const instructions = document.getElementById('instructions');
    instructions.innerHTML = `
        <p>W/↑: Accelerate</p>
        <p>S/↓: Decelerate</p>
        <p>A/←: Turn Left</p>
        <p>D/→: Turn Right</p>
        <p>Space/C: Change Camera View</p>
        <p>F: Toggle Fog</p>
    `;
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    const deltaTime = clock.getDelta();
    gameState.timeElapsed += deltaTime;
    
    // Update boat
    updateBoat(deltaTime);
    
    // Render the scene
    renderer.render(scene, camera);
} 