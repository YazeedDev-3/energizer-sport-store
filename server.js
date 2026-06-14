require("dotenv").config();
const express = require("express");
const app = express();
const mysql = require("mysql2");
const cors = require("cors");
const bcrypt = require("bcrypt");
const fileUpload = require("express-fileupload");
const session = require("express-session");

// ====================
// Basic Middlewares
// ====================
app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("img_project_web1"));
app.use(fileUpload());

// ====================
// Database (Pool)
// ====================
const con = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// ====================
// Session
// ====================
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    saveUninitialized: false,
    resave: false,
  })
);

// ====================
// Auth Middlewares
// ====================
function requireLogin(req, res, next) {
  if (req.session?.username) return next();
  res.redirect("/login?next=" + encodeURIComponent(req.originalUrl));
}

function requireAdmin(req, res, next) {
  if (req.session?.userrole === "admin") return next();
  res.redirect("/login?next=" + encodeURIComponent(req.originalUrl));
}

// ====================
// Products APIs
// ====================
app.post("/process_insert", requireAdmin, (req, res) => {
  const { title, description, price, cata } = req.body;

  if (!req.files?.upfile) {
    return res.status(400).send("No file uploaded");
  }

  const image = req.files.upfile.name;
  const uploadPath = `${process.cwd()}/img_project_web1/${image}`;

  req.files.upfile.mv(uploadPath, (err) => {
    if (err) return res.status(500).send(err);

    const sql =
      "INSERT INTO products (title, description, price, cata, image) VALUES (?, ?, ?, ?, ?)";
    con.query(sql, [title, description, price, cata, image], (err) => {
      if (err) return res.status(500).send("Database error");
      res.end("Product successfully added");
    });
  });
});

app.get("/process_index", (req, res) => {
  con.query("SELECT * FROM products", (err, rows) => {
    if (err) return res.status(500).json(err);
    res.json(rows);
  });
});

app.get("/api/products/search", (req, res) => {
  const q = (req.query.q || "").trim();
  if (!q) return res.json([]);
  con.query(
    "SELECT id, title, image FROM products WHERE title LIKE ? LIMIT 8",
    [`%${q}%`],
    (err, rows) => {
      if (err) return res.status(500).json([]);
      res.json(rows);
    }
  );
});

app.get("/process_detail", (req, res) => {
  con.query(
    "SELECT * FROM products WHERE LOWER(title) = LOWER(?)",
    [req.query.title],
    (err, rows) => {
      if (err || rows.length === 0) return res.json({});
      res.json(rows[0]);
    }
  );
});

app.delete("/process_delete", requireAdmin, (req, res) => {
  con.query(
    "DELETE FROM products WHERE title = ?",
    [req.query.title],
    (err, result) => {
      if (result?.affectedRows > 0) res.send("Deleted");
      else res.send("Not deleted");
    }
  );
});

app.put("/process_update", requireAdmin, (req, res) => {
  const { title, description, price, cata } = req.body;

  const doUpdate = (image) => {
    let sql, params;
    if (image) {
      sql =
        "UPDATE products SET description=?, price=?, cata=?, image=? WHERE title=?";
      params = [description, price, cata, image, title];
    } else {
      sql = "UPDATE products SET description=?, price=?, cata=? WHERE title=?";
      params = [description, price, cata, title];
    }
    con.query(sql, params, (err) => {
      if (err) return res.status(500).send("Database error");
      res.end("Product successfully updated");
    });
  };

  if (req.files?.upfile) {
    const image = req.files.upfile.name;
    req.files.upfile.mv(`${process.cwd()}/img_project_web1/${image}`, (err) => {
      if (err) return res.status(500).send(err);
      doUpdate(image);
    });
  } else {
    doUpdate(null);
  }
});

// ====================
// Auth (Register & Login)
// ====================
app.post("/process_registration", (req, res) => {
  const { username, password, email } = req.body;

  bcrypt.hash(password, 10, (err, hash) => {
    if (err) return res.redirect("/register?error=server");

    const sql =
      "INSERT INTO users (username, password, role, email) VALUES (?, ?, 'customer', ?)";
    con.query(sql, [username, hash, email], (err) => {
      if (err) return res.redirect("/register?error=taken");
      res.redirect("/login");
    });
  });
});

app.post("/loginprocess", (req, res) => {
  const { username, password, next } = req.body;
  const redirectTo =
    next && next.startsWith("/") && !next.startsWith("//") ? next : "/home";
  const errorRedirect =
    "/login?error=invalid" + (next ? "&next=" + encodeURIComponent(next) : "");

  con.query(
    "SELECT * FROM users WHERE username = ?",
    [username],
    (err, rows) => {
      if (err || rows.length === 0) return res.redirect(errorRedirect);

      const user = rows[0];

      bcrypt.compare(password, user.password, (err, match) => {
        if (!match) return res.redirect(errorRedirect);

        req.session.userId = user.id;
        req.session.username = user.username;
        req.session.userrole = user.role;
        res.redirect(redirectTo);
      });
    }
  );
});

// ====================
// Orders
// ====================
app.post("/process_buy", requireLogin, (req, res) => {
  const { total, note, paymentType } = req.body;
  const userId = req.session.userId;

  const sql =
    "INSERT INTO orders (user_id, total, note, payment_type) VALUES (?, ?, ?, ?)";
  con.query(sql, [userId, total, note, paymentType], (err) => {
    if (err) return res.json({ error: "Failed to process order" });
    res.json({ message: "Order placed successfully!" });
  });
});

app.get("/api/my-orders", requireLogin, (req, res) => {
  const userId = req.session.userId;
  con.query(
    "SELECT id, total, payment_type, note, created_at FROM orders WHERE user_id = ? ORDER BY created_at DESC",
    [userId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: "Database error" });
      res.json(rows);
    }
  );
});

// ====================
// Admin APIs
// ====================
app.get("/api/admin/users", requireAdmin, (req, res) => {
  con.query(
    "SELECT id, username, email, role, created_at FROM users ORDER BY id",
    (err, rows) => {
      if (err) return res.status(500).json({ error: "Database error" });
      res.json(rows);
    }
  );
});

app.post("/api/admin/users", requireAdmin, (req, res) => {
  const { username, email, password, role } = req.body;
  if (!username || !email || !password || !role) {
    return res.status(400).json({ error: "All fields are required" });
  }
  bcrypt.hash(password, 10, (err, hash) => {
    if (err) return res.status(500).json({ error: "Server error" });
    con.query(
      "INSERT INTO users (username, password, role, email) VALUES (?, ?, ?, ?)",
      [username, hash, role, email],
      (err) => {
        if (err) return res.status(409).json({ error: "Username or email already exists" });
        res.json({ message: "User created successfully" });
      }
    );
  });
});

app.delete("/api/admin/users/:id", requireAdmin, (req, res) => {
  con.query("DELETE FROM users WHERE id = ?", [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: "Database error" });
    res.json({ message: "User deleted" });
  });
});

app.put("/api/admin/users/:id/role", requireAdmin, (req, res) => {
  con.query("SELECT role FROM users WHERE id = ?", [req.params.id], (err, rows) => {
    if (err || rows.length === 0) return res.status(404).json({ error: "User not found" });
    const newRole = rows[0].role === "admin" ? "customer" : "admin";
    con.query("UPDATE users SET role = ? WHERE id = ?", [newRole, req.params.id], (err) => {
      if (err) return res.status(500).json({ error: "Database error" });
      res.json({ role: newRole });
    });
  });
});

app.get("/api/admin/orders", requireAdmin, (req, res) => {
  const sql = `
    SELECT o.id, u.username, o.total, o.payment_type, o.note, o.created_at
    FROM orders o
    JOIN users u ON o.user_id = u.id
    ORDER BY o.created_at DESC
  `;
  con.query(sql, (err, rows) => {
    if (err) return res.status(500).json({ error: "Database error" });
    res.json(rows);
  });
});

// ====================
// Session API
// ====================
app.get("/api/session", (req, res) => {
  if (req.session?.username) {
    res.json({ loggedIn: true, username: req.session.username, role: req.session.userrole });
  } else {
    res.json({ loggedIn: false });
  }
});

// ====================
// Pages
// ====================
app.get("/", (req, res) => res.sendFile(__dirname + "/home.html"));
app.get("/home", (req, res) => res.sendFile(__dirname + "/home.html"));
app.get("/login", (req, res) => res.sendFile(__dirname + "/login.html"));
app.get("/register", (req, res) => res.sendFile(__dirname + "/register.html"));
app.get("/manage", requireAdmin, (req, res) =>
  res.sendFile(__dirname + "/manage.html")
);
app.get("/cart", requireLogin, (req, res) =>
  res.sendFile(__dirname + "/cart.html")
);
app.get("/buy", requireLogin, (req, res) =>
  res.sendFile(__dirname + "/buy.html")
);
app.get("/orders", requireLogin, (req, res) =>
  res.sendFile(__dirname + "/orders.html")
);
app.get("/search", (req, res) =>
  res.sendFile(__dirname + "/search.html")
);
app.get("/our-products", (req, res) =>
  res.sendFile(__dirname + "/our-products.html")
);

app.get("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/"));
});

// ====================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
