class Deck {
    constructor() {
        this.discardPile = [];
        this.drawPile = this.initializeDrawPile();
        this.shuffle();
    }

    initializeDrawPile() {
        const drawPile = [];
        const ranks = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
        const suits = ["Hearts", "Diamonds", "Clubs", "Spades"];
        for (const suit of suits) {
            for (const rank of ranks) {
                drawPile.push({ rank, suit });
            }
        }
        return drawPile;
    }

    shuffle() {
        for (let i = this.drawPile.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.drawPile[i], this.drawPile[j]] = [this.drawPile[j], this.drawPile[i]];
        }
    }

    drawCard() {
        if (this.drawPile.length === 0) {
            throw new Error("Draw pile is empty");
        }
        return this.drawPile.pop();
    }

    discardCard(card) {
        this.discardPile.push(card);
    }

    // Reverse the discarded cards back into the draw pile when the draw pile is empty
    deckOut() {
        if (this.drawPile.length === 0) {
            this.drawPile = this.discardPile.reverse;
            this.discardPile = [];
        }
    }
}

module.exports = { Deck };