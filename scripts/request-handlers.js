const mysql = require("mysql2");
const options = require("../config/options").database;

module.exports.getBooks = (req, res) => {
    const conn = mysql.createConnection(options);
    var query = "SELECT * FROM books";
    conn.query(query, (err, rows, fields) => {
        if(err){
            res.json({"message":"erro"});
        } else {
            res.json({"message":"ok","rows":rows,"fields":fields});
        }
    });
    conn.end();
}