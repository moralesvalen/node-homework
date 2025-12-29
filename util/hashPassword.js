const crypto = require("crypto");

async function hashPassword(password) {
  if (!password) return null;

  return crypto.createHash("sha256").update(password).digest("hex");
}

module.exports = hashPassword;
