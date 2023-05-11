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
  console.log(rooms);

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

  console.log(room);

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
  console.log(reader, readerId);
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
  console.log("canvas connected");
  var roomID;

  socket.on("joinRoom", (roomId) => {
    roomID = roomId;
    socket.join(roomId);
    console.log(`hello ${roomId}방 from canvasIO`);
  });

  socket.on("draw", (data) => {
    socket.broadcast.to(roomID).emit("draw", data);
  });

  socket.on("disconnect", () => {
    console.log("canvas disconnected");
  });
});

///////////////////////////////////////////////////////////////////

const chatIO = io.of("/chat");

chatIO.on("connection", (socket) => {
  console.log("chat connect");

  var roomID;

  socket.on("joinRoom", (roomId) => {
    roomID = roomId;
    socket.join(roomId);
    console.log(`hello ${roomId}방 from chatIO`);
  });

  socket.on("message", (data) => {
    socket.broadcast.to(roomID).emit("message", data);
  });

  socket.on("disconnect", () => {
    console.log("chat disconnected");
  });
});

///////////////////////////////////////////////////////////////////

const gameIO = io.of("/game");

var roomOfInfo = [];

gameIO.on("connection", (socket) => {
  console.log("game User connected: " + socket.id);

  var roomID;
  var targetRoom;

  var info;

  socket.on("joinRoom", (roomId) => {
    roomID = roomId;
    socket.join(roomId);
    console.log(`hello ${roomId}방 from gameIO`);
  });

  // 사용자 정보 저장
  socket.on("register", (data) => {
    socket.data.username = data.username;

    // 번호와 같은 방을 찾음 {} 객체형으로
    targetRoom = rooms.find((room) => {
      return room.id === parseInt(roomID);
    });

    console.log("targetRoom", targetRoom);

    // 입장하면 인원을 초기 셋팅
    targetRoom.users.set(data.username, socket.id);
    targetRoom.userScore.set(data.username, 0);

    console.log("rooms", rooms);

    var arr = Array.from(targetRoom.userScore);

    // console.log("targetRoom.id 숫자", targetRoom.id);
    // console.log("roomID 문자", roomID);

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

    console.log("roomData", roomOfInfo);

    gameIO.to(roomID).emit("gameStart");
  });

  socket.on("onCount", (data) => {
    gameIO.to(roomID).emit("onCount", data);
  });

  socket.on("gameEnd", (data) => {
    currentIndex = targetRoom.users.size - 1;
    gameIO.to(roomID).emit("gameEnd");
  });

  socket.on("change-player", () => {
    // 모든 접속자에게 공통으로 변경사항
    gameIO.to(roomID).emit("exchange");

    // why?
    info = roomOfInfo.find((info) => {
      return info.id === roomID;
    });

    console.log("info.users", info.users);

    // 다음 사용자 인덱스 계산 (순환)
    info.current_index = (info.current_index + 1) % info.users;

    console.log("info.current_index", info.current_index);

    next_player = Array.from(targetRoom.users.values())[info.current_index]; //!!!!

    console.log("next_player", next_player);

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
    console.log("User disconnected: " + socket.id);

    // 연결된 사용자 정보에서 제거
    if (socket.data.username) {
      console.log("User unregistered: " + socket.data.username);

      targetRoom.users.delete(socket.data.username);
      targetRoom.userScore.delete(socket.data.username);
      console.log("disconnect targetRoom", targetRoom);

      console.log("rooms", rooms);

      var arr = Array.from(targetRoom.userScore);
      gameIO.to(roomID).emit("userlist", arr);

      gameIO.to(roomID).emit("members", targetRoom.users.size);

      gameIO.to(roomID).emit("player-disconnect");
    }
  });
});

server.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
