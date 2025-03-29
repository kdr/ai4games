import React, { useEffect, useState } from 'react';
import Game from './components/Game';
import KeyboardControls from './components/KeyboardControls';
import ScoreDisplay from './components/ScoreDisplay';
import GameStore from './utils/GameStore';

const App: React.FC = () => {
  const [gameStarted, setGameStarted] = useState(false);
  const { score, combo, resetGame, isMuted, setMuted } = GameStore();
  
  const startGame = () => {
    resetGame();
    setGameStarted(true);
  };

  const toggleMute = () => {
    setMuted(!isMuted);
  };

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-between p-4 bg-game-bg text-white overflow-hidden">
      <header className="w-full text-center mb-2 relative">
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
        <button 
          onClick={toggleMute}
          className="absolute top-2 right-2 w-10 h-10 flex items-center justify-center rounded-full bg-game-bg border border-game-accent text-game-accent hover:bg-game-accent hover:text-black transition-colors"
          aria-label={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 5L6 9H2v6h4l5 4V5z"></path>
              <line x1="23" y1="9" x2="17" y2="15"></line>
              <line x1="17" y1="9" x2="23" y2="15"></line>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
            </svg>
          )}
        </button>
      </header>

      <main className="flex-1 w-full flex flex-col items-center justify-center overflow-hidden">
        <Game started={gameStarted} isMuted={isMuted} />
      </main>

      <footer className="w-full mt-2 pb-2 z-10">
        <KeyboardControls />
      </footer>
    </div>
  );
};

export default App; 