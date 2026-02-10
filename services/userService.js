const prisma = require("../db/prisma");
const bcrypt = require("bcrypt");

/* ================================
   CREATE USER
================================ */
async function createUser({ name, email, password }) {
  const hashedPassword = await bcrypt.hash(password, 10);

  return prisma.user.create({
    data: {
      name,
      email,
      hashedPassword,
      role: "user", // default
    },
  });
}

/* ================================
   VERIFY USER PASSWORD
================================ */
async function verifyUserPassword(email, inputPassword) {
  const user = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
  });

  if (!user) return { user: null, isValid: false };

  const isValid = await bcrypt.compare(inputPassword, user.hashedPassword);

  return { user, isValid };
}

module.exports = {
  createUser,
  verifyUserPassword,
};
