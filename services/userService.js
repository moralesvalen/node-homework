const prisma = require("../db/prisma");
const bcrypt = require("bcrypt");

const createUser = async ({ name, email, password }) => {
  const hashedPassword = await bcrypt.hash(password, 10);

  return prisma.user.create({
    data: {
      name,
      email,
      hashedPassword,
    },
  });
};

module.exports = { createUser };
