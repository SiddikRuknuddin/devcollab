const express = require("express");
const protect = require("../middleware/authMiddleware");

const {
  createDiscussion,
  getDiscussions,
  getDiscussionById,
  updateDiscussion,
  deleteDiscussion,
} = require("../controllers/discussionController");

const {
  createComment,
  getComments,
} = require("../controllers/commentController");

const router = express.Router();

// Discussion CRUD
router.post("/", protect, createDiscussion);
router.get("/", protect, getDiscussions);
router.get("/:id", protect, getDiscussionById);
router.put("/:id", protect, updateDiscussion);
router.delete("/:id", protect, deleteDiscussion);

// Nested Comments for Discussion
router.post("/:discussionId/comments", protect, createComment);
router.get("/:discussionId/comments", protect, getComments);

module.exports = router;
