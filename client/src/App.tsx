import { useState, useEffect } from 'react';

// Socket
import { useSocket } from './providers/SocketProvider';

// Component Imports
import Game from './components/Game/Game';
import Modal from './components/Modal/Modal';
import type { AckResponse, PublicGameState } from './types/game';
import './App.css';

function App() {
  const [gameState, setGameState] = useState<PublicGameState | null>(null);
  const [startError, setStartError] = useState<string | null>(null);

  const socket = useSocket();

  // The server broadcasts a per-player redacted state after every accepted move --
  // this single listener keeps the whole client in sync for the entire game.
  useEffect(() => {
    if (!socket) return;

    const handleGameStateUpdated = (data: { gameState: PublicGameState }) => {
      setGameState(data.gameState);
    };

    socket.on('gameStateUpdated', handleGameStateUpdated);

    return () => {
      socket.off('gameStateUpdated', handleGameStateUpdated);
    };
  }, [socket]);

  const startGame = (mode: string, roomId: string) => {
    if (!socket) {
      console.error('Socket not connected');
      return;
    }

    socket.emit('startGame', { mode, roomId }, (response: AckResponse) => {
      if (response?.error) {
        setStartError(response.error);
        setTimeout(() => setStartError(null), 4000);
        return;
      }
      if (response?.gameState) {
        setGameState(response.gameState);
      }
    });
  };

  if (!socket) {
    return <div>Connecting...</div>;
  }

  const inGame = gameState !== null && gameState.phase !== 'LOBBY';

  return (
    <>
      {startError && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] bg-red-600 text-white px-4 py-2 rounded shadow">
          {startError}
        </div>
      )}

      {inGame ? <Game state={gameState} /> : <Modal startGame={startGame} />}
    </>
  );
}

export default App;
