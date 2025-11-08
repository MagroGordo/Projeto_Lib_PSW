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

module.exports.getGenres = (req, res) => {
  const conn = getConnection();
  conn.query("SELECT id, name FROM genres ORDER BY name ASC", (err, rows) => {
    conn.end();
    if (err) {
      console.error("Error fetching genres:", err);
      return res.json({ message: "db_error" });
    }
    res.json({ message: "ok", data: rows });
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
 * Adiciona uma review
 */
module.exports.addBookReview = (req, res) => {
  const userId = req.session.loggedUser?.id;
  const { book_id } = req.params;
  const { rating, comment } = req.body;

  if (!userId) return res.json({ message: "not_logged" });
  if (!rating || !comment) return res.json({ message: "missing_fields" });

  const conn = getConnection();

  // Verifica se já fez review antes
  conn.query(
    "SELECT id FROM ratings WHERE user_id = ? AND book_id = ?",
    [userId, book_id],
    (errCheck, rows) => {
      if (errCheck) {
        console.error("❌ Erro ao verificar review:", errCheck);
        conn.end();
        return res.json({ message: "db_error" });
      }

      if (rows.length > 0) {
        conn.end();
        return res.json({ message: "already_reviewed" });
      }

      // Insere nova review
      const sql =
        "INSERT INTO ratings (user_id, book_id, rating, comment, created_at) VALUES (?, ?, ?, ?, NOW())";

      conn.query(sql, [userId, book_id, rating, comment], (errInsert) => {
        if (errInsert) {
          console.error("❌ Erro ao inserir review:", errInsert);
          conn.end();
          return res.json({ message: "db_error" });
        }

        // Busca username para mostrar no retorno
        conn.query(
          "SELECT username FROM users WHERE id = ?",
          [userId],
          (errUser, resultUser) => {
            conn.end();

            const username = resultUser?.[0]?.username || "User";
            res.json({
              message: "ok",
              data: { username },
            });
          }
        );
      });
    }
  );
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

/**
 * Retorna os 10 utilizadores com login mais recente
 */
module.exports.getTopRecentLogins = (req, res) => {
  const conn = getConnection();
  const sql = `
    SELECT username, updated_at AS last_login
    FROM users
    WHERE updated_at IS NOT NULL
    ORDER BY updated_at DESC
    LIMIT 10;
  `;

  conn.query(sql, (err, rows) => {
    conn.end();
    if (err) {
      console.error("❌ Erro ao buscar logins recentes:", err);
      return res.json({ message: "db_error" });
    }

    res.json({ message: "ok", data: rows });
  });
};

/**
 * Retorna os 10 utilizadores com mais livros lidos
 */
module.exports.getTopReaders = (req, res) => {
  const conn = getConnection();
  const sql = `
    SELECT u.username, COUNT(bus.book_id) AS read_count
    FROM users u
    JOIN books_users_status bus ON u.id = bus.user_id
    WHERE bus.is_read = 1
    GROUP BY u.id
    ORDER BY read_count DESC
    LIMIT 10;
  `;

  conn.query(sql, (err, rows) => {
    conn.end();
    if (err) {
      console.error("❌ Erro ao buscar top leitores:", err);
      return res.json({ message: "db_error" });
    }

    res.json({ message: "ok", data: rows });
  });
};

module.exports.addBook = (req, res) => {
  const { title, author, isbn, year, genre, description, page_count, editor } = req.body;

  if (!title || !author || !isbn || !year || !genre || !page_count || !editor) {
    return res.json({ message: "missing_fields" });
  }

  const conn = getConnection();

  // obter id do género pelo nome (ou adapta se já envias o id)
  const genreSQL = "SELECT id FROM genres WHERE name = ?";
  conn.query(genreSQL, [genre], (err, rows) => {
    if (err) {
      conn.end();
      console.error("Error checking genre:", err);
      return res.json({ message: "db_error" });
    }

    const genreId = rows.length > 0 ? rows[0].id : null;

    const insertSQL = `
      INSERT INTO books (
        title, author, isbn, publication_year, genre_id, description, page_count, editor, image
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL)
    `;

    conn.query(
      insertSQL,
      [title, author, isbn, year, genreId, description, page_count, editor],
      (err2, result) => {
        if (err2) {
          conn.end();
          console.error("Error inserting book:", err2);
          return res.json({ message: "db_error" });
        }

        // caminho automático: images/<id>.jpg
        const imagePath = `images/${result.insertId}.jpg`;
        const updateSQL = "UPDATE books SET image = ? WHERE id = ?";

        conn.query(updateSQL, [imagePath, result.insertId], (err3) => {
          conn.end();
          if (err3) {
            console.error("Error updating image path:", err3);
            return res.json({ message: "db_error" });
          }

          res.json({ message: "ok", id: result.insertId, image: imagePath });
        });
      }
    );
  });
};

/**
 * POST - Atualiza livro existente
 */
module.exports.updateBook = (req, res) => {
  const { id } = req.params;
  const { title, author, isbn, year, genre, description, page_count, editor } = req.body;

  if (!title || !author || !isbn || !year || !genre || !page_count || !editor) {
    return res.json({ message: "missing_fields" });
  }

  const conn = getConnection();

  const genreSQL = "SELECT id FROM genres WHERE name = ?";
  conn.query(genreSQL, [genre], (err, rows) => {
    if (err) {
      conn.end();
      console.error("Error checking genre:", err);
      return res.json({ message: "db_error" });
    }

    const genreId = rows.length > 0 ? rows[0].id : null;
    const imagePath = `images/${id}.jpg`;

    const updateSQL = `
      UPDATE books
      SET title=?, author=?, isbn=?, publication_year=?, genre_id=?, 
          description=?, page_count=?, editor=?, image=?
      WHERE id=?;
    `;

    conn.query(
      updateSQL,
      [title, author, isbn, year, genreId, description, page_count, editor, imagePath, id],
      (err2) => {
        conn.end();
        if (err2) {
          console.error("Error updating book:", err2);
          return res.json({ message: "db_error" });
        }
        res.json({ message: "ok" });
      }
    );
  });
};

/**
 * POST - Elimina um livro
 */
module.exports.deleteBook = (req, res) => {
  const { id } = req.params;
  const conn = getConnection();

  conn.query("DELETE FROM books WHERE id = ?", [id], (err) => {
    conn.end();
    if (err) {
      console.error("Erro ao eliminar livro:", err);
      return res.json({ message: "db_error" });
    }
    res.json({ message: "ok" });
  });
};