module.exports = function (io) {
  const canvasIO = io.of("/canvas");

  canvasIO.on("connection", (socket) => {
    //console.log("캔버스 소켓에 정상접속");
    let roomID;

    socket.on("joinRoom", (roomId) => {
      roomID = roomId;
      socket.join(roomId);
      //console.log(`${roomId}방에 캔버스 소켓 연결`);
    });

    socket.on("draw", (data) => {
      socket.broadcast.to(roomID).emit("draw", data);
    });

    socket.on("disconnect", () => {
      //console.log("캔버스 소켓에 접속해지");
    });
  });
  return canvasIO;
};
