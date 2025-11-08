const mysql = require("mysql2");
const bcrypt = require("bcrypt");
const options = require("./options.json").database;

function getConnection() {
  return mysql.createConnection({
    host: options.host,
    user: options.user,
    password: options.password,
    database: options.database,
  });
}

module.exports.signup = (req, res) => {
  const { username, email, password } = req.body;

  // Verificar campos
  if (!username || !email || !password) {
    return res.json({ message: "missing_fields" });
  }

  // Validar formato de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.json({ message: "invalid_email" });
  }

  const conn = getConnection();

  // Verificar se email já existe
  const checkSQL = "SELECT id FROM users WHERE email = ?";
  conn.query(checkSQL, [email], (err, rows) => {
    if (err) {
      console.error("Erro ao verificar email:", err);
      conn.end();
      return res.json({ message: "db_error" });
    }

    if (rows.length > 0) {
      conn.end();
      return res.json({ message: "user_exists" });
    }

    // Encriptar password
    bcrypt.hash(password, 10, (err, hash) => {
      if (err) {
        console.error("Erro ao encriptar password:", err);
        conn.end();
        return res.json({ message: "hash_error" });
      }

      // Inserir novo user
      const insertSQL =
        "INSERT INTO users (username, email, password, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())";
      conn.query(insertSQL, [username, email, hash], (err, result) => {
        if (err) {
          console.error("Erro ao criar utilizador:", err);
          conn.end();
          return res.json({ message: "db_error" });
        }

        // Login automático após registo
        req.session.loggedUser = { id: result.insertId, email: email };
        conn.end();
        res.json({ message: "ok" });
      });
    });
  });
};

module.exports.login = (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.json({ message: "missing_fields" });
  }

  const conn = getConnection();
  const sql = "SELECT * FROM users WHERE email = ?";

  conn.query(sql, [email], (err, rows) => {
    if (err) {
      console.error("Erro no login:", err);
      conn.end();
      return res.json({ message: "db_error" });
    }

    if (rows.length === 0) {
      conn.end();
      return res.json({ message: "invalid" });
    }

    const user = rows[0];

    // Comparar password
    bcrypt.compare(password, user.password, (err, valid) => {
      if (err) {
        console.error("Erro ao comparar password:", err);
        conn.end();
        return res.json({ message: "compare_error" });
      }

      if (!valid) {
        conn.end();
        return res.json({ message: "invalid" });
      }

      // Criar sessão
      req.session.loggedUser = {
        id: user.id,
        email: user.email,
        username: user.username,
      };

      // Atualizar data de último login
      const updateSQL = "UPDATE users SET updated_at = NOW() WHERE id = ?";
      conn.query(updateSQL, [user.id], (err2) => {
        if (err2) console.warn("Aviso ao atualizar data:", err2);
        conn.end();
        res.json({ message: "ok", email: user.email });
      });
    });
  });
};

module.exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Erro ao terminar sessão:", err);
      return res.json({ message: "error" });
    }
    res.json({ message: "ok" });
  });
};

/**
 * BUSCAR TODOS OS LIVROS (com nome do género)
 */
module.exports.getBooks = (req, res) => {
  const conn = getConnection();
  const sql = `
    SELECT 
      b.*, 
      g.name AS genre_name
    FROM books b
    LEFT JOIN genres g ON b.genre_id = g.id
    ORDER BY g.name, b.title;
  `;

  conn.query(sql, (err, rows) => {
    conn.end();
    if (err) {
      console.error("Erro ao buscar livros:", err);
      return res.json({ message: "erro" });
    }

    res.json({ message: "ok", data: rows });
  });
};

/**
 * BUSCAR UM LIVRO POR ID (com nome do género)
 */
module.exports.getBook = (req, res) => {
  const conn = getConnection();
  const sql = `
    SELECT 
      b.*, 
      g.name AS genre_name
    FROM books b
    LEFT JOIN genres g ON b.genre_id = g.id
    WHERE b.id = ?;
  `;

  conn.query(sql, [req.params.id], (err, rows) => {
    conn.end();
    if (err || rows.length === 0) {
      console.error("Erro ao buscar livro:", err);
      return res.json({ message: "erro" });
    }

    res.json({ message: "ok", data: rows });
  });
};

// Estado atual (lido/favorito) para este user e livro
module.exports.getBookStatus = (req, res) => {
  if (!req.session.loggedUser) return res.json({ message: "not_logged" });

  const conn = getConnection();
  const userId = req.session.loggedUser.id;
  const bookId = req.params.book_id;

  const sql = `
    SELECT is_read, is_favorite
    FROM books_users_status
    WHERE user_id = ? AND book_id = ?
  `;

  conn.query(sql, [userId, bookId], (err, rows) => {
    conn.end();
    if (err) {
      console.error("Erro ao obter status do livro:", err);
      return res.json({ message: "db_error" });
    }

    if (rows.length === 0) {
      // Nenhum registro ainda
      return res.json({
        message: "ok",
        data: { is_read: 0, is_favorite: 0 },
      });
    }

    res.json({ message: "ok", data: rows[0] });
  });
};

// Toggle "lido"
// =============================
// TOGGLE READ
// =============================
module.exports.toggleReadStatus = (req, res) => {
  if (!req.session.loggedUser) return res.json({ message: "not_logged" });
  const conn = getConnection();
  const userId = req.session.loggedUser.id;
  const bookId = req.params.book_id;

  const checkSQL = "SELECT is_read FROM books_users_status WHERE user_id=? AND book_id=?";
  conn.query(checkSQL, [userId, bookId], (err, rows) => {
    if (err) {
      console.error("DB error:", err);
      conn.end();
      return res.json({ message: "db_error" });
    }

    if (rows.length > 0) {
      // Já existe, alternar valor
      const newVal = rows[0].is_read ? 0 : 1;
      conn.query(
        "UPDATE books_users_status SET is_read=? WHERE user_id=? AND book_id=?",
        [newVal, userId, bookId],
        (err2) => {
          conn.end();
          if (err2) {
            console.error("Erro no update:", err2);
            return res.json({ message: "db_error" });
          }
          res.json({ message: "ok", is_read: newVal });
        }
      );
    } else {
      // Não existe, inserir
      const insertSQL =
        "INSERT INTO books_users_status (user_id, book_id, is_read, is_favorite) VALUES (?, ?, 1, 0)";
      conn.query(insertSQL, [userId, bookId], (err3) => {
        conn.end();
        if (err3) {
          console.error("Erro no insert:", err3);
          return res.json({ message: "db_error" });
        }
        res.json({ message: "ok", is_read: 1 });
      });
    }
  });
};

// =============================
// TOGGLE FAVORITE
// =============================
module.exports.toggleFavoriteStatus = (req, res) => {
  if (!req.session.loggedUser) return res.json({ message: "not_logged" });

  const conn = getConnection();
  const userId = req.session.loggedUser.id;
  const bookId = req.params.book_id;

  const checkSQL = "SELECT is_favorite FROM books_users_status WHERE user_id=? AND book_id=?";
  conn.query(checkSQL, [userId, bookId], (err, rows) => {
    if (err) {
      console.error("Erro ao verificar favorito:", err);
      conn.end();
      return res.json({ message: "db_error" });
    }

    if (rows.length > 0) {
      const newVal = rows[0].is_favorite ? 0 : 1;
      const updateSQL =
        "UPDATE books_users_status SET is_favorite=? WHERE user_id=? AND book_id=?";
      conn.query(updateSQL, [newVal, userId, bookId], (err2) => {
        conn.end();
        if (err2) {
          console.error("Erro ao atualizar favorito:", err2);
          return res.json({ message: "db_error" });
        }
        res.json({ message: "ok", is_favorite: newVal });
      });
    } else {
      const insertSQL =
        "INSERT INTO books_users_status (user_id, book_id, is_read, is_favorite) VALUES (?, ?, 0, 1)";
      conn.query(insertSQL, [userId, bookId], (err3) => {
        conn.end();
        if (err3) {
          console.error("Erro ao inserir favorito:", err3);
          return res.json({ message: "db_error" });
        }
        res.json({ message: "ok", is_favorite: 1 });
      });
    }
  });
};

module.exports.getRatings = (req, res) => {
  const conn = getConnection();
  const sql = mysql.format(
    `SELECT r.rating, r.comment, r.created_at, u.username
     FROM ratings r
     JOIN users u ON r.user_id = u.id
     WHERE r.book_id = ?
     ORDER BY r.created_at DESC`,
    [req.params.book_id]
  );

  conn.query(sql, (err, rows) => {
    conn.end();
    if (err) {
      console.error("Erro ao buscar ratings:", err);
      return res.json({ message: "erro" });
    }

    res.json({ message: "ok", data: rows });
  });
};

/**
 * DASHBOARD — Retorna livros favoritos e lidos do utilizador autenticado
 */
module.exports.getUserDashboard = (req, res) => {
  const userId = req.session.loggedUser?.id;
  if (!userId) {
    return res.json({ message: "not_logged" });
  }

  const conn = getConnection();

  const sql = `
    SELECT b.id, b.title, b.author, b.image
    FROM books b
    JOIN books_users_status s ON b.id = s.book_id
    WHERE s.user_id = ? AND s.is_favorite = 1;
  `;

  const sqlRead = `
    SELECT b.id, b.title, b.author, b.image
    FROM books b
    JOIN books_users_status s ON b.id = s.book_id
    WHERE s.user_id = ? AND s.is_read = 1;
  `;

  // primeiro favoritos
  conn.query(sql, [userId], (errFav, favRows) => {
    if (errFav) {
      console.error("❌ Erro ao buscar favoritos:", errFav);
      conn.end();
      return res.json({ message: "db_error" });
    }

    // depois os lidos
    conn.query(sqlRead, [userId], (errRead, readRows) => {
      conn.end();

      if (errRead) {
        console.error("❌ Erro ao buscar livros lidos:", errRead);
        return res.json({ message: "db_error" });
      }

      res.json({
        message: "ok",
        favorites: favRows,
        read: readRows,
      });
    });
  });
};