const express = require("express");

const protect = require("../middleware/authMiddleware");

const {
  createProject,
  getMyProjects,
  getProjectById,
  updateProject,
  deleteProject,
  getProjectGithubInfo,
} = require("../controllers/projectController");
const router = express.Router();

router.post("/", protect, createProject);

router.get("/my", protect, getMyProjects);
router.get("/:id", protect, getProjectById);
router.get("/:id/github", protect, getProjectGithubInfo);

router.put("/:id", protect, updateProject);
router.delete("/:id", protect, deleteProject);
module.exports = router;