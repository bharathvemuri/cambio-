import { useEffect, useRef, useState } from 'react';

import Deck from './Deck';
import Player from './Player';
import { useSocket } from '../../providers/SocketProvider';
import type {
    AckResponse,
    CardData,
    DrawSource,
    PublicGameState,
    PublicPlayer,
} from '../../types/game';

interface Reveal {
    playerId: string;
    handIndex: number;
    card: CardData;
}

interface PickedCard {
    playerId: string;
    handIndex: number;
}

function Game({ state }: { state: PublicGameState }) {
    const socket = useSocket();
    const myId = socket?.id ?? '';
    const roomId = state.roomId;

    const players = state.players;
    const me = players.find(p => p.id === myId);
    const currentPlayer = players[state.currentPlayerIndex];
    const isMyTurn = currentPlayer?.id === myId;
    const pendingPower = state.pendingPower;

    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);
    const [reveals, setReveals] = useState<Reveal[]>([]);
    // Partial target selections for the two-pick powers (blind swap / black K stage 1)
    const [blindPick, setBlindPick] = useState<PickedCard | null>(null);
    const [blackKPick, setBlackKPick] = useState<{ own?: number; target?: PickedCard }>({});

    const errorTimer = useRef<number | null>(null);
    const noticeTimer = useRef<number | null>(null);
    const revealTimer = useRef<number | null>(null);

    // Any accepted move invalidates in-progress target picks (e.g. someone matched
    // mid-selection and hand indices shifted meaning).
    useEffect(() => {
        setBlindPick(null);
        setBlackKPick({});
    }, [state.moveCounter, state.phase]);

    const flashError = (message: string) => {
        setError(message);
        if (errorTimer.current) window.clearTimeout(errorTimer.current);
        errorTimer.current = window.setTimeout(() => setError(null), 3500);
    };

    const flashNotice = (message: string) => {
        setNotice(message);
        if (noticeTimer.current) window.clearTimeout(noticeTimer.current);
        noticeTimer.current = window.setTimeout(() => setNotice(null), 3500);
    };

    const showReveals = (items: Reveal[], ms = 4000) => {
        setReveals(items);
        if (revealTimer.current) window.clearTimeout(revealTimer.current);
        revealTimer.current = window.setTimeout(() => setReveals([]), ms);
    };

    const emit = (event: string, payload: object, onOk?: (response: AckResponse) => void) => {
        socket?.emit(event, { roomId, ...payload }, (response: AckResponse) => {
            if (response?.error) {
                flashError(response.error);
                return;
            }
            onOk?.(response);
        });
    };

    // ------------------------------------------------------------------
    // Actions
    // ------------------------------------------------------------------

    const peekInitialHand = () => {
        emit('peekInitialHand', {}, (response) => {
            const cards = response.cards ?? [];
            showReveals(
                cards.map((card, i) => ({ playerId: myId, handIndex: 2 + i, card })),
                5000,
            );
        });
    };

    const draw = (source: DrawSource) => emit('drawCard', { source });

    const discardDrawn = () => emit('makeDecision', { decision: { type: 'DISCARD_DRAWN' } });

    const callCambio = () => emit('callCambio', {});

    const skipPower = () => emit('resolvePower', { power: { type: 'SKIP_POWER' } });

    const confirmBlackKingSwap = (confirmSwap: boolean) =>
        emit('resolvePower', { power: { type: 'RESOLVE_POWER', confirmSwap } });

    const handleCardClick = (playerId: string, handIndex: number) => {
        if (!isMyTurn) return;
        const isMine = playerId === myId;

        if (state.phase === 'AWAITING_DECISION' && isMine) {
            emit('makeDecision', { decision: { type: 'SWAP_IN', handIndex } });
            return;
        }

        if (state.phase !== 'AWAITING_POWER' || !pendingPower) return;

        switch (pendingPower.power) {
            case 'PEEK_OWN':
                if (isMine) {
                    emit('resolvePower', { power: { type: 'RESOLVE_POWER', handIndex } }, (response) => {
                        if (response.reveal?.type === 'PEEK_OWN') {
                            showReveals([{ playerId: myId, handIndex, card: response.reveal.card }]);
                        }
                    });
                }
                break;

            case 'PEEK_OPPONENT':
                if (!isMine) {
                    emit('resolvePower', { power: { type: 'RESOLVE_POWER', targetPlayerId: playerId, handIndex } }, (response) => {
                        if (response.reveal?.type === 'PEEK_OPPONENT') {
                            showReveals([{ playerId, handIndex, card: response.reveal.card }]);
                        }
                    });
                }
                break;

            case 'BLIND_SWAP':
                if (!blindPick) {
                    setBlindPick({ playerId, handIndex });
                } else if (blindPick.playerId !== playerId || blindPick.handIndex !== handIndex) {
                    emit('resolvePower', {
                        power: {
                            type: 'RESOLVE_POWER',
                            playerAId: blindPick.playerId,
                            handIndexA: blindPick.handIndex,
                            playerBId: playerId,
                            handIndexB: handIndex,
                        },
                    });
                    setBlindPick(null);
                }
                break;

            case 'PEEK_BOTH_AND_SWAP': {
                if (pendingPower.stage !== 'BLACK_K_AWAITING_TARGETS') break;
                const next = {
                    ...blackKPick,
                    ...(isMine ? { own: handIndex } : { target: { playerId, handIndex } }),
                };
                setBlackKPick(next);
                if (next.own !== undefined && next.target) {
                    emit('resolvePower', {
                        power: {
                            type: 'RESOLVE_POWER',
                            ownHandIndex: next.own,
                            targetPlayerId: next.target.playerId,
                            targetHandIndex: next.target.handIndex,
                        },
                    });
                    setBlackKPick({});
                }
                break;
            }
        }
    };

    // Double-click your own card to slap it onto a matchable discard pile.
    const handleCardDoubleClick = (playerId: string, handIndex: number) => {
        if (playerId !== myId || !state.discardMatchable || state.phase === 'ROUND_OVER') return;
        emit('matchDiscard', { handIndex }, (response) => {
            const myHandAfter = response.gameState?.players.find(p => p.id === myId)?.hand;
            if (myHandAfter?.[handIndex] === null) {
                flashNotice('Match!');
            } else {
                flashNotice('Wrong match — penalty card added');
            }
        });
    };

    // ------------------------------------------------------------------
    // Per-player render helpers
    // ------------------------------------------------------------------

    const canSelectCardsOf = (playerId: string): boolean => {
        if (!isMyTurn) return false;
        const isMine = playerId === myId;
        if (state.phase === 'AWAITING_DECISION') return isMine;
        if (state.phase === 'AWAITING_POWER' && pendingPower) {
            switch (pendingPower.power) {
                case 'PEEK_OWN': return isMine;
                case 'PEEK_OPPONENT': return !isMine;
                case 'BLIND_SWAP': return true;
                case 'PEEK_BOTH_AND_SWAP':
                    return pendingPower.stage === 'BLACK_K_AWAITING_TARGETS';
            }
        }
        return false;
    };

    const selectedIndicesOf = (playerId: string): number[] => {
        const picks: number[] = [];
        if (blindPick?.playerId === playerId) picks.push(blindPick.handIndex);
        if (playerId === myId && blackKPick.own !== undefined) picks.push(blackKPick.own);
        if (blackKPick.target?.playerId === playerId) picks.push(blackKPick.target.handIndex);
        return picks;
    };

    const revealsOf = (playerId: string): Record<number, CardData> => {
        const map: Record<number, CardData> = {};
        for (const r of reveals) {
            if (r.playerId === playerId) map[r.handIndex] = r.card;
        }
        return map;
    };

    const renderPlayer = (player: PublicPlayer) => (
        <Player
            player={player}
            isMe={player.id === myId}
            isCurrentTurn={player.id === currentPlayer?.id && state.phase !== 'ROUND_OVER'}
            isCambioCaller={state.cambio?.calledBy === player.id}
            reveals={revealsOf(player.id)}
            selectedIndices={selectedIndicesOf(player.id)}
            selectable={canSelectCardsOf(player.id)}
            onCardClick={(handIndex) => handleCardClick(player.id, handIndex)}
            onCardDoubleClick={(handIndex) => handleCardDoubleClick(player.id, handIndex)}
        />
    );

    // Rotate the seat order so this client always sees themselves at the bottom.
    const myIndex = players.findIndex(p => p.id === myId);
    const seats = myIndex > 0 ? [...players.slice(myIndex), ...players.slice(0, myIndex)] : players;

    // ------------------------------------------------------------------
    // Status text
    // ------------------------------------------------------------------

    const instruction = (): string => {
        if (state.phase === 'ROUND_OVER') return 'Round over!';
        if (!isMyTurn) {
            const who = currentPlayer?.nickname ?? 'someone';
            if (state.phase === 'AWAITING_POWER' && pendingPower) {
                return `${who} is using a ${pendingPower.rank} power…`;
            }
            return `Waiting for ${who}…`;
        }
        switch (state.phase) {
            case 'AWAITING_DRAW':
                return state.cambio
                    ? 'Final lap — draw a card'
                    : 'Your turn — draw from a pile, or call Cambio';
            case 'AWAITING_DECISION':
                return state.pendingDraw?.source === 'DRAW_PILE'
                    ? 'Click one of your cards to swap it in, or discard the draw'
                    : 'Click one of your cards to swap it in';
            case 'AWAITING_POWER':
                if (!pendingPower) return '';
                switch (pendingPower.power) {
                    case 'PEEK_OWN': return 'Power: click one of YOUR cards to peek at it';
                    case 'PEEK_OPPONENT': return "Power: click an OPPONENT's card to peek at it";
                    case 'BLIND_SWAP':
                        return blindPick
                            ? 'Power: click a second card to blind-swap with'
                            : 'Power: click any two cards to blind-swap them';
                    case 'PEEK_BOTH_AND_SWAP':
                        if (pendingPower.stage === 'BLACK_K_AWAITING_TARGETS') {
                            return "Power: click one of YOUR cards and one OPPONENT's card to peek at both";
                        }
                        return 'Decide whether to swap the two cards you peeked at';
                }
                break;
            default:
                return '';
        }
        return '';
    };

    // Black K stage-2 data comes from this client's own filtered pendingPower.data
    // (the server strips it for everyone else).
    const blackKingDecision =
        isMyTurn &&
        pendingPower?.power === 'PEEK_BOTH_AND_SWAP' &&
        pendingPower.stage === 'BLACK_K_AWAITING_SWAP_DECISION'
            ? pendingPower.data
            : undefined;

    const cambioCallerName = state.cambio
        ? players.find(p => p.id === state.cambio?.calledBy)?.nickname ?? 'Someone'
        : null;

    return (
        <div className="fixed inset-0 grid grid-cols-3 grid-rows-3 items-center justify-items-center overflow-hidden bg-emerald-900/10">

            {/* Status banners */}
            <div className="fixed top-2 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-1 pointer-events-none">
                {error && <div className="bg-red-600 text-white text-sm px-4 py-1.5 rounded shadow">{error}</div>}
                {notice && <div className="bg-emerald-600 text-white text-sm px-4 py-1.5 rounded shadow">{notice}</div>}
                {state.cambio && state.phase !== 'ROUND_OVER' && (
                    <div className="bg-amber-500 text-white text-sm px-4 py-1.5 rounded shadow font-semibold">
                        {cambioCallerName} called CAMBIO — {state.cambio.remainingTurns} final turn{state.cambio.remainingTurns === 1 ? '' : 's'} left!
                    </div>
                )}
                <div className="bg-gray-800/90 text-white text-sm px-4 py-1.5 rounded shadow">{instruction()}</div>
            </div>

            {/* Opponent opposite me (2 or 4 players) */}
            {(seats.length === 2 || seats.length === 4) && (
                <div className="col-start-2 row-start-1">
                    {renderPlayer(seats.length === 4 ? seats[2] : seats[1])}
                </div>
            )}

            {/* Opponents to my left and right (3 or 4 players) */}
            {(seats.length === 3 || seats.length === 4) && (
                <>
                    <div className="col-start-1 row-start-2">
                        {renderPlayer(seats[1])}
                    </div>
                    <div className="col-start-3 row-start-2">
                        {renderPlayer(seats.length === 4 ? seats[3] : seats[2])}
                    </div>
                </>
            )}

            {/* Deck in the center */}
            <div className="col-start-2 row-start-2">
                <Deck
                    deck={state.deck}
                    pendingDraw={state.pendingDraw}
                    matchable={state.discardMatchable}
                    canDraw={isMyTurn && state.phase === 'AWAITING_DRAW'}
                    canDiscardDrawn={isMyTurn && state.phase === 'AWAITING_DECISION' && state.pendingDraw?.source === 'DRAW_PILE'}
                    onDraw={draw}
                    onDiscardDrawn={discardDrawn}
                />
            </div>

            {/* Me, always at the bottom */}
            <div className="col-start-2 row-start-3">
                {seats[0] && renderPlayer(seats[0])}
            </div>

            {/* Action buttons */}
            <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2">
                {me && !me.hasPeeked && state.phase !== 'ROUND_OVER' && (
                    <button
                        className="px-4 py-2 bg-indigo-500 text-white rounded shadow hover:bg-indigo-600"
                        onClick={peekInitialHand}
                    >
                        Peek at your bottom two cards
                    </button>
                )}
                {isMyTurn && state.phase === 'AWAITING_DRAW' && !state.cambio && (
                    <button
                        className="px-4 py-2 bg-amber-500 text-white font-semibold rounded shadow hover:bg-amber-600"
                        onClick={callCambio}
                    >
                        Call Cambio!
                    </button>
                )}
                {isMyTurn && state.phase === 'AWAITING_POWER' && !blackKingDecision && (
                    <button
                        className="px-4 py-2 bg-gray-500 text-white rounded shadow hover:bg-gray-600"
                        onClick={skipPower}
                    >
                        Skip power
                    </button>
                )}
            </div>

            {/* Hint: matching is always available on a matchable pile */}
            {state.discardMatchable && state.phase !== 'ROUND_OVER' && (
                <div className="fixed bottom-4 left-4 z-40 text-xs text-gray-600 bg-white/80 px-3 py-1.5 rounded shadow">
                    Double-click one of your cards to match the discard pile
                </div>
            )}

            {/* Black King stage 2: swap decision dialog */}
            {blackKingDecision && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-lg shadow-xl p-6 flex flex-col items-center gap-4">
                        <h2 className="font-semibold text-gray-800">Swap these two cards?</h2>
                        <div className="flex gap-6">
                            <div className="flex flex-col items-center gap-1">
                                <div className="w-16 aspect-[2/3]">
                                    <CardPreview card={blackKingDecision.ownCard} />
                                </div>
                                <span className="text-xs text-gray-500">yours</span>
                            </div>
                            <div className="flex flex-col items-center gap-1">
                                <div className="w-16 aspect-[2/3]">
                                    <CardPreview card={blackKingDecision.targetCard} />
                                </div>
                                <span className="text-xs text-gray-500">theirs</span>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button
                                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                                onClick={() => confirmBlackKingSwap(true)}
                            >
                                Swap them
                            </button>
                            <button
                                className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
                                onClick={() => confirmBlackKingSwap(false)}
                            >
                                Keep as is
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Round over overlay (scoring/results arrive with issue #7) */}
            {state.phase === 'ROUND_OVER' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
                    <div className="bg-white rounded-lg shadow-xl p-8 text-center">
                        <h1 className="text-2xl font-bold text-gray-800 mb-2">Round over!</h1>
                        <p className="text-gray-600">Scoring and results are coming soon.</p>
                    </div>
                </div>
            )}
        </div>
    );
}

// Minimal face-up card for the black K dialog (avoids threading Card's selection props).
function CardPreview({ card }: { card: CardData }) {
    const red = card.suit === 'hearts' || card.suit === 'diamonds';
    const symbol = { hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠' }[card.suit];
    return (
        <div className={`w-full h-full bg-white border border-gray-300 rounded-xl shadow-md flex items-center justify-center text-lg font-semibold ${red ? 'text-red-500' : 'text-black'}`}>
            {card.rank}{symbol}
        </div>
    );
}

export default Game;
