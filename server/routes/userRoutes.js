const express = require("express");
const protect = require("../middleware/authMiddleware");
const { handleProfileImageUpload, handleCertificateUpload } = require("../middleware/upload");
const {
  getProfile,
  updateProfile,
  uploadProfileImage,
  uploadCertificateFile,
  getDevelopers,
  getDeveloperById,
  endorseSkill,
  getPublicPortfolio,
} = require("../controllers/userController");

const router = express.Router();

// Public Portfolio route (Recruiters & visitors can access without logging in)
router.get("/portfolio/:id", getPublicPortfolio);

router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);
router.post(
  "/profile/image",
  protect,
  handleProfileImageUpload,
  uploadProfileImage
);
router.post(
  "/profile/certificate-upload",
  protect,
  handleCertificateUpload,
  uploadCertificateFile
);
router.get("/developers", protect, getDevelopers);
router.get("/developers/:id", protect, getDeveloperById);
router.post("/:id/endorse", protect, endorseSkill);

module.exports = router;