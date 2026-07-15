// Manual, in-process verification of the turn/rules engine. Not wired to `npm test`
// (no test framework is installed in this project) -- run directly with:
//   node server/scratch/manual-test-round.js
//
// No live server/Redis needed: `roundTrip()` below simulates exactly what
// storeGameState/retrieveGameState do (JSON.stringify then `new Game(JSON.parse(...))`),
// which is the scenario that actually exposed the Deck-losing-its-class-identity bug.

const assert = require("assert");
const { Game } = require("../game/game");
const { Deck } = require("../game/deck");
const { getCardValue } = require("../game/rules");
const { toPublicGameState } = require("../game/serialize");

function roundTrip(game) {
    return new Game(JSON.parse(JSON.stringify(game)));
}

function player(game, id) {
    return game.players.find(p => p.id === id);
}

function clone(x) {
    return JSON.parse(JSON.stringify(x));
}

// Pushes cards onto the draw pile so they come out in the given order (drawCard pops
// from the end).
function queueDraws(game, cards) {
    for (const c of [...cards].reverse()) game.deck.drawPile.push(c);
}

let step = 0;
function section(name) {
    step += 1;
    console.log(`\n[${step}] ${name}`);
}

// ---------------------------------------------------------------------------
section("Setup: create room, add 3 players, deal, round-trip through fake Redis");

let game = new Game({ roomId: "test-room" });
game.addPlayer({ id: "p1", nickname: "Alice", isHost: true });
game.addPlayer({ id: "p2", nickname: "Bob" });
game.addPlayer({ id: "p3", nickname: "Carol" });
game = roundTrip(game);
assert.strictEqual(game.players.length, 3);

game.startGame("players");
game = roundTrip(game);
assert.strictEqual(game.phase, "AWAITING_DRAW");
assert.strictEqual(game.currentPlayerIndex, 0);
for (const p of game.players) assert.strictEqual(p.hand.length, 4);
console.log("  OK: dealt, phase/currentPlayerIndex correct, deck survived round-trip");

// ---------------------------------------------------------------------------
section("Initial peek: one-shot, private, independent of turn order");

for (const p of game.players) {
    const cards = game.peekInitialHand(p.id);
    assert.deepStrictEqual(cards, [player(game, p.id).hand[2], player(game, p.id).hand[3]]);
    game = roundTrip(game);
    assert.strictEqual(player(game, p.id).hasPeeked, true);
}
assert.throws(() => game.peekInitialHand("p1"), /Already peeked/);
console.log("  OK: peek returns correct cards, hasPeeked persists, re-peek rejected");

// ---------------------------------------------------------------------------
section("Turn 1 (p1): draw plain card, discard directly -- no power, turn advances");

queueDraws(game, [{ rank: "3", suit: "clubs" }]);
game.makeMove("p1", { type: "DRAW_CARD", source: "DRAW_PILE" });
assert.strictEqual(game.phase, "AWAITING_DECISION");
assert.deepStrictEqual(game.pendingDraw.card, { rank: "3", suit: "clubs" });
game = roundTrip(game);

game.makeMove("p1", { type: "DISCARD_DRAWN" });
assert.strictEqual(game.phase, "AWAITING_DRAW");
assert.strictEqual(game.currentPlayerIndex, 1);
assert.strictEqual(game.discardMatchable, true);
assert.deepStrictEqual(game.deck.discardPile.at(-1), { rank: "3", suit: "clubs" });
game = roundTrip(game);
console.log("  OK: plain discard advances turn, no AWAITING_POWER, discard pile top correct");

// ---------------------------------------------------------------------------
section("Discard-matching: success, chain, and wrong-guess penalty (any player, any time)");

player(game, "p3").hand[0] = { rank: "3", suit: "diamonds" };
game.makeMove("p3", { type: "MATCH_DISCARD", handIndex: 0 });
assert.strictEqual(player(game, "p3").hand[0], null);
assert.deepStrictEqual(game.deck.discardPile.at(-1), { rank: "3", suit: "diamonds" });
assert.strictEqual(game.discardMatchable, true);
assert.strictEqual(game.currentPlayerIndex, 1); // matching never consumes a turn
game = roundTrip(game);
console.log("  OK: successful match empties slot, re-tops discard, window stays open");

player(game, "p2").hand[1] = { rank: "3", suit: "hearts" };
game.makeMove("p2", { type: "MATCH_DISCARD", handIndex: 1 });
assert.strictEqual(player(game, "p2").hand[1], null);
game = roundTrip(game);
console.log("  OK: chained match on the new top works");

{
    const p3 = player(game, "p3");
    const wrongSlot = p3.hand.findIndex(c => c !== null);
    p3.hand[wrongSlot] = { rank: "K", suit: "clubs" }; // guaranteed mismatch vs top rank "3"
    const handLenBefore = p3.hand.length;
    queueDraws(game, [{ rank: "9", suit: "hearts" }]); // becomes the penalty draw
    game.makeMove("p3", { type: "MATCH_DISCARD", handIndex: wrongSlot });
    assert.strictEqual(player(game, "p3").hand[wrongSlot].rank, "K"); // untouched
    const penaltyPlaced = player(game, "p3").hand.some(c => c && c.rank === "9" && c.suit === "hearts");
    assert.ok(penaltyPlaced, "penalty card should land in hand");
    console.log(`  OK: wrong guess drew a penalty card (hand length ${handLenBefore} -> ${player(game, "p3").hand.length})`);
    game = roundTrip(game);
}

// ---------------------------------------------------------------------------
section("Turn 2 (p2): draw+discard a 7 -> PEEK_OWN power");

queueDraws(game, [{ rank: "7", suit: "spades" }]);
game.makeMove("p2", { type: "DRAW_CARD", source: "DRAW_PILE" });
game.makeMove("p2", { type: "DISCARD_DRAWN" });
assert.strictEqual(game.phase, "AWAITING_POWER");
assert.strictEqual(game.pendingPower.power, "PEEK_OWN");
game = roundTrip(game);

const peekTargetIdx = player(game, "p2").hand.findIndex(c => c !== null);
const outcome1 = game.makeMove("p2", { type: "RESOLVE_POWER", handIndex: peekTargetIdx });
assert.deepStrictEqual(outcome1.privateReveal.card, player(game, "p2").hand[peekTargetIdx]);
assert.strictEqual(game.phase, "AWAITING_DRAW");
assert.strictEqual(game.currentPlayerIndex, 2);
game = roundTrip(game);
console.log("  OK: PEEK_OWN reveals the correct card and advances the turn");

// ---------------------------------------------------------------------------
section("Turn 3 (p3): draw+discard a 9 -> PEEK_OPPONENT power (target p1)");

queueDraws(game, [{ rank: "9", suit: "diamonds" }]);
game.makeMove("p3", { type: "DRAW_CARD", source: "DRAW_PILE" });
game.makeMove("p3", { type: "DISCARD_DRAWN" });
assert.strictEqual(game.pendingPower.power, "PEEK_OPPONENT");
game = roundTrip(game);

const targetIdx = player(game, "p1").hand.findIndex(c => c !== null);
const outcome2 = game.makeMove("p3", { type: "RESOLVE_POWER", targetPlayerId: "p1", handIndex: targetIdx });
assert.deepStrictEqual(outcome2.privateReveal.card, player(game, "p1").hand[targetIdx]);
assert.strictEqual(game.currentPlayerIndex, 0);
game = roundTrip(game);
console.log("  OK: PEEK_OPPONENT reveals target's card privately and advances the turn");

// ---------------------------------------------------------------------------
section("Turn 4 (p1): draw+discard a J -> BLIND_SWAP power (p2 <-> p3, no reveal)");

queueDraws(game, [{ rank: "J", suit: "hearts" }]);
game.makeMove("p1", { type: "DRAW_CARD", source: "DRAW_PILE" });
game.makeMove("p1", { type: "DISCARD_DRAWN" });
assert.strictEqual(game.pendingPower.power, "BLIND_SWAP");
game = roundTrip(game);

const beforeA = clone(player(game, "p2").hand[2]);
const beforeB = clone(player(game, "p3").hand[2]);
const outcome3 = game.makeMove("p1", {
    type: "RESOLVE_POWER", playerAId: "p2", handIndexA: 2, playerBId: "p3", handIndexB: 2,
});
assert.strictEqual(outcome3, undefined, "blind swap must not reveal anything");
assert.deepStrictEqual(player(game, "p2").hand[2], beforeB);
assert.deepStrictEqual(player(game, "p3").hand[2], beforeA);
assert.strictEqual(game.currentPlayerIndex, 1);
game = roundTrip(game);
console.log("  OK: BLIND_SWAP swapped the two cards with no reveal to anyone");

// ---------------------------------------------------------------------------
section("Turn 5 (p2): draw+discard black K -> two-stage peek-both-then-swap");

queueDraws(game, [{ rank: "K", suit: "clubs" }]);
game.makeMove("p2", { type: "DRAW_CARD", source: "DRAW_PILE" });
game.makeMove("p2", { type: "DISCARD_DRAWN" });
assert.strictEqual(game.pendingPower.power, "PEEK_BOTH_AND_SWAP");
assert.strictEqual(game.pendingPower.stage, "BLACK_K_AWAITING_TARGETS");
game = roundTrip(game);

const ownBefore = clone(player(game, "p2").hand[3]);
const theirBefore = clone(player(game, "p3").hand[3]);
const stage1 = game.makeMove("p2", {
    type: "RESOLVE_POWER", ownHandIndex: 3, targetPlayerId: "p3", targetHandIndex: 3,
});
assert.deepStrictEqual(stage1.privateReveal, { type: "PEEK_BOTH", ownCard: ownBefore, targetCard: theirBefore });
assert.strictEqual(game.phase, "AWAITING_POWER"); // turn hasn't advanced yet
assert.strictEqual(game.pendingPower.stage, "BLACK_K_AWAITING_SWAP_DECISION");
game = roundTrip(game);

game.makeMove("p2", { type: "RESOLVE_POWER", confirmSwap: true });
assert.deepStrictEqual(player(game, "p2").hand[3], theirBefore);
assert.deepStrictEqual(player(game, "p3").hand[3], ownBefore);
assert.strictEqual(game.currentPlayerIndex, 2);
game = roundTrip(game);
console.log("  OK: black K stage 1 reveals both privately, stage 2 confirms the swap");

// ---------------------------------------------------------------------------
section("Turn 6 (p3): draw+discard black K -> SKIP_POWER before peeking (no changes)");

queueDraws(game, [{ rank: "K", suit: "spades" }]);
game.makeMove("p3", { type: "DRAW_CARD", source: "DRAW_PILE" });
game.makeMove("p3", { type: "DISCARD_DRAWN" });
assert.strictEqual(game.pendingPower.stage, "BLACK_K_AWAITING_TARGETS");
const handsBeforeSkip = clone(game.players.map(p => p.hand));
game = roundTrip(game);

game.makeMove("p3", { type: "SKIP_POWER" });
assert.strictEqual(game.phase, "AWAITING_DRAW");
assert.strictEqual(game.currentPlayerIndex, 0);
assert.deepStrictEqual(game.players.map(p => p.hand), handsBeforeSkip);
game = roundTrip(game);
console.log("  OK: SKIP_POWER clears the power and advances the turn with no hand changes");

// ---------------------------------------------------------------------------
section("Turn 7 (p1): red K has -1 value and grants no power at all");

assert.strictEqual(getCardValue({ rank: "K", suit: "hearts" }), -1);
assert.strictEqual(getCardValue({ rank: "K", suit: "diamonds" }), -1);
assert.strictEqual(getCardValue({ rank: "K", suit: "clubs" }), 10);
assert.strictEqual(getCardValue({ rank: "Q", suit: "hearts" }), 10);
assert.strictEqual(getCardValue({ rank: "J", suit: "spades" }), 10);
assert.strictEqual(getCardValue({ rank: "A", suit: "spades" }), 1);
assert.strictEqual(getCardValue({ rank: "7", suit: "spades" }), 7);
assert.strictEqual(getCardValue(null), 0);

queueDraws(game, [{ rank: "K", suit: "hearts" }]);
game.makeMove("p1", { type: "DRAW_CARD", source: "DRAW_PILE" });
game.makeMove("p1", { type: "DISCARD_DRAWN" });
assert.strictEqual(game.phase, "AWAITING_DRAW"); // straight through, never AWAITING_POWER
assert.strictEqual(game.currentPlayerIndex, 1);
game = roundTrip(game);
console.log("  OK: card values match the house rules; red K never triggers AWAITING_POWER");

// ---------------------------------------------------------------------------
section("Turn 8 (p2): draw + SWAP_IN (old card lands on discard pile)");

queueDraws(game, [{ rank: "5", suit: "clubs" }]);
game.makeMove("p2", { type: "DRAW_CARD", source: "DRAW_PILE" });
const oldCard = clone(player(game, "p2").hand[1]);
game.makeMove("p2", { type: "SWAP_IN", handIndex: 1 });
assert.deepStrictEqual(player(game, "p2").hand[1], { rank: "5", suit: "clubs" });
if (oldCard !== null) {
    assert.deepStrictEqual(game.deck.discardPile.at(-1), oldCard);
    assert.strictEqual(game.discardMatchable, true);
}
assert.strictEqual(game.currentPlayerIndex, 2);
game = roundTrip(game);
console.log("  OK: SWAP_IN places drawn card and discards the replaced one");

// ---------------------------------------------------------------------------
section("Turn 9 (p3): illegal DISCARD_DRAWN after a discard-pile draw is rejected");

game.makeMove("p3", { type: "DRAW_CARD", source: "DISCARD_PILE" });
assert.strictEqual(game.pendingDraw.source, "DISCARD_PILE");
assert.throws(() => game.makeMove("p3", { type: "DISCARD_DRAWN" }), /Only a fresh draw-pile card/);
assert.strictEqual(game.phase, "AWAITING_DECISION", "state must be unchanged after a rejected move");
game.makeMove("p3", { type: "SWAP_IN", handIndex: 0 }); // legally close out the turn instead
assert.strictEqual(game.currentPlayerIndex, 0);
game = roundTrip(game);
console.log("  OK: discard-pile-sourced card cannot be discarded directly, state stays consistent");

// ---------------------------------------------------------------------------
section("Illegal moves: wrong player's turn, wrong phase");

assert.throws(() => game.makeMove("p2", { type: "DRAW_CARD", source: "DRAW_PILE" }), /Not your turn/);
assert.throws(() => game.makeMove("p1", { type: "SWAP_IN", handIndex: 0 }), /Not awaiting a decision/);
console.log("  OK: both rejected with clear reasons, no state mutation");

// ---------------------------------------------------------------------------
section("Cambio: caller gets no further turn, round ends after everyone else's last turn");

game.makeMove("p1", { type: "CALL_CAMBIO" });
assert.deepStrictEqual(game.cambio, { calledBy: "p1", remainingTurns: 2 });
assert.strictEqual(game.currentPlayerIndex, 1); // skipped straight past p1
game = roundTrip(game);

queueDraws(game, [{ rank: "4", suit: "clubs" }]);
game.makeMove("p2", { type: "DRAW_CARD", source: "DRAW_PILE" });
game.makeMove("p2", { type: "DISCARD_DRAWN" });
assert.strictEqual(game.cambio.remainingTurns, 1);
assert.strictEqual(game.phase, "AWAITING_DRAW");
assert.strictEqual(game.currentPlayerIndex, 2);
game = roundTrip(game);

queueDraws(game, [{ rank: "4", suit: "hearts" }]);
game.makeMove("p3", { type: "DRAW_CARD", source: "DRAW_PILE" });
game.makeMove("p3", { type: "DISCARD_DRAWN" });
assert.strictEqual(game.phase, "ROUND_OVER");
game = roundTrip(game);

assert.throws(() => game.makeMove("p2", { type: "DRAW_CARD", source: "DRAW_PILE" }), /Not awaiting a draw/);
assert.throws(() => game.makeMove("p2", { type: "MATCH_DISCARD", handIndex: 0 }), /Round is over/);
console.log("  OK: caller skipped, remainingTurns counted down correctly, ROUND_OVER reached, no further moves accepted");

// ---------------------------------------------------------------------------
section("serialize.js: private info is redacted per recipient");

const asP1 = toPublicGameState(game, "p1");
const asP2 = toPublicGameState(game, "p2");
const p2AsSeenByP1 = asP1.players.find(p => p.id === "p2");
const p2AsSeenByP2 = asP2.players.find(p => p.id === "p2");
for (let i = 0; i < p2AsSeenByP1.hand.length; i++) {
    if (p2AsSeenByP1.hand[i] !== null) {
        assert.deepStrictEqual(p2AsSeenByP1.hand[i], { hidden: true });
    }
}
assert.deepStrictEqual(p2AsSeenByP2.hand, player(game, "p2").hand);
assert.strictEqual(typeof asP1.deck.drawCount, "number");
assert.strictEqual(asP1.deck.drawPile, undefined, "undrawn card identities must never be exposed");
console.log("  OK: other players' hands are hidden, own hand and draw count are visible");

// ---------------------------------------------------------------------------
section("Deck.deckOut(): reshuffles discard pile back in, keeps current top card in play");

{
    const d = new Deck();
    d.drawPile = [];
    d.discardPile = [{ rank: "2", suit: "clubs" }, { rank: "3", suit: "clubs" }, { rank: "4", suit: "clubs" }];
    d.deckOut();
    assert.strictEqual(d.discardPile.length, 1);
    assert.strictEqual(d.discardPile[0].rank, "4"); // the card that was on top stays on top
    assert.strictEqual(d.drawPile.length, 2);
    console.log("  OK: deckOut() keeps the current top card, reshuffles the rest");
}

{
    const d = new Deck();
    d.drawPile = [];
    d.discardPile = [{ rank: "5", suit: "hearts" }, { rank: "6", suit: "hearts" }];
    const drawn = d.drawCard(); // drawPile is empty -> should auto-reshuffle, not throw
    assert.deepStrictEqual(drawn, { rank: "5", suit: "hearts" });
    assert.deepStrictEqual(d.discardPile, [{ rank: "6", suit: "hearts" }]);
    assert.strictEqual(d.drawPile.length, 0);
    console.log("  OK: drawCard() auto-reshuffles on an empty draw pile instead of throwing");
}

{
    const d = new Deck();
    d.drawPile = [];
    d.discardPile = [{ rank: "7", suit: "hearts" }]; // only the top card, nothing to reshuffle
    assert.throws(() => d.deckOut(), /No cards left to reshuffle/);
    console.log("  OK: deckOut() throws cleanly on the near-impossible fully-exhausted case");
}

console.log("\nAll checks passed.");
