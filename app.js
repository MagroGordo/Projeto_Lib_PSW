const express = require("express");
const bodyParser = require("body-parser");
const options = require("./scripts/options.json").server;
const handler = require("./scripts/request-handlers");
const app = express();

app.use(express.static("www"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/books/:id", handler.getBook);
app.get("/books", handler.getBooks);

app.listen(options.port, function () {
    console.log("Server running at http://localhost:"+options.port);
});