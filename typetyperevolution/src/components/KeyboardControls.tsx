import React, { useEffect } from 'react';
import GameStore from '../utils/GameStore';
import { HitAccuracy } from '../utils/GameStore';

const KEYS = ['Q', 'W', 'E', 'R', 'T', 'Y'];

const KeyboardControls: React.FC = () => {
  const { keysActive, keyHitState, registerKeyState, hitLetter } = GameStore();

  useEffect(() => {
    // Handle key down events
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toUpperCase();
      if (KEYS.includes(key)) {
        if (!keysActive[key]) {
          registerKeyState(key, true);
          hitLetter(key);
        }
      }
    };

    // Handle key up events
    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toUpperCase();
      if (KEYS.includes(key)) {
        registerKeyState(key, false);
      }
    };

    // Add event listeners
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Clean up event listeners
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [keysActive, registerKeyState, hitLetter]);

  // Get CSS class for key based on its state
  const getKeyClass = (key: string) => {
    if (keyHitState[key]) {
      return `key key-${keyHitState[key]}`;
    }
    return keysActive[key] ? 'key key-active' : 'key key-inactive';
  };

  return (
    <div className="flex justify-center gap-2 pb-2 fixed bottom-0 left-0 right-0 bg-black bg-opacity-50 pt-2 z-50">
      {KEYS.map((key) => (
        <div key={key} className={getKeyClass(key)}>
          {key}
        </div>
      ))}
    </div>
  );
};

export default KeyboardControls; 