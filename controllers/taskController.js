const { StatusCodes } = require("http-status-codes");
const { taskSchema, patchTaskSchema } = require("../validation/taskSchema");
//const pool = require("../db/pg-pool");
const prisma = require("../db/prisma");

// INDEX (GET /tasks)
const index = async (req, res, next) => {
  try {
    const tasks = await prisma.task.findMany({
      where: {
        userId: global.user_id,
      },
      select: {
        id: true,
        title: true,
        isCompleted: true,
      },
    });

    if (tasks.length === 0) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: "No tasks found",
      });
    }

    return res.status(StatusCodes.OK).json(tasks);
  } catch (err) {
    return next(err);
  }
};

// SHOW (GET /tasks/:id)
const show = async (req, res, next) => {
  const taskId = parseInt(req.params.id);

  if (!taskId) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      message: "The task ID passed is not valid.",
    });
  }

  try {
    const task = await prisma.task.findUnique({
      where: {
        id_userId: {
          id: taskId,
          userId: global.user_id,
        },
      },
      select: {
        id: true,
        title: true,
        isCompleted: true,
      },
    });

    if (!task) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: "That task was not found",
      });
    }

    return res.status(StatusCodes.OK).json(task);
  } catch (err) {
    return next(err);
  }
};

// CREATE (POST /tasks)
const create = async (req, res) => {
  if (!req.body) req.body = {};

  const { error, value } = taskSchema.validate(req.body, {
    abortEarly: false,
  });

  if (error) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      message: "Validation failed",
      details: error.details,
    });
  }

  try {
    const task = await prisma.task.create({
      data: {
        title: value.title,
        isCompleted: value.isCompleted ?? false, // 👈 clave
        userId: global.user_id,
      },
      select: {
        id: true,
        title: true,
        isCompleted: true,
      },
    });

    return res.status(StatusCodes.CREATED).json(task);
  } catch (err) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: err.message,
    });
  }
};

// UPDATE (PATCH /tasks/:id)
const update = async (req, res, next) => {
  const taskId = parseInt(req.params.id);

  if (!taskId) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      message: "The task ID passed is not valid.",
    });
  }

  const { error, value } = patchTaskSchema.validate(req.body, {
    abortEarly: false,
  });

  if (error) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      message: "Validation failed",
      details: error.details,
    });
  }

  const keys = Object.keys(value);
  if (keys.length === 0) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      message: "No fields to update",
    });
  }

  try {
    const task = await prisma.task.update({
      where: {
        id_userId: {
          id: taskId,
          userId: global.user_id,
        },
      },
      data: value,
      select: {
        id: true,
        title: true,
        isCompleted: true,
      },
    });

    return res.status(StatusCodes.OK).json(task);
  } catch (err) {
    if (err.name === "PrismaClientKnownRequestError" && err.code === "P2025") {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: "That task was not found",
      });
    }
    return next(err);
  }
};

// DELETE (DELETE /tasks/:id)
const deleteTask = async (req, res, next) => {
  const taskId = parseInt(req.params.id);

  if (!taskId) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      message: "The task ID passed is not valid.",
    });
  }

  try {
    const task = await prisma.task.delete({
      where: {
        id_userId: {
          id: taskId,
          userId: global.user_id,
        },
      },
      select: {
        id: true,
      },
    });

    return res.status(StatusCodes.OK).json(task);
  } catch (err) {
    if (err.name === "PrismaClientKnownRequestError" && err.code === "P2025") {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: "That task was not found",
      });
    }
    return next(err);
  }
};

module.exports = { index, show, create, update, deleteTask };
