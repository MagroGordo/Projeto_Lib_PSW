// request-handlers.js
const mysql = require("mysql2");
const bcrypt = require("bcrypt");
const options = require("./options.json").database;

/**
 * Cria uma ligação à base de dados
 */
function getConnection() {
  return mysql.createConnection({
    host: options.host,
    user: options.user,
    password: options.password,
    database: options.database,
  });
}

/**
 * SIGNUP — Registar novo utilizador
 */
module.exports.signup = async (req, res) => {
  const { username, email, password } = req.body;

  // Verificar campos obrigatórios
  if (!username || !email || !password)
    return res.json({ message: "missing_fields" });

  const conn = getConnection();

  try {
    // Verificar se o email já existe
    const [rows] = await conn.promise().query(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (rows.length > 0) {
      conn.end();
      return res.json({ message: "user_exists" });
    }

    // Encriptar password
    const hash = await bcrypt.hash(password, 10);

    // Inserir novo utilizador
    await conn
      .promise()
      .query(
        "INSERT INTO users (username, email, password, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())",
        [username, email, hash]
      );

    conn.end();
    res.json({ message: "ok" });
  } catch (err) {
    console.error("❌ Erro no signup:", err);
    conn.end();
    res.json({ message: "db_error" });
  }
};

/**
 * LOGIN — Autenticar utilizador por email e password
 */
module.exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.json({ message: "missing_fields" });

  const conn = getConnection();

  try {
    // Buscar utilizador pelo email
    const [rows] = await conn
      .promise()
      .query("SELECT * FROM users WHERE email = ?", [email]);

    if (rows.length === 0) {
      conn.end();
      return res.json({ message: "invalid" });
    }

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      conn.end();
      return res.json({ message: "invalid" });
    }

    // Criar sessão
    req.session.loggedUser = {
      id: user.id,
      email: user.email,
    };

    // Atualizar data de último login
    await conn
      .promise()
      .query("UPDATE users SET updated_at = NOW() WHERE id = ?", [user.id]);

    conn.end();

    res.json({ message: "ok", email: user.email });
  } catch (err) {
    console.error("❌ Erro no login:", err);
    conn.end();
    res.json({ message: "db_error" });
  }
};

/**
 * LOGOUT — Terminar sessão
 */
module.exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("❌ Erro no logout:", err);
      return res.json({ message: "error" });
    }
    res.json({ message: "ok" });
  });
};

module.exports.getBooks = (req, res) => {
  const conn = getConnection();
  const sql = "SELECT * FROM books";

  conn.query(sql, (err, rows) => {
    conn.end();
    if (err) {
      console.error("❌ Erro ao buscar livros:", err);
      return res.json({ message: "erro" });
    }
    res.json({ message: "ok", data: rows });
  });
};

/**
 * BUSCAR UM LIVRO POR ID
 */
module.exports.getBook = (req, res) => {
  const conn = getConnection();
  const sql = "SELECT * FROM books WHERE id = ?";
  conn.query(sql, [req.params.id], (err, rows) => {
    conn.end();
    if (err || rows.length === 0) {
      console.error("❌ Erro ao buscar livro:", err);
      return res.json({ message: "erro" });
    }
    res.json({ message: "ok", data: rows });
  });
};

/**
 * BUSCAR RATINGS / COMENTÁRIOS DE UM LIVRO
 */
module.exports.getRatings = (req, res) => {
  const conn = getConnection();
  var sql = mysql.format(`
    SELECT r.rating, r.comment, r.created_at AS date, u.username
    FROM ratings r
    JOIN users u ON r.user_id = u.id
    WHERE r.book_id = ?
    ORDER BY r.created_at DESC
  `, [req.params.book_id]);

  conn.query(sql, (err, rows) => {
    conn.end();
    if (err) {
      console.error("❌ Erro ao buscar ratings:", err);
      return res.json({ message: "erro" });
    }

    res.json({ message: "ok", data: rows });
  });
};