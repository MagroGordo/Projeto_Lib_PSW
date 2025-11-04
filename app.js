const express = require("express");
const bodyParser = require("body-parser");
const options = require("./config/options.json").server;
const handler = require("./scripts/request-handlers");
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("www"));

app.get("/book", handler.getBooks);

app.listen(options.port, function () {
    console.log("Server running at http://localhost:"+options.port);
});