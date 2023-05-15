module.exports = function (io) {
  const chatIO = io.of("/chat");

  chatIO.on("connection", (socket) => {
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
     * 자신을 제외한 자기가 속한 방에 접속한 사람들에게 메세지 전송
     * @param data { name, message }
     */
    socket.on("message", (data) => {
      socket.broadcast.to(roomID).emit("message", data);
    });

    socket.on("disconnect", () => {});
  });
  return chatIO;
};
