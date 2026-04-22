import { useState } from 'react';

type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';

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
    suit: Suit;
    rank: Rank;
    isFaceUp?: boolean;
    isDeckCard?: number; // index of the card in the deck, used for styling
}

function Card({ suit, rank, isFaceUp, isDeckCard = 0 }: CardProps) {
    const symbol = suitSymbols[suit];
    const color = suitColors[suit];
    const [orientation, setOrientation] = useState(isFaceUp ?? false);

    return (
        <div
            className="w-[clamp(40px,8vw,80px)] aspect-[2/3]"
            style={isDeckCard ? {
                position: "absolute",
                top: `${isDeckCard * 2}px`,
                left: `${isDeckCard * 2}px`,
                zIndex: isDeckCard
            } : {}}
        // onClick={() => setOrientation(!orientation)} DEBUG: Toggle card orientation on click

        >
            {orientation ? (
                <div className="w-full h-full bg-white border border-gray-300 rounded-xl shadow-md flex flex-col justify-between p-1">
                    <div className={`text-[clamp(16px,3vw,28px)] text-center ${color}`}>
                        {rank} {symbol}
                    </div>
                    <div className={`text-[clamp(8px,1.5vw,14px)] ${color}`}>
                        {symbol}
                    </div>
                    <div className={`text-[clamp(16px,3vw,28px)] text-center ${color}`}>
                        {rank} {symbol}
                    </div>
                </div>
            ) : (
                <div className="w-full h-full bg-white border border-black-300 rounded-xl shadow-md p-1">
                    <span className="bg-red-500 w-full h-full rounded-lg block"></span>
                </div>
            )}
        </div>
    );
}

export default Card;
export type { Suit, Rank };