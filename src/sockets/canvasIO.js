module.exports = function (io) {
  const canvasIO = io.of("/canvas");

  canvasIO.on("connection", (socket) => {
    console.log("canvas connected");

    socket.on("draw", (data) => {
      socket.broadcast.emit("draw", data);
    });

    socket.on("disconnect", () => {
      console.log("canvas disconnected");
    });
  });
  return canvasIO;
};
