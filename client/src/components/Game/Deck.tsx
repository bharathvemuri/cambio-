import Card from './Card';
import type { DrawSource, PublicGameState } from '../../types/game';

interface DeckProps {
    deck: PublicGameState['deck'];
    pendingDraw: PublicGameState['pendingDraw'];
    matchable: boolean;
    canDraw: boolean;            // it's this client's turn and phase is AWAITING_DRAW
    canDiscardDrawn: boolean;    // this client may discard the pending draw directly
    onDraw: (source: DrawSource) => void;
    onDiscardDrawn: () => void;
}

function Deck({ deck, pendingDraw, matchable, canDraw, canDiscardDrawn, onDraw, onDiscardDrawn }: DeckProps) {
    const discardTop = deck.discardPile.length > 0 ? deck.discardPile[deck.discardPile.length - 1] : null;
    // The drawn card's identity is only present in the drawer's own filtered state.
    const myDrawnCard = pendingDraw && 'card' in pendingDraw ? pendingDraw.card : null;

    return (
        <div className="flex flex-col items-center gap-3">
            <div className="flex flex-row gap-6">
                {/* Draw pile: identities are never sent to the client, only a count */}
                <div className="flex flex-col items-center gap-1">
                    <div
                        className={`relative w-[clamp(40px,7vw,72px)] aspect-[2/3] ${canDraw ? 'cursor-pointer' : ''}`}
                        onClick={() => canDraw && onDraw('DRAW_PILE')}
                    >
                        {deck.drawCount === 0 && (
                            <div className="w-full h-full border-2 border-dashed border-gray-400/60 rounded-xl" />
                        )}
                        {Array.from({ length: Math.min(deck.drawCount, 5) }).map((_, i) => (
                            <Card key={i} card={{ hidden: true }} stackIndex={i} selectable={canDraw && i === Math.min(deck.drawCount, 5) - 1} />
                        ))}
                    </div>
                    <span className="text-xs text-gray-500 mt-2">draw ({deck.drawCount})</span>
                </div>

                {/* Discard pile: top card is public information */}
                <div className="flex flex-col items-center gap-1">
                    <div
                        className={`w-[clamp(40px,7vw,72px)] aspect-[2/3] rounded-xl ${
                            matchable ? 'ring-2 ring-emerald-400' : ''
                        } ${canDraw && discardTop ? 'cursor-pointer' : ''}`}
                        onClick={() => canDraw && discardTop && onDraw('DISCARD_PILE')}
                    >
                        <Card card={discardTop} faceUp selectable={canDraw && discardTop !== null} />
                    </div>
                    <span className="text-xs text-gray-500 mt-2">
                        discard{matchable ? ' · matchable' : ''}
                    </span>
                </div>
            </div>

            {/* Pending drawn card, shown between draw and swap/discard decision */}
            {pendingDraw && (
                <div className="flex flex-col items-center gap-2">
                    <div className="w-[clamp(40px,7vw,72px)] aspect-[2/3]">
                        {myDrawnCard
                            ? <Card card={myDrawnCard} faceUp />
                            : <Card card={{ hidden: true }} />}
                    </div>
                    {myDrawnCard && (
                        <div className="flex flex-col items-center gap-1">
                            <span className="text-xs text-gray-500">your draw</span>
                            {canDiscardDrawn && (
                                <button
                                    className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                                    onClick={onDiscardDrawn}
                                >
                                    Discard
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default Deck;
