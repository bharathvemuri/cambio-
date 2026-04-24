const { createClient } = require("redis");

const pubClient = createClient({
    url: `${process.env.REDIS_URL}:${process.env.REDIS_PORT}`
});

const subClient = pubClient.duplicate();

const connectRedis = async () => {
    await pubClient.connect();
    await subClient.connect();
};

module.exports = {
    pubClient,
    subClient,
    connectRedis
};