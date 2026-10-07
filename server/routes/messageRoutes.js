const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const {
  getProjectMessages,
  getDirectMessages,
  sendMessage,
} = require("../controllers/messageController");

router.get("/project/:projectId", protect, getProjectMessages);
router.get("/direct/:userId", protect, getDirectMessages);
router.post("/", protect, sendMessage);

module.exports = router;
