const mysql = require("mysql2");
const options = require("../scripts/options.json").database;

// devolve todos os livros
module.exports.getBooks = (req, res) => {
  var connection = mysql.createConnection(options);
  var sql = "SELECT * FROM books";

  connection.query(sql, function (err, rows) {
    if (err) {
      console.error("Erro ao buscar livros:", err);
      res.json({ message: "Erro" });
    } else {
      res.json({ message: "ok", data: rows });
    }
    connection.end();
  });
};

module.exports.getBook = (req, res) => {
  var connection = mysql.createConnection(options);
  var sql = mysql.format("SELECT * FROM books WHERE id = ?", [req.params.id]);

  connection.query(sql, function (err, rows) {
    if (err) {
      console.error("Erro ao buscar livro:", err);
      res.json({ message: "Erro" });
    } else {
      res.json({ message: "ok", data: rows });
    }
    connection.end();
  });
};
