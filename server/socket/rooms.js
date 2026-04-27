const { v4: uuidv4 } = require("uuid");

const { Game } = require("../game/game");
const { storeGameState, retrieveGameState } = require("../services/redis");

function registerRoomHandlers(io, socket) {

    socket.on("createRoom", async (data, callback) => {
        const { mode, nickname } = data;

        const roomId = uuidv4();
        socket.join(roomId);

        // TODO: Create Room, Store Game State In Redis

        const gameState = new Game({ mode, roomId });
        gameState.addPlayer({ id: socket.id, nickname, isHost: true });

        await storeGameState(roomId, gameState);

        console.log(`Room created: ${roomId} by ${socket.id}`);

        callback({ roomId, players: gameState.players });
    });

    socket.on("joinRoom", async (data, callback) => {
        const { nickname, roomId } = data;

        console.log("nickname:", nickname);
        console.log("roomId:", roomId);

        socket.join(roomId);

        const gameState = await retrieveGameState(roomId);
        gameState.addPlayer({ id: socket.id, nickname });
        await storeGameState(roomId, gameState);

        socket.broadcast.to(roomId).emit("playerJoined", { players: gameState.players });

        console.log(`Client joined room: ${roomId} by ${socket.id}`);

        callback({ roomId, players: gameState.players });
    });

    socket.on("leaveRoom", async (data, callback) => {
        const { roomId } = data;
        socket.leave(roomId);

    });

    socket.on("disconnect", () => {
        console.log(`Client disconnected: ${socket.id}`);
    });
}

module.exports = { registerRoomHandlers };