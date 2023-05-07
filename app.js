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
app.get("/channel", function (req, res) {
  res.sendFile(__dirname + "/views/channel.html");
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
