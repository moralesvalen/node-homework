const crypto = require("crypto");

async function comparePassword(password, hashedPassword) {
  if (!password || !hashedPassword) return false;

  const hash = crypto.createHash("sha256").update(password).digest("hex");

  return hash === hashedPassword;
}

module.exports = comparePassword;
