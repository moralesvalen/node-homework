const express = require("express");
const router = express.Router();
//const authenticate = require("../middleware/auth");
const jwtMiddleware = require("../middleware/jwtMiddleware");

const {
  index,
  show,
  create,
  update,
  deleteTask,
  bulkCreate,
} = require("../controllers/taskController");

router.use(jwtMiddleware); // Apply authentication middleware to all task routes

router.post("/", create);

router.get("/", index);

router.post("/bulk", bulkCreate);

router.get("/:id", show);

router.patch("/:id", update);

router.delete("/:id", deleteTask);

module.exports = router;
