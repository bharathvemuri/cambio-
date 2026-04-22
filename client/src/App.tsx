import { useState } from 'react'


import './App.css'
import Card from './components/Game/Card'
import Game from './components/Game/Game'
import Navbar from './components/Navbar/Navbar'
import Player from './components/Game/Player'


function App() {

  return (
    <>
      <Navbar/>
      <Game />
      {/* <Player name="Player 1" cards={[
        { suit: 'hearts', rank: 'A' },
        { suit: 'clubs', rank: '10' },
        { suit: 'spades', rank: 'K' },
        { suit: 'diamonds', rank: '5' },
      ]} order={1}/> */}
      {/* <Card suit="hearts" rank="A"/> */}
      {/* <GameDisplay/> */}
      {/* <div>
        <ChatSidebar/>
      </div> */}
    </>
  )
}

export default App
