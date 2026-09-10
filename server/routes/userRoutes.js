const express = require("express");
const protect = require("../middleware/authMiddleware");
const { handleProfileImageUpload } = require("../middleware/upload");
const {
  getProfile,
  updateProfile,
  uploadProfileImage,
  getDevelopers,
  getDeveloperById,
} = require("../controllers/userController");

const router = express.Router();

router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);
router.post(
  "/profile/image",
  protect,
  handleProfileImageUpload,
  uploadProfileImage
);
router.get("/developers", protect, getDevelopers);
router.get("/developers/:id", protect, getDeveloperById);

module.exports = router;