import Deck from "./Deck";
import Player from "./Player";

function Game() {
  return (
    <div className="h-screen w-screen grid grid-cols-3 grid-rows-3 items-center justify-items-center overflow-hidden">

      <div className="col-start-2 row-start-1">
        <Player name="Player 4" order={2} cards={[
          { suit: 'hearts', rank: 'A' },
          { suit: 'clubs', rank: '10' },
          { suit: 'spades', rank: 'K' },
          { suit: 'diamonds', rank: '5' },
        ]} />
      </div>

      <div className="col-start-1 row-start-2">
        <Player name="Player 3" order={1} cards={[
          { suit: 'hearts', rank: '3' },
          { suit: 'clubs', rank: '7' },
          { suit: 'spades', rank: 'Q' },
          { suit: 'diamonds', rank: '9' },
        ]} />
      </div>

        <div className="col-start-2 row-start-2">
          <Deck />
        </div>

      <div className="col-start-3 row-start-2">
        <Player name="Player 2" order={3} cards={[
          { suit: 'hearts', rank: '5' },
          { suit: 'clubs', rank: '2' },
          { suit: 'spades', rank: 'J' },
          { suit: 'diamonds', rank: '4' },
        ]} />
      </div>

      <div className="col-start-2 row-start-3">
        <Player name="Player 1" order={0} cards={[
          { suit: 'hearts', rank: 'K' },
          { suit: 'clubs', rank: 'A' },
          { suit: 'spades', rank: '2' },
          { suit: 'diamonds', rank: '6' },
        ]} />
      </div>

    </div>
  );
}

export default Game;