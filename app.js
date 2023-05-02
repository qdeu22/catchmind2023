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

const canvasIO = io.of("/canvas");

// 소켓 연결
canvasIO.on("connection", (socket) => {
  console.log("canvas connected");

  socket.on("draw", (data) => {
    // console.log(data);
    socket.broadcast.emit("draw", data);
  });

  socket.on("game-start", () => {
    socket.broadcast.emit("game-start", { drawingToolStatus: true });
  });

  socket.on("disconnect", () => {
    console.log("canvas disconnected");
  });
});

var chat_members = 0;

var connectedUserList = [];

// 채팅 연결
const chatIO = io.of("/chat");
chatIO.on("connection", (socket) => {
  console.log("A user connected to chat");

  chat_members++;

  // 클라이언트에서 message 이벤트를 받으면 다른 클라이언트에게 메시지를 전송
  socket.on("message", (data) => {
    socket.broadcast.emit("message", data);
  });

  socket.on("members", () => {
    chatIO.emit("members", chat_members);
  });

  var username;

  socket.on("userlist", (data) => {
    username = data.username;
    connectedUserList.push(username);
    chatIO.emit("userlist", connectedUserList);
  });

  socket.on("game-start", () => {
    socket.broadcast.emit("game-start");
  });

  socket.on("disconnect", () => {
    chat_members--;
    chatIO.emit("members", chat_members);

    const index = connectedUserList.indexOf(username); // 연결이 끊긴 사용자의 인덱스
    if (index !== -1) {
      connectedUserList.splice(index, 1); // 배열에서 사용자 제거
      console.log("User disconnected:", username);
    }
    chatIO.emit("userlist", connectedUserList);

    console.log("chat disconnected");
  });
});

server.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
