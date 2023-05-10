module.exports = function (io) {
  const canvasIO = io.of("/canvas");

  canvasIO.on("connection", (socket) => {
    console.log("canvas connected");

    socket.on("joinRoom", (roomId) => {
      socket.join(roomId);
      canvasIO.to(roomId).emit("event", `hello ${roomId}방 from canvasIO`);
    });

    socket.on("draw", (data) => {
      canvasIO.emit("draw", data);
    });

    socket.on("disconnect", () => {
      console.log("canvas disconnected");
    });
  });
  return canvasIO;
};
