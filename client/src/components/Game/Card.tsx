import type { CardData, PublicCard, Suit } from '../../types/game';

const suitSymbols: Record<Suit, string> = {
    hearts: '♥',
    diamonds: '♦',
    clubs: '♣',
    spades: '♠',
};

const suitColors: Record<Suit, string> = {
    hearts: 'text-red-500',
    diamonds: 'text-red-500',
    clubs: 'text-black',
    spades: 'text-black',
};

interface CardProps {
    card: PublicCard;
    faceUp?: boolean;      // face-up rendering only works when real card data is present
    stackIndex?: number;   // offset styling for cards stacked in the draw pile
    selectable?: boolean;  // visual affordance that clicking this card does something now
    selected?: boolean;    // picked as a pending target (blind swap / black K)
    onClick?: () => void;
    onDoubleClick?: () => void;
}

function CardFace({ card }: { card: CardData }) {
    const symbol = suitSymbols[card.suit];
    const color = suitColors[card.suit];
    return (
        <div className="w-full h-full bg-white border border-gray-300 rounded-xl shadow-md flex flex-col justify-between p-1">
            <div className={`text-[clamp(14px,2.5vw,24px)] text-center leading-none ${color}`}>
                {card.rank} {symbol}
            </div>
            <div className={`text-[clamp(8px,1.5vw,14px)] ${color}`}>{symbol}</div>
            <div className={`text-[clamp(14px,2.5vw,24px)] text-center leading-none rotate-180 ${color}`}>
                {card.rank} {symbol}
            </div>
        </div>
    );
}

function CardBack() {
    return (
        <div className="w-full h-full bg-white border border-gray-300 rounded-xl shadow-md p-1">
            <span className="bg-red-500 w-full h-full rounded-lg block"></span>
        </div>
    );
}

function Card({ card, faceUp = false, stackIndex = 0, selectable, selected, onClick, onDoubleClick }: CardProps) {
    // null = an empty slot where a card was matched away
    if (card === null) {
        return <div className="w-full h-full border-2 border-dashed border-gray-400/60 rounded-xl" />;
    }

    const isKnown = !('hidden' in card);
    const showFace = faceUp && isKnown;

    return (
        <div
            className={`w-full h-full rounded-xl transition-transform ${
                selected ? 'ring-4 ring-amber-400 -translate-y-1' : ''
            } ${selectable ? 'cursor-pointer hover:-translate-y-1 hover:ring-2 hover:ring-blue-400' : ''}`}
            style={stackIndex ? {
                position: 'absolute',
                top: `${stackIndex * 2}px`,
                left: `${stackIndex * 2}px`,
                zIndex: stackIndex,
            } : {}}
            onClick={onClick}
            onDoubleClick={onDoubleClick}
        >
            {showFace ? <CardFace card={card as CardData} /> : <CardBack />}
        </div>
    );
}

export default Card;
