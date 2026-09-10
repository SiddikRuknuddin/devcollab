const Project = require("../models/Project");
const ProjectMember = require("../models/ProjectMember");
const { Discussion } = require("../models/Discussion");
const Comment = require("../models/Comment");

// ==========================================
// GET DASHBOARD STATS
// ==========================================
const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // Projects owned by user
    const [
      totalProjects,
      planningProjects,
      inProgressProjects,
      completedProjects,
    ] = await Promise.all([
      Project.countDocuments({ owner: userId }),
      Project.countDocuments({ owner: userId, status: "Planning" }),
      Project.countDocuments({ owner: userId, status: "In Progress" }),
      Project.countDocuments({ owner: userId, status: "Completed" }),
    ]);

    // Find all project IDs owned by user to count total members
    const userProjects = await Project.find({ owner: userId }).select("_id");
    const userProjectIds = userProjects.map((p) => p._id);

    // Total accepted members in user's projects
    const totalProjectMembers = await ProjectMember.countDocuments({
      project: { $in: userProjectIds },
      status: "Accepted",
    });

    // Invitations received by the user
    const [pendingInvitations, acceptedInvitations] = await Promise.all([
      ProjectMember.countDocuments({ user: userId, status: "Pending" }),
      ProjectMember.countDocuments({ user: userId, status: "Accepted" }),
    ]);

    // Discussions & Comments created by the user
    const [totalDiscussions, totalComments] = await Promise.all([
      Discussion.countDocuments({ author: userId }),
      Comment.countDocuments({ author: userId }),
    ]);

    // Recent activity (projects, discussions, received invitations)
    const [recentProjects, recentDiscussions, recentInvitations] =
      await Promise.all([
        Project.find({ owner: userId })
          .sort({ createdAt: -1 })
          .limit(3)
          .select("title description status technologies createdAt"),
        Discussion.find({ author: userId })
          .sort({ createdAt: -1 })
          .limit(3)
          .select("title category createdAt"),
        ProjectMember.find({ user: userId })
          .populate("project", "title status")
          .sort({ createdAt: -1 })
          .limit(3),
      ]);

    res.status(200).json({
      success: true,
      stats: {
        totalProjects,
        planningProjects,
        inProgressProjects,
        completedProjects,
        totalProjectMembers,
        pendingInvitations,
        acceptedInvitations,
        totalDiscussions,
        totalComments,
      },
      recentActivity: {
        projects: recentProjects,
        discussions: recentDiscussions,
        invitations: recentInvitations,
      },
    });
  } catch (error) {
    console.error("Get Dashboard Stats Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching dashboard statistics",
    });
  }
};

module.exports = {
  getDashboardStats,
};
