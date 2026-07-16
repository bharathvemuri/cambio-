import Card from './Card';
import type { CardData, PublicPlayer } from '../../types/game';

interface PlayerProps {
    player: PublicPlayer;
    isMe: boolean;
    isCurrentTurn: boolean;
    isCambioCaller: boolean;
    // handIndex -> card to show temporarily face-up (peeks/reveals, private to this client)
    reveals: Record<number, CardData>;
    selectedIndices: number[];
    selectable: boolean;
    onCardClick: (handIndex: number) => void;
    onCardDoubleClick: (handIndex: number) => void;
}

function Player({
    player,
    isMe,
    isCurrentTurn,
    isCambioCaller,
    reveals,
    selectedIndices,
    selectable,
    onCardClick,
    onCardDoubleClick,
}: PlayerProps) {
    // Hands normally hold 4 cards but grow past 4 on wrong-match penalties.
    const cols = player.hand.length > 4 ? 'grid-cols-3' : 'grid-cols-2';

    return (
        <div
            className={`flex flex-col items-center gap-1 p-2 sm:p-3 rounded-xl transition-colors ${
                isCurrentTurn ? 'ring-2 ring-blue-400 bg-blue-400/10' : ''
            }`}
        >
            <div className={`grid ${cols} justify-center gap-1`}>
                {player.hand.map((card, index) => (
                    <div className="w-[clamp(40px,7vw,72px)] aspect-[2/3]" key={index}>
                        <Card
                            card={reveals[index] ?? card}
                            faceUp={reveals[index] !== undefined}
                            selectable={selectable}
                            selected={selectedIndices.includes(index)}
                            onClick={() => onCardClick(index)}
                            onDoubleClick={() => onCardDoubleClick(index)}
                        />
                    </div>
                ))}
            </div>

            <h2 className="text-sm sm:text-base font-semibold">
                {player.nickname || 'Anonymous'}
                {isMe && ' (you)'}
                {isCambioCaller && <span className="ml-1 text-amber-500 font-bold">CAMBIO!</span>}
            </h2>
        </div>
    );
}

export default Player;
