module.exports = function (io) {
  const chatIO = io.of("/chat");

  //var chat_members = 0;
  var connectedUserList = [];
  var userScore = new Map();

  chatIO.on("connection", (socket) => {
    console.log("A user connected to chat");

    var roomID;

    socket.on("joinRoom", (roomId) => {
      roomID = roomId;
      socket.join(roomId);
      chatIO.to(roomId).emit("event", `hello ${roomId}방 from chatIO`);
    });

    //chat_members++;

    socket.on("message", (data) => {
      socket.broadcast.to(roomID).emit("message", data);
    });

    // socket.on("members", () => {
    //   chatIO.emit("members", chat_members);
    // });

    var username;
    var arr;

    socket.on("userlist", (data) => {
      username = data.username;
      connectedUserList.push(username);
      userScore.set(username, 0);
      console.log("userScore ==>", userScore);
      arr = Array.from(userScore);
      chatIO.emit("userlist", arr);
    });

    socket.on("correct-player", (data) => {
      userScore.set(data.username, userScore.get(data.username) + 1);
      chatIO.emit("correct-player", { username: data.username });
      arr = Array.from(userScore);
      chatIO.emit("userlist", arr);
    });

    socket.on("clearUserScore", (data) => {
      userScore.forEach(function (value, key) {
        userScore.set(key, 0);
      });
      arr = Array.from(userScore);
      chatIO.emit("userlist", arr);
    });

    socket.on("disconnect", () => {
      // chat_members--;
      // chatIO.emit("members", chat_members);

      const index = connectedUserList.indexOf(username);
      if (index !== -1) {
        connectedUserList.splice(index, 1);
        console.log("User disconnected:", username);
      }

      userScore.delete(username);
      arr = Array.from(userScore);
      chatIO.emit("userlist", arr);

      console.log("chat disconnected");
    });
  });
  return chatIO;
};
