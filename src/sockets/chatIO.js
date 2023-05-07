module.exports = function (io) {
  const chatIO = io.of("/chat");

  var chat_members = 0;
  var connectedUserList = [];

  chatIO.on("connection", (socket) => {
    console.log("A user connected to chat");

    chat_members++;

    socket.on("message", (data) => {
      socket.broadcast.emit("message", data);
    });

    socket.on("members", () => {
      chatIO.emit("members", chat_members);
    });

    var username;

    socket.on("userlist", (data) => {
      username = data.username;
      connectedUserList.push(username);
      chatIO.emit("userlist", connectedUserList);
    });

    socket.on("correct-player", (data) => {
      chatIO.emit("correct-player", { username: data.username });
    });

    socket.on("disconnect", () => {
      chat_members--;
      chatIO.emit("members", chat_members);

      const index = connectedUserList.indexOf(username);
      if (index !== -1) {
        connectedUserList.splice(index, 1);
        console.log("User disconnected:", username);
      }
      chatIO.emit("userlist", connectedUserList);

      console.log("chat disconnected");
    });
  });
  return chatIO;
};
