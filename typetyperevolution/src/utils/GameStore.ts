import { create } from 'zustand';

// Define hit accuracy types
export enum HitAccuracy {
  PERFECT = 'perfect',
  GOOD = 'good',
  OK = 'ok',
  MISS = 'miss',
}

// Define hit accuracy scores
const HIT_SCORES = {
  [HitAccuracy.PERFECT]: 100,
  [HitAccuracy.GOOD]: 50,
  [HitAccuracy.OK]: 25,
  [HitAccuracy.MISS]: 0,
};

// Define hit accuracy timing windows in milliseconds
export const HIT_WINDOWS = {
  [HitAccuracy.PERFECT]: 100, // Within 100ms
  [HitAccuracy.GOOD]: 250,    // Within 250ms
  [HitAccuracy.OK]: 500,      // Within 500ms
};

// Define the target position for hit detection (0-100)
const TARGET_POSITION = 85; // Adjusted to match the visual target line

// Store loaded sound effects
const SOUND_EFFECTS: Record<HitAccuracy, HTMLAudioElement | undefined> = {
  [HitAccuracy.PERFECT]: undefined,
  [HitAccuracy.GOOD]: undefined,
  [HitAccuracy.OK]: undefined,
  [HitAccuracy.MISS]: undefined,
};

// Create reusable audio elements for sound effects with error handling
const createSoundEffect = (src: string, volume: number = 0.5): HTMLAudioElement | undefined => {
  try {
    const audio = new Audio(src);
    audio.volume = volume;
    return audio;
  } catch (error) {
    console.warn(`Failed to create sound effect from ${src}:`, error);
    return undefined;
  }
};

// Try to load sound effects, but don't crash if they're missing
try {
  SOUND_EFFECTS[HitAccuracy.PERFECT] = createSoundEffect('/sounds/perfect.mp3', 0.6);
  SOUND_EFFECTS[HitAccuracy.GOOD] = createSoundEffect('/sounds/good.mp3', 0.5);
  SOUND_EFFECTS[HitAccuracy.OK] = createSoundEffect('/sounds/ok.mp3', 0.4);
  SOUND_EFFECTS[HitAccuracy.MISS] = createSoundEffect('/sounds/miss.mp3', 0.3);
} catch (error) {
  console.warn('Failed to load some sound effects:', error);
}

// Play sound effect with error handling
const playSoundEffect = (accuracy: HitAccuracy, isMuted: boolean = false) => {
  if (isMuted) return;
  
  const soundEffect = SOUND_EFFECTS[accuracy];
  if (!soundEffect) return;
  
  try {
    // Clone the audio to allow multiple sounds simultaneously
    const sound = soundEffect.cloneNode(true) as HTMLAudioElement;
    sound.play().catch(err => console.warn('Sound play failed:', err));
  } catch (error) {
    console.warn(`Failed to play ${accuracy} sound effect:`, error);
  }
};

// Define falling letter interface
export interface FallingLetter {
  id: string;
  letter: string;
  lane: number;
  position: number;  // 0 to 100 where 100 is at the bottom
  speed: number;     // How fast the letter falls
  timestamp: number; // When the letter was created
  hit?: boolean;     // If the letter has been hit
  accuracy?: HitAccuracy; // The accuracy of the hit
}

// Define game stats interface
interface GameStats {
  score: number;
  combo: number;
  maxCombo: number;
  perfects: number;
  goods: number;
  oks: number;
  misses: number;
  lettersProcessed: number;
  accuracy: number;
  isMuted: boolean;
}

// Define game state interface
interface GameState extends GameStats {
  letters: FallingLetter[];
  keysActive: Record<string, boolean>;
  keyHitState: Record<string, HitAccuracy | null>;
  lastUpdate: number;
  difficulty: number;
  spawnRate: number;

  // Methods
  addLetter: (letter: string) => void;
  updateLetters: (timestamp: number) => void;
  hitLetter: (key: string) => void;
  registerKeyState: (key: string, active: boolean) => void;
  resetGame: () => void;
  increaseDifficulty: () => void;
  setMuted: (muted: boolean) => void;
}

// Initial game state
const initialState: GameStats = {
  score: 0,
  combo: 0,
  maxCombo: 0,
  perfects: 0,
  goods: 0,
  oks: 0,
  misses: 0,
  lettersProcessed: 0,
  accuracy: 100,
  isMuted: false,
};

// Create the store
const GameStore = create<GameState>((set, get) => ({
  ...initialState,
  letters: [],
  keysActive: {},
  keyHitState: {},
  lastUpdate: Date.now(),
  difficulty: 1,
  spawnRate: 1500, // Time between letter spawns in ms

  addLetter: (letter: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    const lane = 'QWERTY'.indexOf(letter);
    
    // Only add letters for Q, W, E, R, T, Y
    if (lane === -1) return;
    
    set((state) => ({
      letters: [
        ...state.letters,
        {
          id,
          letter,
          lane,
          position: 0,
          speed: 5 + (state.difficulty * 0.5), // Speed increases with difficulty
          timestamp: Date.now(),
        },
      ],
    }));
  },

  updateLetters: (timestamp: number) => {
    const state = get();
    const delta = timestamp - state.lastUpdate;
    const moveAmount = delta / 1000; // Convert to seconds

    let newLetters: FallingLetter[] = [];
    let newScore = state.score;
    let newCombo = state.combo;
    let newMaxCombo = state.maxCombo;
    let newPerfects = state.perfects;
    let newGoods = state.goods;
    let newOks = state.oks;
    let newMisses = state.misses;
    let newLettersProcessed = state.lettersProcessed;

    // Update each letter's position
    for (const letter of state.letters) {
      // Skip letters that have been hit
      if (letter.hit) continue;

      // Update the letter's position based on its speed and time delta
      const newPosition = letter.position + (letter.speed * moveAmount);

      // Check if letter has passed the bottom
      if (newPosition >= 100) {
        // Letter missed
        newMisses++;
        newCombo = 0;
        newLettersProcessed++;
        // Mark as hit with miss accuracy so it will be removed
        newLetters.push({
          ...letter,
          position: 100,
          hit: true,
          accuracy: HitAccuracy.MISS,
        });
        
        // Play miss sound
        playSoundEffect(HitAccuracy.MISS, state.isMuted);
      } else {
        // Letter still falling
        newLetters.push({
          ...letter,
          position: newPosition,
        });
      }
    }

    // Calculate accuracy percentage
    const totalHits = newPerfects + newGoods + newOks + newMisses;
    const newAccuracy = totalHits > 0
      ? Math.round(((newPerfects * 1.0 + newGoods * 0.6 + newOks * 0.3) / totalHits) * 100)
      : 100;

    // Remove hit letters after 1 second
    const now = Date.now();
    newLetters = newLetters.filter(letter => {
      if (letter.hit) {
        // Keep the letter for 1 second after it was hit for visual feedback
        const hitTime = letter.timestamp + (letter.position / letter.speed) * 1000;
        return now - hitTime < 1000;
      }
      return true;
    });

    // Update state
    set({
      letters: newLetters,
      score: newScore,
      combo: newCombo,
      maxCombo: newMaxCombo,
      perfects: newPerfects,
      goods: newGoods,
      oks: newOks,
      misses: newMisses,
      lettersProcessed: newLettersProcessed,
      accuracy: newAccuracy,
      lastUpdate: timestamp,
    });
  },

  hitLetter: (key: string) => {
    const state = get();
    let hitLetter: FallingLetter | null = null;
    let hitAccuracy: HitAccuracy | null = null;
    let updatedLetters: FallingLetter[] = [...state.letters];
    
    // Find the lowest unhit letter of this key
    const lane = 'QWERTY'.indexOf(key);
    if (lane === -1) return;
    
    const laneLetters = state.letters
      .filter(l => l.lane === lane && !l.hit)
      .sort((a, b) => b.position - a.position); // Sort by position (descending)
    
    if (laneLetters.length === 0) {
      // No letters to hit in this lane
      set(state => ({
        keyHitState: {
          ...state.keyHitState,
          [key]: null, // Clear any previous hit state
        }
      }));
      return;
    }
    
    // The lowest letter is the one we want to hit
    hitLetter = laneLetters[0];
    
    // Calculate timing difference
    const idealHitPosition = TARGET_POSITION; // Updated to use the target position constant
    const positionDiff = Math.abs(hitLetter.position - idealHitPosition);
    
    // Convert position difference to timing difference
    // 100 units / letter.speed units per second = time to traverse the entire track
    const timeToTraverse = 100 / hitLetter.speed; // in seconds
    const timingDiff = (positionDiff / 100) * timeToTraverse * 1000; // in milliseconds
    
    // Determine hit accuracy based on timing difference
    if (timingDiff <= HIT_WINDOWS[HitAccuracy.PERFECT]) {
      hitAccuracy = HitAccuracy.PERFECT;
    } else if (timingDiff <= HIT_WINDOWS[HitAccuracy.GOOD]) {
      hitAccuracy = HitAccuracy.GOOD;
    } else if (timingDiff <= HIT_WINDOWS[HitAccuracy.OK]) {
      hitAccuracy = HitAccuracy.OK;
    } else {
      hitAccuracy = HitAccuracy.MISS;
    }
    
    // Play sound effect based on accuracy
    playSoundEffect(hitAccuracy, state.isMuted);
    
    // Update the letter with hit information
    updatedLetters = updatedLetters.map(l => {
      if (l.id === hitLetter!.id) {
        return {
          ...l,
          hit: true,
          accuracy: hitAccuracy,
        };
      }
      return l;
    });
    
    // Update score and combo
    let newScore = state.score;
    let newCombo = state.combo;
    let newMaxCombo = state.maxCombo;
    let newPerfects = state.perfects;
    let newGoods = state.goods;
    let newOks = state.oks;
    let newMisses = state.misses;
    let newLettersProcessed = state.lettersProcessed + 1;
    
    // Update stats based on accuracy
    switch (hitAccuracy) {
      case HitAccuracy.PERFECT:
        newPerfects++;
        newCombo++;
        newScore += HIT_SCORES[HitAccuracy.PERFECT] * (1 + newCombo * 0.1);
        break;
      case HitAccuracy.GOOD:
        newGoods++;
        newCombo++;
        newScore += HIT_SCORES[HitAccuracy.GOOD] * (1 + newCombo * 0.05);
        break;
      case HitAccuracy.OK:
        newOks++;
        newCombo++;
        newScore += HIT_SCORES[HitAccuracy.OK];
        break;
      case HitAccuracy.MISS:
        newMisses++;
        newCombo = 0;
        break;
    }
    
    // Update max combo
    if (newCombo > newMaxCombo) {
      newMaxCombo = newCombo;
    }
    
    // Calculate new accuracy
    const totalHits = newPerfects + newGoods + newOks + newMisses;
    const newAccuracy = totalHits > 0
      ? Math.round(((newPerfects * 1.0 + newGoods * 0.6 + newOks * 0.3) / totalHits) * 100)
      : 100;

    // Update state with new values
    set({
      letters: updatedLetters,
      score: Math.round(newScore),
      combo: newCombo,
      maxCombo: newMaxCombo,
      perfects: newPerfects,
      goods: newGoods,
      oks: newOks,
      misses: newMisses,
      lettersProcessed: newLettersProcessed,
      accuracy: newAccuracy,
      keyHitState: {
        ...state.keyHitState,
        [key]: hitAccuracy,
      }
    });
    
    // Reset hit state after a short delay
    setTimeout(() => {
      set(state => ({
        keyHitState: {
          ...state.keyHitState,
          [key]: null,
        }
      }));
    }, 500);
  },

  registerKeyState: (key: string, active: boolean) => {
    set(state => ({
      keysActive: {
        ...state.keysActive,
        [key]: active,
      }
    }));
  },

  resetGame: () => {
    set(state => ({
      ...initialState,
      isMuted: state.isMuted, // Preserve mute setting
      letters: [],
      keysActive: {},
      keyHitState: {},
      lastUpdate: Date.now(),
      difficulty: 1,
      spawnRate: 1500,
    }));
  },

  increaseDifficulty: () => {
    set(state => ({
      difficulty: state.difficulty + 0.2,
      spawnRate: Math.max(500, state.spawnRate - 100),
    }));
  },

  setMuted: (muted: boolean) => {
    set({ isMuted: muted });
  },
}));

export default GameStore; 