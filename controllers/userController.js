//const pool = require("../db/pg-pool");
const prisma = require("../db/prisma");
const { setLoggedOnUser } = require("../util/memoryStore");

const hashPassword = require("../util/hashPassword");
const comparePassword = require("../util/comparePassword");
const { userSchema } = require("../validation/userSchema");

// REGISTER
const register = async (req, res, next) => {
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
    const hashedPassword = await hashPassword(value.password);

    const user = await prisma.user.create({
      data: {
        email: value.email.toLowerCase(),
        name: value.name,
        hashedPassword,
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    global.user_id = user.id;

    return res.status(201).json({
      email: user.email,
      name: user.name,
    });
  } catch (err) {
    if (err.code === "P2002") {
      return res.status(400).json({ message: "Email already registered" });
    }
    return res.status(500).json({ message: err.message });
  }
};

// LOGIN
const logon = async (req, res, next) => {
  try {
    if (!req.body) req.body = {};

    let { email, password } = req.body;

    email = email.toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ message: "Authentication Failed" });
    }

    const isValid = await comparePassword(password, user.hashedPassword);

    if (!isValid) {
      return res.status(401).json({ message: "Authentication Failed" });
    }

    setLoggedOnUser(user.id);
    global.user_id = user.id;

    return res.status(200).json({
      name: user.name,
      email: user.email,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// LOGOFF
const logoff = (req, res) => {
  global.user_id = null;
  return res.status(200).json({ message: "logged off" });
};

module.exports = { register, logon, login: logon, logoff };
