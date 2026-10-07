const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const {
  getProjectTasks,
  createTask,
  updateTask,
  deleteTask,
  getProjectSprintAnalytics,
  addBounty,
  claimBounty,
  releaseBounty,
} = require("../controllers/taskController");

router.get("/project/:projectId", protect, getProjectTasks);
router.get("/project/:projectId/analytics", protect, getProjectSprintAnalytics);
router.post("/", protect, createTask);
router.put("/:id", protect, updateTask);
router.delete("/:id", protect, deleteTask);

// Bounty & Escrow endpoints
router.post("/:id/bounty", protect, addBounty);
router.post("/:id/bounty/claim", protect, claimBounty);
router.post("/:id/bounty/release", protect, releaseBounty);

module.exports = router;

