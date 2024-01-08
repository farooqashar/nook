const express = require("express");
const app = express();
const http = require("http");
const cors = require("cors");

app.use(cors());

const server = http.createServer(app);

const { Server } = require("socket.io");
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});
const mapping = {};
io.on("connection", (socket) => {
  console.log(`a user connected: ${socket.id}`);

  socket.on("storeURL", ({ sessionId, newUrl }) => {
    mapping[sessionId] = { url: newUrl, progress: {} };
    socket.emit("updatedMapping", mapping);
  });

  socket.on("joinSession", (sessionId) => {
    socket.join(sessionId);
    socket.emit("updatedMapping", mapping);

    if (mapping[sessionId]["progress"]) {
      const progress = mapping[sessionId]["progress"];
      io.to(sessionId).emit("syncProgress", progress);
    }
  });

  socket.on("seekVideo", ({sessionId, seekTime}) => {
    if (seekTime) {
      const progress = {playedSeconds: seekTime}
      io.to(sessionId).emit("syncProgress", progress);
    }

  });

  socket.on("onPause", (sessionId) => {
    io.to(sessionId).emit("pause");
  });

  socket.on("onPlay", (sessionId) => {
    io.to(sessionId).emit("play");
  });

  socket.on("onProgress", ({ sessionId, state }) => {
    mapping[sessionId]["progress"] = state;
    io.emit("progress", mapping);
  });

  socket.on("disconnect", () => {
    console.log("a user disconnected", socket.id);
  });
});

server.listen(4000, () => {
  console.log("listening on port 4000");
});
