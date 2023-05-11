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
  const [reader, readerId] = users.entries().next().value;
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

const canvasIO = io.of("/canvas");

canvasIO.on("connection", (socket) => {
  console.log("canvas connected");

  var roomID;

  socket.on("joinRoom", (roomId) => {
    roomID = roomId;

    socket.join(roomId);
    canvasIO.to(roomId).emit("event", `hello ${roomId}방 from canvasIO`);
  });

  socket.on("draw", (data) => {
    socket.broadcast.to(roomID).emit("draw", data);
  });

  socket.on("disconnect", () => {
    console.log("canvas disconnected");
  });
});

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

const gameIO = io.of("/game");

// 연결된 사용자 정보 저장
const users = new Map();

var currentIndex;

var next_player;

gameIO.on("connection", (socket) => {
  console.log("game User connected: " + socket.id);

  socket.on("joinRoom", (roomId) => {
    socket.join(roomId);
    gameIO.to(roomId).emit("event", `hello ${roomId}방 from gameIO`);
  });

  // 사용자 정보 저장
  socket.on("register", (data) => {
    socket.data.username = data.username;
    users.set(data.username, socket.id);
    console.log("User registered: " + socket.data.username);
    console.log("register", users);
  });

  socket.on("gameStart", (data) => {
    currentIndex = users.size - 1;
    gameIO.emit("gameStart");
  });

  socket.on("onCount", (data) => {
    gameIO.emit("onCount", data);
  });

  socket.on("gameEnd", (data) => {
    currentIndex = users.size - 1;
    gameIO.emit("gameEnd");
  });

  socket.on("change-player", () => {
    // 모든 접속자에게 공통으로 변경사항
    gameIO.emit("exchange");

    // 다음 사용자 인덱스 계산 (순환)
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

      gameIO.emit("player-disconnect");
    }
  });
});

server.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
