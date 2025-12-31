const pool = require("../db/pg-pool");
const hashPassword = require("../util/hashPassword");
const comparePassword = require("../util/comparePassword");
const { userSchema } = require("../validation/userSchema");

// REGISTER
const register = async (req, res) => {
  if (!req.body) req.body = {};

  const { error, value } = userSchema.validate(req.body, {
    abortEarly: false,
  });

  if (error) {
    return res.status(400).json({
      message: "Validation failed",
      details: error.details,
    });
  }

  try {
    const hashed_password = await hashPassword(value.password);

    const result = await pool.query(
      `INSERT INTO users (email, name, hashed_password)
       VALUES ($1, $2, $3)
       RETURNING id, email, name`,
      [value.email, value.name, hashed_password]
    );

    global.user_id = result.rows[0].id;

    return res.status(201).json({
      user: {
        email: result.rows[0].email,
        name: result.rows[0].name,
      },
    });
  } catch (e) {
    if (e.code === "23505") {
      return res.status(400).json({ message: "Email already registered" });
    }
    return res.status(500).json({ message: e.message });
  }
};

// LOGIN  ✅ (EL TEST USA ESTE NOMBRE)
const login = async (req, res) => {
  if (!req.body) req.body = {};

  const { email, password } = req.body;

  const result = await pool.query("SELECT * FROM users WHERE email = $1", [
    email,
  ]);

  if (result.rows.length === 0) {
    return res.status(401).json({ message: "Authentication Failed" });
  }

  const user = result.rows[0];
  const isValid = await comparePassword(password, user.hashed_password);

  if (!isValid) {
    return res.status(401).json({ message: "Authentication Failed" });
  }

  global.user_id = user.id;

  return res.status(200).json({
    user: {
      name: user.name,
      email: user.email,
    },
  });
};

// LOGOFF
const logoff = (req, res) => {
  global.user_id = null;
  return res.status(200).json({ message: "logged off" });
};

module.exports = { register, login, logoff };
