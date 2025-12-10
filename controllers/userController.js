const {
  storedUsers,
  addUser,
  setLoggedOnUser,
} = require("../util/memoryStore");

// REGISTER
const register = (req, res) => {
  const { name, email, password } = req.body;

  const newUser = { name, email, password };

  addUser(newUser);
  setLoggedOnUser(newUser);

  // never return password
  const responseUser = { name, email };

  return res.status(201).json({ user: responseUser });
};

// LOGON
const logon = (req, res) => {
  const { email, password } = req.body;

  const user = storedUsers.find((u) => u.email === email);

  if (!user || user.password !== password) {
    return res.status(401).json({ message: "Authentication Failed" });
  }

  setLoggedOnUser(user);

  const responseUser = { name: user.name, email: user.email };
  return res.status(200).json({ user: responseUser });
};

// LOGOFF
const logoff = (req, res) => {
  setLoggedOnUser(null);
  return res.status(200).json({ message: "logged off" });
};

module.exports = { register, logon, logoff };
