const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    technologies: {
      type: [String],
      default: [],
    },

    githubUrl: {
      type: String,
      default: "",
      trim: true,
    },

    status: {
      type: String,
      enum: ["Planning", "In Progress", "Completed"],
      default: "Planning",
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Feature 8: Milestones & Roadmap
    milestones: [
      {
        title: { type: String, required: true, trim: true },
        dueDate: { type: Date, default: null },
        isCompleted: { type: Boolean, default: false },
        completedAt: { type: Date, default: null },
      },
    ],

    // Feature 7: Project File Vault
    files: [
      {
        name: { type: String, required: true, trim: true },
        url: { type: String, required: true },
        fileType: { type: String, default: "file" },
        size: { type: Number, default: 0 },
        uploadedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        createdAt: { type: Date, default: Date.now },
      },
    ],

    // Feature 10: Public Explore & Bounties
    isPublic: {
      type: Boolean,
      default: true,
    },

    applications: [
      {
        applicant: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        message: { type: String, default: "", trim: true },
        status: {
          type: String,
          enum: ["Pending", "Accepted", "Rejected"],
          default: "Pending",
        },
        createdAt: { type: Date, default: Date.now },
      },
    ],

    // Advanced Feature 3: Architecture Whiteboard Diagram State
    architectureDiagram: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    // Advanced Feature 4: Automated Discord / Slack Webhooks
    webhooks: [
      {
        platform: {
          type: String,
          enum: ["discord", "slack", "custom"],
          default: "discord",
        },
        url: { type: String, required: true, trim: true },
        events: [{ type: String }],
        active: { type: Boolean, default: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],

    // Advanced Feature 9: Cloud Deployment Status & Preview Links
    deployments: [
      {
        environment: {
          type: String,
          enum: ["Production", "Staging", "Preview"],
          default: "Production",
        },
        provider: {
          type: String,
          enum: ["Vercel", "Render", "Netlify", "Railway", "AWS", "Custom"],
          default: "Vercel",
        },
        url: { type: String, required: true, trim: true },
        status: {
          type: String,
          enum: ["Live", "Building", "Failed", "Offline"],
          default: "Live",
        },
        lastChecked: { type: Date, default: Date.now },
        latencyMs: { type: Number, default: 0 },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }

);

module.exports = mongoose.model("Project", projectSchema);