const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    title: {
      type: String,
      required: [true, "Task title is required"],
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: 2000,
    },
    column: {
      type: String,
      enum: ["To Do", "In Progress", "In Review", "Done"],
      default: "To Do",
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Urgent"],
      default: "Medium",
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    dueDate: {
      type: Date,
      default: null,
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    points: {
      type: Number,
      default: 3,
      min: 1,
      max: 21,
    },
    bounty: {
      amount: { type: Number, default: 0 },
      currency: { type: String, default: "USD" },
      status: {
        type: String,
        enum: ["None", "Funded", "Claimed", "Released"],
        default: "None",
      },
      funder: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
      claimer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
      claimedAt: { type: Date, default: null },
      releasedAt: { type: Date, default: null },
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

taskSchema.index({ project: 1, column: 1 });

module.exports = mongoose.model("Task", taskSchema);
