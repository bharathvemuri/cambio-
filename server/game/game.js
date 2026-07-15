const { Deck } = require("./deck");
const { isMoveLegal, applyMove } = require("./rules");

class Game {
    constructor(data) {
        this.mode = data.mode;
        this.players = data.players ?? [];
        this.moveCounter = data.moveCounter ?? 0;
        this.moveHistory = data.moveHistory ?? [];
        this.chatHistory = data.chatHistory ?? [];
        this.roomId = data.roomId;
        this.host = data.host ?? null;

        // data.deck loses its class identity after a Redis JSON round-trip (it becomes
        // a plain object), so Deck methods must be reattached rather than trusted as-is.
        // A brand-new game (no persisted deck yet) still gets a freshly initialized one.
        if (data.deck instanceof Deck) {
            this.deck = data.deck;
        } else if (data.deck) {
            this.deck = Object.assign(new Deck(), {
                drawPile: data.deck.drawPile ?? [],
                discardPile: data.deck.discardPile ?? [],
            });
        } else {
            this.deck = new Deck();
        }

        this.phase = data.phase ?? "LOBBY";
        this.currentPlayerIndex = data.currentPlayerIndex ?? 0;
        this.pendingDraw = data.pendingDraw ?? null;
        this.pendingPower = data.pendingPower ?? null;
        this.cambio = data.cambio ?? null;
        this.discardMatchable = data.discardMatchable ?? false;
    }

    addPlayer(player) {
        if (this.players.length >= 4) {
            throw new Error("Maximum players reached");
        }
        this.players.push({
            ...player,
            hand: player.hand ?? [null, null, null, null],
            hasPeeked: player.hasPeeked ?? false,
        });
    }

    removePlayer(playerId) {
        this.players = this.players.filter(p => p.id !== playerId);
    }

    startGame(mode) {
        this.mode = mode;
        this.deck.shuffle(); // ensure deck is shuffled at start of game

        // Deal by fixed index (not push) so hand slot positions are stable from the
        // start, matching the fixed-grid hand representation the rules engine relies on.
        for (let i = 0; i < 4; i++) {
            for (const player of this.players) {
                player.hand[i] = this.deck.drawCard();
            }
        }

        this.phase = "AWAITING_DRAW";
        this.currentPlayerIndex = 0;
        this.pendingDraw = null;
        this.pendingPower = null;
        this.cambio = null;
        this.discardMatchable = false;
        for (const player of this.players) {
            player.hasPeeked = false;
        }
    }

    // One-shot side-channel, independent of the turn engine: lets a player privately
    // view their own bottom two dealt cards once before play begins.
    peekInitialHand(playerId) {
        const player = this.players.find(p => p.id === playerId);
        if (!player) {
            throw new Error("Player not found");
        }
        if (player.hasPeeked) {
            throw new Error("Already peeked");
        }
        player.hasPeeked = true;
        return [player.hand[2], player.hand[3]];
    }

    validateMove(playerId, move) {
        return isMoveLegal(this, playerId, move);
    }

    makeMove(playerId, move) {
        const result = this.validateMove(playerId, move);
        if (!result.legal) {
            throw new Error(result.reason ?? "Invalid move");
        }
        const outcome = applyMove(this, playerId, move);
        this.moveCounter += 1;
        this.moveHistory.push({ playerId, move, moveNumber: this.moveCounter });
        return outcome;
    }
}

module.exports = { Game };