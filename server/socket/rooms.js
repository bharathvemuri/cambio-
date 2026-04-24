const { v4: uuidv4 } = require("uuid");

function registerRoomHandlers(io, socket) {

    socket.on("createRoom", (data, callback) => {
        const { nickname } = data;

        const roomId = uuidv4();
        socket.join(roomId);

        // TODO: Create Room, Store Game State In Redis

        console.log(`Room created: ${roomId} by ${socket.id}`);

        callback({ roomId });
    });

    socket.on("joinRoom", (data, callback) => {
        const { nickname, roomId } = data;

        socket.join(roomId);

        // TODO: Retrieve Game State and Update Players

        console.log(`Client joined room: ${roomId} by ${socket.id}`);

        callback({ roomId });
    });

    socket.on("disconnect", () => {
        console.log(`Client disconnected: ${socket.id}`);
    });
}

module.exports = { registerRoomHandlers };