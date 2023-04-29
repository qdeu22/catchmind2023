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

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.render("alert", {
    message: "로그인이 필요합니다.",
    url: "/login",
  });
}

app.get("/", (req, res) => {
  const title = "캐치마인드";
  const isLoggedIn = !!req.user;
  const username = req.user ? req.user.emails[0].value : null;
  res.render("index", { title, isLoggedIn, username });
});

app.get("/login", function (req, res, next) {
  res.render("login", {});
});
app.get("/channel", isLoggedIn, function (req, res, next) {
  res.sendFile(__dirname + "/views/channel.html");
});

app.get(
  "/login/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/fail" }),
  function (req, res) {
    // Successful authentication, redirect home.
    res.redirect("/");
  }
);

app.get("/logout", isLoggedIn, function (req, res, next) {
  req.logout(function (err) {
    if (err) return next(err);
    res.redirect("/");
  });
});

// GET 요청을 받아들이고 응답을 반환하는 API 엔드포인트
app.get("/chat", (req, res) => {
  const data = { key: req.user.displayName }; // 응답으로 보낼 데이터
  res.json(data); // 데이터를 JSON 형태로 반환
});
const canvasIO = io.of("/canvas");

// 소켓 연결
canvasIO.on("connection", (socket) => {
  console.log("canvas connected");

  socket.on("draw", (data) => {
    // console.log(data);
    socket.broadcast.emit("draw", data);
  });

  socket.on("disconnect", () => {
    console.log("canvas disconnected");
  });
});

// 채팅 연결
const chatIO = io.of("/chat");
chatIO.on("connection", (socket) => {
  console.log("A user connected to chat");

  // 클라이언트에서 message 이벤트를 받으면 다른 클라이언트에게 메시지를 전송
  socket.on("message", (data) => {
    socket.broadcast.emit("message", data);
  });
  socket.on("disconnect", () => {
    console.log("chat disconnected");
  });
});
server.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
