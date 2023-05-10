module.exports = function (io) {
  const canvasIO = io.of("/canvas");

  canvasIO.on("connection", (socket) => {
    console.log("canvas connected");

    var roomID;

    socket.on("joinRoom", (roomId) => {
      roomID = roomId;

      socket.join(roomId);
      canvasIO.to(roomId).emit("event", `hello ${roomId}방 from canvasIO`);
    });

    socket.on("draw", (data) => {
      socket.broadcast.to(roomID).emit("draw", data);
    });

    socket.on("disconnect", () => {
      console.log("canvas disconnected");
    });
  });
  return canvasIO;
};
