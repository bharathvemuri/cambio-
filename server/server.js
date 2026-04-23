const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const { v4: uuidv4 } = require("uuid");

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*"
    }
});

app.get("/", (req, res) => {
    res.send("Cambio- server is running");
});

// Socket.IO connection handling
io.on("connection", (socket) => {
    console.log(`Client connected: ${socket.id}`);

    socket.on("createRoom", (callback) => {
        const roomId = uuidv4();
        socket.join(roomId);
        console.log(`Room created: ${roomId} by ${socket.id}`);
        callback({ roomId });
    });

    socket.on("joinRoom", ({ roomId }, callback) => {
        socket.join(roomId);
        console.log(`Client joined room: ${roomId} by ${socket.id}`);
        callback({ roomId });
    });


    socket.on("disconnect", () => {
        console.log(`Client disconnected: ${socket.id}`);
    });
});


// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});