import React, { useEffect, useState } from 'react';
import Game from './components/Game';
import KeyboardControls from './components/KeyboardControls';
import ScoreDisplay from './components/ScoreDisplay';
import GameStore from './utils/GameStore';

const App: React.FC = () => {
  const [gameStarted, setGameStarted] = useState(false);
  const { score, combo, resetGame } = GameStore();
  
  const startGame = () => {
    resetGame();
    setGameStarted(true);
  };

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-between p-4 bg-game-bg text-white">
      <header className="w-full text-center mb-4">
        <h1 className="text-4xl font-bold text-game-accent">Type Type Revolution</h1>
        <div className="mt-2 text-xl">
          {gameStarted ? (
            <ScoreDisplay />
          ) : (
            <button 
              onClick={startGame}
              className="bg-game-accent text-black font-bold py-2 px-8 rounded-lg hover:opacity-80 transition-opacity"
            >
              Start Game
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 w-full flex flex-col items-center justify-center">
        <Game started={gameStarted} />
      </main>

      <footer className="w-full mt-4">
        <KeyboardControls />
      </footer>
    </div>
  );
};

export default App; 