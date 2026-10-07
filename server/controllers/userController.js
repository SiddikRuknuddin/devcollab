const fs = require("fs");
const path = require("path");
const User = require("../models/User");
const { uploadToCloudinary, deleteFromCloudinary, getPublicIdFromUrl } = require("../utils/cloudinary");

const isCloudinaryConfigured = () => {
  return (
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_CLOUD_NAME !== "your_cloud_name" &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_KEY !== "your_api_key"
  );
};

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

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    let profileImageUrl = "";

    // Try Cloudinary if properly configured
    if (isCloudinaryConfigured()) {
      try {
        if (user.profileImage && user.profileImage.includes("cloudinary.com")) {
          const oldPublicId = getPublicIdFromUrl(user.profileImage);
          if (oldPublicId) await deleteFromCloudinary(oldPublicId);
        }

        const result = await uploadToCloudinary(req.file.buffer, {
          public_id: `user_${user._id}_avatar`,
          overwrite: true,
          transformation: [
            { width: 400, height: 400, crop: "fill", gravity: "face" },
            { quality: "auto", fetch_format: "auto" },
          ],
        });
        profileImageUrl = result.secure_url;
      } catch (cloudErr) {
        console.warn("Cloudinary avatar upload failed, falling back to local:", cloudErr.message);
      }
    }

    // Local disk fallback
    if (!profileImageUrl) {
      const uploadDir = path.join(__dirname, "../uploads/avatars");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const ext = path.extname(req.file.originalname) || ".jpg";
      const filename = `avatar_${user._id}_${Date.now()}${ext}`;
      const filePath = path.join(uploadDir, filename);

      fs.writeFileSync(filePath, req.file.buffer);
      profileImageUrl = `/uploads/avatars/${filename}`;
    }

    user.profileImage = profileImageUrl;
    await user.save();

    const updatedUser = await User.findById(user._id).select("-password");

    res.status(200).json({
      success: true,
      message: "Profile image updated successfully",
      profileImage: profileImageUrl,
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

// ── POST /api/users/profile/certificate-upload ──────────────────────────────
const uploadCertificateFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No certificate file provided",
      });
    }

    let certificateUrl = "";

    // 1. Try Cloudinary if properly configured
    if (isCloudinaryConfigured()) {
      try {
        const result = await uploadToCloudinary(req.file.buffer, {
          folder: "devcollab/certificates",
          resource_type: "auto",
        });
        certificateUrl = result.secure_url;
      } catch (cloudErr) {
        console.warn("Cloudinary certificate upload failed, falling back to local:", cloudErr.message);
      }
    }

    // 2. Local disk fallback
    if (!certificateUrl) {
      const uploadDir = path.join(__dirname, "../uploads/certificates");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const ext = path.extname(req.file.originalname) || (req.file.mimetype === "application/pdf" ? ".pdf" : ".jpg");
      const filename = `cert_${req.user.id}_${Date.now()}${ext}`;
      const filePath = path.join(uploadDir, filename);

      fs.writeFileSync(filePath, req.file.buffer);
      certificateUrl = `/uploads/certificates/${filename}`;
    }

    res.status(200).json({
      success: true,
      message: "Certificate uploaded successfully",
      certificateUrl,
      fileName: req.file.originalname,
    });
  } catch (error) {
    console.error("Upload Certificate Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to upload certificate file.",
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

// ── POST /api/users/:id/endorse ──────────────────────────────────────────────
const endorseSkill = async (req, res) => {
  try {
    const { skill } = req.body;
    const targetUserId = req.params.id;
    const currentUserId = req.user._id;

    if (!skill || !skill.trim()) {
      return res.status(400).json({ success: false, message: "Skill name is required" });
    }

    if (targetUserId === currentUserId.toString()) {
      return res.status(400).json({ success: false, message: "You cannot endorse your own skills" });
    }

    const user = await User.findById(targetUserId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const normalizedSkill = skill.trim();

    // Check if already endorsed
    const existingIndex = user.endorsements.findIndex(
      (e) =>
        e.skill.toLowerCase() === normalizedSkill.toLowerCase() &&
        e.endorsedBy.toString() === currentUserId.toString()
    );

    let action = "added";
    if (existingIndex > -1) {
      // Toggle off
      user.endorsements.splice(existingIndex, 1);
      action = "removed";
    } else {
      user.endorsements.push({
        skill: normalizedSkill,
        endorsedBy: currentUserId,
        createdAt: new Date(),
      });
    }

    // Auto-calculate badges
    const totalEndorsements = user.endorsements.length;
    const Project = require("../models/Project");
    const ProjectMember = require("../models/ProjectMember");
    const Discussion = require("../models/Discussion");

    const [ownedProjects, memberCount, discussionCount] = await Promise.all([
      Project.countDocuments({ owner: user._id }),
      ProjectMember.countDocuments({ user: user._id, status: "Accepted" }),
      Discussion.countDocuments({ author: user._id }),
    ]);

    const newBadges = [];
    if (ownedProjects >= 2) {
      newBadges.push({ name: "Project Pioneer", icon: "🚀", description: "Created 2+ collaborative projects" });
    }
    if (memberCount >= 2) {
      newBadges.push({ name: "Team Player", icon: "🤝", description: "Collaborated on 2+ team projects" });
    }
    if (discussionCount >= 2) {
      newBadges.push({ name: "Community Voice", icon: "💡", description: "Started 2+ insightful community discussions" });
    }
    if (totalEndorsements >= 2) {
      newBadges.push({ name: "Endorsed Pro", icon: "⭐", description: "Received 2+ peer skill endorsements" });
    }

    user.badges = newBadges;
    await user.save();

    res.status(200).json({
      success: true,
      action,
      endorsements: user.endorsements,
      badges: user.badges,
    });
  } catch (error) {
    console.error("Endorse Skill Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── GET /api/users/portfolio/:id (PUBLIC - No Auth Required) ─────────────────
const getPublicPortfolio = async (req, res) => {
  try {
    const { id } = req.params;
    const Project = require("../models/Project");

    let user;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      user = await User.findById(id).select("-password").populate("endorsements.endorsedBy", "name profileImage");
    } else {
      user = await User.findOne({ email: id.toLowerCase().trim() }).select("-password").populate("endorsements.endorsedBy", "name profileImage");
    }

    if (!user) {
      return res.status(404).json({ success: false, message: "Developer not found" });
    }

    const projects = await Project.find({ owner: user._id })
      .select("title description technologies githubUrl status milestones createdAt")
      .sort({ createdAt: -1 });

    const stats = {
      totalProjects: projects.length,
      totalEndorsements: user.endorsements ? user.endorsements.length : 0,
      totalBadges: user.badges ? user.badges.length : 0,
      totalCertificates: (user.certifications || user.certificates || []).length,
      memberSince: user.createdAt,
    };

    res.status(200).json({
      success: true,
      portfolio: {
        user,
        projects,
        stats,
      },
    });
  } catch (error) {
    console.error("Get Public Portfolio Error:", error);
    res.status(500).json({ success: false, message: "Server error generating portfolio" });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  uploadProfileImage,
  uploadCertificateFile,
  getDevelopers,
  getDeveloperById,
  endorseSkill,
  getPublicPortfolio,
};