module.exports = function (io) {
  const chatIO = io.of("/chat");

  chatIO.on("connection", (socket) => {
    //console.log("채팅 소켓에 정상접속");

    let roomID;

    socket.on("joinRoom", (roomId) => {
      roomID = roomId;
      socket.join(roomId);
      //console.log(`${roomId}방에 채팅 소켓 연결`);
    });

    socket.on("message", (data) => {
      socket.broadcast.to(roomID).emit("message", data);
    });

    socket.on("disconnect", () => {
      //console.log("채팅 소켓에 접근해지");
    });
  });
  return chatIO;
};
