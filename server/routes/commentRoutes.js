const express = require("express");
const protect = require("../middleware/authMiddleware");

const {
  updateComment,
  deleteComment,
} = require("../controllers/commentController");

const router = express.Router();

// Direct Comment Management
router.put("/:id", protect, updateComment);
router.delete("/:id", protect, deleteComment);

module.exports = router;
