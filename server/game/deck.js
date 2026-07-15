class Deck {
    constructor() {
        this.discardPile = [];
        this.drawPile = this.initializeDrawPile();
        this.shuffle();
    }

    initializeDrawPile() {
        const drawPile = [];
        const ranks = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
        const suits = ["hearts", "diamonds", "clubs", "spades"];
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
            this.deckOut();
        }
        return this.drawPile.pop();
    }

    discardCard(card) {
        this.discardPile.push(card);
    }

    // Reshuffle the discard pile back into the draw pile when the draw pile is empty,
    // keeping the current top discard card in place since it's still "in play" as the
    // active match target.
    deckOut() {
        if (this.drawPile.length === 0) {
            if (this.discardPile.length <= 1) {
                throw new Error("No cards left to reshuffle");
            }
            const topCard = this.discardPile.pop();
            this.drawPile = this.discardPile;
            this.discardPile = [topCard];
            this.shuffle();
        }
    }
}

module.exports = { Deck };