const express = require("express");
const session = require("express-session");
const options = require("./scripts/options.json").server;
const handler = require("./scripts/request-handlers");
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: "super_hiper_mega_ultra_escondido_invisivel_segredo",
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24,
  }
}));

function isLoggedIn(req, res, next) {
  if (req.session.loggedUser) return next();
  return res.redirect("./login.html");
}

function alreadyLogged(req, res, next) {
  if (req.session.loggedUser) return res.redirect("./dashboard.html");
  return next();
}

app.use(express.static("www"));

app.listen(options.port, function () {
  console.log("A ouvir em http://localhost:" + options.port);
});