const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // If project is set, this is a team chat message for the project room
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      default: null,
    },
    // If recipient is set, this is a 1-on-1 direct message
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 3000,
    },
    // Optional attached code snippet
    codeSnippet: {
      code: { type: String, default: "" },
      language: { type: String, default: "javascript" },
    },
  },
  {
    timestamps: true,
  }
);

messageSchema.index({ project: 1, createdAt: 1 });
messageSchema.index({ sender: 1, recipient: 1, createdAt: 1 });

module.exports = mongoose.model("Message", messageSchema);
