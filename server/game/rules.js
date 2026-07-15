// Pure rules/turn-engine logic for Cambio. Nothing here touches sockets or Redis --
// functions take plain game/player data in and return legality results or mutate the
// passed-in `game` object in place, consistent with the rest of the codebase's style.

const RED_SUITS = ["hearts", "diamonds"];

function getCardValue(card) {
    if (!card) return 0;
    if (card.rank === "A") return 1;
    if (card.rank === "K") return RED_SUITS.includes(card.suit) ? -1 : 10;
    if (card.rank === "J" || card.rank === "Q") return 10;
    return Number(card.rank);
}

// K's power depends on suit color, not just rank -- red K has no power at all (its only
// effect is the -1 value), so `suit` is a required argument here, not an afterthought.
function getPowerForRank(rank, suit) {
    if (rank === "7" || rank === "8") return "PEEK_OWN";
    if (rank === "9" || rank === "10") return "PEEK_OPPONENT";
    if (rank === "J" || rank === "Q") return "BLIND_SWAP";
    if (rank === "K") return RED_SUITS.includes(suit) ? null : "PEEK_BOTH_AND_SWAP";
    return null;
}

function getHandTotal(hand) {
    return hand.reduce((sum, card) => sum + getCardValue(card), 0);
}

function findFirstEmptySlot(hand) {
    return hand.indexOf(null);
}

function getPlayer(game, playerId) {
    return game.players.find(p => p.id === playerId);
}

function isCurrentPlayer(game, playerId) {
    return game.players[game.currentPlayerIndex]?.id === playerId;
}

function isValidHandIndex(hand, handIndex) {
    return Number.isInteger(handIndex) && handIndex >= 0 && handIndex < hand.length;
}

// ---------------------------------------------------------------------------
// Legality checks
// ---------------------------------------------------------------------------

function _canDraw(game, playerId, move) {
    if (game.phase !== "AWAITING_DRAW") return { legal: false, reason: "Not awaiting a draw" };
    if (!isCurrentPlayer(game, playerId)) return { legal: false, reason: "Not your turn" };
    if (move.source !== "DRAW_PILE" && move.source !== "DISCARD_PILE") {
        return { legal: false, reason: "Invalid draw source" };
    }
    if (move.source === "DISCARD_PILE" && game.deck.discardPile.length === 0) {
        return { legal: false, reason: "Discard pile is empty" };
    }
    return { legal: true };
}

function _canCallCambio(game, playerId) {
    if (game.phase !== "AWAITING_DRAW") return { legal: false, reason: "Not awaiting a draw" };
    if (!isCurrentPlayer(game, playerId)) return { legal: false, reason: "Not your turn" };
    if (game.cambio !== null) return { legal: false, reason: "Cambio already called" };
    return { legal: true };
}

function _canSwapIn(game, playerId, move) {
    if (game.phase !== "AWAITING_DECISION") return { legal: false, reason: "Not awaiting a decision" };
    if (!isCurrentPlayer(game, playerId)) return { legal: false, reason: "Not your turn" };
    if (!game.pendingDraw) return { legal: false, reason: "No pending drawn card" };
    const player = getPlayer(game, playerId);
    if (!isValidHandIndex(player.hand, move.handIndex)) {
        return { legal: false, reason: "Invalid hand index" };
    }
    return { legal: true };
}

function _canDiscardDrawn(game, playerId) {
    if (game.phase !== "AWAITING_DECISION") return { legal: false, reason: "Not awaiting a decision" };
    if (!isCurrentPlayer(game, playerId)) return { legal: false, reason: "Not your turn" };
    if (!game.pendingDraw) return { legal: false, reason: "No pending drawn card" };
    if (game.pendingDraw.source !== "DRAW_PILE") {
        return { legal: false, reason: "Only a fresh draw-pile card can be discarded directly" };
    }
    return { legal: true };
}

function _canResolvePower(game, playerId, move) {
    if (game.phase !== "AWAITING_POWER") return { legal: false, reason: "No power pending" };
    if (!isCurrentPlayer(game, playerId)) return { legal: false, reason: "Not your turn" };
    const pp = game.pendingPower;
    if (!pp) return { legal: false, reason: "No power pending" };
    const player = getPlayer(game, playerId);

    switch (pp.power) {
        case "PEEK_OWN": {
            if (!isValidHandIndex(player.hand, move.handIndex)) {
                return { legal: false, reason: "Invalid hand index" };
            }
            return { legal: true };
        }
        case "PEEK_OPPONENT": {
            const target = getPlayer(game, move.targetPlayerId);
            if (!target || target.id === playerId) return { legal: false, reason: "Invalid target player" };
            if (!isValidHandIndex(target.hand, move.handIndex)) {
                return { legal: false, reason: "Invalid hand index" };
            }
            return { legal: true };
        }
        case "BLIND_SWAP": {
            const playerA = getPlayer(game, move.playerAId);
            const playerB = getPlayer(game, move.playerBId);
            if (!playerA || !playerB) return { legal: false, reason: "Invalid swap target" };
            if (!isValidHandIndex(playerA.hand, move.handIndexA) || !isValidHandIndex(playerB.hand, move.handIndexB)) {
                return { legal: false, reason: "Invalid hand index" };
            }
            if (playerA.id === playerB.id && move.handIndexA === move.handIndexB) {
                return { legal: false, reason: "Must choose two different cards" };
            }
            return { legal: true };
        }
        case "PEEK_BOTH_AND_SWAP": {
            if (pp.stage === "BLACK_K_AWAITING_TARGETS") {
                const target = getPlayer(game, move.targetPlayerId);
                if (!target || target.id === playerId) return { legal: false, reason: "Invalid target player" };
                if (!isValidHandIndex(player.hand, move.ownHandIndex) || !isValidHandIndex(target.hand, move.targetHandIndex)) {
                    return { legal: false, reason: "Invalid hand index" };
                }
                return { legal: true };
            }
            if (pp.stage === "BLACK_K_AWAITING_SWAP_DECISION") {
                if (typeof move.confirmSwap !== "boolean") {
                    return { legal: false, reason: "confirmSwap must be a boolean" };
                }
                return { legal: true };
            }
            return { legal: false, reason: "Unexpected power stage" };
        }
        default:
            return { legal: false, reason: "Unknown power" };
    }
}

function _canSkipPower(game, playerId) {
    if (game.phase !== "AWAITING_POWER") return { legal: false, reason: "No power pending" };
    if (!isCurrentPlayer(game, playerId)) return { legal: false, reason: "Not your turn" };
    if (!game.pendingPower) return { legal: false, reason: "No power pending" };
    return { legal: true };
}

function _canMatchDiscard(game, playerId, move) {
    if (game.phase === "ROUND_OVER") return { legal: false, reason: "Round is over" };
    if (!game.discardMatchable) return { legal: false, reason: "Discard pile is not matchable right now" };
    const player = getPlayer(game, playerId);
    if (!player) return { legal: false, reason: "Player not found" };
    if (!isValidHandIndex(player.hand, move.handIndex)) {
        return { legal: false, reason: "Invalid hand index" };
    }
    if (player.hand[move.handIndex] === null) {
        return { legal: false, reason: "No card in that slot" };
    }
    return { legal: true };
}

function isMoveLegal(game, playerId, move) {
    if (!move || typeof move.type !== "string") {
        return { legal: false, reason: "Move must have a type" };
    }
    switch (move.type) {
        case "DRAW_CARD": return _canDraw(game, playerId, move);
        case "CALL_CAMBIO": return _canCallCambio(game, playerId);
        case "SWAP_IN": return _canSwapIn(game, playerId, move);
        case "DISCARD_DRAWN": return _canDiscardDrawn(game, playerId);
        case "RESOLVE_POWER": return _canResolvePower(game, playerId, move);
        case "SKIP_POWER": return _canSkipPower(game, playerId);
        case "MATCH_DISCARD": return _canMatchDiscard(game, playerId, move);
        default: return { legal: false, reason: `Unknown move type: ${move.type}` };
    }
}

// ---------------------------------------------------------------------------
// Move application
// ---------------------------------------------------------------------------

// Moves the turn pointer to the next player without touching `cambio.remainingTurns` --
// shared by both a normal turn ending and by CALL_CAMBIO moving past the caller (whose
// own move must not itself count as one of the "remaining" final turns).
function _moveToNextPlayer(game) {
    game.currentPlayerIndex = (game.currentPlayerIndex + 1) % game.players.length;
    game.phase = "AWAITING_DRAW";
    game.pendingDraw = null;
    game.pendingPower = null;
}

// Ends a completed turn: if Cambio is active, counts it against the final lap and ends
// the round once every other player has had their one last turn; otherwise just moves
// on. `discardMatchable` is intentionally left untouched here -- the matching window
// survives across the turn boundary until the next DRAW_CARD/CALL_CAMBIO.
function _advanceTurn(game) {
    if (game.cambio !== null) {
        game.cambio.remainingTurns -= 1;
        if (game.cambio.remainingTurns <= 0) {
            game.phase = "ROUND_OVER";
            game.pendingDraw = null;
            game.pendingPower = null;
            return;
        }
    }
    _moveToNextPlayer(game);
}

function applyDrawCard(game, playerId, move) {
    const card = move.source === "DRAW_PILE" ? game.deck.drawCard() : game.deck.discardPile.pop();
    game.pendingDraw = { card, source: move.source };
    game.phase = "AWAITING_DECISION";
    game.discardMatchable = false;
}

function applyCallCambio(game, playerId) {
    game.cambio = { calledBy: playerId, remainingTurns: game.players.length - 1 };
    game.discardMatchable = false;
    _moveToNextPlayer(game); // does not consume one of the "remaining" final turns
}

function applySwapIn(game, playerId, move) {
    const player = getPlayer(game, playerId);
    const oldCard = player.hand[move.handIndex];
    player.hand[move.handIndex] = game.pendingDraw.card;
    // If the slot was already empty (a prior successful match), there's no old card to
    // discard -- the drawn card just fills the gap and nothing new lands on the pile.
    if (oldCard !== null) {
        game.deck.discardCard(oldCard);
        game.discardMatchable = true;
    }
    game.pendingDraw = null;
    _advanceTurn(game);
}

function applyDiscardDrawn(game, playerId) {
    const card = game.pendingDraw.card;
    game.deck.discardCard(card);
    game.discardMatchable = true;
    game.pendingDraw = null;

    const power = getPowerForRank(card.rank, card.suit);
    if (power === null) {
        _advanceTurn(game);
        return;
    }
    game.phase = "AWAITING_POWER";
    game.pendingPower = {
        rank: card.rank,
        suit: card.suit,
        power,
        stage: power === "PEEK_BOTH_AND_SWAP" ? "BLACK_K_AWAITING_TARGETS" : "DEFAULT",
        data: {},
    };
}

function applyResolvePower(game, playerId, move) {
    const player = getPlayer(game, playerId);
    const pp = game.pendingPower;

    switch (pp.power) {
        case "PEEK_OWN": {
            const card = player.hand[move.handIndex];
            game.pendingPower = null;
            _advanceTurn(game);
            return { privateReveal: { type: "PEEK_OWN", handIndex: move.handIndex, card } };
        }
        case "PEEK_OPPONENT": {
            const target = getPlayer(game, move.targetPlayerId);
            const card = target.hand[move.handIndex];
            game.pendingPower = null;
            _advanceTurn(game);
            return {
                privateReveal: {
                    type: "PEEK_OPPONENT",
                    targetPlayerId: move.targetPlayerId,
                    handIndex: move.handIndex,
                    card,
                },
            };
        }
        case "BLIND_SWAP": {
            const playerA = getPlayer(game, move.playerAId);
            const playerB = getPlayer(game, move.playerBId);
            const cardA = playerA.hand[move.handIndexA];
            const cardB = playerB.hand[move.handIndexB];
            playerA.hand[move.handIndexA] = cardB;
            playerB.hand[move.handIndexB] = cardA;
            game.pendingPower = null;
            _advanceTurn(game);
            return undefined;
        }
        case "PEEK_BOTH_AND_SWAP": {
            if (pp.stage === "BLACK_K_AWAITING_TARGETS") {
                const target = getPlayer(game, move.targetPlayerId);
                const ownCard = player.hand[move.ownHandIndex];
                const targetCard = target.hand[move.targetHandIndex];
                pp.data = {
                    ownHandIndex: move.ownHandIndex,
                    targetPlayerId: move.targetPlayerId,
                    targetHandIndex: move.targetHandIndex,
                    ownCard,
                    targetCard,
                };
                pp.stage = "BLACK_K_AWAITING_SWAP_DECISION";
                // Phase stays AWAITING_POWER; the turn doesn't advance until stage 2.
                return { privateReveal: { type: "PEEK_BOTH", ownCard, targetCard } };
            }
            // BLACK_K_AWAITING_SWAP_DECISION
            if (move.confirmSwap) {
                const target = getPlayer(game, pp.data.targetPlayerId);
                const ownCard = player.hand[pp.data.ownHandIndex];
                const targetCard = target.hand[pp.data.targetHandIndex];
                player.hand[pp.data.ownHandIndex] = targetCard;
                target.hand[pp.data.targetHandIndex] = ownCard;
            }
            game.pendingPower = null;
            _advanceTurn(game);
            return undefined;
        }
        default:
            throw new Error("Unknown power");
    }
}

function applySkipPower(game) {
    game.pendingPower = null;
    _advanceTurn(game);
}

function applyMatchDiscard(game, playerId, move) {
    const player = getPlayer(game, playerId);
    const candidate = player.hand[move.handIndex];
    const top = game.deck.discardPile[game.deck.discardPile.length - 1];

    if (candidate.rank === top.rank) {
        player.hand[move.handIndex] = null;
        game.deck.discardCard(candidate);
        game.discardMatchable = true; // chaining stays open
        return { matched: true };
    }

    const penalty = game.deck.drawCard();
    const emptySlot = findFirstEmptySlot(player.hand);
    if (emptySlot === -1) {
        player.hand.push(penalty);
    } else {
        player.hand[emptySlot] = penalty;
    }
    return { matched: false };
    // Deliberately does not touch phase/currentPlayerIndex -- matching never consumes a turn.
}

function applyMove(game, playerId, move) {
    switch (move.type) {
        case "DRAW_CARD": return applyDrawCard(game, playerId, move);
        case "CALL_CAMBIO": return applyCallCambio(game, playerId);
        case "SWAP_IN": return applySwapIn(game, playerId, move);
        case "DISCARD_DRAWN": return applyDiscardDrawn(game, playerId);
        case "RESOLVE_POWER": return applyResolvePower(game, playerId, move);
        case "SKIP_POWER": return applySkipPower(game);
        case "MATCH_DISCARD": return applyMatchDiscard(game, playerId, move);
        default: throw new Error(`Unknown move type: ${move.type}`);
    }
}

module.exports = {
    getCardValue,
    getPowerForRank,
    getHandTotal,
    findFirstEmptySlot,
    isMoveLegal,
    applyMove,
};
