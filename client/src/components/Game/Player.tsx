import Card from "./Card";


interface PlayerProps {
    name: string;
    cards: { suit: 'hearts' | 'diamonds' | 'clubs' | 'spades'; rank: '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A'; }[];
    order: number;
}


function Player({ name, cards, order }: PlayerProps) {
    return (
        <div className={`flex flex-col-reverse w-full max-w-sm sm:max-w-md mx-auto p-2 sm:p-4 transform rotate-[${order * 90}deg]`}>
            <h2 className="text-sm sm:text-base font-semibold mt-2">{name}</h2>

            <div className="grid grid-cols-[auto_auto] justify-center gap-x-1 gap-y-1 mt-2">
                {cards.map((card, index) => (
                    <div className="w-[60px] sm:w-[80px] aspect-[2/3]" key={index}>
                        <Card key={index} suit={card.suit} rank={card.rank} />
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Player;