const multer = require("multer");

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

// Store in memory — we stream directly to Cloudinary
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Only JPEG, JPG, PNG, and WEBP images are allowed."
      ),
      false
    );
  }
};

const upload = multer({
  storage,
  limits: { fileSize: MAX_SIZE_BYTES },
  fileFilter,
});

/**
 * Middleware for single profile image upload
 * Field name: "profileImage"
 */
const uploadProfileImage = upload.single("profileImage");

/**
 * Wrapped middleware that returns clean JSON errors instead of multer's default
 */
const handleProfileImageUpload = (req, res, next) => {
  uploadProfileImage(req, res, (err) => {
    if (!err) return next();

    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "File too large. Maximum allowed size is 5MB.",
      });
    }

    return res.status(400).json({
      success: false,
      message: err.message || "File upload error",
    });
  });
};

module.exports = { handleProfileImageUpload };
