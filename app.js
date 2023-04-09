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
  const username = req.user ? req.user.displayName : null;
  res.render("index", { title, isLoggedIn, username });
});

app.get("/login", function (req, res, next) {
  res.render("login", {});
});

app.get(
  "/login/google",
  passport.authenticate("google", { scope: ["profile"] })
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

app.get("/channel", isLoggedIn, function (req, res, next) {
  res.render("channel", {});
});

app.get("/channel/:pageId", function (req, res, next) {
  console.log("/channel/:pageId", req.headers.referer);
  if (req.headers.referer !== "http://localhost:3000/channel") {
    // 이전 페이지가 특정한 URL이 아닌 경우
    return res.send(
      `<script>
         alert('잘못된 접근입니다.');
         history.back();      
      </script >`
    );
  }
  var number = req.params.pageId;
  res.render("channel_process", { number });
});

// 채널 1 혼잡도 정보 전송
function sendChannel1Congestion() {
  const congestion = Math.random(); // 임의의 혼잡도 정보 생성
  io.emit("channel1_congestion", congestion);
}

// 채널 2 혼잡도 정보 전송
function sendChannel2Congestion() {
  const congestion = Math.random(); // 임의의 혼잡도 정보 생성
  io.emit("channel2_congestion", congestion);
}

// 1초마다 혼잡도 정보 전송
setInterval(() => {
  sendChannel1Congestion();
  sendChannel2Congestion();
}, 1000);

// Socket.io 연결
io.on("connection", (socket) => {
  console.log("새로운 클라이언트 연결됨");

  // 클라이언트로부터 채널 1 요청 받음
  socket.on("request_channel1", () => {
    sendChannel1Congestion();
  });

  // 클라이언트로부터 채널 2 요청 받음
  socket.on("request_channel2", () => {
    sendChannel2Congestion();
  });
});

server.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
