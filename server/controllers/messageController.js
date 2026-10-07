const Message = require("../models/Message");
const ProjectMember = require("../models/ProjectMember");
const Project = require("../models/Project");

// GET /api/messages/project/:projectId
const getProjectMessages = async (req, res) => {
  try {
    const { projectId } = req.params;

    // Verify user is project owner or accepted member
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    const isOwner = project.owner.toString() === req.user._id.toString();
    const isMember = await ProjectMember.findOne({
      project: projectId,
      user: req.user._id,
      status: "Accepted",
    });

    if (!isOwner && !isMember && !project.isPublic) {
      return res.status(403).json({ success: false, message: "Not authorized to view project chat" });
    }

    const messages = await Message.find({ project: projectId })
      .populate("sender", "name email profileImage")
      .sort({ createdAt: 1 })
      .limit(100);

    res.status(200).json({ success: true, messages });
  } catch (error) {
    console.error("Get Project Messages Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET /api/messages/direct/:userId
const getDirectMessages = async (req, res) => {
  try {
    const myId = req.user._id;
    const otherId = req.params.userId;

    const messages = await Message.find({
      $or: [
        { sender: myId, recipient: otherId },
        { sender: otherId, recipient: myId },
      ],
    })
      .populate("sender", "name email profileImage")
      .populate("recipient", "name email profileImage")
      .sort({ createdAt: 1 })
      .limit(100);

    res.status(200).json({ success: true, messages });
  } catch (error) {
    console.error("Get Direct Messages Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// POST /api/messages
const sendMessage = async (req, res) => {
  try {
    const { projectId, recipientId, text, codeSnippet } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: "Message text is required" });
    }

    const message = await Message.create({
      sender: req.user._id,
      project: projectId || null,
      recipient: recipientId || null,
      text: text.trim(),
      codeSnippet: codeSnippet || undefined,
    });

    const populated = await Message.findById(message._id)
      .populate("sender", "name email profileImage")
      .populate("recipient", "name email profileImage");

    res.status(201).json({ success: true, message: populated });
  } catch (error) {
    console.error("Send Message Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  getProjectMessages,
  getDirectMessages,
  sendMessage,
};
