const { storeGameState, retrieveGameState } = require("../services/redis");
const { toPublicGameState } = require("../game/serialize");

// Broadcasting one room-wide `gameState` would leak every player's hand to every
// client. Instead, emit a per-recipient filtered view to each connected player.
function broadcastGameState(io, roomId, gameState) {
    for (const player of gameState.players) {
        io.to(player.id).emit("gameStateUpdated", { gameState: toPublicGameState(gameState, player.id) });
    }
}

// Emits a room-wide (safe, card-data-free) notice once a round has ended, regardless
// of which handler's move caused the final turn to complete.
function maybeBroadcastRoundOver(io, roomId, gameState) {
    if (gameState.phase === "ROUND_OVER") {
        io.to(roomId).emit("roundOver", { roomId });
    }
}

function registerGameHandlers(io, socket) {

    socket.on("startGame", async (data, callback) => {
        const { mode, roomId } = data;
        try {
            const gameState = await retrieveGameState(roomId);
            gameState.startGame(mode);
            await storeGameState(roomId, gameState);

            broadcastGameState(io, roomId, gameState);
            callback({ gameState: toPublicGameState(gameState, socket.id) });
        } catch (err) {
            callback({ error: err.message });
        }
    });

    socket.on("peekInitialHand", async (data, callback) => {
        const { roomId } = data;
        try {
            const gameState = await retrieveGameState(roomId);
            const cards = gameState.peekInitialHand(socket.id);
            await storeGameState(roomId, gameState);

            broadcastGameState(io, roomId, gameState);
            callback({ cards });
        } catch (err) {
            callback({ error: err.message });
        }
    });

    socket.on("drawCard", async (data, callback) => {
        const { roomId, source } = data;
        try {
            const gameState = await retrieveGameState(roomId);
            gameState.makeMove(socket.id, { type: "DRAW_CARD", source });
            await storeGameState(roomId, gameState);

            broadcastGameState(io, roomId, gameState);
            callback({ gameState: toPublicGameState(gameState, socket.id) });
        } catch (err) {
            callback({ error: err.message });
        }
    });

    socket.on("makeDecision", async (data, callback) => {
        const { roomId, decision } = data;
        try {
            const gameState = await retrieveGameState(roomId);
            gameState.makeMove(socket.id, decision);
            await storeGameState(roomId, gameState);

            broadcastGameState(io, roomId, gameState);
            maybeBroadcastRoundOver(io, roomId, gameState);
            callback({ gameState: toPublicGameState(gameState, socket.id) });
        } catch (err) {
            callback({ error: err.message });
        }
    });

    socket.on("resolvePower", async (data, callback) => {
        const { roomId, power } = data;
        try {
            const gameState = await retrieveGameState(roomId);
            const outcome = gameState.makeMove(socket.id, power);
            await storeGameState(roomId, gameState);

            broadcastGameState(io, roomId, gameState);
            maybeBroadcastRoundOver(io, roomId, gameState);
            callback({ gameState: toPublicGameState(gameState, socket.id), reveal: outcome?.privateReveal ?? null });
        } catch (err) {
            callback({ error: err.message });
        }
    });

    socket.on("matchDiscard", async (data, callback) => {
        const { roomId, handIndex } = data;
        try {
            const gameState = await retrieveGameState(roomId);
            gameState.makeMove(socket.id, { type: "MATCH_DISCARD", handIndex });
            await storeGameState(roomId, gameState);

            broadcastGameState(io, roomId, gameState);
            callback({ gameState: toPublicGameState(gameState, socket.id) });
        } catch (err) {
            callback({ error: err.message });
        }
    });

    socket.on("callCambio", async (data, callback) => {
        const { roomId } = data;
        try {
            const gameState = await retrieveGameState(roomId);
            gameState.makeMove(socket.id, { type: "CALL_CAMBIO" });
            await storeGameState(roomId, gameState);

            broadcastGameState(io, roomId, gameState);
            maybeBroadcastRoundOver(io, roomId, gameState);
            callback({ gameState: toPublicGameState(gameState, socket.id) });
        } catch (err) {
            callback({ error: err.message });
        }
    });
}

module.exports = { registerGameHandlers };
