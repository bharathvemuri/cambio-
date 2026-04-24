const { registerRoomHandlers } = require("./rooms");

function initSocket(io) {
    io.on("connection", (socket) => {
        console.log(`Client connected: ${socket.id}`);

        registerRoomHandlers(io, socket);
    });
}

module.exports = { initSocket };