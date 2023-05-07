module.exports = function (io) {
  const gameIO = io.of("/game");

  // 연결된 사용자 정보 저장
  const users = new Map();

  var currentIndex = 0;

  var next_player;

  gameIO.on("connection", (socket) => {
    console.log("game User connected: " + socket.id);

    // 사용자 정보 저장
    socket.on("register", (data) => {
      socket.data.username = data.username;
      users.set(data.username, socket.id);
      console.log("User registered: " + socket.data.username);
      console.log("register", users);
    });

    socket.on("gameStart", (data) => {
      gameIO.emit("gameStart");
    });

    socket.on("onCount", (data) => {
      gameIO.emit("onCount", data);
    });

    socket.on("gameEnd", (data) => {
      gameIO.emit("gameEnd");
    });

    socket.on("host", (data) => {
      host = Array.from(users.values())[0];
      gameIO.to(host).emit("currentPlayer");
    });

    socket.on("change-player", () => {
      // 다음 사용자 인덱스 계산 (순환)

      // 모든 접속자에게 공통으로 변경사항
      gameIO.emit("exchange");

      currentIndex = (currentIndex + 1) % users.size;

      next_player = Array.from(users.values())[currentIndex];

      // 다음 사용자에게 턴을 시작하도록 메시지를 보냅니다.
      gameIO.to(next_player).emit("currentPlayer");
    });

    // 소켓 연결 종료 시
    socket.on("disconnect", () => {
      console.log("User disconnected: " + socket.id);

      // 연결된 사용자 정보에서 제거
      if (socket.data.username) {
        users.delete(socket.data.username);
        console.log("User unregistered: " + socket.data.username);
        console.log("disconnect", users);
      }
    });
  });
  return { users };
};
