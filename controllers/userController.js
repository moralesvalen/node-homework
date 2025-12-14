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

  return res.status(201).json({ user: { name, email } });
};

// LOGON
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
};

// LOGOFF
const logoff = (req, res) => {
  setLoggedOnUser(null);
  return res.status(200).json({ message: "logged off" });
};

module.exports = { register, logon, logoff };
