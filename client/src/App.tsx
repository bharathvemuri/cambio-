import { useState } from 'react'
import { io } from 'socket.io-client';

import './App.css'
import Game from './components/Game/Game'
import Navbar from './components/Navbar/Navbar'
import Modal from './components/Modal/Modal'

function App() {

  const [modalOpen, setModalOpen] = useState(true);
  const socket = io('http://localhost:3000');


  const startGame = (mode: string) => {

    switch (mode) {
      case 'computer':
        console.log('Starting game vs Computer');
        break;
      case 'players':
        console.log('Starting game vs Players');
        break;
      default:
        console.log('Invalid game mode selected');
    }
    setModalOpen(false);
  }
  return (
    <>

      {modalOpen && (
        <Modal startGame={startGame} socket={socket} />
      )}
      {/* <Navbar/> */}
      <Game />
    </>
  )
}

export default App
