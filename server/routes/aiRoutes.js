const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const { reviewCode } = require("../controllers/aiController");

// POST /api/ai/code-review
router.post("/code-review", protect, reviewCode);

module.exports = router;
