const { StatusCodes } = require("http-status-codes");

const index = (req, res) => {
  res.status(StatusCodes.OK).json({ message: "Task index endpoint" });
};

const show = (req, res) => {
  res.status(StatusCodes.OK).json({ message: "Show index endpoint" });
};

const create = (req, res) => {
  res.status(StatusCodes.CREATED).json({ message: "Task creation endpoint" });
};

const update = (req, res) => {
  res.status(StatusCodes.OK).json({ message: "Task update endpoint" });
};

const deleteTask = (req, res) => {
  res.status(StatusCodes.OK).json({ message: "Task deletion endpoint" });
};

module.exports = { index, show, create, update, deleteTask };
