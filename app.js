const express = require("express");
const http = require("http");
const path = require("path");
const app = express();
const port = 3000;

const server = http.createServer(app);
const socketIO = require("socket.io");
const io = socketIO(server);

const bodyParser = require("body-parser");

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

app.use(express.static(path.join(__dirname, "src")));
// JSON 형식의 요청 바디를 파싱하기 위한 미들웨어 등록
app.use(bodyParser.json());

const rooms = [];

const wordModule = require("./lib/file");

var randomWord;

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

app.get("/room", (req, res) => {
  res.sendFile(__dirname + "/views/room.html");
});

app.post("/room/create", (req, res) => {
  const roomName = req.body.roomName;

  // 방 생성 작업 수행
  const newRoom = {
    id: rooms.length + 1,
    name: roomName,
    users: new Map(),
    userScore: new Map(),
  };

  rooms.push(newRoom);
  console.log("생성된 방 목록 배열 =>", rooms);

  // 생성된 방 정보를 클라이언트에게 응답
  res.json({
    success: true,
    roomId: newRoom.id,
  });
});

// /room/:id 라우팅 경로에서 roomId를 매개변수로 사용합니다.
app.get("/room/:id", (req, res) => {
  const roomId = req.params.id;

  var room = rooms.find((room) => {
    return room.id === parseInt(roomId); // parseInt 꼭하기
  });

  console.log(`/room/${roomId}를 통해 찾은 방 객체 =>`, room);

  if (room) {
    // roomId가 배열의 요소로 포함되어 있을 경우
    res.sendFile(__dirname + "/views/channel.html");
  } else {
    // roomId가 배열의 요소로 포함되어 있지 않을 경우
    res.status(404).json({ error: `방 ${roomId}은 존재하지 않습니다.` });
  }
});

////////////////////////////////////////////////////////////////////////////////////////////////////

app.get("/rooms", (req, res) => {
  res.json(rooms);
});

app.get("/getRandomWord", (req, res) => {
  // getRandomWord 함수를 호출하여 무작위 단어를 얻습니다.
  randomWord = wordModule.getRandomWord().trim();
  const data = { message: randomWord };
  res.json(data);
});

app.get("/getReader", (req, res) => {
  const id = req.query.id;
  var targetRoom = rooms.find((room) => {
    return room.id === parseInt(id);
  });
  const [reader, readerId] = targetRoom.users.entries().next().value;
  const data = { reader, readerId };
  console.log(
    `${id}방의 방장은 ${reader}님 입니다. 그리고 소켓 ID는 ${readerId}입니다.`
  );
  res.json(data);
});

app.post("/checkChat", (req, res) => {
  var clientVal = req.body.message;
  var serverVal = randomWord;

  if (clientVal === serverVal) {
    res.json({ result: true });
  } else {
    res.json({ result: false });
  }
});

///////////////////////////////////////////////////////////////////

const canvasIO = io.of("/canvas");

canvasIO.on("connection", (socket) => {
  console.log("캔버스 소켓에 정상접속");
  var roomID;

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

  var roomID;

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

var roomOfInfo = [];

gameIO.on("connection", (socket) => {
  console.log(`게임 소켓에 소켓ID ${socket.id}님이 정상접속`);

  var roomID;
  var targetRoom;

  var info;

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

    var arr = Array.from(targetRoom.userScore);

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

  // socket.on("onCount", (data) => {
  //   gameIO.to(roomID).emit("onCount", data);
  // });

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
    var arr = Array.from(targetRoom.userScore);
    gameIO.to(roomID).emit("userlist", arr);
  });

  socket.on("clearUserScore", (data) => {
    targetRoom.userScore.forEach(function (value, key) {
      targetRoom.userScore.set(key, 0);
    });
    var arr = Array.from(targetRoom.userScore);
    gameIO.to(roomID).emit("userlist", arr);
  });

  // 소켓 연결 종료 시
  socket.on("disconnect", () => {
    console.log(`소켓 ID가 ${socket.id}님 게임 소켓 접속해지 `);

    // 연결된 사용자 정보에서 제거
    if (socket.data.username) {
      console.log(`${socket.data.username}님 게임 소켓 접속해지 `);

      var myRoom = roomOfInfo.find((info) => {
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

      var arr = Array.from(targetRoom.userScore);
      gameIO.to(roomID).emit("userlist", arr);

      gameIO.to(roomID).emit("members", targetRoom.users.size);

      gameIO.to(roomID).emit("player-disconnect");
    }
  });
});

///////////////////////////////////////////////////////////////////

const timerIO = io.of("/timer");

var timerInfo = [];

timerIO.on("connection", function (socket) {
  var roomID;

  socket.on("joinRoom", (roomId) => {
    roomID = roomId;
    socket.join(roomId);
    console.log(`${roomId}방에 타이머 소켓 연결`);
  });

  socket.on("start", function () {
    var myTimer = timerInfo.find((info) => {
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

    var count = 5;

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
    var myTimer = timerInfo.find((info) => {
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
    var myTimer = timerInfo.find((info) => {
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
    var myTimer = timerInfo.find((info) => {
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
