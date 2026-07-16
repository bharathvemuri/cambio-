// Client-side mirror of the per-player redacted game state produced by
// server/game/serialize.js. Other players' cards arrive as { hidden: true },
// matched-away slots as null, and the draw pile as just a count.

export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';

export interface CardData {
    suit: Suit;
    rank: Rank;
}

export type PublicCard = CardData | { hidden: true } | null;

export function isKnownCard(card: PublicCard | undefined): card is CardData {
    return card != null && !('hidden' in card);
}

export type DrawSource = 'DRAW_PILE' | 'DISCARD_PILE';

export type Phase = 'LOBBY' | 'AWAITING_DRAW' | 'AWAITING_DECISION' | 'AWAITING_POWER' | 'ROUND_OVER';

export type PowerKind = 'PEEK_OWN' | 'PEEK_OPPONENT' | 'BLIND_SWAP' | 'PEEK_BOTH_AND_SWAP';

export interface PublicPlayer {
    id: string;
    nickname: string;
    isHost?: boolean;
    hasPeeked: boolean;
    hand: PublicCard[];
}

// pendingPower.data is only present in the acting player's own view.
export interface BlackKingData {
    ownHandIndex: number;
    targetPlayerId: string;
    targetHandIndex: number;
    ownCard: CardData;
    targetCard: CardData;
}

export interface PublicGameState {
    mode: string;
    roomId: string;
    host: string | null;
    phase: Phase;
    currentPlayerIndex: number;
    cambio: { calledBy: string; remainingTurns: number } | null;
    discardMatchable: boolean;
    moveCounter: number;
    players: PublicPlayer[];
    deck: { drawCount: number; discardPile: CardData[] };
    pendingDraw:
        | { card: CardData; source: DrawSource }
        | { hidden: true; source: DrawSource }
        | null;
    pendingPower: {
        rank: Rank;
        suit: Suit;
        power: PowerKind;
        stage: string;
        data?: BlackKingData;
    } | null;
}

// Peek results delivered privately via ack callbacks, never broadcast.
export type RevealPayload =
    | { type: 'PEEK_OWN'; handIndex: number; card: CardData }
    | { type: 'PEEK_OPPONENT'; targetPlayerId: string; handIndex: number; card: CardData }
    | { type: 'PEEK_BOTH'; ownCard: CardData; targetCard: CardData };

export interface AckResponse {
    error?: string;
    gameState?: PublicGameState;
    reveal?: RevealPayload | null;
    cards?: CardData[];
}
