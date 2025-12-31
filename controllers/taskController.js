const { StatusCodes } = require("http-status-codes");
const { taskSchema, patchTaskSchema } = require("../validation/taskSchema");
const pool = require("../db/pg-pool");

// INDEX (GET /tasks)
const index = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, title, is_completed FROM tasks WHERE user_id = $1",
      [global.user_id]
    );

    if (result.rows.length === 0) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: "No tasks found",
      });
    }

    return res.status(StatusCodes.OK).json(result.rows);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// SHOW (GET /tasks/:id)
const show = async (req, res) => {
  const taskId = parseInt(req.params.id);

  if (!taskId) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      message: "The task ID passed is not valid.",
    });
  }

  const result = await pool.query(
    "SELECT id, title, is_completed FROM tasks WHERE id = $1 AND user_id = $2",
    [taskId, global.user_id]
  );

  if (result.rows.length === 0) {
    return res.status(StatusCodes.NOT_FOUND).json({
      message: "That task was not found",
    });
  }

  return res.status(StatusCodes.OK).json(result.rows[0]);
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

  const result = await pool.query(
    `INSERT INTO tasks (title, is_completed, user_id)
     VALUES ($1, $2, $3)
     RETURNING id, title, is_completed`,
    [value.title, value.isCompleted, global.user_id]
  );

  return res.status(StatusCodes.CREATED).json(result.rows[0]);
};

// UPDATE (PATCH /tasks/:id)
const update = async (req, res) => {
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

  const setClause = keys
    .map(
      (key, idx) =>
        `${key === "isCompleted" ? "is_completed" : key} = $${idx + 1}`
    )
    .join(", ");

  const params = [...Object.values(value), taskId, global.user_id];

  const result = await pool.query(
    `UPDATE tasks SET ${setClause}
     WHERE id = $${keys.length + 1} AND user_id = $${keys.length + 2}
     RETURNING id, title, is_completed`,
    params
  );

  if (result.rows.length === 0) {
    return res.status(StatusCodes.NOT_FOUND).json({
      message: "That task was not found",
    });
  }

  return res.status(StatusCodes.OK).json(result.rows[0]);
};

// DELETE (DELETE /tasks/:id)
const deleteTask = async (req, res) => {
  const taskId = parseInt(req.params.id);

  const result = await pool.query(
    "DELETE FROM tasks WHERE id = $1 AND user_id = $2 RETURNING id",
    [taskId, global.user_id]
  );

  if (result.rows.length === 0) {
    return res.status(StatusCodes.NOT_FOUND).json({
      message: "That task was not found",
    });
  }

  return res.status(StatusCodes.OK).json(result.rows[0]);
};

module.exports = { index, show, create, update, deleteTask };
