const {
  storedUsers,
  addUser,
  setLoggedOnUser,
} = require("../util/memoryStore");

const { userSchema } = require("../validation/userSchema");
const crypto = require("crypto");
const util = require("util");

const scrypt = util.promisify(crypto.scrypt);

//helper function
async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = await scrypt(password, salt, 64);
  return `${salt}:${derivedKey.toString("hex")}`;
}

async function comparePassword(inputPassword, storedHash) {
  const [salt, key] = storedHash.split(":");
  const keyBuffer = Buffer.from(key, "hex");
  const derivedKey = await scrypt(inputPassword, salt, 64);
  return crypto.timingSafeEqual(keyBuffer, derivedKey);
}

// REGISTER
const register = async (req, res) => {
  if (!req.body) req.body = {};

  const { error, value } = userSchema.validate(req.body, {
    abortEarly: false,
  });

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  const hashedPassword = await hashPassword(value.password);

  const newUser = {
    name: value.name,
    email: value.email,
    hashedPassword,
  };

  addUser(newUser);
  setLoggedOnUser(newUser);

  return res.status(201).json({
    user: { name: newUser.name, email: newUser.email },
  });
};
/*const register = (req, res) => {
  const { name, email, password } = req.body;

  const newUser = { name, email, password };

  addUser(newUser);
  setLoggedOnUser(newUser);

  // never return password

  return res.status(201).json({ user: { name, email } });
};*/

// LOGON
const logon = async (req, res) => {
  if (!req.body) req.body = {};

  const { email, password } = req.body;

  const user = storedUsers.find((u) => u.email === email);

  if (!user) {
    return res.status(401).json({ message: "Authentication Failed" });
  }

  const isValid = await comparePassword(password, user.hashedPassword);

  if (!isValid) {
    return res.status(401).json({ message: "Authentication Failed" });
  }

  setLoggedOnUser(user);

  return res.status(200).json({
    user: { name: user.name, email: user.email },
  });
};
/*
const logon = (req, res) => {
  const { email, password } = req.body;

  const user = storedUsers.find((u) => u.email === email);

  if (!user || user.password !== password) {
    return res.status(401).json({ message: "Authentication Failed" });
  }

  setLoggedOnUser(user);

  return res.status(200).json({
    user: { name: user.name, email: user.email },
  });
};*/

// LOGOFF
const logoff = (req, res) => {
  setLoggedOnUser(null);
  return res.status(200).json({ message: "logged off" });
};

module.exports = { register, logon, logoff };
