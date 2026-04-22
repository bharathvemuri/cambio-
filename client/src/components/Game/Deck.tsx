import { useReducer } from "react"

import Card, { type Rank, type Suit } from "./Card"

const initialDeck = {
    deck: [
        { suit: 'hearts', rank: '2' },
        { suit: 'hearts', rank: '3' },
        { suit: 'hearts', rank: '4' },
        { suit: 'hearts', rank: '5' },
        { suit: 'hearts', rank: '6' },
        { suit: 'hearts', rank: '7' },
        { suit: 'hearts', rank: '8' },
        { suit: 'hearts', rank: '9' },
        { suit: 'hearts', rank: '10' },
        { suit: 'hearts', rank: 'J' },
        { suit: 'hearts', rank: 'Q' },
        { suit: 'hearts', rank: 'K' },
        { suit: 'hearts', rank: 'A' },
    ],
    discardPile: []
}

const ACTIONS = {
    DRAW_CARD: 'DRAW_CARD',
    DISCARD_CARD: 'DISCARD_CARD',
    SHUFFLE_DECK: 'SHUFFLE_DECK',
}

const reducer = (state: any, action: any) => {
    switch (action.type) {
        case ACTIONS.DRAW_CARD:
            return {
                ...state,
                deck: state.deck.slice(1),
                discardPile: [...state.discardPile, state.deck[0]]
            };
        case ACTIONS.DISCARD_CARD:
            return state; // Implementation for discarding a card
        case ACTIONS.SHUFFLE_DECK:
            // Implementation for shuffling the deck
            return state;
        default:
            return state;
    }
};

type PlayingCard = {
    suit: Suit;
    rank: Rank;
};

function Deck() {

    const [state, dispatch] = useReducer(reducer, initialDeck);


    return (
        <div className="deck-container flex flex-row gap-4">
            {state.deck.length > 0 && (
                <div className="deck relative" onClick={() => dispatch({ type: ACTIONS.DRAW_CARD })}>
                    {state.deck.slice(0, 5).map((card: PlayingCard, index: number) => (
                        <Card
                            key={index}
                            suit={card.suit}
                            rank={card.rank}
                            isDeckCard={index}
                        />
                    ))}
                </div>
            )}
            <div className="discard-pile">
                {state.discardPile.length > 0 && (
                    <Card suit={state.discardPile[state.discardPile.length - 1].suit} rank={state.discardPile[state.discardPile.length - 1].rank} isFaceUp={true} />
                )}
            </div>
        </div>
    )
}

export default Deck