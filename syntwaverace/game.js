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
let speedLines = []; // Array to hold speed line objects
let roadsideObjects = []; // Array to hold roadside objects
let brakeLights = []; // Array to hold brake light objects and their glows

// Audio variables
let audioContext;
let bgMusic = {
  neonRush: null,
  sunSet: null,
  currentTrack: null,
  trackNames: {
    neonRush: "NEON RUSH",
    sunSet: "SUN SET"
  },
  switchInterval: 120000, // Switch tracks every 2 minutes (milliseconds)
  lastSwitchTime: 0,
  isLoaded: false,
  source: null,
  isMuted: false, // Start with music enabled
  audioElements: {
    neonRush: null,
    sunSet: null
  }
};

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
const cameraHeight = 40;
const cameraDistance = 120;

// Colors
const colors = {
  sky: 0xff5588, // Pink sky like in reference
  grid: 0xff41e9,
  road: 0x000000, // Pure black road
  rumble: 0xffffff,
  lane: 0xff3333 // Red lane markers like in the reference image
};

// Key states
const keyStates = {
  ArrowUp: false,
  ArrowDown: false,
  ArrowLeft: false,
  ArrowRight: false
};

// Touch control variables
let isTouching = false;
let touchStartX = 0;
let touchCurrentX = 0;

// Initialize the game
function init() {
  // Set up Three.js scene
  scene = new THREE.Scene();
  
  // Prevent touch scrolling on the canvas
  document.getElementById('game-canvas').addEventListener('touchmove', function(e) {
    e.preventDefault();
  }, { passive: false });
  
  // Initialize audio
  initAudio();
  
  // Create sky gradient like in reference image (pink to purple)
  const skyGeometry = new THREE.SphereGeometry(15000, 32, 32);
  // Use shader material for gradient sky
  const skyMaterial = new THREE.ShaderMaterial({
    uniforms: {
      topColor: { value: new THREE.Color(0xff99aa) },    // Light pink at top
      bottomColor: { value: new THREE.Color(0x330066) }, // Deep purple at bottom
      offset: { value: 400 },
      exponent: { value: 0.6 }
    },
    vertexShader: `
      varying vec3 vWorldPosition;
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 topColor;
      uniform vec3 bottomColor;
      uniform float offset;
      uniform float exponent;
      varying vec3 vWorldPosition;
      void main() {
        float h = normalize(vWorldPosition + offset).y;
        gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
      }
    `,
    side: THREE.BackSide
  });
  
  const sky = new THREE.Mesh(skyGeometry, skyMaterial);
  scene.add(sky);
  
  scene.fog = new THREE.Fog(0xff5588, 2000, 15000); // Pink fog

  // Set up camera
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 30000);
  camera.position.set(0, cameraHeight, cameraDistance);
  camera.lookAt(0, 0, -2000);

  // Set up renderer
  renderer = new THREE.WebGLRenderer({ 
    canvas: document.getElementById('game-canvas'), 
    antialias: true,
    alpha: true 
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);

  // Add lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
  directionalLight.position.set(0, 1000, 0);
  scene.add(directionalLight);
  
  // Add a subtle pink light for atmosphere
  const pinkLight = new THREE.PointLight(0xff41e9, 0.8, 5000);
  pinkLight.position.set(0, 500, -3000);
  scene.add(pinkLight);

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

  // Create the speed lines
  createSpeedLines();
  
  // Create roadside objects
  createRoadsideObjects();

  // Initial render
  renderer.render(scene, camera);
}

// Initialize audio system
function initAudio() {
  try {
    // Create audio context
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    console.log('Loading audio tracks...');
    document.getElementById('current-track').textContent = "LOADING...";
    
    // Load tracks both ways for better compatibility across browsers
    // Method 1: Using XMLHttpRequest and AudioContext
    loadAudioTrack('neonrush.mp3', 'neonRush');
    loadAudioTrack('sunset.mp3', 'sunSet');
    
    // Method 2: Using HTML5 Audio elements
    // This provides a fallback method that works better in some browsers
    const neonRushAudio = new Audio('neonrush.mp3');
    const sunSetAudio = new Audio('sunset.mp3');
    
    neonRushAudio.loop = true;
    sunSetAudio.loop = true;
    
    // Store the elements
    bgMusic.audioElements.neonRush = neonRushAudio;
    bgMusic.audioElements.sunSet = sunSetAudio;
    
    // Create load event listeners
    let loadedCount = 0;
    const totalToLoad = 2;
    
    const markAsLoaded = () => {
      loadedCount++;
      if (loadedCount >= totalToLoad) {
        console.log('All audio elements loaded');
        bgMusic.isLoaded = true;
        // Don't update the display here, let the game start handle it
      }
    };
    
    neonRushAudio.addEventListener('canplaythrough', markAsLoaded);
    sunSetAudio.addEventListener('canplaythrough', markAsLoaded);
    
    // Preload the audio
    neonRushAudio.load();
    sunSetAudio.load();
    
  } catch (e) {
    console.error('Audio initialization failed:', e);
    document.getElementById('current-track').textContent = "NO AUDIO";
  }
}

// Load an audio track from file
function loadAudioTrack(filename, trackKey) {
  console.log(`Loading track: ${filename}`);
  const request = new XMLHttpRequest();
  request.open('GET', filename, true);
  request.responseType = 'arraybuffer';
  
  request.onload = function() {
    console.log(`File loaded: ${filename}, decoding...`);
    
    audioContext.decodeAudioData(
      request.response, 
      function(buffer) {
        console.log(`Successfully decoded: ${filename}`);
        bgMusic[trackKey] = buffer;
      }, 
      function(error) {
        console.error(`Error decoding audio data for ${filename}:`, error);
      }
    );
  };
  
  request.onerror = function() {
    console.error(`Error loading audio file: ${filename}`);
  };
  
  request.send();
}

// Play a track
function playTrack(trackKey) {
  if (bgMusic.isMuted) {
    console.log('Music is muted, not playing');
    return;
  }
  
  console.log(`Attempting to play track: ${trackKey}`);
  
  // Try playing using HTML5 Audio API first (more reliable in some browsers)
  if (bgMusic.audioElements[trackKey]) {
    try {
      // Stop all audio elements first
      Object.values(bgMusic.audioElements).forEach(audio => {
        if (audio) {
          audio.pause();
          audio.currentTime = 0;
        }
      });
      
      // Make sure we're at the start of the track
      bgMusic.audioElements[trackKey].currentTime = 0;
      
      // Play the selected track - with user interaction promise handling
      const playPromise = bgMusic.audioElements[trackKey].play();
      
      if (playPromise !== undefined) {
        playPromise.then(() => {
          console.log(`Now playing: ${bgMusic.trackNames[trackKey]}`);
          bgMusic.currentTrack = trackKey;
          bgMusic.lastSwitchTime = Date.now();
          updateTrackDisplay();
        }).catch(err => {
          console.error('Error playing HTML5 Audio:', err);
          
          // If we get a user interaction error, try playing on the next user interaction
          if (err.name === 'NotAllowedError') {
            console.log('Browser requires user interaction, will try again on next interaction');
            document.getElementById('current-track').textContent = "Press M to play music";
            
            // Set up a one-time event listener for the next user interaction
            const playOnInteraction = () => {
              bgMusic.audioElements[trackKey].play().catch(e => {
                console.error('Still cannot play audio:', e);
              });
              document.removeEventListener('click', playOnInteraction);
              document.removeEventListener('keydown', playOnInteraction);
            };
            
            document.addEventListener('click', playOnInteraction, { once: true });
            document.addEventListener('keydown', playOnInteraction, { once: true });
          } else {
            // Fall back to Web Audio API method for other errors
            playTrackWithWebAudio(trackKey);
          }
        });
      } else {
        // For browsers that don't return a promise
        console.log(`Now playing: ${bgMusic.trackNames[trackKey]}`);
        bgMusic.currentTrack = trackKey;
        bgMusic.lastSwitchTime = Date.now();
        updateTrackDisplay();
      }
      
      return;
    } catch (e) {
      console.error('Error with HTML5 Audio playback:', e);
      // Fall back to Web Audio API method
    }
  }
  
  // Fallback to Web Audio API
  playTrackWithWebAudio(trackKey);
}

// Play a track using Web Audio API
function playTrackWithWebAudio(trackKey) {
  if (!bgMusic[trackKey]) {
    console.error(`Track not loaded: ${trackKey}`);
    return;
  }
  
  try {
    console.log(`Playing track with Web Audio API: ${trackKey}`);
    
    // Stop current track if playing
    if (bgMusic.source) {
      bgMusic.source.stop();
      bgMusic.source.disconnect();
      bgMusic.source = null;
    }
  
    // Create a new source node
    const source = audioContext.createBufferSource();
    source.buffer = bgMusic[trackKey];
    
    // Connect to audio context
    source.connect(audioContext.destination);
    
    // Loop the track
    source.loop = true;
    
    // Start playing
    source.start(0);
    
    // Update current track
    bgMusic.currentTrack = trackKey;
    bgMusic.source = source;
    bgMusic.lastSwitchTime = Date.now();
    
    // Update HUD
    updateTrackDisplay();
    
    console.log(`Now playing: ${bgMusic.trackNames[trackKey]}`);
  } catch (e) {
    console.error('Error playing track with Web Audio API:', e);
  }
}

// Update the track display in the HUD
function updateTrackDisplay() {
  const trackDisplay = document.getElementById('current-track');
  
  if (!bgMusic.currentTrack) {
    trackDisplay.textContent = "--";
    return;
  }
  
  if (bgMusic.isMuted) {
    trackDisplay.textContent = "MUTED";
  } else {
    trackDisplay.textContent = bgMusic.trackNames[bgMusic.currentTrack];
  }
}

// Toggle music on/off
function toggleMusic() {
  if (!audioContext) {
    console.log('Audio context not created, cannot toggle');
    return;
  }
  
  // Always make sure the audio context is running
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  
  console.log('Toggle music called, current state:', bgMusic.isMuted ? 'muted' : 'playing');
  
  if (bgMusic.isMuted) {
    // Unmute - start playing again
    console.log('Unmuting music');
    bgMusic.isMuted = false;
    
    if (bgMusic.currentTrack) {
      playTrack(bgMusic.currentTrack);
    } else {
      playTrack('neonRush');
    }
  } else {
    // Mute - stop current playback
    console.log('Muting music');
    bgMusic.isMuted = true;
    
    // Stop Web Audio API playback
    if (bgMusic.source) {
      try {
        bgMusic.source.stop();
        bgMusic.source.disconnect();
        bgMusic.source = null;
      } catch (e) {
        console.error('Error stopping Web Audio track:', e);
      }
    }
    
    // Stop HTML5 Audio playback
    Object.values(bgMusic.audioElements).forEach(audio => {
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    });
  }
  
  updateTrackDisplay();
}

// Create grid floor
function createGrid() {
  // Create enhanced synthwave grid with perspective
  const gridWidth = gridSize;
  const gridDepth = gridSize * 2; // Make it deeper
  
  // Dark background for the grid
  const planeGeometry = new THREE.PlaneGeometry(gridWidth, gridDepth);
  const planeMaterial = new THREE.MeshBasicMaterial({ 
    color: 0x120023, // Dark purple
    side: THREE.DoubleSide 
  });
  const plane = new THREE.Mesh(planeGeometry, planeMaterial);
  plane.rotation.x = Math.PI / 2;
  plane.position.y = -0.1;
  plane.position.z = -gridDepth / 2;
  scene.add(plane);
  
  // Add horizontal grid lines (more pronounced)
  const numHorizontalLines = 40;
  const horizontalSpacing = gridDepth / numHorizontalLines;
  
  for (let i = 0; i <= numHorizontalLines; i++) {
    const lineGeometry = new THREE.PlaneGeometry(gridWidth, 10);
    const lineMaterial = new THREE.MeshBasicMaterial({
      color: 0xff41e9, // Pink
      transparent: true,
      opacity: 0.7 - (i * 0.015), // Fade with distance
      side: THREE.DoubleSide
    });
    
    const line = new THREE.Mesh(lineGeometry, lineMaterial);
    line.rotation.x = Math.PI / 2;
    line.position.set(0, 0, -i * horizontalSpacing);
    scene.add(line);
  }
  
  // Add vertical grid lines (less pronounced)
  const numVerticalLines = 20;
  const verticalSpacing = gridWidth / numVerticalLines;
  
  for (let i = -numVerticalLines / 2; i <= numVerticalLines / 2; i++) {
    const lineGeometry = new THREE.PlaneGeometry(10, gridDepth);
    const lineMaterial = new THREE.MeshBasicMaterial({
      color: 0x00fff9, // Cyan
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide
    });
    
    const line = new THREE.Mesh(lineGeometry, lineMaterial);
    line.rotation.x = Math.PI / 2;
    line.position.set(i * verticalSpacing, 0, -gridDepth / 2);
    scene.add(line);
  }
  
  // Create original grid helper for additional grid effect
  const gridHelper = new THREE.GridHelper(gridWidth, 100, 0x00fff9, 0xff41e9);
  gridHelper.position.y = 0.5;
  grid = gridHelper;
  scene.add(grid);
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

    // Side rumble strips - white
    if (Math.floor(z / segmentLength) % rumbleLength < Math.floor(rumbleLength / 2)) {
      const leftRumble = new THREE.Mesh(
        new THREE.PlaneGeometry(laneWidth / 6, segmentLength),
        new THREE.MeshBasicMaterial({ color: colors.rumble })
      );
      leftRumble.rotation.x = -Math.PI / 2;
      leftRumble.position.set(-roadWidth / 2 + laneWidth / 12, 0.02, -z - segmentLength / 2);
      road.add(leftRumble);

      const rightRumble = new THREE.Mesh(
        new THREE.PlaneGeometry(laneWidth / 6, segmentLength),
        new THREE.MeshBasicMaterial({ color: colors.rumble })
      );
      rightRumble.rotation.x = -Math.PI / 2;
      rightRumble.position.set(roadWidth / 2 - laneWidth / 12, 0.02, -z - segmentLength / 2);
      road.add(rightRumble);
    }

    // Center line - bright red like in reference image
    if (z % (segmentLength * 2) === 0) {
      const centerLine = new THREE.Mesh(
        new THREE.PlaneGeometry(laneWidth / 8, segmentLength),
        new THREE.MeshBasicMaterial({ 
          color: 0xff0000, // Bright red centerline
          emissive: 0xff0000,
          transparent: true,
          opacity: 0.9
        })
      );
      centerLine.rotation.x = -Math.PI / 2;
      centerLine.position.set(0, 0.03, -z - segmentLength / 2);
      road.add(centerLine);
      
      // Create a subtle glow effect for the center line
      const glowGeometry = new THREE.PlaneGeometry(laneWidth / 4, segmentLength);
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0xff0000,
        transparent: true,
        opacity: 0.3
      });
      const glow = new THREE.Mesh(glowGeometry, glowMaterial);
      glow.rotation.x = -Math.PI / 2;
      glow.position.set(0, 0.025, -z - segmentLength / 2);
      road.add(glow);
    }
  }
}

// Create car (silhouette style)
function createCar() {
  // Container for all car parts
  car = new THREE.Group();
  
  // Create the main car body silhouette
  const carShape = new THREE.Shape();
  carShape.moveTo(0, 0);
  carShape.lineTo(60, 0);      // Longer car
  carShape.lineTo(60, 10);
  carShape.lineTo(50, 10);
  carShape.lineTo(40, 30);     // Higher roof
  carShape.lineTo(15, 30);     // Higher roof
  carShape.lineTo(0, 10);
  carShape.lineTo(0, 0);

  const extrudeSettings = {
    steps: 1,
    depth: 40,
    bevelEnabled: false
  };

  const carBodyGeometry = new THREE.ExtrudeGeometry(carShape, extrudeSettings);
  const carBodyMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
  const carBody = new THREE.Mesh(carBodyGeometry, carBodyMaterial);
  car.add(carBody);
  
  // Add neon trim around the car
  const neonColor = 0x00fff9; // Cyan neon
  
  // Bottom trim
  const bottomTrimGeometry = new THREE.BoxGeometry(62, 2, 42);
  const neonMaterial = new THREE.MeshBasicMaterial({ 
    color: neonColor,
    transparent: true,
    opacity: 0.8
  });
  const bottomTrim = new THREE.Mesh(bottomTrimGeometry, neonMaterial);
  bottomTrim.position.set(30, 0, 20);
  car.add(bottomTrim);
  
  // Add regular tail lights (these will be the base)
  const tailLightGeometry = new THREE.BoxGeometry(5, 5, 40);
  const tailLightMaterial = new THREE.MeshBasicMaterial({ 
    color: 0xff0000,
    transparent: true,
    opacity: 0.8
  });
  
  // Left tail light
  const leftTailLight = new THREE.Mesh(tailLightGeometry, tailLightMaterial);
  leftTailLight.position.set(5, 5, 20);
  car.add(leftTailLight);
  
  // Right tail light
  const rightTailLight = new THREE.Mesh(tailLightGeometry, tailLightMaterial);
  rightTailLight.position.set(55, 5, 20);
  car.add(rightTailLight);
  
  // Add neon brake lights (these will glow brighter when braking)
  // Create two separate brake light bars
  const brakeLightGeometry = new THREE.BoxGeometry(18, 6, 3); // Smaller width for individual lights
  const brakeLightMaterial = new THREE.MeshBasicMaterial({ 
    color: 0xff0066, // purple-red color
    transparent: true,
    opacity: 0.8 // Very visible by default
  });
  
  // Left brake light
  const leftBrakeLight = new THREE.Mesh(brakeLightGeometry, brakeLightMaterial);
  leftBrakeLight.position.set(15, 8, -2); // Left side position
  car.add(leftBrakeLight);
  
  // Right brake light
  const rightBrakeLight = new THREE.Mesh(brakeLightGeometry, brakeLightMaterial);
  rightBrakeLight.position.set(45, 8, -2); // Right side position
  car.add(rightBrakeLight);
  
  // Add glow effect for brake lights
  const brakeGlowGeometry = new THREE.BoxGeometry(20, 8, 3); // Slightly larger than the light for glow
  const brakeGlowMaterial = new THREE.MeshBasicMaterial({ 
    color: 0xff00ff, // More purple glow
    transparent: true,
    opacity: 0.5 // Strong glow by default
  });
  
  // Left brake light glow
  const leftBrakeGlow = new THREE.Mesh(brakeGlowGeometry, brakeGlowMaterial);
  leftBrakeGlow.position.set(15, 8, -2); // Match position with left brake light
  car.add(leftBrakeGlow);
  
  // Right brake light glow
  const rightBrakeGlow = new THREE.Mesh(brakeGlowGeometry, brakeGlowMaterial);
  rightBrakeGlow.position.set(45, 8, -2); // Match position with right brake light
  car.add(rightBrakeGlow);
  
  // Store brake light objects for animation
  brakeLights = []; // Clear the array first
  brakeLights.push({ 
    light: leftBrakeLight, 
    glow: leftBrakeGlow, 
    baseLightOpacity: 0.8,
    baseGlowOpacity: 0.5
  });
  brakeLights.push({ 
    light: rightBrakeLight, 
    glow: rightBrakeGlow, 
    baseLightOpacity: 0.8,
    baseGlowOpacity: 0.5
  });
  
  // Add headlights
  const headlightGeometry = new THREE.BoxGeometry(8, 5, 2);
  const headlightMaterial = new THREE.MeshBasicMaterial({ 
    color: 0xffffff,
    transparent: true,
    opacity: 0.9
  });
  
  // Left headlight
  const leftHeadlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
  leftHeadlight.position.set(10, 5, 0);
  car.add(leftHeadlight);
  
  // Right headlight
  const rightHeadlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
  rightHeadlight.position.set(50, 5, 0);
  car.add(rightHeadlight);
  
  // Subtle glow effect
  const glowGeometry = new THREE.BoxGeometry(65, 35, 45); // Smaller, more form-fitting
  const glowMaterial = new THREE.MeshBasicMaterial({
    color: neonColor,
    transparent: true,
    opacity: 0.08 // Much subtler glow
  });
  const glow = new THREE.Mesh(glowGeometry, glowMaterial);
  glow.position.set(30, 15, 20);
  car.add(glow);
  
  // Position the car
  car.position.set(0, 20, 200);
  car.rotation.set(0, Math.PI, 0);
  scene.add(car);
}

// Create synthwave sun
function createSynthwaveSun() {
  // Main sun - yellow-white like in reference image
  const sunGeometry = new THREE.CircleGeometry(3000, 64);
  const sunMaterial = new THREE.MeshBasicMaterial({ 
    color: 0xffee66, // More yellow like in the reference image
    transparent: true,
    opacity: 1.0 // Full opacity
  });
  const sun = new THREE.Mesh(sunGeometry, sunMaterial);
  sun.position.set(0, 400, -6000); // Bringing it closer and lower
  scene.add(sun);

  // Inner glow - larger with warm color
  const innerGlowGeometry = new THREE.CircleGeometry(3200, 64);
  const innerGlowMaterial = new THREE.MeshBasicMaterial({ 
    color: 0xffbb33, // Warmer orange glow
    transparent: true,
    opacity: 0.8 // More visible
  });
  const innerGlow = new THREE.Mesh(innerGlowGeometry, innerGlowMaterial);
  innerGlow.position.set(0, 400, -6010);
  scene.add(innerGlow);

  // Outer glow - pinkish like sky in reference
  const outerGlowGeometry = new THREE.CircleGeometry(3500, 64);
  const outerGlowMaterial = new THREE.MeshBasicMaterial({ 
    color: 0xff9999, // Pinkish glow
    transparent: true,
    opacity: 0.6 // More visible
  });
  const outerGlow = new THREE.Mesh(outerGlowGeometry, outerGlowMaterial);
  outerGlow.position.set(0, 400, -6020);
  scene.add(outerGlow);
  
  // Extra large outer glow
  const extraGlowGeometry = new THREE.CircleGeometry(4000, 64);
  const extraGlowMaterial = new THREE.MeshBasicMaterial({ 
    color: 0xff71c5, // Light pink
    transparent: true,
    opacity: 0.3
  });
  const extraGlow = new THREE.Mesh(extraGlowGeometry, extraGlowMaterial);
  extraGlow.position.set(0, 400, -6030);
  scene.add(extraGlow);
  
  // Add a starry burst effect
  addSunburstEffect(0, 400, -6000);
  
  // Add a grid reflection below the sun
  addSunReflection();
}

// Add a starburst effect around the sun
function addSunburstEffect(x, y, z) {
  const burstCount = 8; // Fewer rays for better stability
  
  // Create a container for all rays to ensure they move together
  const burstContainer = new THREE.Group();
  burstContainer.position.set(x, y, z - 10);
  scene.add(burstContainer);
  
  for (let i = 0; i < burstCount; i++) {
    const angle = (i / burstCount) * Math.PI * 2;
    // Fixed length for all rays for better stability
    const length = 2500;
    // Fixed width for all rays for better stability
    const width = 120;
    
    const rayGeometry = new THREE.PlaneGeometry(width, length);
    const rayMaterial = new THREE.MeshBasicMaterial({
      color: i % 2 === 0 ? 0xff41e9 : 0x00fff9, // Alternating colors
      transparent: true,
      opacity: 0.25, // Lower opacity for less visual noise
      side: THREE.DoubleSide
    });
    
    const ray = new THREE.Mesh(rayGeometry, rayMaterial);
    ray.rotation.z = angle;
    
    // Add ray to container instead of directly to scene
    burstContainer.add(ray);
  }
}

// Add a reflection of the sun on the "water"/horizon
function addSunReflection() {
  // Create a strip of "water" with a grid texture
  const waterWidth = 6000; // Wider water
  const waterLength = 6000; // Longer water
  
  // Water plane
  const waterGeometry = new THREE.PlaneGeometry(waterWidth, waterLength);
  const waterMaterial = new THREE.MeshBasicMaterial({ 
    color: 0x120046, // Dark purple
    transparent: true,
    opacity: 0.7, // More visible
    side: THREE.DoubleSide 
  });
  const water = new THREE.Mesh(waterGeometry, waterMaterial);
  water.rotation.x = -Math.PI / 2;
  water.position.set(0, -50, -5000);
  scene.add(water);
  
  // Add a large sun reflection on the water
  const reflectionGeometry = new THREE.CircleGeometry(1500, 32);
  const reflectionMaterial = new THREE.MeshBasicMaterial({
    color: 0xff1493, // Hot pink
    transparent: true,
    opacity: 0.4,
    side: THREE.DoubleSide
  });
  const reflection = new THREE.Mesh(reflectionGeometry, reflectionMaterial);
  reflection.rotation.x = -Math.PI / 2;
  reflection.position.set(0, -45, -5500);
  scene.add(reflection);
  
  // Add outer reflection glow
  const reflectionGlowGeometry = new THREE.CircleGeometry(1700, 32);
  const reflectionGlowMaterial = new THREE.MeshBasicMaterial({
    color: 0x00fff9, // Cyan
    transparent: true,
    opacity: 0.2,
    side: THREE.DoubleSide
  });
  const reflectionGlow = new THREE.Mesh(reflectionGlowGeometry, reflectionGlowMaterial);
  reflectionGlow.rotation.x = -Math.PI / 2;
  reflectionGlow.position.set(0, -45, -5500);
  scene.add(reflectionGlow);
  
  // Add additional horizontal grid lines for water reflection - more of them and more prominent
  for (let i = 0; i < 30; i++) {
    const lineGeometry = new THREE.PlaneGeometry(waterWidth, i < 10 ? 8 : 4); // Thicker lines near the horizon
    const lineMaterial = new THREE.MeshBasicMaterial({
      color: i % 2 === 0 ? 0xff41e9 : 0x00fff9, // Alternating pink and cyan
      transparent: true,
      opacity: 0.5 - (i * 0.015), // Fade out more gradually
      side: THREE.DoubleSide
    });
    const line = new THREE.Mesh(lineGeometry, lineMaterial);
    line.rotation.x = -Math.PI / 2;
    line.position.set(0, -49, -4000 - (i * 100));
    scene.add(line);
  }
}

// Add decorative elements
function addDecorations() {
  // Create two rows of palm trees along the road sides (like in reference image)
  createPalmTreeRows();
  
  // Add some random neon structures for variety
  for (let i = 0; i < 15; i++) {
    // Left side
    addNeonStructure(-roadWidth - 300 - Math.random() * 200, 0, -i * 1200 - Math.random() * 400);
    
    // Right side
    addNeonStructure(roadWidth + 300 + Math.random() * 200, 0, -i * 1200 - Math.random() * 400);
  }
  
  // Add prominent palm trees along the horizon to match reference image
  const horizonDistance = -8000;
  const spacing = 400;
  
  // Create a row of palms along the horizon on both sides
  for (let i = -10; i <= 10; i++) {
    if (i === 0) continue; // Skip center to leave room for the sun
    
    // Left side of horizon
    const leftX = i * spacing - 2000;
    addLargePalmTree(leftX, 0, horizonDistance);
    
    // Right side of horizon
    const rightX = i * spacing + 2000;
    addLargePalmTree(rightX, 0, horizonDistance);
  }
}

// Create rows of palm trees along the road sides
function createPalmTreeRows() {
  // Distance between palm trees
  const spacing = 300;
  // How many palm trees in each row
  const treeCount = 30;
  // Distance from the road edge
  const roadOffset = 120;
  
  // Left row of palm trees
  for (let i = 0; i < treeCount; i++) {
    const z = -i * spacing - 500; // Start a bit ahead and go down the road
    addRoadsidePalm(-roadWidth/2 - roadOffset, 0, z, true);
  }
  
  // Right row of palm trees
  for (let i = 0; i < treeCount; i++) {
    const z = -i * spacing - 500;
    addRoadsidePalm(roadWidth/2 + roadOffset, 0, z, false);
  }
}

// Create a palm tree specifically for the roadside (larger and more visible)
function addRoadsidePalm(x, y, z, isLeft) {
  // Use black for pure silhouette as in reference image
  const palmColor = 0x000000;
  
  // Much taller trunk
  const trunkGeometry = new THREE.BoxGeometry(30, 400, 30);
  const trunkMaterial = new THREE.MeshBasicMaterial({ 
    color: palmColor,
    transparent: false,
    opacity: 1.0
  });
  const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
  trunk.position.set(x, y + 200, z);
  scene.add(trunk);
  roadsideObjects.push(trunk); // Add to roadside objects to recycle them

  // Create proper palm fronds
  const frondCount = 16; // More fronds for fuller palm
  
  for (let i = 0; i < frondCount; i++) {
    // Longer, thinner fronds
    const frondLength = 300;
    const frondGeometry = new THREE.BoxGeometry(frondLength, 6, 15);
    const frondMaterial = new THREE.MeshBasicMaterial({ 
      color: palmColor,
      transparent: false,
      opacity: 1.0
    });
    
    const frond = new THREE.Mesh(frondGeometry, frondMaterial);
    frond.position.set(x, y + 400, z); // Position at top of trunk
    
    // Fan the fronds out in a circle
    const angle = (i / frondCount) * Math.PI * 2;
    frond.rotation.z = angle;
    
    // Add a slight droop to the fronds
    frond.rotation.y = isLeft ? 0.2 : -0.2; // Angle slightly toward the road
    frond.rotation.x = 0.3; // Droop down slightly
    
    scene.add(frond);
    roadsideObjects.push(frond); // Add to roadside objects to recycle them
  }
}

// Create palm tree silhouette
function addPalmTree(x, y, z) {
  // Use a purple color for the silhouette
  const palmColor = 0x330066; // Deep purple
  
  // Taller, thinner trunk
  const trunkGeometry = new THREE.BoxGeometry(15, 200, 15);
  const trunkMaterial = new THREE.MeshBasicMaterial({ 
    color: palmColor,
    transparent: true,
    opacity: 0.9
  });
  const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
  trunk.position.set(x, y + 100, z);
  scene.add(trunk);

  // Create better palm fronds - curved and more numerous
  for (let i = 0; i < 10; i++) {
    // Create curved frond
    const curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(60, 40, 0),
      new THREE.Vector3(120, 0, 0)
    );
    
    const points = curve.getPoints(10);
    const frondGeometry = new THREE.BufferGeometry().setFromPoints(points);
    
    // Create thicker frond using edges
    const frondEdgeGeometry = new THREE.EdgesGeometry(
      new THREE.BoxGeometry(120, 3, 3)
    );
    
    const frondMaterial = new THREE.LineBasicMaterial({ 
      color: palmColor,
      linewidth: 3,
      transparent: true,
      opacity: 0.9
    });
    
    const frond = new THREE.Line(frondEdgeGeometry, frondMaterial);
    frond.position.set(x, y + 200, z);
    frond.rotation.z = (i * Math.PI) / 5;
    frond.rotation.y = Math.random() * 0.3;
    frond.rotation.x = Math.random() * 0.2 - 0.1;
    
    // Add a slight curve to each frond
    frond.scale.set(1, 0.8, 1);
    
    scene.add(frond);
  }
  
  // Add small glow to outline the palm
  const glowGeometry = new THREE.SphereGeometry(30, 8, 8);
  const glowMaterial = new THREE.MeshBasicMaterial({
    color: 0xff41e9, // Pink
    transparent: true,
    opacity: 0.2
  });
  const glow = new THREE.Mesh(glowGeometry, glowMaterial);
  glow.position.set(x, y + 200, z);
  scene.add(glow);
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
  
  // Show HUD
  document.getElementById('hud').style.display = 'flex';
  document.getElementById('title-screen').style.display = 'none';
  document.addEventListener('keydown', handleKeyDown);
  document.addEventListener('keyup', handleKeyUp);
  
  // Add touch event listeners for mobile
  const gameCanvas = document.getElementById('game-canvas');
  gameCanvas.addEventListener('touchstart', handleTouchStart);
  gameCanvas.addEventListener('touchmove', handleTouchMove);
  gameCanvas.addEventListener('touchend', handleTouchEnd);
  gameCanvas.addEventListener('mousedown', handleMouseDown);
  gameCanvas.addEventListener('mousemove', handleMouseMove);
  gameCanvas.addEventListener('mouseup', handleMouseUp);
  
  // Handle audio
  if (audioContext) {
    // Resume audio context (required for Chrome and Safari due to autoplay policies)
    audioContext.resume().then(() => {
      console.log('Audio context resumed successfully');
      
      // Attempt to play music immediately
      if (bgMusic.isLoaded) {
        console.log('Tracks loaded, playing initial track');
        try {
          // Make sure music isn't muted
          bgMusic.isMuted = false;
          playTrack('neonRush');
        } catch (e) {
          console.error('Error starting initial track:', e);
          document.getElementById('current-track').textContent = "Press M to play music";
        }
      } else {
        console.log('Tracks not loaded yet, waiting...');
        document.getElementById('current-track').textContent = "LOADING...";
        
        // Check every second if tracks are loaded
        const checkInterval = setInterval(() => {
          if (bgMusic.isLoaded) {
            console.log('Tracks loaded, playing initial track');
            try {
              // Make sure music isn't muted
              bgMusic.isMuted = false;
              playTrack('neonRush');
              clearInterval(checkInterval);
            } catch (e) {
              console.error('Error starting initial track:', e);
              document.getElementById('current-track').textContent = "Press M to play music";
              clearInterval(checkInterval);
            }
          }
        }, 500);
      }
    }).catch(err => {
      console.error('Failed to resume audio context:', err);
      document.getElementById('current-track').textContent = "Press M to play music";
    });
  } else {
    console.error('Audio context not created');
    document.getElementById('current-track').textContent = "NO AUDIO";
  }
  
  gameLoop = requestAnimationFrame(update);
}

// Handle touch start event
function handleTouchStart(event) {
  event.preventDefault();
  isTouching = true;
  // Store initial touch position for steering calculation
  touchStartX = event.touches[0].clientX;
  touchCurrentX = touchStartX;
}

// Handle touch move event
function handleTouchMove(event) {
  event.preventDefault();
  if (isTouching) {
    // Update current touch position for steering calculation
    touchCurrentX = event.touches[0].clientX;
  }
}

// Handle touch end event
function handleTouchEnd(event) {
  event.preventDefault();
  isTouching = false;
  // Reset touch positions
  touchStartX = 0;
  touchCurrentX = 0;
}

// Handle mouse down event
function handleMouseDown(event) {
  event.preventDefault();
  isTouching = true;
  // Store initial mouse position for steering calculation
  touchStartX = event.clientX;
  touchCurrentX = touchStartX;
}

// Handle mouse move event
function handleMouseMove(event) {
  event.preventDefault();
  if (isTouching) {
    // Update current mouse position for steering calculation
    touchCurrentX = event.clientX;
  }
}

// Handle mouse up event
function handleMouseUp(event) {
  event.preventDefault();
  isTouching = false;
  // Reset touch positions
  touchStartX = 0;
  touchCurrentX = 0;
}

// Handle key down
function handleKeyDown(event) {
  if (keyStates.hasOwnProperty(event.key)) {
    keyStates[event.key] = true;
  }
  
  // Music controls - only when game has started
  if (isGameStarted) {
    // M key - toggle music on/off
    if (event.key === 'm' || event.key === 'M') {
      toggleMusic();
    }
    
    // N key - next track
    if (event.key === 'n' || event.key === 'N') {
      if (!bgMusic.isMuted && bgMusic.isLoaded) {
        switchTrack();
      }
    }
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
  if (keyStates.ArrowUp || isTouching) {
    speed = Math.min(maxSpeed, speed + acceleration);
    
    // Dim brake lights when accelerating
    updateBrakeLightsIntensity(false);
    
  } else if (keyStates.ArrowDown) {
    speed = Math.max(0, speed - deceleration * 2);
    
    // Brighten brake lights when braking
    updateBrakeLightsIntensity(true);
    
  } else {
    speed = Math.max(0, speed - deceleration);
    
    // Normal brake light intensity when coasting
    updateBrakeLightsIntensity(false);
  }

  // Handle steering with car tilt
  if (speed > 0) {
    // Process keyboard input for steering
    if (keyStates.ArrowLeft) {
      car.position.x = Math.max(-roadWidth / 2 + 100, car.position.x - (speed / 20));
      // Tilt car left when turning left
      car.rotation.z = Math.min(0.1, speed / maxSpeed * 0.2);
    } else if (keyStates.ArrowRight) {
      car.position.x = Math.min(roadWidth / 2 - 100, car.position.x + (speed / 20));
      // Tilt car right when turning right
      car.rotation.z = Math.max(-0.1, -speed / maxSpeed * 0.2);
    } 
    // Process touch/mouse input for steering when touching
    else if (isTouching && touchStartX !== touchCurrentX) {
      const deltaX = touchCurrentX - touchStartX;
      // Make steering less sensitive by increasing the divisors
      const steeringFactor = deltaX / (window.innerWidth < 768 ? 50 : 80); // Reduced sensitivity for more precise control
      
      if (steeringFactor < 0) {
        // Steer left
        car.position.x = Math.max(-roadWidth / 2 + 100, car.position.x - (speed / 20) * Math.abs(steeringFactor));
        // Tilt car left
        car.rotation.z = Math.min(0.1, speed / maxSpeed * 0.2 * Math.abs(steeringFactor));
      } else {
        // Steer right
        car.position.x = Math.min(roadWidth / 2 - 100, car.position.x + (speed / 20) * steeringFactor);
        // Tilt car right
        car.rotation.z = Math.max(-0.1, -speed / maxSpeed * 0.2 * steeringFactor);
      }
    } else {
      // Return to center when not turning
      car.rotation.z *= 0.8;
    }
    
    // Add a slight forward tilt based on acceleration/deceleration
    if (keyStates.ArrowUp || isTouching) {
      // Tilt backward when accelerating
      car.rotation.x = Math.min(0.05, car.rotation.x + 0.005);
    } else if (keyStates.ArrowDown) {
      // Tilt forward when braking
      car.rotation.x = Math.max(-0.05, car.rotation.x - 0.005);
    } else {
      // Return to neutral
      car.rotation.x *= 0.9;
    }
  }

  // Calculate speed factor (0 to 1)
  const speedFactor = speed / maxSpeed;
  
  // Move road based on speed - faster movement at higher speeds
  const roadSpeedMultiplier = 1 + speedFactor; // Road moves up to 2x faster at max speed
  road.position.z += speed * roadSpeedMultiplier;
  if (road.position.z > segmentLength) {
    road.position.z = 0;
  }

  // Move grid with increasing speed
  const gridSpeedMultiplier = 1 + speedFactor * 0.5; // Grid moves up to 1.5x faster at max speed
  grid.position.z = (grid.position.z + speed * gridSpeedMultiplier) % gridDivisions;

  // Update camera position for a low-angle shot from behind the car (like reference image)
  const cameraZOffset = cameraDistance;
  const lowOffset = 25; // Position the camera much lower
  
  camera.position.set(
    car.position.x * 0.3, // Slightly offset from car for better view
    lowOffset, // Very low camera
    car.position.z + cameraZOffset // Close behind the car
  );
  
  // Adjust camera field of view for speed effect
  camera.fov = 70 + (speedFactor * 10); // Narrower FOV for more cinematic look
  camera.updateProjectionMatrix();
  
  // Point camera slightly up to see the sun and palm trees
  const lookPointZ = car.position.z - 1000; // Look ahead down the road
  const lookPointY = 200 + (speedFactor * 50); // Look up to see the sun
  camera.lookAt(car.position.x * 0.2, lookPointY, lookPointZ);
  
  // Update speed lines
  updateSpeedLines(speedFactor);

  // Update roadside objects
  updateRoadsideObjects();

  // Check if it's time to switch tracks
  if (bgMusic.source && Date.now() - bgMusic.lastSwitchTime > bgMusic.switchInterval) {
    switchTrack();
  }

  // Update speed display
  updateSpeedDisplay();

  // Render scene
  renderer.render(scene, camera);

  // Continue game loop
  gameLoop = requestAnimationFrame(update);
}

// Update speed lines based on current speed
function updateSpeedLines(speedFactor) {
  // Only show speed lines when going fast
  const linesVisibility = Math.max(0, speedFactor - 0.4) * 1.6; // Start showing at 40% of max speed
  
  for (let i = 0; i < speedLines.length; i++) {
    const line = speedLines[i];
    
    // Set opacity based on speed
    line.material.opacity = linesVisibility;
    
    // Move line forward and reset when it passes the camera
    line.line.position.z += speed * 3; // Lines move faster than the road
    if (line.line.position.z > 500) {
      line.line.position.z = -3000 - Math.random() * 1000;
    }
  }
}

// Update speed display
function updateSpeedDisplay() {
  document.getElementById('speed').textContent = Math.floor(speed) + ' mph';
}

// Create a larger palm tree specifically for the horizon/skyline
function addLargePalmTree(x, y, z) {
  const scale = 2.5; // Scale up the regular palm trees
  const palmColor = 0x330066; // Deep purple
  
  // Taller, thinner trunk
  const trunkGeometry = new THREE.BoxGeometry(15 * scale, 250 * scale, 15 * scale);
  const trunkMaterial = new THREE.MeshBasicMaterial({ 
    color: palmColor,
    transparent: true,
    opacity: 0.9
  });
  const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
  trunk.position.set(x, y + 125 * scale, z);
  scene.add(trunk);

  // Create palm fronds - more dramatic for silhouette
  for (let i = 0; i < 12; i++) {
    const frondGeometry = new THREE.BoxGeometry(180 * scale, 5 * scale, 5 * scale);
    const frondMaterial = new THREE.MeshBasicMaterial({ 
      color: palmColor,
      transparent: true,
      opacity: 0.9
    });
    
    const frond = new THREE.Mesh(frondGeometry, frondMaterial);
    frond.position.set(x, y + 250 * scale, z);
    
    // Create a more natural-looking palm crown
    const angle = (i * Math.PI) / 6;
    frond.rotation.z = angle;
    
    // Make the fronds curve downward
    if (i % 2 === 0) {
      frond.rotation.x = 0.3;
    } else {
      frond.rotation.x = -0.3;
    }
    
    scene.add(frond);
  }
  
  // Add glow around the crown
  const glowGeometry = new THREE.SphereGeometry(70 * scale, 16, 16);
  const glowMaterial = new THREE.MeshBasicMaterial({
    color: 0xff41e9, // Pink
    transparent: true,
    opacity: 0.15
  });
  const glow = new THREE.Mesh(glowGeometry, glowMaterial);
  glow.position.set(x, y + 250 * scale, z);
  scene.add(glow);
}

// Create speed lines that appear when going fast
function createSpeedLines() {
  // Container for all speed lines
  const speedLinesContainer = new THREE.Group();
  scene.add(speedLinesContainer);
  
  // Create 30 speed lines
  for (let i = 0; i < 30; i++) {
    // Create a line geometry
    const lineGeometry = new THREE.BufferGeometry();
    const lineMaterial = new THREE.LineBasicMaterial({
      color: getRandomNeonColor(),
      transparent: true,
      opacity: 0
    });
    
    // Each line starts from a random position and goes backward
    const x = (Math.random() - 0.5) * roadWidth * 3;
    const y = 50 + Math.random() * 150;
    const zStart = -500 - Math.random() * 1000;
    const zEnd = zStart + 2000 + Math.random() * 1000;
    
    const points = [
      new THREE.Vector3(x, y, zStart),
      new THREE.Vector3(x * 0.8, y, zEnd)
    ];
    
    lineGeometry.setFromPoints(points);
    const line = new THREE.Line(lineGeometry, lineMaterial);
    speedLinesContainer.add(line);
    speedLines.push({
      line: line,
      initialZ: zStart,
      length: zEnd - zStart,
      material: lineMaterial
    });
  }
}

// Create objects along the roadside that will pass by the player
function createRoadsideObjects() {
  // Create roadside markers to enhance the sense of speed
  for (let i = 0; i < 60; i++) {
    // Alternate between left and right side of the road
    const side = i % 2 === 0 ? -1 : 1;
    
    // Create a simple neon pole
    const poleHeight = 80 + Math.random() * 40;
    const poleGeometry = new THREE.BoxGeometry(5, poleHeight, 5);
    const poleMaterial = new THREE.MeshBasicMaterial({ 
      color: getRandomNeonColor(),
      transparent: true,
      opacity: 0.8
    });
    
    const pole = new THREE.Mesh(poleGeometry, poleMaterial);
    
    // Position along the road
    const roadDistance = 10000;
    const z = -(i * (roadDistance / 30));
    pole.position.set(
      side * (roadWidth / 2 + 50 + Math.random() * 30), 
      poleHeight / 2, 
      z
    );
    
    scene.add(pole);
    roadsideObjects.push(pole);
    
    // Add a small light at the top of some poles
    if (Math.random() > 0.5) {
      const lightGeometry = new THREE.SphereGeometry(10, 8, 8);
      const lightMaterial = new THREE.MeshBasicMaterial({ 
        color: poleMaterial.color,
        transparent: true,
        opacity: 0.9
      });
      
      const light = new THREE.Mesh(lightGeometry, lightMaterial);
      light.position.set(
        pole.position.x,
        pole.position.y + poleHeight / 2,
        pole.position.z
      );
      
      scene.add(light);
      roadsideObjects.push(light);
    }
  }
}

// Update roadside objects to loop around as they pass by
function updateRoadsideObjects() {
  const resetPosition = -10000;
  const visualRange = 1000;
  
  for (let i = 0; i < roadsideObjects.length; i++) {
    const object = roadsideObjects[i];
    
    // Move the object forward
    object.position.z += speed * 1.5; // Slightly faster than road movement for enhanced speed sensation
    
    // Reset position when it passes behind the player
    if (object.position.z > visualRange) {
      object.position.z = resetPosition + Math.random() * 500;
    }
  }
}

// Update brake light intensity based on braking state
function updateBrakeLightsIntensity(isBraking) {
  brakeLights.forEach(brakeLight => {
    if (isBraking) {
      // Intense glow when braking
      brakeLight.light.material.opacity = 1.0;  // Maximum brightness
      brakeLight.glow.material.opacity = 0.8;   // Strong glow
      
      // Update color to be more intense red when braking
      brakeLight.light.material.color.set(0xff0033);
      brakeLight.glow.material.color.set(0xff00cc);
    } else {
      // Always visible with a subtle glow (instead of completely off)
      brakeLight.light.material.opacity = 0.8;
      brakeLight.glow.material.opacity = 0.5;
      
      // Slightly dimmer purple-red color when not braking
      brakeLight.light.material.color.set(0xff0066);
      brakeLight.glow.material.color.set(0xff00ff);
    }
  });
}

// Switch to the next track
function switchTrack() {
  console.log('Switching tracks...');
  
  if (bgMusic.isMuted) {
    console.log('Music is muted, not switching');
    return;
  }
  
  // Stop current track if playing with Web Audio API
  if (bgMusic.source) {
    try {
      bgMusic.source.stop();
      bgMusic.source.disconnect();
      bgMusic.source = null;
    } catch (e) {
      console.error('Error stopping Web Audio track:', e);
    }
  }
  
  // Stop any playing HTML5 Audio elements
  Object.values(bgMusic.audioElements).forEach(audio => {
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  });
  
  // Switch to the other track
  const nextTrack = bgMusic.currentTrack === 'neonRush' ? 'sunSet' : 'neonRush';
  playTrack(nextTrack);
}

// Initialize the game when the page loads
window.addEventListener('load', init); 