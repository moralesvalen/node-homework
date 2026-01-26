const prisma = require("../db/prisma");
const { userSchema } = require("../validation/userSchema");
const { StatusCodes } = require("http-status-codes");
const bcrypt = require("bcryptjs");
const { randomUUID } = require("crypto");
const jwt = require("jsonwebtoken");

//helpers JWT

const cookieFlags = (req) => {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Strict",
  };
};

const setJwtCookie = (req, res, user) => {
  const payload = { id: user.id, csrfToken: randomUUID() };

  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });

  res.cookie("jwt", token, {
    ...cookieFlags(req),
    maxAge: 60 * 60 * 1000, // 1 hora
  });

  return payload.csrfToken;
};

// REGISTER

const register = async (req, res) => {
  const { error, value } = userSchema.validate(req.body);

  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  try {
    const hashedPassword = await bcrypt.hash(value.password, 10);

    const user = await prisma.user.create({
      data: {
        name: value.name,
        email: value.email.toLowerCase(),
        hashedPassword,
      },
    });

    const csrfToken = setJwtCookie(req, res, user);

    return res.status(201).json({
      name: user.name,
      email: user.email,
      csrfToken,
    });
  } catch (err) {
    if (err.code === "P2002") {
      // 🔴 TEST ESPERA 400, NO 409
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

    const isValid = await bcrypt.compare(password, user.hashedPassword);

    if (!isValid) {
      return res.status(401).json({ message: "Authentication Failed" });
    }

    const csrfToken = setJwtCookie(req, res, user);

    return res.status(StatusCodes.OK).json({
      name: user.name,
      email: user.email,
      csrfToken,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// LOGOFF
const logoff = (req, res) => {
  res.clearCookie("jwt", cookieFlags(req));
  return res.status(200).json({ message: "logged off" });
};
// GET USER BY ID
const getUser = async (req, res) => {
  const id = parseInt(req.params.id, 10);

  if (isNaN(id)) {
    return res.status(400).json({
      error: "Invalid user ID",
    });
  }

  let select;

  if (req.query.fields) {
    const fields = req.query.fields.split(",");
    select = {};

    for (const field of fields) {
      select[field] = true;
    }
  } else {
    select = {
      id: true,
      name: true,
      email: true,
      createdAt: true,
    };
  }

  const user = await prisma.user.findUnique({
    where: { id },
    select: select,
  });

  if (!user) {
    return res.status(404).json({
      error: "User not found",
    });
  }

  return res.status(200).json(user);
};
module.exports = { register, logon, login: logon, logoff, getUser };
