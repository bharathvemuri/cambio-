import { useEffect, useReducer, useState } from "react";

import Deck from "./Deck";
import Player from "./Player";
import { useSocket } from "../../providers/SocketProvider";

const ACTIONS = {
  INITIALIZE_GAME: 'INITIALIZE_GAME',
  UPDATE_PLAYER_HAND: 'UPDATE_PLAYER_HAND',
}

function reducer(localState: any, action: any) {
  switch (action.type) {
    case ACTIONS.INITIALIZE_GAME:
      return { ...localState, players: action.payload.players };
    case ACTIONS.UPDATE_PLAYER_HAND:
      return { ...localState, players: action.payload.players };
    default:
      return localState;
  }
}

function Game({ state }: { state: any}) {

  const socket = useSocket();
  const [localState, dispatch] = useReducer(reducer, state);

  const updatePlayerHand = (playerId: number, newHand: any[]) => {
    dispatch({
      type: ACTIONS.UPDATE_PLAYER_HAND, payload: {
        players: localState.players.map((player: any, index: number) => {
          if (index === playerId) {
            return { ...player, hand: newHand };
          }
          return player;
        })
      }
    });
  }

  return (
    <div className="h-screen w-screen grid grid-cols-3 grid-rows-3 items-center justify-items-center overflow-hidden">

      {/* Opposite from player 1 - when there are 2 or 4 players */}
      {localState.players.length === 2 || localState.players.length === 4 && (
        <div className="col-start-2 row-start-1">
          <Player name={localState.players[1].name} order={2} hand={localState.players[1].hand} />
        </div>
      )}

      {/* Players to the left and right of player 1 - when there are 3 or 4 players     */}
      {localState.players.length === 4 || localState.players.length === 3 && (
        <>
          <div className="col-start-1 row-start-2">
            <Player name={localState.players[localState.players.length-1].name} order={3} hand={localState.players[localState.players.length-1].hand} />
          </div>
          <div className="col-start-3 row-start-2">
            <Player name={localState.players[1].name} order={1} hand={localState.players[1].hand} />
          </div>
        </>
      )}

      {/* Deck in the center */}
      <div className="col-start-2 row-start-2">
        <Deck />
      </div>

      {/* Player 1 - always at the bottom */}
      <div className="col-start-2 row-start-3">
        <Player name={localState.players[0].name} order={0} hand={localState.players[0].hand} />
      </div>

    </div>
  );
}

export default Game;



