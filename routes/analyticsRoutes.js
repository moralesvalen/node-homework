const express = require("express");
const router = express.Router();

const requireRole = require("../middleware/requireRole");
const {
  getUserAnalytics,
  getUsersWithStats,
  searchTasks,
} = require("../controllers/analyticsController");

// SOLO MANAGER
router.get("/users", requireRole(["manager"]), getUsersWithStats);

//  sOLO MANAGER
router.get("/users/:id", requireRole(["manager"]), getUserAnalytics);

// CUALQUIER USUARIO LOGUEADO
router.get("/tasks/search", searchTasks);

module.exports = router;
