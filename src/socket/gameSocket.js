"use strict";

function registerSocketHandlers(io) {
  io.on("connection", (socket) => {
    console.log("[Socket] Client connected:", socket.id);

    socket.on("join:board", (boardId) => {
      socket.join(boardId);
      console.log("[Socket]", socket.id, "joined room:", boardId);
    });

    socket.on("leave:board", (boardId) => {
      socket.leave(boardId);
      console.log("[Socket]", socket.id, "left room:", boardId);
    });

    socket.on("disconnect", () => {
      console.log("[Socket] Client disconnected:", socket.id);
    });
  });
}

module.exports = registerSocketHandlers;