const multer = require("multer");

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

const ALLOWED_CERT_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "application/pdf",
];

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_CERT_SIZE = 10 * 1024 * 1024; // 10 MB

// Store in memory
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: MAX_IMAGE_SIZE },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Invalid file type. Only JPEG, JPG, PNG, and WEBP images are allowed."
        ),
        false
      );
    }
  },
});

const certUpload = multer({
  storage,
  limits: { fileSize: MAX_CERT_SIZE },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_CERT_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Invalid file type. Only PDF documents and JPEG/PNG/WEBP images are allowed."
        ),
        false
      );
    }
  },
});

/**
 * Middleware for single profile image upload
 * Field name: "profileImage"
 */
const uploadProfileImage = upload.single("profileImage");

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

/**
 * Middleware for certificate file upload (PDF or Image)
 * Field name: "certificateFile"
 */
const uploadCertFile = certUpload.single("certificateFile");

const handleCertificateUpload = (req, res, next) => {
  uploadCertFile(req, res, (err) => {
    if (!err) return next();

    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "Certificate file too large. Maximum allowed size is 10MB.",
      });
    }

    return res.status(400).json({
      success: false,
      message: err.message || "File upload error",
    });
  });
};

/**
 * Middleware for project asset file upload (PDF, Images, Docs, Zips, Code)
 * Field name: "file"
 */
const MAX_PROJECT_FILE_SIZE = 25 * 1024 * 1024; // 25 MB
const projectUpload = multer({
  storage,
  limits: { fileSize: MAX_PROJECT_FILE_SIZE },
});

const uploadProjectSingleFile = projectUpload.single("file");

const handleProjectFileUpload = (req, res, next) => {
  uploadProjectSingleFile(req, res, (err) => {
    if (!err) return next();

    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "File too large. Maximum allowed size is 25MB.",
      });
    }

    return res.status(400).json({
      success: false,
      message: err.message || "File upload error",
    });
  });
};

module.exports = {
  handleProfileImageUpload,
  handleCertificateUpload,
  handleProjectFileUpload,
};
