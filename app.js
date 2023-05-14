const express = require("express");
const http = require("http");
const path = require("path");
const bodyParser = require("body-parser");
const socketIO = require("socket.io");

const app = express();
const port = 3000;

const server = http.createServer(app);
const io = socketIO(server);

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

app.use(express.static(path.join(__dirname, "src")));
// JSON 형식의 요청 바디를 파싱하기 위한 미들웨어 등록
app.use(bodyParser.json());

const wordModule = require("./lib/file");

const rooms = require("./rooms");

let randomWord;

const indexRouter = require("./routes/index");
const roomRouter = require("./routes/room");

app.use("/", indexRouter);
app.use("/room", roomRouter);

const canvasIO = io.of("/canvas");

canvasIO.on("connection", (socket) => {
  console.log("캔버스 소켓에 정상접속");
  let roomID;

  socket.on("joinRoom", (roomId) => {
    roomID = roomId;
    socket.join(roomId);
    console.log(`${roomId}방에 캔버스 소켓 연결`);
  });

  socket.on("draw", (data) => {
    socket.broadcast.to(roomID).emit("draw", data);
  });

  socket.on("disconnect", () => {
    console.log("캔버스 소켓에 접속해지");
  });
});

///////////////////////////////////////////////////////////////////

const chatIO = io.of("/chat");

chatIO.on("connection", (socket) => {
  console.log("채팅 소켓에 정상접속");

  let roomID;

  socket.on("joinRoom", (roomId) => {
    roomID = roomId;
    socket.join(roomId);
    console.log(`${roomId}방에 채팅 소켓 연결`);
  });

  socket.on("message", (data) => {
    socket.broadcast.to(roomID).emit("message", data);
  });

  socket.on("disconnect", () => {
    console.log("채팅 소켓에 접근해지");
  });
});

///////////////////////////////////////////////////////////////////

const gameIO = io.of("/game");

let roomOfInfo = [];

gameIO.on("connection", (socket) => {
  console.log(`게임 소켓에 소켓ID ${socket.id}님이 정상접속`);

  let roomID;
  let targetRoom;

  let info;

  socket.on("joinRoom", (roomId) => {
    roomID = roomId;
    socket.join(roomId);
    console.log(`${roomId}방에 게임 소켓 연결`);
  });

  // 사용자 정보 저장
  socket.on("register", (data) => {
    socket.data.username = data.username;

    // 번호와 같은 방을 찾음 {} 객체형으로
    targetRoom = rooms.find((room) => {
      return room.id === parseInt(roomID);
    });

    console.log(`방목록에서 해당 방${roomID}의 정보 =>`, targetRoom);

    // 입장하면 인원을 초기 셋팅
    targetRoom.users.set(data.username, socket.id);
    targetRoom.userScore.set(data.username, 0);

    console.log(`사용자 등록후 모든 방목록의 세부 정보 =>`, rooms);

    let arr = Array.from(targetRoom.userScore);

    gameIO.to(roomID).emit("members", targetRoom.users.size);

    gameIO.to(roomID).emit("userlist", arr);
  });

  socket.on("gameStart", (data) => {
    const roomData = {
      id: roomID,
      users: targetRoom.users.size,
      current_index: targetRoom.users.size - 1,
    };

    roomOfInfo.push(roomData);

    console.log("게임시작에 대한 룸 정보 =>", roomOfInfo);

    gameIO.to(roomID).emit("gameStart");
  });

  socket.on("gameEnd", (data) => {
    roomOfInfo = roomOfInfo.filter((info) => info.id !== roomID);

    console.log("게임종료에 대한 룸 정보 =>", roomOfInfo);
    gameIO.to(roomID).emit("gameEnd");
  });

  socket.on("change-player", () => {
    // 모든 접속자에게 공통으로 변경사항
    gameIO.to(roomID).emit("exchange");

    // why?
    info = roomOfInfo.find((info) => {
      return info.id === roomID;
    });

    console.log(`방${roomID}에 대한 룸 인원 => `, info.users);

    // 다음 사용자 인덱스 계산 (순환)
    info.current_index = (info.current_index + 1) % info.users;

    console.log(
      `방${roomID}에 게임중 현재 플레이어 인덱스 => `,
      info.current_index
    );

    next_player = Array.from(targetRoom.users.values())[info.current_index]; //!!!!

    console.log(`방${roomID}에 대한 다음 플레이어 소켓ID => `, next_player);

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
    console.log(`소켓 ID가 ${socket.id}님 게임 소켓 접속해지 `);

    // 연결된 사용자 정보에서 제거
    if (socket.data.username) {
      console.log(`${socket.data.username}님 게임 소켓 접속해지 `);

      let myRoom = roomOfInfo.find((info) => {
        return info.id === roomID;
      });

      if (myRoom) {
        console.log("게임중인 방인데 탈주 발생 =>", myRoom);
        roomOfInfo = roomOfInfo.filter((info) => info.id !== roomID);

        console.log("탈주 발생 후 강제종료된 방 삭제후 룸 정보 =>", roomOfInfo);

        gameIO.to(roomID).emit("escape");
      }

      targetRoom.users.delete(socket.data.username);
      targetRoom.userScore.delete(socket.data.username);
      console.log(`게임 소켓 정상해지후 방${roomID} 정보 =>`, targetRoom);

      console.log(`게임 소켓 정상해지후 전체 방 목록 =>`, rooms);

      let arr = Array.from(targetRoom.userScore);
      gameIO.to(roomID).emit("userlist", arr);

      gameIO.to(roomID).emit("members", targetRoom.users.size);

      gameIO.to(roomID).emit("player-disconnect");
    }
  });
});

///////////////////////////////////////////////////////////////////

const timerIO = io.of("/timer");

let timerInfo = [];

timerIO.on("connection", function (socket) {
  let roomID;

  socket.on("joinRoom", (roomId) => {
    roomID = roomId;
    socket.join(roomId);
    console.log(`${roomId}방에 타이머 소켓 연결`);
  });

  socket.on("start", function () {
    let myTimer = timerInfo.find((info) => {
      return info.id === roomID;
    });

    // 게임 대기 중 다시 눌렀을 경우
    if (myTimer) {
      timerInfo = timerInfo.filter((info) => info.id !== roomID);
      clearInterval(myTimer.countInterval);
      timerIO.to(roomID).emit("waitstop");
      return;
    }

    const timer = {
      id: roomID,
      elapsedTime: 0,
      remainingTime: 60,
      elapsedTimeInterval: null,
      remainingTimeInterval: null,
      countInterval: null,
    };
    timerInfo.push(timer);

    console.log("저장된 모든 방의 타이머 =>", timerInfo);

    myTimer = timerInfo.find((info) => {
      return info.id === roomID;
    });

    let count = 5;

    timerIO.to(roomID).emit("count", count);

    myTimer.countInterval = setInterval(function () {
      count--;

      timerIO.to(roomID).emit("count", count);

      if (count === 0) {
        clearInterval(myTimer.countInterval);
        timerIO.to(roomID).emit("start");
      }
    }, 1000);
  });

  socket.on("elapsedTime", function () {
    // 경과시간
    let myTimer = timerInfo.find((info) => {
      return info.id === roomID;
    });

    myTimer.elapsedTime = 0;

    myTimer.elapsedTimeInterval = setInterval(function () {
      myTimer.elapsedTime++;

      // console.log(`방${roomID}의 경과시간 =>`, timerInfo);

      timerIO.to(roomID).emit("elapsedTime", {
        elapsedTime: myTimer.elapsedTime,
      });
    }, 1000);
  });

  socket.on("remainingTime", function () {
    // 남은 시간
    let myTimer = timerInfo.find((info) => {
      return info.id === roomID;
    });

    myTimer.remainingTime = 60;

    myTimer.remainingTimeInterval = setInterval(function () {
      myTimer.remainingTime--;

      timerIO.to(roomID).emit("remainingTime", {
        remainingTime: myTimer.remainingTime,
      });

      if (myTimer.remainingTime === 0) {
        clearInterval(myTimer.remainingTimeInterval);
      }
    }, 1000);
  });

  socket.on("stop", function () {
    let myTimer = timerInfo.find((info) => {
      return info.id === roomID;
    });

    clearInterval(myTimer.elapsedTimeInterval);
    clearInterval(myTimer.remainingTimeInterval);

    // 배열에 타이머 삭제
    timerInfo = timerInfo.filter((info) => info.id !== roomID);

    console.log("게임정지에 대한 타이머 삭제후 모든 방 정보 =>", timerInfo);
  });

  socket.on("disconnect", () => {
    console.log("타이머 소켓에 접근해지");
  });
});

server.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
