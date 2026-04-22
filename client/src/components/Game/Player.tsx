import Card from "./Card";


interface PlayerProps {
    name: string;
    cards: { suit: 'hearts' | 'diamonds' | 'clubs' | 'spades'; rank: '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A'; }[];
    order: number;
}

const rotationClasses = [
    'rotate-0',
    'rotate-90',
    'rotate-180',
    'rotate-270',
];


function Player({ name, cards, order }: PlayerProps) {
    return (
        <div className={`flex flex-col-reverse w-full gap-2 max-w-sm sm:max-w-md mx-auto p-2 sm:p-4 transform ${rotationClasses[order]}`}>

            <h2 className="text-sm sm:text-base font-semibold mt-2">{name}</h2>

            <div className="grid grid-cols-[auto_auto] justify-center gap-x-1 gap-y-1 mt-1">
                {cards.map((card, index) => (
                    <div className="w-[clamp(40px,8vw,80px)] aspect-[2/3]" key={index}>
                        <Card key={index} suit={card.suit} rank={card.rank} />
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Player;