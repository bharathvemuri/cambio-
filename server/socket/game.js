const { storeGameState, retrieveGameState } = require("../services/redis");

function registerGameHandlers(io, socket) {

    socket.on("startGame", async (data, callback) => {
        const { mode, roomId } = data;
        
        // update game state in redis
        const gameState = await retrieveGameState(roomId);
        gameState.startGame(mode);
        await storeGameState(roomId, gameState);

        // notify all players in room about updated game state
        io.to(roomId).emit("gameStarted", { gameState });

        // send updated game state back to client that initiated the move
        callback({ gameState });
    });
}

module.exports = { registerGameHandlers };