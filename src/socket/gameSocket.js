function registerSocketHandlers(io) {
  io.on("connection", (socket) => {
    socket.on("join:board", (boardId) => {
      socket.join(boardId);
    });

    socket.on("leave:board", (boardId) => {
      socket.leave(boardId);
    });
  });
}

module.exports = registerSocketHandlers;