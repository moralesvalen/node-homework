const { StatusCodes } = require("http-status-codes");
const { taskSchema, patchTaskSchema } = require("../validation/taskSchema");
const { getLoggedOnUser } = require("../util/memoryStore");

if (!global.tasks) {
  global.tasks = [];
}

const taskCounter = (() => {
  let lastTaskNumber = 0;
  return () => {
    lastTaskNumber += 1;
    return lastTaskNumber;
  };
})();

// all my tasks
const index = (req, res) => {
  const loggedUser = getLoggedOnUser();

  const userTasks = global.tasks.filter(
    (task) => task.userId === loggedUser.email
  );

  if (userTasks.length === 0) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ message: "No tasks found" });
  }

  const sanitizedTasks = userTasks.map((task) => {
    const { userId, ...sanitizedTask } = task;
    return sanitizedTask;
  });

  return res.status(StatusCodes.OK).json(sanitizedTasks);
};

// show a specific task
const show = (req, res) => {
  const loggedUser = getLoggedOnUser();
  const taskId = parseInt(req.params?.id);

  if (!taskId) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "The task ID passed is not valid." });
  }

  const taskToFind = global.tasks.find(
    (task) => task.id === taskId && task.userId === loggedUser.email
  );

  if (!taskToFind) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ message: "That task was not found" });
  }

  const { userId, ...sanitizedTask } = taskToFind;
  return res.status(StatusCodes.OK).json(sanitizedTask);
};

// create a new task
const create = (req, res) => {
  const loggedUser = getLoggedOnUser();

  if (!req.body) req.body = {};

  const { error, value } = taskSchema.validate(req.body, {
    abortEarly: false,
  });

  if (error) {
    return res.status(StatusCodes.BAD_REQUEST).json({ error: error.message });
  }

  const newTask = {
    id: taskCounter(),
    title: value.title,
    isCompleted: value.isCompleted,
    userId: loggedUser.email,
  };

  global.tasks.push(newTask);

  const { userId, ...sanitizedTask } = newTask;
  return res.status(StatusCodes.CREATED).json(sanitizedTask);
};

// update a specific task
const update = (req, res) => {
  const loggedUser = getLoggedOnUser();
  const taskId = parseInt(req.params?.id);

  if (!taskId) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "The task ID passed is not valid." });
  }

  const taskToFind = global.tasks.find((task) => task.id === taskId);

  if (!taskToFind) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ message: "That task was not found" });
  }

  if (taskToFind.userId !== loggedUser.email) {
    return res
      .status(StatusCodes.FORBIDDEN)
      .json({ message: "Not authorized" });
  }

  if (!req.body) req.body = {};

  const { error, value } = patchTaskSchema.validate(req.body, {
    abortEarly: false,
  });

  if (error) {
    return res.status(StatusCodes.BAD_REQUEST).json({ error: error.message });
  }

  // ✅ correct update
  Object.assign(taskToFind, value);

  const { userId, ...sanitizedTask } = taskToFind;
  return res.status(StatusCodes.OK).json(sanitizedTask);
};

// delete a specific task
const deleteTask = (req, res) => {
  const loggedUser = getLoggedOnUser();
  const taskToFind = parseInt(req.params?.id);

  if (!taskToFind) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "The task ID passed is not valid." });
  }

  const taskIndex = global.tasks.findIndex((task) => task.id === taskToFind);

  if (taskIndex === -1) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ message: "That task was not found" });
  }

  if (global.tasks[taskIndex].userId !== loggedUser.email) {
    return res
      .status(StatusCodes.FORBIDDEN)
      .json({ message: "Not authorized" });
  }

  const { userId, ...sanitizedTask } = global.tasks[taskIndex];
  global.tasks.splice(taskIndex, 1);

  return res.status(StatusCodes.OK).json(sanitizedTask);
};

module.exports = { index, show, create, update, deleteTask };
