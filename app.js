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
  res.render("channel");
});

app.get("/channel/:pageId", function (req, res, next) {
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

server.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
