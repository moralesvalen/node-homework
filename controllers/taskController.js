const { StatusCodes } = require("http-status-codes");
const { taskSchema, patchTaskSchema } = require("../validation/taskSchema");
const prisma = require("../db/prisma");

// INDEX (GET /tasks)
const index = async (req, res, next) => {
  try {
    if (!req.query.user_id) {
      return res.status(401).json({
        error: "User ID required",
      });
    }

    const userId = parseInt(req.query.user_id, 10);

    if (isNaN(userId)) {
      return res.status(401).json({
        error: "User ID required",
      });
    }

    let page = parseInt(req.query.page, 10);
    let limit = parseInt(req.query.limit, 10);

    if (isNaN(page) || page < 1) {
      page = 1;
    }

    if (isNaN(limit) || limit < 1 || limit > 100) {
      limit = 10;
    }

    const skip = (page - 1) * limit;

    const whereClause = {
      userId: userId,
    };

    if (req.query.search) {
      whereClause.title = {
        contains: req.query.search,
        mode: "insensitive",
      };
    }

    if (req.query.priority) {
      whereClause.priority = req.query.priority;
    }

    if (req.query.status === "true") {
      whereClause.isCompleted = true;
    }

    if (req.query.status === "false") {
      whereClause.isCompleted = false;
    }

    let orderBy = {
      createdAt: "desc",
    };

    if (req.query.sort_by) {
      let order = "asc";
      if (req.query.sort_order === "desc") {
        order = "desc";
      }

      orderBy = {
        [req.query.sort_by]: order,
      };
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
        title: true,
        isCompleted: true,
        priority: true,
        createdAt: true,
        userId: true,
      };
    }

    const tasks = await prisma.task.findMany({
      where: whereClause,
      select: select,
      skip: skip,
      take: limit,
      orderBy: orderBy,
    });

    const total = await prisma.task.count({
      where: whereClause,
    });

    const pagination = {
      page: page,
      limit: limit,
      total: total,
      pages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    };

    return res.status(200).json({
      tasks,
      pagination,
    });
  } catch (err) {
    return next(err);
  }
};

// SHOW (GET /tasks/:id)
const show = async (req, res, next) => {
  const id = parseInt(req.params.id, 10);

  if (isNaN(id)) {
    return res.status(400).json({ error: "Invalid task ID" });
  }

  const select = req.query.fields
    ? req.query.fields.split(",").reduce((acc, field) => {
        acc[field] = true;
        return acc;
      }, {})
    : {
        id: true,
        title: true,
        isCompleted: true,
        priority: true,
        createdAt: true,
        userId: true,
      };

  try {
    const task = await prisma.task.findFirst({
      where: { id },
      select,
    });

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    return res.status(200).json(task);
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
    return res.status(400).json({
      error: "Validation failed",
      details: error.details,
    });
  }

  try {
    const task = await prisma.task.create({
      data: {
        title: value.title,
        isCompleted: value.isCompleted,
        priority: value.priority,
        userId: global.user_id,
      },
      select: {
        id: true,
        title: true,
        isCompleted: true,
        priority: true,
        userId: true,
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
  const id = parseInt(req.params.id, 10);

  if (isNaN(id)) {
    return res.status(400).json({ error: "Invalid task ID" });
  }

  try {
    const task = await prisma.task.update({
      where: { id },
      data: {
        title: req.body.title,
        isCompleted: req.body.isCompleted,
        priority: req.body.priority,
      },
      select: {
        id: true,
        title: true,
        isCompleted: true,
        priority: true,
      },
    });

    return res.status(200).json(task);
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({ error: "Task not found" });
    }
    return next(err);
  }
};

// DELETE (DELETE /tasks/:id)
const deleteTask = async (req, res, next) => {
  const taskId = parseInt(req.params.id, 10);

  if (isNaN(taskId)) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      error: "Invalid task ID",
    });
  }

  try {
    await prisma.task.delete({
      where: {
        id_userId: {
          id: taskId,
          userId: global.user_id,
        },
      },
    });

    return res.status(StatusCodes.OK).json({
      message: "Task deleted successfully",
    });
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(StatusCodes.NOT_FOUND).json({
        error: "Task not found",
      });
    }
    return next(err);
  }
};

// buklk create (POST /tasks/bulk)
const bulkCreate = async (req, res, next) => {
  const { tasks } = req.body;

  if (tasks.length > 100) {
    return res.status(400).json({
      error: "Too many tasks",
    });
  }

  if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      error: "Invalid request data. Expected an array of tasks.",
    });
  }

  const validTasks = [];

  for (const task of tasks) {
    const { error, value } = taskSchema.validate(task);

    if (error) {
      return res.status(400).json({
        error: "Validation failed",
        validationErrors: error.details,
      });
    }

    validTasks.push({
      title: value.title,
      isCompleted: value.isCompleted || false,
      priority: value.priority || "medium",
      userId: global.user_id,
    });
  }

  try {
    const result = await prisma.task.createMany({
      data: validTasks,
    });

    return res.status(201).json({
      message: "Bulk task creation successful",
      tasksCreated: result.count,
      totalRequested: validTasks.length,
    });
  } catch (err) {
    return next(err);
  }
};

module.exports = { index, show, create, update, deleteTask, bulkCreate };
