const { Discussion, CATEGORIES } = require("../models/Discussion");
const Comment = require("../models/Comment");
const { Notification } = require("../models/Notification");

// ==========================================
// CREATE DISCUSSION
// ==========================================
const createDiscussion = async (req, res) => {
  try {
    const { title, content, category, tags } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: "Discussion title is required",
      });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: "Discussion content is required",
      });
    }

    if (category && !CATEGORIES.includes(category)) {
      return res.status(400).json({
        success: false,
        message: `Invalid category. Must be one of: ${CATEGORIES.join(", ")}`,
      });
    }

    // Process tags
    let cleanTags = [];
    if (Array.isArray(tags)) {
      cleanTags = Array.from(
        new Set(
          tags
            .map((t) => (typeof t === "string" ? t.trim() : ""))
            .filter((t) => t.length > 0)
        )
      );
    } else if (typeof tags === "string") {
      cleanTags = Array.from(
        new Set(
          tags
            .split(",")
            .map((t) => t.trim())
            .filter((t) => t.length > 0)
        )
      );
    }

    const discussion = await Discussion.create({
      title: title.trim(),
      content: content.trim(),
      category: category || "General",
      tags: cleanTags,
      author: req.user.id,
    });

    const populatedDiscussion = await Discussion.findById(discussion._id).populate(
      "author",
      "name profileImage skills"
    );

    res.status(201).json({
      success: true,
      message: "Discussion created successfully",
      discussion: populatedDiscussion,
    });
  } catch (error) {
    console.error("Create Discussion Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error creating discussion",
    });
  }
};

// ==========================================
// GET ALL DISCUSSIONS (Search, Category, Sort)
// ==========================================
const getDiscussions = async (req, res) => {
  try {
    const { search, category, sort } = req.query;
    const filter = {};

    if (category && category !== "All" && CATEGORIES.includes(category)) {
      filter.category = category;
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(
        search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "i"
      );
      filter.$or = [
        { title: searchRegex },
        { content: searchRegex },
        { tags: searchRegex },
      ];
    }

    const sortOption = sort === "oldest" ? { createdAt: 1 } : { createdAt: -1 };

    const discussions = await Discussion.find(filter)
      .populate("author", "name profileImage skills")
      .sort(sortOption)
      .lean();

    // Get comment counts for all fetched discussions
    const discussionIds = discussions.map((d) => d._id);
    const commentCounts = await Comment.aggregate([
      { $match: { discussion: { $in: discussionIds } } },
      { $group: { _id: "$discussion", count: { $sum: 1 } } },
    ]);

    const countMap = {};
    commentCounts.forEach((item) => {
      countMap[item._id.toString()] = item.count;
    });

    const discussionsWithCount = discussions.map((d) => ({
      ...d,
      commentCount: countMap[d._id.toString()] || 0,
    }));

    res.status(200).json({
      success: true,
      count: discussionsWithCount.length,
      discussions: discussionsWithCount,
    });
  } catch (error) {
    console.error("Get Discussions Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching discussions",
    });
  }
};

// ==========================================
// GET DISCUSSION BY ID
// ==========================================
const getDiscussionById = async (req, res) => {
  try {
    const { id } = req.params;

    const discussion = await Discussion.findById(id).populate(
      "author",
      "name profileImage skills bio"
    );

    if (!discussion) {
      return res.status(404).json({
        success: false,
        message: "Discussion not found",
      });
    }

    const comments = await Comment.find({ discussion: id })
      .populate("author", "name profileImage skills")
      .sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      discussion,
      comments,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(404).json({
        success: false,
        message: "Discussion not found",
      });
    }

    console.error("Get Discussion Details Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching discussion",
    });
  }
};

// ==========================================
// UPDATE DISCUSSION
// ==========================================
const updateDiscussion = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, category, tags } = req.body;

    const discussion = await Discussion.findById(id);

    if (!discussion) {
      return res.status(404).json({
        success: false,
        message: "Discussion not found",
      });
    }

    if (discussion.author.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this discussion",
      });
    }

    if (title !== undefined) {
      if (!title.trim()) {
        return res.status(400).json({
          success: false,
          message: "Discussion title cannot be empty",
        });
      }
      discussion.title = title.trim();
    }

    if (content !== undefined) {
      if (!content.trim()) {
        return res.status(400).json({
          success: false,
          message: "Discussion content cannot be empty",
        });
      }
      discussion.content = content.trim();
    }

    if (category !== undefined) {
      if (!CATEGORIES.includes(category)) {
        return res.status(400).json({
          success: false,
          message: `Invalid category. Must be one of: ${CATEGORIES.join(", ")}`,
        });
      }
      discussion.category = category;
    }

    if (tags !== undefined) {
      if (Array.isArray(tags)) {
        discussion.tags = Array.from(
          new Set(
            tags
              .map((t) => (typeof t === "string" ? t.trim() : ""))
              .filter((t) => t.length > 0)
          )
        );
      } else if (typeof tags === "string") {
        discussion.tags = Array.from(
          new Set(
            tags
              .split(",")
              .map((t) => t.trim())
              .filter((t) => t.length > 0)
          )
        );
      }
    }

    await discussion.save();

    const updatedDiscussion = await Discussion.findById(discussion._id).populate(
      "author",
      "name profileImage skills bio"
    );

    res.status(200).json({
      success: true,
      message: "Discussion updated successfully",
      discussion: updatedDiscussion,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(404).json({
        success: false,
        message: "Discussion not found",
      });
    }

    console.error("Update Discussion Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error updating discussion",
    });
  }
};

// ==========================================
// DELETE DISCUSSION
// ==========================================
const deleteDiscussion = async (req, res) => {
  try {
    const { id } = req.params;

    const discussion = await Discussion.findById(id);

    if (!discussion) {
      return res.status(404).json({
        success: false,
        message: "Discussion not found",
      });
    }

    if (discussion.author.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this discussion",
      });
    }

    // Cascade delete all comments and related notifications
    await Promise.all([
      Comment.deleteMany({ discussion: id }),
      Notification.deleteMany({ relatedDiscussion: id }),
      Discussion.findByIdAndDelete(id),
    ]);

    res.status(200).json({
      success: true,
      message: "Discussion and associated comments deleted successfully",
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(404).json({
        success: false,
        message: "Discussion not found",
      });
    }

    console.error("Delete Discussion Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error deleting discussion",
    });
  }
};

module.exports = {
  createDiscussion,
  getDiscussions,
  getDiscussionById,
  updateDiscussion,
  deleteDiscussion,
};
