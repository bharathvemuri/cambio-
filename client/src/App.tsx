import { useState, useEffect } from 'react';

// Socket
import { useSocket } from './providers/SocketProvider';

// Component Imports
import Game from './components/Game/Game';
import Modal from './components/Modal/Modal';
import './App.css';

function App() {
  const [modalOpen, setModalOpen] = useState(true);
  const [gameState, setGameState] = useState(null);

  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;

    const handleGameStarted = (data: any) => {
      setGameState(data.gameState);
    };

    socket.on('gameStarted', handleGameStarted);

    return () => {
      socket.off('gameStarted', handleGameStarted);
    };
  }, [socket]);

  const startGame = (mode: string) => {
    if (!socket) {
      console.error('Socket not connected');
      return;
    }

    socket.emit('startGame', { mode }, (response: any) => {
      console.log('Server response:', response);
      setGameState(response.gameState);
    });

    setModalOpen(false);
  };

  if (!socket) {
    return <div>Connecting...</div>;
  }

  return (
    <>
      {modalOpen && <Modal startGame={startGame} />}

      {gameState && <Game state={gameState} />}
    </>
  );
}

export default App;