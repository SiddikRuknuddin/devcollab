const express = require("express");

const protect = require("../middleware/authMiddleware");
const {
  getProfile,
  updateProfile,
  getDevelopers,
  getDeveloperById,
} = require("../controllers/userController");

const router = express.Router();

router.get("/profile", protect, getProfile);

router.put("/profile", protect, updateProfile);

router.get("/developers", protect, getDevelopers);

router.get(
  "/developers/:id",
  protect,
  getDeveloperById
);

module.exports = router;