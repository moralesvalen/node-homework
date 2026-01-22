const prisma = require("../db/prisma");
const { setLoggedOnUser } = require("../util/memoryStore");

const comparePassword = require("../util/comparePassword");
const { userSchema } = require("../validation/userSchema");
const { StatusCodes } = require("http-status-codes");
const bcrypt = require("bcryptjs");

// REGISTER

const register = async (req, res, next) => {
  try {
    const { error, value } = userSchema.validate(req.body);

    if (error) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: error.details[0].message,
      });
    }

    const hashedPassword = await bcrypt.hash(value.password, 10);
    delete value.password;

    const result = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: value.email,
          name: value.name,
          hashedPassword,
        },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
        },
      });

      const welcomeTaskData = [
        {
          title: "Complete your profile",
          priority: "medium",
          userId: newUser.id,
        },
        { title: "Add your first task", priority: "high", userId: newUser.id },
        {
          title: "Explore the app features",
          priority: "low",
          userId: newUser.id,
        },
      ];

      await tx.task.createMany({
        data: welcomeTaskData,
      });

      const welcomeTasks = await tx.task.findMany({
        where: {
          userId: newUser.id,
          title: {
            in: welcomeTaskData.map((t) => t.title),
          },
        },
        select: {
          id: true,
          title: true,
          isCompleted: true,
          priority: true,
          userId: true,
        },
      });

      return { user: newUser, welcomeTasks };
    });

    global.user_id = result.user.id;

    return res.status(StatusCodes.CREATED).json({
      message: "User registered successfully with welcome tasks",
      user: result.user,
      tasksCreated: result.welcomeTasks.length,
    });
  } catch (err) {
    if (err.code === "P2002") {
      return res.status(StatusCodes.CONFLICT).json({
        message: "Email already registered",
      });
    }
    return next(err);
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

    setLoggedOnUser(user.id);
    global.user_id = user.id;

    return res.status(200).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
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