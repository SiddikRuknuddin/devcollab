const express = require("express");

const protect = require("../middleware/authMiddleware");
const { handleProjectFileUpload } = require("../middleware/upload");

const {
  createProject,
  getMyProjects,
  getProjectById,
  updateProject,
  deleteProject,
  getProjectGithubInfo,
  addMilestone,
  toggleMilestone,
  deleteMilestone,
  addProjectFile,
  uploadProjectFile,
  deleteProjectFile,
  getExploreProjects,
  applyToProject,
  getRecommendedTeammates,
  saveArchitectureDiagram,
  getWebhooks,
  addWebhook,
  deleteWebhook,
  testWebhook,
  addDeployment,
  deleteDeployment,
  pingDeployment,
} = require("../controllers/projectController");
const router = express.Router();

// Static and explore routes (must be before /:id)
router.post("/", protect, createProject);
router.get("/my", protect, getMyProjects);
router.get("/explore", protect, getExploreProjects);

// Project specific routes
router.get("/:id", protect, getProjectById);
router.put("/:id", protect, updateProject);
router.delete("/:id", protect, deleteProject);
router.get("/:id/github", protect, getProjectGithubInfo);

// Feature 8: Milestones
router.post("/:id/milestones", protect, addMilestone);
router.put("/:id/milestones/:milestoneId", protect, toggleMilestone);
router.delete("/:id/milestones/:milestoneId", protect, deleteMilestone);

// Feature 7: Project File Vault
router.post("/:id/files", protect, addProjectFile);
router.post("/:id/files/upload", protect, handleProjectFileUpload, uploadProjectFile);
router.delete("/:id/files/:fileId", protect, deleteProjectFile);

// Feature 10: Apply to Join
router.post("/:id/apply", protect, applyToProject);

// Feature 4: AI Teammate Matchmaker
router.get("/:id/recommended-teammates", protect, getRecommendedTeammates);

// Advanced Feature 3: Architecture Whiteboard Diagram
router.put("/:id/whiteboard", protect, saveArchitectureDiagram);

// Advanced Feature 4: Project Webhooks
router.get("/:id/webhooks", protect, getWebhooks);
router.post("/:id/webhooks", protect, addWebhook);
router.delete("/:id/webhooks/:webhookId", protect, deleteWebhook);
router.post("/:id/webhooks/test", protect, testWebhook);

// Advanced Feature 9: Cloud Deployment Status & Preview Links
router.post("/:id/deployments", protect, addDeployment);
router.delete("/:id/deployments/:depId", protect, deleteDeployment);
router.post("/:id/deployments/ping", protect, pingDeployment);

module.exports = router;
