const express = require("express");
const http = require("http");
const path = require("path");
const app = express();
const port = 3000;

const server = http.createServer(app);
const socketIO = require("socket.io");
const io = socketIO(server);

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

app.use(express.static(path.join(__dirname, "src")));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});
app.get("/channel", function (req, res) {
  res.sendFile(__dirname + "/views/channel.html");
});

const wordModule = require("./lib/file");

// getRandomWord 함수를 호출하여 무작위 단어를 얻습니다.
const randomWord = wordModule.getRandomWord().trim();

app.get("/getWord", (req, res) => {
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

server.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
