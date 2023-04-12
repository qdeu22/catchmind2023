const express = require("express");
const router = express.Router();
var passport = require("../lib/passport");

router.get("/", function (req, res, next) {
  res.render("login", {});
});

router.get("/google", passport.authenticate("google", { scope: ["profile"] }));

module.exports = router;
