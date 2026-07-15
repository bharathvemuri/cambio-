// Produces a per-recipient view of a Game's state with private information redacted.
// Broadcasting the raw Game object would leak every player's hand, the undrawn cards in
// the deck, and any pending peek/power data to every client -- this is the single place
// that must be kept in sync whenever a new field is added to Game that could carry
// hidden information (a denylist approach, so a forgotten new field defaults to leaked --
// flagged as a hardening follow-up: switch to an allowlist once the shape stabilizes).
function toPublicGameState(game, forPlayerId) {
    const isCurrentPlayer = game.players[game.currentPlayerIndex]?.id === forPlayerId;

    return {
        mode: game.mode,
        roomId: game.roomId,
        host: game.host,
        phase: game.phase,
        currentPlayerIndex: game.currentPlayerIndex,
        cambio: game.cambio,
        discardMatchable: game.discardMatchable,
        moveCounter: game.moveCounter,

        players: game.players.map(player => ({
            id: player.id,
            nickname: player.nickname,
            isHost: player.isHost,
            hasPeeked: player.hasPeeked,
            hand: player.hand.map(card => {
                if (card === null) return null;
                return player.id === forPlayerId ? card : { hidden: true };
            }),
        })),

        deck: {
            drawCount: game.deck.drawPile.length,
            discardPile: game.deck.discardPile,
        },

        // Only the acting player gets to see the identity of their own pending draw --
        // everyone else just learns that a draw happened and from which pile.
        pendingDraw: game.pendingDraw
            ? (isCurrentPlayer
                ? game.pendingDraw
                : { source: game.pendingDraw.source, hidden: true })
            : null,

        // pendingPower.data can hold revealed card identities (e.g. black-K peek stage);
        // never expose it to anyone but the acting player.
        pendingPower: game.pendingPower
            ? {
                rank: game.pendingPower.rank,
                suit: game.pendingPower.suit,
                power: game.pendingPower.power,
                stage: game.pendingPower.stage,
                data: isCurrentPlayer ? game.pendingPower.data : undefined,
            }
            : null,
    };
}

module.exports = { toPublicGameState };
