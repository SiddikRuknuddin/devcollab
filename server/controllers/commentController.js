const Comment = require("../models/Comment");
const { Discussion } = require("../models/Discussion");
const { Notification } = require("../models/Notification");
const { createNotification } = require("../utils/notificationHelper");

// ==========================================
// CREATE COMMENT
// ==========================================
const createComment = async (req, res) => {
  try {
    const { discussionId } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: "Comment content is required",
      });
    }

    const discussion = await Discussion.findById(discussionId);

    if (!discussion) {
      return res.status(404).json({
        success: false,
        message: "Discussion not found",
      });
    }

    const comment = await Comment.create({
      discussion: discussionId,
      author: req.user.id,
      content: content.trim(),
    });

    const populatedComment = await Comment.findById(comment._id).populate(
      "author",
      "name profileImage skills"
    );

    // Notify discussion author if someone else commented
    if (discussion.author.toString() !== req.user.id) {
      const commenterName = populatedComment.author?.name || "A developer";
      await createNotification({
        recipient: discussion.author,
        sender: req.user.id,
        type: "DISCUSSION_COMMENT",
        title: "New Comment on Discussion",
        message: `${commenterName} commented on your discussion "${discussion.title}".`,
        relatedDiscussion: discussion._id,
        relatedComment: comment._id,
      });
    }

    res.status(201).json({
      success: true,
      message: "Comment added successfully",
      comment: populatedComment,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(404).json({
        success: false,
        message: "Discussion not found",
      });
    }

    console.error("Create Comment Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error creating comment",
    });
  }
};

// ==========================================
// GET COMMENTS FOR DISCUSSION
// ==========================================
const getComments = async (req, res) => {
  try {
    const { discussionId } = req.params;

    const discussion = await Discussion.findById(discussionId);

    if (!discussion) {
      return res.status(404).json({
        success: false,
        message: "Discussion not found",
      });
    }

    const comments = await Comment.find({ discussion: discussionId })
      .populate("author", "name profileImage skills")
      .sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      count: comments.length,
      comments,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(404).json({
        success: false,
        message: "Discussion not found",
      });
    }

    console.error("Get Comments Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching comments",
    });
  }
};

// ==========================================
// UPDATE COMMENT
// ==========================================
const updateComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: "Comment content cannot be empty",
      });
    }

    const comment = await Comment.findById(id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    if (comment.author.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this comment",
      });
    }

    comment.content = content.trim();
    await comment.save();

    const updatedComment = await Comment.findById(comment._id).populate(
      "author",
      "name profileImage skills"
    );

    res.status(200).json({
      success: true,
      message: "Comment updated successfully",
      comment: updatedComment,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    console.error("Update Comment Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error updating comment",
    });
  }
};

// ==========================================
// DELETE COMMENT
// ==========================================
const deleteComment = async (req, res) => {
  try {
    const { id } = req.params;

    const comment = await Comment.findById(id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    if (comment.author.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this comment",
      });
    }

    await Promise.all([
      Notification.deleteMany({ relatedComment: id }),
      Comment.findByIdAndDelete(id),
    ]);

    res.status(200).json({
      success: true,
      message: "Comment deleted successfully",
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    console.error("Delete Comment Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error deleting comment",
    });
  }
};

module.exports = {
  createComment,
  getComments,
  updateComment,
  deleteComment,
};
