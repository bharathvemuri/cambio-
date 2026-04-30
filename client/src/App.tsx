// Library Imports
import { useState } from 'react'

// Socket
import { useSocket } from './providers/SocketProvider.tsx';

// Component Imports
import Game from './components/Game/Game';
import Modal from './components/Modal/Modal';
import './App.css'

function App() {

  const [modalOpen, setModalOpen] = useState(true);
  const [gameState, setGameState] = useState(null);
  const socket = useSocket();


  const startGame = (mode: string) => {

    socket.emit("startGame", { mode }, (response: any) => {
      console.log("Server response:", response);
      setGameState(response.gameState);
    });
    setModalOpen(false);
  }


  // socket event listeners
  socket.on("gameStarted", (data: any) => {
    setGameState(data.gameState);
  });

  return (
    <>
      {modalOpen && (
        <Modal startGame={startGame}/>
      )}
      {/* <Navbar/> */}
      {gameState && (
        <Game state={gameState}/>
      )}
    </>
  )
}

export default App
