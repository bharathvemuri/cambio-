const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const { createAdapter } = require("@socket.io/redis-adapter");

const { pubClient, subClient, connectRedis } = require("./services/redis");
const { initSocket } = require("./socket/initialize");

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
    cors: { origin: "*" }
});

io.adapter(createAdapter(pubClient, subClient));

connectRedis();

initSocket(io);

app.get("/", (req, res) => {
    res.send("Cambio server is running");
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});