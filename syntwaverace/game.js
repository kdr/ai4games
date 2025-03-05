// Game variables
let scene, camera, renderer;
let road, car, grid;
let speed = 0;
let maxSpeed = 200;
let acceleration = 0.5;
let deceleration = 0.3;
let roadSegments = [];
let isGameStarted = false;
let gameLoop;

// Road config
const roadWidth = 2000;
const roadLength = 10000;
const laneWidth = roadWidth / 4;
const segmentLength = 100;
const rumbleLength = 3;

// Grid config
const gridSize = 20000;
const gridDivisions = 100;

// Camera config
const cameraHeight = 200;
const cameraDistance = 500;

// Colors
const colors = {
  sky: 0x120023,
  grid: 0xff41e9,
  road: 0x111111,
  rumble: 0xffffff,
  lane: 0xffff00
};

// Initialize the game
function init() {
  // Set up Three.js scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(colors.sky);
  scene.fog = new THREE.Fog(colors.sky, 1000, 10000);

  // Set up camera
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 20000);
  camera.position.set(0, cameraHeight, cameraDistance);
  camera.lookAt(0, 0, 0);

  // Set up renderer
  renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('game-canvas'), antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);

  // Add lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(0, 1000, 0);
  scene.add(directionalLight);

  // Create synthwave grid
  createGrid();

  // Create road
  createRoad();

  // Create car
  createCar();

  // Add synthwave sun
  createSynthwaveSun();

  // Add some decorative elements
  addDecorations();

  // Handle window resize
  window.addEventListener('resize', onWindowResize);

  // Handle game start
  document.getElementById('start-button').addEventListener('click', startGame);

  // Update speed display
  updateSpeedDisplay();

  // Initial render
  renderer.render(scene, camera);
}

// Create grid floor
function createGrid() {
  const gridHelper = new THREE.GridHelper(gridSize, gridDivisions, colors.grid, colors.grid);
  grid = gridHelper;
  scene.add(grid);

  // Add a plane below the grid
  const planeGeometry = new THREE.PlaneGeometry(gridSize, gridSize);
  const planeMaterial = new THREE.MeshBasicMaterial({ 
    color: 0x000000,
    side: THREE.DoubleSide 
  });
  const plane = new THREE.Mesh(planeGeometry, planeMaterial);
  plane.rotation.x = Math.PI / 2;
  plane.position.y = -0.1;
  scene.add(plane);
}

// Create road
function createRoad() {
  road = new THREE.Group();
  scene.add(road);

  // Create road segments
  for (let z = 0; z < roadLength; z += segmentLength) {
    // Main road
    const roadSegment = new THREE.Mesh(
      new THREE.PlaneGeometry(roadWidth, segmentLength),
      new THREE.MeshBasicMaterial({ color: colors.road })
    );
    roadSegment.rotation.x = -Math.PI / 2;
    roadSegment.position.set(0, 0.01, -z - segmentLength / 2);
    road.add(roadSegment);
    roadSegments.push(roadSegment);

    // Rumble strips
    if (Math.floor(z / segmentLength) % rumbleLength < Math.floor(rumbleLength / 2)) {
      const leftRumble = new THREE.Mesh(
        new THREE.PlaneGeometry(laneWidth / 4, segmentLength),
        new THREE.MeshBasicMaterial({ color: colors.rumble })
      );
      leftRumble.rotation.x = -Math.PI / 2;
      leftRumble.position.set(-roadWidth / 2 + laneWidth / 8, 0.02, -z - segmentLength / 2);
      road.add(leftRumble);

      const rightRumble = new THREE.Mesh(
        new THREE.PlaneGeometry(laneWidth / 4, segmentLength),
        new THREE.MeshBasicMaterial({ color: colors.rumble })
      );
      rightRumble.rotation.x = -Math.PI / 2;
      rightRumble.position.set(roadWidth / 2 - laneWidth / 8, 0.02, -z - segmentLength / 2);
      road.add(rightRumble);
    }

    // Lane markers
    if (z % (segmentLength * 2) === 0) {
      const laneLine = new THREE.Mesh(
        new THREE.PlaneGeometry(laneWidth / 8, segmentLength / 2),
        new THREE.MeshBasicMaterial({ color: colors.lane })
      );
      laneLine.rotation.x = -Math.PI / 2;
      laneLine.position.set(0, 0.02, -z - segmentLength / 2);
      road.add(laneLine);
    }
  }
}

// Create car (silhouette style)
function createCar() {
  // Create a simple silhouette car shape
  const carShape = new THREE.Shape();
  carShape.moveTo(0, 0);
  carShape.lineTo(20, 0);
  carShape.lineTo(20, 10);
  carShape.lineTo(15, 10);
  carShape.lineTo(10, 20);
  carShape.lineTo(5, 20);
  carShape.lineTo(0, 10);
  carShape.lineTo(0, 0);

  const extrudeSettings = {
    steps: 1,
    depth: 40,
    bevelEnabled: false
  };

  const carGeometry = new THREE.ExtrudeGeometry(carShape, extrudeSettings);
  const carMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
  car = new THREE.Mesh(carGeometry, carMaterial);
  
  // Position the car
  car.position.set(0, 20, 200);
  car.rotation.set(0, Math.PI, 0);
  scene.add(car);
}

// Create synthwave sun
function createSynthwaveSun() {
  const sunGeometry = new THREE.CircleGeometry(1000, 32);
  const sunMaterial = new THREE.MeshBasicMaterial({ 
    color: 0xff5555,
    transparent: true,
    opacity: 0.8
  });
  const sun = new THREE.Mesh(sunGeometry, sunMaterial);
  sun.position.set(0, 300, -9000);
  scene.add(sun);

  // Add glow effect
  const glowGeometry = new THREE.CircleGeometry(1200, 32);
  const glowMaterial = new THREE.MeshBasicMaterial({ 
    color: 0xff8855,
    transparent: true,
    opacity: 0.4
  });
  const glow = new THREE.Mesh(glowGeometry, glowMaterial);
  glow.position.set(0, 300, -9010);
  scene.add(glow);
}

// Add decorative elements
function addDecorations() {
  // Add palm trees and neon structures along the road
  for (let i = 0; i < 20; i++) {
    // Left side
    addPalmTree(-roadWidth - 200 - Math.random() * 500, 0, -i * 500 - Math.random() * 200);
    addNeonStructure(-roadWidth - 100 - Math.random() * 300, 0, -i * 800 - Math.random() * 400);
    
    // Right side
    addPalmTree(roadWidth + 200 + Math.random() * 500, 0, -i * 500 - Math.random() * 200);
    addNeonStructure(roadWidth + 100 + Math.random() * 300, 0, -i * 800 - Math.random() * 400);
  }
}

// Create palm tree silhouette
function addPalmTree(x, y, z) {
  const trunkGeometry = new THREE.BoxGeometry(20, 150, 20);
  const trunkMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
  const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
  trunk.position.set(x, y + 75, z);
  scene.add(trunk);

  // Create palm fronds
  const frondGeometry = new THREE.BoxGeometry(150, 10, 20);
  const frondMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });

  for (let i = 0; i < 6; i++) {
    const frond = new THREE.Mesh(frondGeometry, frondMaterial);
    frond.position.set(x, y + 150, z);
    frond.rotation.z = (i * Math.PI) / 3;
    frond.rotation.y = Math.random() * 0.5;
    scene.add(frond);
  }
}

// Create neon structure
function addNeonStructure(x, y, z) {
  const height = 100 + Math.random() * 200;
  const geometry = new THREE.BoxGeometry(30, height, 30);
  const material = new THREE.MeshBasicMaterial({ 
    color: getRandomNeonColor(),
    transparent: true,
    opacity: 0.8
  });
  const structure = new THREE.Mesh(geometry, material);
  structure.position.set(x, y + height / 2, z);
  scene.add(structure);

  // Add a glow effect
  const glowGeometry = new THREE.BoxGeometry(40, height + 10, 40);
  const glowMaterial = new THREE.MeshBasicMaterial({ 
    color: material.color,
    transparent: true,
    opacity: 0.3
  });
  const glow = new THREE.Mesh(glowGeometry, glowMaterial);
  glow.position.set(x, y + height / 2, z);
  scene.add(glow);
}

// Get random neon color
function getRandomNeonColor() {
  const colors = [0xff41e9, 0x00fff9, 0xffff00, 0xff0080, 0x00ff80];
  return colors[Math.floor(Math.random() * colors.length)];
}

// Handle window resize
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// Start the game
function startGame() {
  isGameStarted = true;
  document.getElementById('title-screen').style.display = 'none';
  document.addEventListener('keydown', handleKeyDown);
  document.addEventListener('keyup', handleKeyUp);
  gameLoop = requestAnimationFrame(update);
}

// Key states
const keyStates = {
  ArrowUp: false,
  ArrowDown: false,
  ArrowLeft: false,
  ArrowRight: false
};

// Handle key down
function handleKeyDown(event) {
  if (keyStates.hasOwnProperty(event.key)) {
    keyStates[event.key] = true;
  }
}

// Handle key up
function handleKeyUp(event) {
  if (keyStates.hasOwnProperty(event.key)) {
    keyStates[event.key] = false;
  }
}

// Update game state
function update() {
  if (!isGameStarted) return;

  // Handle acceleration/deceleration
  if (keyStates.ArrowUp) {
    speed = Math.min(maxSpeed, speed + acceleration);
  } else if (keyStates.ArrowDown) {
    speed = Math.max(0, speed - deceleration * 2);
  } else {
    speed = Math.max(0, speed - deceleration);
  }

  // Handle steering
  if (speed > 0) {
    if (keyStates.ArrowLeft) {
      car.position.x = Math.max(-roadWidth / 2 + 100, car.position.x - (speed / 20));
    }
    if (keyStates.ArrowRight) {
      car.position.x = Math.min(roadWidth / 2 - 100, car.position.x + (speed / 20));
    }
  }

  // Move road based on speed
  road.position.z += speed;
  if (road.position.z > segmentLength) {
    road.position.z = 0;
  }

  // Move grid
  grid.position.z = (grid.position.z + speed) % gridDivisions;

  // Update camera
  camera.position.set(car.position.x / 2, cameraHeight, car.position.z + cameraDistance);
  camera.lookAt(car.position.x / 3, 0, car.position.z - 500);

  // Update speed display
  updateSpeedDisplay();

  // Render scene
  renderer.render(scene, camera);

  // Continue game loop
  gameLoop = requestAnimationFrame(update);
}

// Update speed display
function updateSpeedDisplay() {
  document.getElementById('speed').textContent = Math.floor(speed) + ' mph';
}

// Initialize the game when the page loads
window.addEventListener('load', init); 