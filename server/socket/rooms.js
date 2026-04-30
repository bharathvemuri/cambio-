const { v4: uuidv4 } = require("uuid");

const { Game } = require("../game/game");
const { storeGameState, retrieveGameState, deleteGameState } = require("../services/redis");

function registerRoomHandlers(io, socket) {

    socket.on("createRoom", async (data, callback) => {
        const { mode, nickname } = data;

        // Create Unique Room ID and Join Socket.IO Room
        const roomId = uuidv4();
        socket.join(roomId);

        // Create initial game state and store in redis
        const gameState = new Game({ mode, roomId });
        gameState.addPlayer({ id: socket.id, nickname, isHost: true });
        await storeGameState(roomId, gameState);

        // Notify client about created room and player list
        callback({ roomId, players: gameState.players });
    });

    socket.on("joinRoom", async (data, callback) => {
        const { nickname, roomId } = data;

        // Join Socket.IO Room
        socket.join(roomId);

        // update game state in redis
        const gameState = await retrieveGameState(roomId);
        gameState.addPlayer({ id: socket.id, nickname });
        await storeGameState(roomId, gameState);

        // notify other players in room about updated player list
        socket.broadcast.to(roomId).emit("updatePlayers", { players: gameState.players });
        callback({ roomId, players: gameState.players });
    });

    socket.on("leaveRoom", async (data, callback) => {
        const { roomId } = data;

        // update game state in redis
        const gameState = await retrieveGameState(roomId);
        gameState.removePlayer(socket.id);
        await storeGameState(roomId, gameState);

        // notify remaining players in room about updated player list
        socket.broadcast.to(roomId).emit("updatePlayers", { players: gameState.players });

        // remove player socket connection from room
        socket.leave(roomId);

        if (gameState.players.length === 0) {
            // Room is empty, remove it from Redis
            await deleteGameState(roomId);
            console.log(`Room ${roomId} deleted from Redis`);
        }

        callback({roomId, players: gameState.players});
    });

    socket.on("kickPlayer", async (data, callback) => {
        const { playerId, roomId } = data;

        // update game state in redis
        const gameState = await retrieveGameState(roomId);
        gameState.removePlayer(playerId);
        await storeGameState(roomId, gameState);

        // notify kicked player and remove from room
        const playerSocket = io.sockets.sockets.get(playerId);
        if (playerSocket) {
            io.to(playerId).emit("kicked", { roomId });
            playerSocket.leave(roomId);
        }

        // notify remaining players in room about updated player list
        socket.broadcast.to(roomId).emit("updatePlayers", { players: gameState.players });
        callback({ success: true });
    });
}

module.exports = { registerRoomHandlers };