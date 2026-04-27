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

    kickPlayer(playerId) {
        this.players = this.players.filter(p => p.id !== playerId);
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