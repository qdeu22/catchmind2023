var passport = require("passport");
var GoogleStrategy = require("passport-google-oauth20").Strategy;

require("dotenv").config();
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.client_id,
      clientSecret: process.env.client_secret,
      callbackURL: process.env.redirect_uris,
    },
    function (accessToken, refreshToken, profile, done) {
      done(null, profile);
    }
  )
);

passport.serializeUser(function (user, done) {
  console.log("serializeUser", user.emails[0].value);
  done(null, user);
});

passport.deserializeUser(function (user, done) {
  console.log("deserializeUser", user.emails[0].value);
  done(null, user);
});

module.exports = passport;
