const express = require("express");

const protect = require("../middleware/authMiddleware");

const {
  createProject,
  getMyProjects,
  updateProject,
  deleteProject,
} = require("../controllers/projectController");
const router = express.Router();

router.post("/", protect, createProject);

router.get("/my", protect, getMyProjects);

router.put("/:id", protect, updateProject);
router.delete("/:id", protect, deleteProject);
module.exports = router;