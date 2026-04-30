const { registerRoomHandlers } = require("./rooms");
const { registerGameHandlers } = require("./game");

function initSocket(io) {
    io.on("connection", (socket) => {
        console.log(`Client connected: ${socket.id}`);

        registerRoomHandlers(io, socket);
        registerGameHandlers(io, socket);

        socket.on("disconnect", () => {
            console.log(`Client disconnected: ${socket.id}`);
        });
    });


}

module.exports = { initSocket };