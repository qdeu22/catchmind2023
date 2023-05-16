const rooms = require("../../rooms");
const roomOfInfo = require("../../roomOfInfo");

module.exports = function (io) {
  const gameIO = io.of("/game");

  gameIO.on("connection", (socket) => {
    let roomID;
    let targetRoom;

    let info;

    //소켓 룸 가입
    socket.on("joinRoom", (roomId) => {
      roomID = roomId;
      socket.join(roomId);
    });

    // 같은 방에 참가한 이용자 등록하는 콜백함수
    socket.on("register", (data) => {
      // socket 객체의 data 속성에 저장
      socket.data.username = data.username;

      // 번호와 같은 방을 찾음 {} 객체형으로
      targetRoom = rooms.find(parseInt(roomID));

      console.log(`방목록에서 해당 ${roomID}번 방의 정보 =>`, targetRoom);

      // 방에 입장하면 해당 이용자를 기본값 셋팅
      targetRoom.users.set(data.username, socket.id);
      targetRoom.userScore.set(data.username, 0);

      console.log(`사용자 등록후 모든 방목록의 세부 정보 =>`, rooms.getRooms());

      let arr = Array.from(targetRoom.userScore);

      //같은 방에 속한 클라이언트에게 현재 접속자 수를 알림
      gameIO.to(roomID).emit("members", targetRoom.users.size);

      // 같은 방에 속한 클라이언트에게 현재 접속자 목록들을 알림
      gameIO.to(roomID).emit("userlist", arr);
    });

    // 게임시작 버튼을 누르고 5초가 지난후 실행되는 게임시작 콜백함수
    socket.on("gameStart", () => {
      /**
       * 자신이 속한 방의 정보를 객체로 저장
       * @param id 방번호
       * @param users 같은 방에 속한 이용자 수
       * @param current_index 게임시작 하기전 플레이어 인덱스 (인원수 - 1)
       * @param round 라운드 수
       */
      const roomData = {
        id: roomID,
        users: targetRoom.users.size,
        current_index: targetRoom.users.size - 1,
        round: 0,
      };

      // 전체 방 목록에 자신이 속한 방의 정보를 추가
      roomOfInfo.addItem(roomData);

      console.log("게임시작된 룸 정보들 =>", roomOfInfo.getRoomOfInfo());

      // 같은 방에 속한 클라이언트에게 게임결과 랭킹 리스트 초기화
      gameIO.to(roomID).emit("clear-ranklist");

      // 같은 방에 속한 클라이언트에게 게임시작되자마자 해야할 일을 하도록 전송!
      gameIO.to(roomID).emit("gameStart");
    });

    // 클라이언트에서 게임시작 버튼을 눌러 취소할때 실행되는 콜백함수!
    socket.on("gameEnd", () => {
      // 전체 방 목록에 자신이 속한 방의 정보를 필터링(삭제)
      roomOfInfo.filter(roomID);

      console.log("게임종료된 룸 정보들 =>", roomOfInfo.getRoomOfInfo());

      // 같은 방에 속한 클라이언트에게 게임종료되어 해야할 일을 하도록 전송!
      gameIO.to(roomID).emit("gameEnd");
    });

    // 게임중 플레이어 턴이 바뀌도록하는 콜백함수
    socket.on("change-player", () => {
      // 자신이 속한 방을 찾음
      info = roomOfInfo.find(roomID);

      // 현재 라운드가 마지막 라운드가 끝나고 실행됬다면
      if (info.round === info.users * 2) {
        // 자신이 속한 방의 정보를 필터링
        roomOfInfo.filter(roomID);

        console.log(
          `${roomID}번방의 모든 라운드가 종료되어 게임이 종료되었습니다.`
        );

        // 같은 방에 속한 클라이언트들에게 라운드가 종료되어 게임이 종료되었음을 알림
        gameIO.to(roomID).emit("roundOfGameSet");
        return;
      }

      // 같은 방에 속한 클라이언트에게 공통으로 해야할 일을 전송!
      gameIO.to(roomID).emit("exchange");

      info.round++; // 라운드 증가

      console.log(`${roomID}번방에 대한 룸 인원 => `, info.users);

      // 같은 방에 속한 클라이언트 중 현재 플레이어 다음의 플레이어의 인덱스 계산 (순환)
      info.current_index = (info.current_index + 1) % info.users;

      console.log(
        `${roomID}번방에 게임중 현재 플레이어 인덱스 => `,
        info.current_index
      );

      // 해당 인덱스의 socket.id를 가져와서 next_player에 할당
      next_player = Array.from(targetRoom.users.values())[info.current_index];

      console.log(`${roomID}번방에 대한 다음 플레이어 소켓ID => `, next_player);

      // 다음 플레이어에게만 턴을 시작하도록 메시지를 보냅니다.
      gameIO.to(next_player).emit("currentPlayer");
    });

    // 채팅을 통해 입력된 값이 올바른 경우 실행되는 콜백함수
    socket.on("correct-player", (data) => {
      /**
       * 같은 방에 속한 플레이어중 전달 받은 플레이어 이름의 점수를 찾아 +1 증가하도록 함
       * @param data.username 플레이어 이름
       */
      targetRoom.userScore.set(
        data.username,
        targetRoom.userScore.get(data.username) + 1
      );

      // 같은 방에 속한 클라이언트에게 누가 정답을 맞췄는지 알림
      gameIO.to(roomID).emit("correct-player", { username: data.username });

      let arr = Array.from(targetRoom.userScore);

      // 같은 방에 속한 클라이언트에게 점수 변경사항이 생겼으므로 접속자 명단을 갱신
      gameIO.to(roomID).emit("userlist", arr);
    });

    // 게임이 종료되거나 취소된후 접속자들의 점수를 초기화하는 콜백함수
    socket.on("clearUserScore", () => {
      // 같은 방에 속한 클라이언트들의 점수를 순회하여 0으로 초기화
      targetRoom.userScore.forEach(function (value, key) {
        targetRoom.userScore.set(key, 0);
      });

      let arr = Array.from(targetRoom.userScore);

      // 같은 방에 속한 클라이언트에게 초기화된 접속자 명단을 갱신
      gameIO.to(roomID).emit("userlist", arr);
    });

    // 라운드 종료된후 게임결과를 생성하는 콜백함수
    socket.on("gameResult", (data) => {
      const mapEntries = Array.from(targetRoom.userScore.entries());

      const sortedEntries = mapEntries.sort((a, b) => b[1] - a[1]);

      let rank = 1;
      let prevValue = null;

      const rankedData = sortedEntries.map((entry, index) => {
        if (entry[1] !== prevValue) {
          rank = index + 1;
        }
        prevValue = entry[1];
        return { name: entry[0], value: entry[1], rank };
      });

      // 게임 결과가 정리된 후 순회하여 점수를 0으로 초기화
      targetRoom.userScore.forEach(function (value, key) {
        targetRoom.userScore.set(key, 0);
      });

      // 같은 방에 속한 클라이언트에게 모든 결과를 정리하여 순위를 매기고 배열을 전송
      gameIO.to(roomID).emit("ranklist", rankedData);
    });

    // 소켓 연결 종료 시
    socket.on("disconnect", () => {
      // 연결된 사용자 정보에서 제거
      if (socket.data.username) {
        //console.log(`${socket.data.username}님 게임 소켓 접속해지 `);

        // 해당 방에서 사용자(socket.id)를 삭제
        targetRoom.users.delete(socket.data.username);
        // 해당 방에서 사용자(점수)를 삭제
        targetRoom.userScore.delete(socket.data.username);

        // 모든 방에서 해당 방을 찾아 있다면=> 게임중, 아니라면=> 게임중x
        let myRoom = roomOfInfo.find(roomID);

        // 현재 게임중인 방이라면
        if (myRoom) {
          console.log("게임중인 방에서 탈주 발생 =>", myRoom);

          // 모든 방의 정보에서 해당 방의 정보를 필터링
          roomOfInfo.filter(roomID);

          console.log(
            "탈주 발생 후 강제종료된 방 삭제후 모든 방의 정보 =>",
            roomOfInfo.getRoomOfInfo()
          );

          // 같은 방에 속한 클라이언트에게 탈주자가 발생했다고 알림
          gameIO.to(roomID).emit("escape");

          const keysArray = Array.from(targetRoom.users.keys());
          const randomKey =
            keysArray[Math.floor(Math.random() * keysArray.length)];
          const randomSocketid = targetRoom.users.get(randomKey);

          //같은 방에 속한 무작위의 하나를 선택하여 해야할일을 하기위해 전송!
          gameIO.to(randomSocketid).emit("random-escape");
        }

        console.log(`게임 소켓 정상해지후 ${roomID}번방 정보 =>`, targetRoom);

        console.log(`게임 소켓 정상해지후 전체 방 목록 =>`, rooms.getRooms());

        let arr = Array.from(targetRoom.userScore);

        // 같은 방에 속한 클라이언트에게 사용자 제거후 사용자 목록을 갱신
        gameIO.to(roomID).emit("userlist", arr);

        // 같은 방에 속한 클라이언트에게 현재 접속자 수를 알림
        gameIO.to(roomID).emit("members", targetRoom.users.size);

        // 같은 방에 속한 클라이언트에게 사용자가 제거된 후 방장을 재검색하기위해 전송!
        gameIO.to(roomID).emit("player-disconnect");
      }
    });
  });
  return gameIO;
};
