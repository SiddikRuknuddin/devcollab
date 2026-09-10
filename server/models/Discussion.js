const mongoose = require("mongoose");

const CATEGORIES = [
  "General",
  "Programming",
  "Web Development",
  "Mobile Development",
  "Machine Learning",
  "DevOps",
  "Database",
  "Career",
  "Projects",
  "Help",
];

const discussionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Discussion title is required"],
      trim: true,
      minlength: [3, "Title must be at least 3 characters"],
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    content: {
      type: String,
      required: [true, "Discussion content is required"],
      trim: true,
      minlength: [5, "Content must be at least 5 characters"],
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: {
        values: CATEGORIES,
        message: "{VALUE} is not a valid category",
      },
      default: "General",
    },
    tags: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

discussionSchema.index({ title: "text", content: "text", tags: "text" });

const Discussion = mongoose.model("Discussion", discussionSchema);

module.exports = { Discussion, CATEGORIES };
