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

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

const rooms = [];

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

  // 이 방법은 보안에 취약합니다...
  if (req.headers.check === "fetch") {
    // Fetch API 요청인 경우 처리합니다.
    const data = { roomId: parseInt(roomId) };
    res.json(data);
  } else {
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
  }
});

app.get("/rooms", (req, res) => {
  res.json(rooms);
});

const wordModule = require("./lib/file");

var randomWord;

app.get("/getRandomWord", (req, res) => {
  // getRandomWord 함수를 호출하여 무작위 단어를 얻습니다.
  randomWord = wordModule.getRandomWord().trim();
  const data = { message: randomWord };
  res.json(data);
});
const canvasIO = require("./src/sockets/canvasIO")(io);
const chatIO = require("./src/sockets/chatIO")(io);
const { users } = require("./src/sockets/gameIO")(io);

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

server.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

module.exports = {
  rooms,
};
