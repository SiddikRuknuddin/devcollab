const Project = require("../models/Project");
const User = require("../models/User");
const ProjectMember = require("../models/ProjectMember");
const { createNotification } = require("../utils/notificationHelper");

const inviteDeveloper = async (req, res) => {
  try {
    const { userId, role } = req.body;
    const projectId = req.params.projectId || req.params.id;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    // Check project
    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Only project owner can invite developers
    if (project.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Only project owner can invite developers",
      });
    }

    // Check developer exists
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Developer not found",
      });
    }

    // Owner cannot invite himself
    if (userId === req.user.id) {
      return res.status(400).json({
        success: false,
        message: "You cannot invite yourself",
      });
    }

    // Check duplicate invitation/member
    const existingMember = await ProjectMember.findOne({
      project: projectId,
      user: userId,
    });

    if (existingMember) {
      return res.status(400).json({
        success: false,
        message: "Developer is already invited or a member",
      });
    }

    const member = await ProjectMember.create({
      project: projectId,
      user: userId,
      role: role || "Developer",
      status: "Pending",
    });

    // Notify the invited developer
    const ownerUser = await User.findById(req.user.id);
    const ownerName = ownerUser?.name || "A project owner";
    await createNotification({
      recipient: userId,
      sender: req.user.id,
      type: "PROJECT_INVITATION",
      title: "Project Invitation",
      message: `${ownerName} invited you to join "${project.title}".`,
      relatedProject: project._id,
    });

    res.status(201).json({
      success: true,
      message: "Developer invited successfully",
      member,
    });
  } catch (error) {
    console.error("Invite Developer Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const getProjectMembers = async (req, res) => {
  try {
    const projectId = req.params.projectId || req.params.id;

    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Only project owner can view members
    if (project.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Only project owner can view project members",
      });
    }

    const members = await ProjectMember.find({
      project: projectId,
    })
      .populate("user", "name email bio skills profileImage")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: members.length,
      members,
    });
  } catch (error) {
    console.error("Get Project Members Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const respondToInvitation = async (req, res) => {
  try {
    const { memberId } = req.params;
    const { status } = req.body;

    if (!["Accepted", "Rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be Accepted or Rejected",
      });
    }

    const member = await ProjectMember.findById(memberId).populate("project");

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Invitation not found",
      });
    }

    // Only invited developer can respond
    if (member.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to respond to this invitation",
      });
    }

    // Invitation must still be pending
    if (member.status !== "Pending") {
      return res.status(400).json({
        success: false,
        message: "Invitation has already been processed",
      });
    }

    member.status = status;
    await member.save();

    // Notify project owner
    const respondingUser = await User.findById(req.user.id);
    const developerName = respondingUser?.name || "A developer";
    const projectTitle = member.project?.title || "your project";
    const projectOwner = member.project?.owner;

    if (projectOwner) {
      const isAccepted = status === "Accepted";
      await createNotification({
        recipient: projectOwner,
        sender: req.user.id,
        type: isAccepted ? "INVITATION_ACCEPTED" : "INVITATION_REJECTED",
        title: isAccepted ? "Invitation Accepted" : "Invitation Rejected",
        message: isAccepted
          ? `${developerName} accepted your invitation to join "${projectTitle}".`
          : `${developerName} declined your invitation to join "${projectTitle}".`,
        relatedProject: member.project?._id || member.project,
      });
    }

    res.status(200).json({
      success: true,
      message: `Invitation ${status.toLowerCase()} successfully`,
      member,
    });
  } catch (error) {
    console.error("Invitation Response Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const getMyInvitations = async (req, res) => {
  try {
    const invitations = await ProjectMember.find({
      user: req.user.id,
    })
      .populate("project", "title description status owner")
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: invitations.length,
      invitations,
    });
  } catch (error) {
    console.error("Get My Invitations Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const removeMember = async (req, res) => {
  try {
    const { memberId } = req.params;

    const member = await ProjectMember.findById(memberId);

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Member not found",
      });
    }

    const project = await Project.findById(member.project);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Only project owner can remove members
    if (project.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Only project owner can remove members",
      });
    }

    const removedUserId = member.user;

    await ProjectMember.findByIdAndDelete(memberId);

    // Notify the removed member
    await createNotification({
      recipient: removedUserId,
      sender: req.user.id,
      type: "PROJECT_MEMBER_REMOVED",
      title: "Removed from Project",
      message: `You have been removed from the project "${project.title}".`,
      relatedProject: project._id,
    });

    res.status(200).json({
      success: true,
      message: "Member removed successfully",
    });
  } catch (error) {
    console.error("Remove Member Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/**
 * DELETE /api/projects/members/:memberId/cancel
 * Project owner cancels a PENDING invitation.
 * Cannot cancel an already Accepted or Rejected invitation through this route.
 */
const cancelInvitation = async (req, res) => {
  try {
    const { memberId } = req.params;

    const member = await ProjectMember.findById(memberId);

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Invitation not found",
      });
    }

    const project = await Project.findById(member.project);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Only the project owner can cancel invitations
    if (project.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Only the project owner can cancel invitations",
      });
    }

    // Can only cancel Pending invitations
    if (member.status !== "Pending") {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel an invitation with status "${member.status}". Only Pending invitations can be cancelled.`,
      });
    }

    await ProjectMember.findByIdAndDelete(memberId);

    res.status(200).json({
      success: true,
      message: "Invitation cancelled successfully",
    });
  } catch (error) {
    console.error("Cancel Invitation Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = {
  inviteDeveloper,
  getProjectMembers,
  respondToInvitation,
  getMyInvitations,
  removeMember,
  cancelInvitation,
};