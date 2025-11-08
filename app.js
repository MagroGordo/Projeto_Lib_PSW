const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const options = require("./scripts/options.json").server;
const handler = require("./scripts/request-handlers");
const app = express();

//middlewares
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
  secret: "super_hiper_mega_ultra_escondido_invisivel_segredo",
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24, // 24 horas
  }
}));

//verifica se tem sessão iniciada para páginas protegidas
function isLoggedIn(req, res, next) {
  if (req.session.loggedUser) return next();
  return res.redirect("./login.html");
}

//verifica se já tem sessão iniciada para páginas de login/signup
function alreadyLogged(req, res, next) {
  if (req.session.loggedUser) return res.redirect("./dashboard.html");
  return next();
}

//rotas
app.post("/signup", handler.signup);
app.post("/login", handler.login);
app.get("/logout", handler.logout);

app.get("/books", isLoggedIn, handler.getBooks);
app.get("/books/:id", isLoggedIn, handler.getBook);
app.get("/ratings/:book_id", isLoggedIn, handler.getRatings);
app.get("/books/:book_id/status", isLoggedIn, handler.getBookStatus);
app.post("/books/:book_id/toggle-read", isLoggedIn, handler.toggleReadStatus);
app.post("/books/:book_id/toggle-favorite", isLoggedIn, handler.toggleFavoriteStatus);
app.get("/dashboard", isLoggedIn, handler.getUserDashboard);

//páginas bloqueadas para se não tiver sessão iniciada
app.get("/dashboard.html", isLoggedIn, (req, res) => {
  res.sendFile(__dirname + "/www/dashboard.html");
});
app.get("/search_books.html", isLoggedIn, (req, res) => {
  res.sendFile(__dirname + "/www/search_books.html");
});
app.get("/profile.html", isLoggedIn, (req, res) => {
  res.sendFile(__dirname + "/www/profile.html");
});
app.get("/book.html", isLoggedIn, (req, res) => {
  res.sendFile(__dirname + "/www/book.html");
});

//páginas de login/signup bloqueadas se já tiver sessão iniciada
app.get("/login.html", alreadyLogged, (req, res) => {
  res.sendFile(__dirname + "/www/login.html");
});
app.get("/signup.html", alreadyLogged, (req, res) => {
  res.sendFile(__dirname + "/www/signup.html");
});

app.get("/check-session", (req, res) => {
  if (req.session.loggedUser)
    return res.json({ message: "ok", user: req.session.loggedUser });
  return res.json({ message: "sem sessão" });
});

app.use(express.static("www"));

app.listen(options.port, function () {
  console.log("A ouvir em http://localhost:" + options.port);
});