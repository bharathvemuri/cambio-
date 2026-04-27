const { createClient } = require("redis");
const { Game } = require("../game/game");

// load environment variables from .env file
require('dotenv').config();

const pubClient = createClient({
    url: `redis://${process.env.REDIS_URL}:${process.env.REDIS_PORT}`
});

const subClient = pubClient.duplicate();

const connectRedis = async () => {
    await pubClient.connect();
    await subClient.connect();
};

const storeGameState = async (roomId, gameState) => {
    await pubClient.set(`gameState:${roomId}`, JSON.stringify(gameState));
}

const retrieveGameState = async (roomId) => {
    const gameStateStr = await pubClient.get(`gameState:${roomId}`);
    if (!gameStateStr) {
        throw new Error("Game state not found");
    }
    const data = JSON.parse(gameStateStr);
    return new Game(data);
}

const deleteGameState = async (roomId) => {
    await pubClient.del(`gameState:${roomId}`);
}

module.exports = {
    pubClient,
    subClient,
    connectRedis,
    storeGameState,
    retrieveGameState,
    deleteGameState
};