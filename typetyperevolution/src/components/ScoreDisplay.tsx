import React from 'react';
import GameStore from '../utils/GameStore';

const ScoreDisplay: React.FC = () => {
  const { score, combo, maxCombo, perfects, goods, oks, misses, accuracy } = GameStore();

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="text-3xl font-bold text-game-accent">
        {score.toLocaleString()}
      </div>
      
      <div className="flex gap-8 text-sm mt-2">
        <div className="flex flex-col items-center">
          <span className="text-gray-400">COMBO</span>
          <span className="text-xl font-bold">{combo}x</span>
        </div>
        
        <div className="flex flex-col items-center">
          <span className="text-gray-400">MAX COMBO</span>
          <span className="text-xl font-bold">{maxCombo}x</span>
        </div>
        
        <div className="flex flex-col items-center">
          <span className="text-gray-400">ACCURACY</span>
          <span className="text-xl font-bold">{accuracy}%</span>
        </div>
      </div>
      
      <div className="flex gap-4 text-xs mt-2">
        <div className="flex flex-col items-center">
          <span className="text-perfect">PERFECT</span>
          <span>{perfects}</span>
        </div>
        
        <div className="flex flex-col items-center">
          <span className="text-good">GOOD</span>
          <span>{goods}</span>
        </div>
        
        <div className="flex flex-col items-center">
          <span className="text-ok">OK</span>
          <span>{oks}</span>
        </div>
        
        <div className="flex flex-col items-center">
          <span className="text-miss">MISS</span>
          <span>{misses}</span>
        </div>
      </div>
    </div>
  );
};

export default ScoreDisplay; 