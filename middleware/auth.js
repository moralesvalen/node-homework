const { getLoggedOnUser } = require("../util/memoryStore");

module.exports = function (req, res, next) {
  const user = getLoggedOnUser();

  if (!user) {
    return res.status(401).json({ message: "unauthorized" });
  }

  global.user_id = user;

  next();
};
