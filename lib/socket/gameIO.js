const rooms = require("../../roomss");
const roomOfInfo = require("../../roomOfInfo");
module.exports = function (io) {
  const gameIO = io.of("/game");

  gameIO.on("connection", (socket) => {
    //console.log(`게임 소켓에 소켓ID ${socket.id}님이 정상접속`);

    let roomID;
    let targetRoom;

    let info;

    socket.on("joinRoom", (roomId) => {
      roomID = roomId;
      socket.join(roomId);
      //console.log(`${roomId}방에 게임 소켓 연결`);
    });

    // 사용자 정보 저장
    socket.on("register", (data) => {
      socket.data.username = data.username;

      // 번호와 같은 방을 찾음 {} 객체형으로
      targetRoom = rooms.find(parseInt(roomID));

      console.log(`방목록에서 해당 ${roomID}번 방의 정보 =>`, targetRoom);

      // 입장하면 인원을 초기 셋팅
      targetRoom.users.set(data.username, socket.id);
      targetRoom.userScore.set(data.username, 0);

      console.log(`사용자 등록후 모든 방목록의 세부 정보 =>`, rooms.getRooms());

      let arr = Array.from(targetRoom.userScore);

      gameIO.to(roomID).emit("members", targetRoom.users.size);

      gameIO.to(roomID).emit("userlist", arr);
    });

    socket.on("gameStart", (data) => {
      const roomData = {
        id: roomID,
        users: targetRoom.users.size,
        current_index: targetRoom.users.size - 1,
        round: 0,
      };

      roomOfInfo.addItem(roomData);

      console.log("게임시작에 대한 룸 정보 =>", roomOfInfo.getRoomOfInfo());

      gameIO.to(roomID).emit("gameStart");
    });

    socket.on("gameEnd", (data) => {
      roomOfInfo.filter(roomID);

      console.log("게임종료에 대한 룸 정보 =>", roomOfInfo.getRoomOfInfo());
      gameIO.to(roomID).emit("gameEnd");
    });

    socket.on("change-player", () => {
      // 모든 접속자에게 공통으로 변경사항
      // why?
      info = roomOfInfo.find(roomID);

      if (info.round === info.users * 2) {
        //라운드 충족여부
        roomOfInfo.filter(roomID);
        console.log(
          `${roomID}번방의 모든 라운드가 종료되어 게임이 종료되었습니다.`
        );
        gameIO.to(roomID).emit("roundOfGameSet");
        return;
      }

      gameIO.to(roomID).emit("exchange");

      info.round++;

      console.log(`${roomID}번방에 대한 룸 인원 => `, info.users);

      // 다음 사용자 인덱스 계산 (순환)
      info.current_index = (info.current_index + 1) % info.users;

      console.log(
        `${roomID}번방에 게임중 현재 플레이어 인덱스 => `,
        info.current_index
      );

      next_player = Array.from(targetRoom.users.values())[info.current_index]; //!!!!

      console.log(`${roomID}번방에 대한 다음 플레이어 소켓ID => `, next_player);

      // 다음 사용자에게 턴을 시작하도록 메시지를 보냅니다.
      gameIO.to(next_player).emit("currentPlayer"); // ????/
    });

    socket.on("correct-player", (data) => {
      targetRoom.userScore.set(
        data.username,
        targetRoom.userScore.get(data.username) + 1
      );
      gameIO.to(roomID).emit("correct-player", { username: data.username });
      let arr = Array.from(targetRoom.userScore);
      gameIO.to(roomID).emit("userlist", arr);
    });

    socket.on("clearUserScore", (data) => {
      targetRoom.userScore.forEach(function (value, key) {
        targetRoom.userScore.set(key, 0);
      });
      let arr = Array.from(targetRoom.userScore);
      gameIO.to(roomID).emit("userlist", arr);
    });

    // 소켓 연결 종료 시
    socket.on("disconnect", () => {
      //console.log(`소켓 ID가 ${socket.id}님 게임 소켓 접속해지 `);

      // 연결된 사용자 정보에서 제거
      if (socket.data.username) {
        console.log(`${socket.data.username}님 게임 소켓 접속해지 `);

        targetRoom.users.delete(socket.data.username);
        targetRoom.userScore.delete(socket.data.username);

        let myRoom = roomOfInfo.find(roomID);

        if (myRoom) {
          console.log("게임중인 방인데 탈주 발생 =>", myRoom);
          roomOfInfo.filter(roomID);

          console.log(
            "탈주 발생 후 강제종료된 방 삭제후 룸 정보 =>",
            roomOfInfo.getRoomOfInfo()
          );

          gameIO.to(roomID).emit("escape");

          const keysArray = Array.from(targetRoom.users.keys());
          const randomKey =
            keysArray[Math.floor(Math.random() * keysArray.length)];
          const randomSocketid = targetRoom.users.get(randomKey);
          gameIO.to(randomSocketid).emit("random-escape");
        }

        console.log(`게임 소켓 정상해지후 ${roomID}번방 정보 =>`, targetRoom);

        console.log(`게임 소켓 정상해지후 전체 방 목록 =>`, rooms.getRooms());

        let arr = Array.from(targetRoom.userScore);
        gameIO.to(roomID).emit("userlist", arr);

        gameIO.to(roomID).emit("members", targetRoom.users.size);

        gameIO.to(roomID).emit("player-disconnect");
      }
    });
  });
  return gameIO;
};
