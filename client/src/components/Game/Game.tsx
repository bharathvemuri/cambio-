import { useEffect, useReducer } from "react";

import Deck from "./Deck";
import Player from "./Player";

const ACTIONS = {
    INITIALIZE_GAME: 'INITIALIZE_GAME',
    UPDATE_PLAYER_HAND: 'UPDATE_PLAYER_HAND',
}

function reducer(state: any, action: any) {
    switch (action.type) {
        case ACTIONS.INITIALIZE_GAME:
            return { ...state, players: action.payload.players };
        case ACTIONS.UPDATE_PLAYER_HAND:
            return { ...state, players: action.payload.players };
        default:
            return state;
    }
}

const initialState = {
    players: [
        { name: 'Player 1', 
          order: 0, 
          cards: [
            { suit: 'hearts', rank: 'K' },
            { suit: 'clubs', rank: 'A' },
            { suit: 'spades', rank: '2' },
            { suit: 'diamonds', rank: '6' },
          ] },
        { name: 'Player 2', 
          order: 1, 
          cards: [
            { suit: 'hearts', rank: '5' },
            { suit: 'clubs', rank: '2' },
            { suit: 'spades', rank: 'J' },
            { suit: 'diamonds', rank: '4' },
          ] },
        { name: 'Player 3', 
          order: 2, 
          cards: [
            { suit: 'hearts', rank: '3' },
            { suit: 'clubs', rank: '7' },
            { suit: 'spades', rank: 'Q' },
            { suit: 'diamonds', rank: '9' },
          ] },
        { name: 'Player 4', 
          order: 3, 
          cards: [
            { suit: 'hearts', rank: 'A' },
            { suit: 'clubs', rank: '10' },
            { suit: 'spades', rank: 'K' },
            { suit: 'diamonds', rank: '5' },
          ] }
    ]
};

function Game() {

  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    // Initialize game state, fetch data, etc.
  }, []);

  return (
    <div className="h-screen w-screen grid grid-cols-3 grid-rows-3 items-center justify-items-center overflow-hidden">

      <div className="col-start-2 row-start-1">
        <Player name={state.players[3].name} order={2} cards={state.players[3].cards} />
      </div>

      <div className="col-start-1 row-start-2">
        <Player name={state.players[2].name} order={1} cards={state.players[2].cards} />
      </div>

        <div className="col-start-2 row-start-2">
          <Deck />
        </div>

      <div className="col-start-3 row-start-2">
        <Player name={state.players[1].name} order={3} cards={state.players[1].cards} />
      </div>

      <div className="col-start-2 row-start-3">
        <Player name={state.players[0].name} order={0} cards={state.players[0].cards} />
      </div>

    </div>
  );
}

export default Game;