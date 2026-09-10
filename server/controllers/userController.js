const User = require("../models/User");
const { uploadToCloudinary, deleteFromCloudinary, getPublicIdFromUrl } = require("../utils/cloudinary");

// ── GET /api/users/profile ────────────────────────────────────────────────────
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({ success: true, user });
  } catch (error) {
    console.error("Get Profile Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── PUT /api/users/profile ────────────────────────────────────────────────────
const updateProfile = async (req, res) => {
  try {
    const {
      name,
      bio,
      skills,
      github,
      linkedin,
      portfolio,
      location,
      experience,
      education,
      title,
      certifications,
    } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (name !== undefined) user.name = name.trim();
    if (bio !== undefined) user.bio = bio.trim();
    if (title !== undefined) user.title = title.trim();
    if (certifications !== undefined && Array.isArray(certifications)) {
      user.certifications = certifications;
    }

    if (skills !== undefined) {
      if (Array.isArray(skills)) {
        user.skills = Array.from(
          new Set(
            skills
              .map((s) => (typeof s === "string" ? s.trim() : ""))
              .filter((s) => s.length > 0)
          )
        );
      } else if (typeof skills === "string") {
        user.skills = Array.from(
          new Set(
            skills
              .split(",")
              .map((s) => s.trim())
              .filter((s) => s.length > 0)
          )
        );
      }
    }

    if (github !== undefined) user.github = github.trim();
    if (linkedin !== undefined) user.linkedin = linkedin.trim();
    if (portfolio !== undefined) user.portfolio = portfolio.trim();
    if (location !== undefined) user.location = location.trim();
    if (experience !== undefined) user.experience = experience.trim();
    if (education !== undefined) user.education = education.trim();
    if (req.body.profileImage !== undefined) user.profileImage = req.body.profileImage.trim();

    await user.save();

    const updatedUser = await User.findById(user._id).select("-password");

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update Profile Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── POST /api/users/profile/image ─────────────────────────────────────────────
const uploadProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image file provided",
      });
    }

    // Validate Cloudinary is configured
    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      return res.status(503).json({
        success: false,
        message:
          "Image upload service is not configured. Please set Cloudinary environment variables.",
      });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Delete previous Cloudinary image if it exists
    if (user.profileImage) {
      const oldPublicId = getPublicIdFromUrl(user.profileImage);
      if (oldPublicId) {
        await deleteFromCloudinary(oldPublicId);
      }
    }

    // Upload new image to Cloudinary
    const result = await uploadToCloudinary(req.file.buffer, {
      public_id: `user_${user._id}_avatar`,
      overwrite: true,
      transformation: [
        { width: 400, height: 400, crop: "fill", gravity: "face" },
        { quality: "auto", fetch_format: "auto" },
      ],
    });

    user.profileImage = result.secure_url;
    await user.save();

    const updatedUser = await User.findById(user._id).select("-password");

    res.status(200).json({
      success: true,
      message: "Profile image updated successfully",
      profileImage: result.secure_url,
      user: updatedUser,
    });
  } catch (error) {
    console.error("Upload Profile Image Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to upload image. Please try again.",
    });
  }
};

// ── GET /api/users/developers ─────────────────────────────────────────────────
const getDevelopers = async (req, res) => {
  try {
    const { search, email } = req.query;
    const query = {};

    if (email) {
      query.email = email.toLowerCase().trim();
    } else if (search && search.trim()) {
      const searchRegex = new RegExp(
        search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "i"
      );
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { skills: searchRegex },
        { bio: searchRegex },
        { location: searchRegex },
      ];
    }

    const developers = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: developers.length,
      developers,
    });
  } catch (error) {
    console.error("Get Developers Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── GET /api/users/developers/:id ─────────────────────────────────────────────
const getDeveloperById = async (req, res) => {
  try {
    const developer = await User.findById(req.params.id).select("-password");

    if (!developer) {
      return res.status(404).json({ success: false, message: "Developer not found" });
    }

    res.status(200).json({ success: true, developer });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(404).json({ success: false, message: "Developer not found" });
    }
    console.error("Get Developer Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  uploadProfileImage,
  getDevelopers,
  getDeveloperById,
};