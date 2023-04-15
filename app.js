const express = require("express");
const http = require("http");
const path = require("path");
const app = express();
const port = 3000;

const server = http.createServer(app);
const socketIO = require("socket.io");
const io = socketIO(server);

var passport = require("./lib/passport");
var session = require("express-session");

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

app.use(
  //+
  session({
    secret: "keyboard cat",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);

app.use(passport.initialize()); //+
app.use(passport.session()); //+

app.use(express.static(path.join(__dirname, "src")));

var indexRouter = require("./routes/index");
var loginRouter = require("./routes/login");

app.use("/", indexRouter);
app.use("/login", loginRouter);

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.render("alert", {
    message: "로그인이 필요합니다.",
    url: "/login",
  });
}

var username = null;
app.get("/channel", isLoggedIn, function (req, res, next) {
  username = req.user.displayName;
  res.sendFile(__dirname + "/views/channel.html");
});

// app.get("/channel/:pageId", function (req, res, next) {
//   if (req.headers.referer !== "http://localhost:3000/channel") {
//     // 이전 페이지가 특정한 URL이 아닌 경우
//     return res.send(
//       `<script>
//          alert('잘못된 접근입니다.');
//          history.back();
//       </script >`
//     );
//   }
//   res.sendFile(__dirname + `/views/${req.params.pageId}`);
// });
app.get("/channel/group", function (req, res, next) {
  const username = req.user ? req.user.displayName : null;
  res.render("group", { username });
});

// 방문자 수 저장 변수
let visitors = 0;

// 소켓 연결
io.on("connection", (socket) => {
  // 새로운 방문자 접속 시 visitors 변수를 증가시키고, 모든 클라이언트에게 방문자 수를 전달합니다.
  visitors++;
  io.emit("visitorsUpdated", visitors);

  // 방문자가 연결을 끊을 때마다 visitors 변수를 감소시키고, 모든 클라이언트에게 방문자 수를 전달합니다.
  socket.on("disconnect", () => {
    visitors--;
    io.emit("visitorsUpdated", visitors);
  });
});

const groupChat = io.of("/groupChat");

// room 네임스페이스에 대한 이벤트 리스너 등록
groupChat.on("connection", (socket) => {
  console.log("room 네임스페이스에 접속");

  // chat message 이벤트 리스너 등록
  socket.on("chat message", (message) => {
    console.log("받은 메시지: " + message);

    const param = {
      name: username,
      msg: message,
    };

    // 모든 클라이언트에게 메시지 전송
    io.of("/groupChat").emit("chat message", param);
  });

  // 접속 해제 이벤트 리스너 등록
  socket.on("disconnect", () => {
    console.log("room 네임스페이스 접속 해제");
  });
});

server.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
