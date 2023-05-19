module.exports = function (io) {
  const canvasIO = io.of("/canvas");

  canvasIO.on("connection", (socket) => {
    let roomID;

    /**
     * 소켓 룸 가입
     * @param roomId 방 번호
     */
    socket.on("joinRoom", (roomId) => {
      roomID = roomId;
      socket.join(roomId);
    });

    /**
     * 자신을 제외한 자기가 속한 방에 접속한 사람들에게 그림 전송
     * @param data { x, y, start: 불리언 }
     */
    socket.on("draw", (data) => {
      socket.broadcast.to(roomID).emit("draw", data);
    });

    /**
     * 자신을 제외한 자기가 속한 방에 접속한 사람들에게 그림 지우라고 전송!
     */
    socket.on("clear-canvas", () => {
      socket.broadcast.to(roomID).emit("clear-canvas");
    });

    socket.on("disconnect", () => {});
  });
  return canvasIO;
};
