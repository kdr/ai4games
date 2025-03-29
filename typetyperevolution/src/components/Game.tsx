import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import GameStore, { FallingLetter, HitAccuracy } from '../utils/GameStore';

interface GameProps {
  started: boolean;
  isMuted: boolean;
}

// Letters to use in the game
const LETTERS = 'QWERTY';

// Colors for different hit states
const COLORS = {
  [HitAccuracy.PERFECT]: 0x00FF00, // Green
  [HitAccuracy.GOOD]: 0xFFFF00,    // Yellow
  [HitAccuracy.OK]: 0xFFA500,      // Orange
  [HitAccuracy.MISS]: 0xFF0000,    // Red
  default: 0x00FFCC,               // Game accent color
};

const Game: React.FC<GameProps> = ({ started, isMuted }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { letters, addLetter, updateLetters, spawnRate, increaseDifficulty } = GameStore();
  
  // References to reusable three.js objects
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const lettersRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const lanesRef = useRef<THREE.Mesh[]>([]);
  const targetZoneRef = useRef<THREE.Mesh | null>(null);

  // Handle background music
  useEffect(() => {
    // Create audio element if it doesn't exist
    if (!audioRef.current) {
      audioRef.current = new Audio('/backing.mp3');
      audioRef.current.loop = true;
      audioRef.current.volume = 0.7;
    }

    // Set muted state
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }

    // Play or pause based on game state
    if (started && !isMuted) {
      audioRef.current.play().catch(error => {
        console.warn('Audio playback failed:', error);
      });
    } else if (audioRef.current) {
      audioRef.current.pause();
      if (!started) {
        audioRef.current.currentTime = 0;
      }
    }

    // Clean up audio on unmount
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
      }
    };
  }, [started, isMuted]);

  // Initialize the 3D scene
  useEffect(() => {
    if (!containerRef.current) return;

    // Create scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x121212);

    // Create camera
    const camera = new THREE.PerspectiveCamera(
      75, 
      containerRef.current.clientWidth / containerRef.current.clientHeight, 
      0.1, 
      1000
    );
    camera.position.z = 15;
    camera.position.y = 0;

    // Create renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    containerRef.current.appendChild(renderer.domElement);

    // Create lanes (vertical tracks for letters)
    const laneWidth = 1.2;
    const laneSpacing = 0.3;
    const totalWidth = (laneWidth + laneSpacing) * LETTERS.length - laneSpacing;
    const startX = -totalWidth / 2 + laneWidth / 2;

    // Create lanes and add to scene
    for (let i = 0; i < LETTERS.length; i++) {
      const laneGeometry = new THREE.PlaneGeometry(laneWidth, 20);
      const laneMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x333333, 
        transparent: true, 
        opacity: 0.4 
      });
      
      const lane = new THREE.Mesh(laneGeometry, laneMaterial);
      lane.position.x = startX + i * (laneWidth + laneSpacing);
      scene.add(lane);
      lanesRef.current.push(lane);
    }

    // Create target zone (bottom area where letters should hit)
    const targetGeometry = new THREE.PlaneGeometry(totalWidth + 1, 0.5);
    const targetMaterial = new THREE.MeshBasicMaterial({ 
      color: COLORS.default, 
      transparent: true, 
      opacity: 0.8 
    });
    
    const targetZone = new THREE.Mesh(targetGeometry, targetMaterial);
    targetZone.position.y = -6.5;
    scene.add(targetZone);
    targetZoneRef.current = targetZone;

    // Add light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    // Store references
    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;

    // Handle window resize
    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
      
      cameraRef.current.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    // Clean up
    return () => {
      window.removeEventListener('resize', handleResize);
      
      if (containerRef.current && rendererRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }

      // Dispose of Three.js resources
      lanesRef.current.forEach(lane => {
        lane.geometry.dispose();
        (lane.material as THREE.Material).dispose();
      });
      
      if (targetZoneRef.current) {
        targetZoneRef.current.geometry.dispose();
        (targetZoneRef.current.material as THREE.Material).dispose();
      }
      
      lettersRef.current.forEach(letterMesh => {
        letterMesh.geometry.dispose();
        (letterMesh.material as THREE.Material).dispose();
      });
    };
  }, []);

  // Letter spawning logic
  useEffect(() => {
    if (!started) return;
    
    // Function to spawn a random letter
    const spawnLetter = () => {
      const randomIndex = Math.floor(Math.random() * LETTERS.length);
      const letter = LETTERS[randomIndex];
      addLetter(letter);
    };

    // Start spawning letters
    const spawnInterval = setInterval(spawnLetter, spawnRate);
    
    // Increase difficulty over time
    const difficultyInterval = setInterval(() => {
      increaseDifficulty();
    }, 10000); // Every 10 seconds
    
    return () => {
      clearInterval(spawnInterval);
      clearInterval(difficultyInterval);
    };
  }, [started, spawnRate, addLetter, increaseDifficulty]);

  // Handle letter creation and movement
  useEffect(() => {
    if (!sceneRef.current) return;
    
    const scene = sceneRef.current;
    const letterHeight = 1;
    const letterWidth = 0.8;

    // Remove letters that are no longer in the state
    const currentIds = new Set(letters.map(l => l.id));
    lettersRef.current.forEach((mesh, id) => {
      if (!currentIds.has(id)) {
        scene.remove(mesh);
        lettersRef.current.delete(id);
        // Dispose of geometry and material
        mesh.geometry.dispose();
        (mesh.material as THREE.Material).dispose();
      }
    });

    // Update or create letter meshes
    letters.forEach(letter => {
      // Convert position from 0-100 to actual Y coordinate (-10 to 10)
      const yPos = 10 - (letter.position / 5.5);
      
      // Calculate x position based on lane
      const laneWidth = 1.2;
      const laneSpacing = 0.3;
      const totalWidth = (laneWidth + laneSpacing) * LETTERS.length - laneSpacing;
      const startX = -totalWidth / 2 + laneWidth / 2;
      const xPos = startX + letter.lane * (laneWidth + laneSpacing);

      if (lettersRef.current.has(letter.id)) {
        // Update existing letter
        const mesh = lettersRef.current.get(letter.id)!;
        mesh.position.y = yPos;
        
        // Update color if needed
        if (letter.hit && letter.accuracy) {
          (mesh.material as THREE.MeshBasicMaterial).color.setHex(COLORS[letter.accuracy]);
        }
      } else {
        // Create new letter mesh
        const geometry = new THREE.PlaneGeometry(letterWidth, letterHeight);
        const material = new THREE.MeshBasicMaterial({ 
          color: COLORS.default,
          transparent: true,
          opacity: 0.9
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(xPos, yPos, 0.1);
        
        // Add text to the mesh
        const loader = new THREE.TextureLoader();
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const context = canvas.getContext('2d')!;
        context.fillStyle = '#000000';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = '#FFFFFF';
        context.font = 'bold 48px Arial';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(letter.letter, canvas.width / 2, canvas.height / 2);
        const texture = new THREE.Texture(canvas);
        texture.needsUpdate = true;
        material.map = texture;
        
        scene.add(mesh);
        lettersRef.current.set(letter.id, mesh);
      }
    });
  }, [letters]);

  // Animation loop
  useEffect(() => {
    if (!started) return;
    
    let animationFrameId: number;
    
    const animate = (timestamp: number) => {
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        // Update game state
        updateLetters(timestamp);
        
        // Render the scene
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
      
      animationFrameId = requestAnimationFrame(animate);
    };
    
    animationFrameId = requestAnimationFrame(animate);
    
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [started, updateLetters]);

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full"
      style={{ cursor: started ? 'none' : 'default' }}
    />
  );
};

export default Game; 