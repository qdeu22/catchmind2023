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

const indexRouter = require("./routes/index");
const roomRouter = require("./routes/room");

app.use("/", indexRouter);
app.use("/room", roomRouter);

require("./lib/socket/canvasIO")(io);
require("./lib/socket/chatIO")(io);
require("./lib/socket/gameIO")(io);
require("./lib/socket/timerIO")(io);

server.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
