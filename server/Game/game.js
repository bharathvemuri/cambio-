const { Deck } = require("./deck");

class Game {
    constructor(data) {
        this.mode = data.mode;
        this.players = data.players ?? [];
        this.moveCounter = data.moveCounter ?? 0;
        this.moveHistory = data.moveHistory ?? [];
        this.chatHistory = data.chatHistory ?? [];
        this.roomId = data.roomId;
        this.host = data.host ?? null;
        this.deck = data.deck ?? new Deck();
    }

    addPlayer(player) {
        if (this.players.length >= 4) {
            throw new Error("Maximum players reached");
        }
        this.players.push(player);
    }

    removePlayer(playerId) {
        this.players = this.players.filter(p => p.id !== playerId);
    }

    startGame(mode) {
        this.mode = mode;
        this.deck.shuffle(); // ensure deck is shuffled at start of game

        // Deal 4 cards to each player  
        let count = 0;
        while (count < 4) {
            for (const player of this.players) {
                player.hand.push(this.deck.drawCard());
            }
            count++;
        }
    }

    validateMove(move) {
        // TODO: Implement move validation logic
    }

    makeMove(playerId, move) {
        if (!this.validateMove(move)) {
            throw new Error("Invalid move");
        }
    }


}

module.exports = { Game };