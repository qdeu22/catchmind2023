const express = require("express");
const router = express.Router();
var passport = require("../lib/passport");

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.render("alert", {
    message: "로그인이 필요합니다.",
    url: "/login",
  });
}

router.get("/", (req, res) => {
  const title = "캐치마인드";
  const isLoggedIn = !!req.user;
  const username = req.user ? req.user.displayName : null;
  res.render("index", { title, isLoggedIn, username });
});

router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/fail" }),
  function (req, res) {
    // Successful authentication, redirect home.
    res.redirect("/");
  }
);

router.get("/logout", isLoggedIn, function (req, res, next) {
  req.logout(function (err) {
    if (err) return next(err);
    res.redirect("/");
  });
});

module.exports = router;
