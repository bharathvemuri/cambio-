import Player from "./Player"

function Game() {
    return (
        <div className="player-space flex flex-col w-full justify-center gap-8">
            <div>
                <Player name="Player 4" cards={[
                    { suit: 'hearts', rank: 'A' },
                    { suit: 'clubs', rank: '10' },
                    { suit: 'spades', rank: 'K' },
                    { suit: 'diamonds', rank: '5' },
                ]} order={2}/>
            </div>
            <div className="flex  flex-row space-between gap-8">
                <Player name="Player 3" cards={[
                    { suit: 'hearts', rank: '3' },
                    { suit: 'clubs', rank: '7' },
                    { suit: 'spades', rank: 'Q' },
                    { suit: 'diamonds', rank: '9' },
                ]} order={1}/>

                {/* <Deck /> */}

                <Player name="Player 2" cards={[
                    { suit: 'hearts', rank: '5' },
                    { suit: 'clubs', rank: '2' },
                    { suit: 'spades', rank: 'J' },
                    { suit: 'diamonds', rank: '4' },
                ]} order={3}/>
            </div>
            <div>
                <Player name="Player 1" cards={[
                    { suit: 'hearts', rank: 'K' },
                    { suit: 'clubs', rank: 'A' },
                    { suit: 'spades', rank: '2' },
                    { suit: 'diamonds', rank: '6' },
                ]} order={0}/>
            </div>
        </div>
    )
}

export default Game