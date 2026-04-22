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
}

function Card({ suit, rank }: CardProps) {
    const symbol = suitSymbols[suit];
    const color = suitColors[suit];
    const [isFaceUp, setIsFaceUp] = useState(true);


    return (
        <div
            onClick={() => setIsFaceUp(!isFaceUp)}
            className="w-[60px] sm:w-[80px] aspect-[2/3]"
        >
            {isFaceUp ? (
                <div className="w-full h-full bg-white border border-gray-300 rounded-xl shadow-md flex flex-col justify-between p-2">

                    <div className={`text-sm leading-none self-start w-fit ${color}`}>
                        {rank} {symbol}
                    </div>

                    <div className={`text-3xl text-center ${color}`}>
                        {symbol}
                    </div>

                    <div className={`text-sm leading-none self-end rotate-180 ${color}`}>
                        {rank} {symbol}
                    </div>

                </div>
            ) : (
                <div className="w-full h-full bg-gray-300 border border-gray-400 rounded-xl shadow-md flex items-center justify-center">
                    <span className="bg-red-500 w-full h-full m-1 rounded-xl"></span>
                </div>
            )}
        </div>
    )
}

export default Card;