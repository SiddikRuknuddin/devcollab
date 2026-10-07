const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
    },

    bio: {
      type: String,
      default: "",
    },

    skills: {
      type: [String],
      default: [],
    },

    profileImage: {
      type: String,
      default: "",
      trim: true,
    },

    github: {
      type: String,
      default: "",
      trim: true,
    },

    linkedin: {
      type: String,
      default: "",
      trim: true,
    },

    portfolio: {
      type: String,
      default: "",
      trim: true,
    },

    location: {
      type: String,
      default: "",
      trim: true,
    },

    experience: {
      type: String,
      default: "",
      trim: true,
    },

    title: {
      type: String,
      default: "Full-stack Web Developer",
      trim: true,
    },

    certifications: [
      {
        name: { type: String, trim: true },
        completed: { type: String, trim: true },
        issuer: { type: String, trim: true },
        certificateUrl: { type: String, trim: true, default: "" },
      },
    ],

    education: {
      type: String,
      default: "",
      trim: true,
    },

    // Email verification
    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    emailVerificationToken: {
      type: String,
      default: null,
      select: false, // Never returned in queries by default
    },

    emailVerificationExpires: {
      type: Date,
      default: null,
      select: false,
    },

    // Feature 6: Skill Endorsements
    endorsements: [
      {
        skill: { type: String, required: true, trim: true },
        endorsedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        createdAt: { type: Date, default: Date.now },
      },
    ],

    // Feature 6: Gamification Badges
    badges: [
      {
        name: { type: String, required: true },
        icon: { type: String, default: "🏆" },
        description: { type: String, default: "" },
        earnedAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);

module.exports = User;