const Task = require("../models/Task");
const Project = require("../models/Project");
const ProjectMember = require("../models/ProjectMember");

// GET /api/tasks/project/:projectId
const getProjectTasks = async (req, res) => {
  try {
    const { projectId } = req.params;
    const tasks = await Task.find({ project: projectId })
      .populate("assignedTo", "name email profileImage")
      .populate("creator", "name")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, tasks });
  } catch (error) {
    console.error("Get Project Tasks Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// POST /api/tasks
const createTask = async (req, res) => {
  try {
    const { project, title, description, column, priority, assignedTo, dueDate } = req.body;

    if (!project || !title || !title.trim()) {
      return res.status(400).json({ success: false, message: "Project and title are required" });
    }

    const task = await Task.create({
      project,
      title: title.trim(),
      description: description ? description.trim() : "",
      column: column || "To Do",
      priority: priority || "Medium",
      assignedTo: assignedTo || null,
      dueDate: dueDate || null,
      creator: req.user._id,
    });

    const populated = await Task.findById(task._id)
      .populate("assignedTo", "name email profileImage")
      .populate("creator", "name");

    res.status(201).json({ success: true, task: populated });
  } catch (error) {
    console.error("Create Task Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// PUT /api/tasks/:id
const updateTask = async (req, res) => {
  try {
    const { title, description, column, priority, assignedTo, dueDate } = req.body;

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    if (title !== undefined) task.title = title.trim();
    if (description !== undefined) task.description = description.trim();
    if (priority !== undefined) task.priority = priority;
    if (assignedTo !== undefined) task.assignedTo = assignedTo || null;
    if (dueDate !== undefined) task.dueDate = dueDate || null;
    if (req.body.points !== undefined) task.points = Number(req.body.points) || 3;

    if (column !== undefined) {
      task.column = column;
      if (column === "Done" && !task.completedAt) {
        task.completedAt = new Date();
      } else if (column !== "Done") {
        task.completedAt = null;
      }
    }

    await task.save();

    const populated = await Task.findById(task._id)
      .populate("assignedTo", "name email profileImage")
      .populate("creator", "name")
      .populate("bounty.funder", "name profileImage")
      .populate("bounty.claimer", "name profileImage");

    res.status(200).json({ success: true, task: populated });
  } catch (error) {
    console.error("Update Task Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── GET /api/tasks/project/:projectId/analytics ───────────────────────────────
const getProjectSprintAnalytics = async (req, res) => {
  try {
    const { projectId } = req.params;
    const tasks = await Task.find({ project: projectId })
      .populate("assignedTo", "name email profileImage")
      .sort({ createdAt: 1 });

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.column === "Done");
    const inProgressTasks = tasks.filter((t) => t.column === "In Progress" || t.column === "In Review");
    const todoTasks = tasks.filter((t) => t.column === "To Do");

    const totalPoints = tasks.reduce((sum, t) => sum + (t.points || 3), 0);
    const completedPoints = completedTasks.reduce((sum, t) => sum + (t.points || 3), 0);
    const remainingPoints = totalPoints - completedPoints;

    // 7-day Burndown Timeline
    const burndownTimeline = [];
    const days = 7;
    const idealStep = totalPoints > 0 ? totalPoints / days : 0;

    for (let i = days; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];

      // Tasks completed on or before this day
      const completedUpToDate = tasks.filter((t) => {
        if (!t.completedAt) return false;
        const taskDate = new Date(t.completedAt).toISOString().split("T")[0];
        return taskDate <= dateStr;
      });

      const pointsDone = completedUpToDate.reduce((sum, t) => sum + (t.points || 3), 0);
      const actualRemaining = Math.max(0, totalPoints - pointsDone);
      const idealRemaining = Math.max(0, Math.round(totalPoints - idealStep * (days - i)));

      burndownTimeline.push({
        date: dateStr.slice(5), // MM-DD
        ideal: idealRemaining,
        actual: actualRemaining,
      });
    }

    // Member Velocity Breakdown
    const memberMap = {};
    tasks.forEach((t) => {
      if (t.assignedTo) {
        const uid = t.assignedTo._id.toString();
        if (!memberMap[uid]) {
          memberMap[uid] = {
            user: {
              _id: t.assignedTo._id,
              name: t.assignedTo.name,
              profileImage: t.assignedTo.profileImage,
            },
            assignedTasks: 0,
            completedTasks: 0,
            completedPoints: 0,
          };
        }
        memberMap[uid].assignedTasks += 1;
        if (t.column === "Done") {
          memberMap[uid].completedTasks += 1;
          memberMap[uid].completedPoints += t.points || 3;
        }
      }
    });

    const memberVelocity = Object.values(memberMap).sort((a, b) => b.completedPoints - a.completedPoints);

    // Bounty Summary
    const bountyTasks = tasks.filter((t) => t.bounty && t.bounty.amount > 0);
    const totalBountiesAmount = bountyTasks.reduce((acc, t) => acc + (t.bounty.amount || 0), 0);

    res.status(200).json({
      success: true,
      analytics: {
        totalTasks,
        completedCount: completedTasks.length,
        inProgressCount: inProgressTasks.length,
        todoCount: todoTasks.length,
        totalPoints,
        completedPoints,
        remainingPoints,
        completionRate: totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0,
        burndownTimeline,
        memberVelocity,
        totalBountiesAmount,
        bountyCount: bountyTasks.length,
      },
    });
  } catch (error) {
    console.error("Get Sprint Analytics Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── Feature 6: Task Bounty & Escrow Controllers ───────────────────────────────
const addBounty = async (req, res) => {
  try {
    const { amount, currency } = req.body;
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: "Task not found" });

    task.bounty = {
      amount: Number(amount) || 50,
      currency: currency || "USD",
      status: "Funded",
      funder: req.user._id,
      claimer: null,
      claimedAt: null,
      releasedAt: null,
    };

    await task.save();
    const populated = await Task.findById(task._id)
      .populate("assignedTo", "name email profileImage")
      .populate("creator", "name")
      .populate("bounty.funder", "name profileImage");

    res.status(200).json({ success: true, task: populated });
  } catch (error) {
    console.error("Add Bounty Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const claimBounty = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: "Task not found" });

    task.bounty.status = "Claimed";
    task.bounty.claimer = req.user._id;
    task.bounty.claimedAt = new Date();

    await task.save();
    const populated = await Task.findById(task._id)
      .populate("assignedTo", "name email profileImage")
      .populate("creator", "name")
      .populate("bounty.funder", "name profileImage")
      .populate("bounty.claimer", "name profileImage");

    res.status(200).json({ success: true, task: populated });
  } catch (error) {
    console.error("Claim Bounty Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const releaseBounty = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: "Task not found" });

    task.bounty.status = "Released";
    task.bounty.releasedAt = new Date();

    await task.save();
    const populated = await Task.findById(task._id)
      .populate("assignedTo", "name email profileImage")
      .populate("creator", "name")
      .populate("bounty.funder", "name profileImage")
      .populate("bounty.claimer", "name profileImage");

    res.status(200).json({ success: true, task: populated });
  } catch (error) {
    console.error("Release Bounty Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// DELETE /api/tasks/:id
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    await task.deleteOne();
    res.status(200).json({ success: true, message: "Task deleted successfully" });
  } catch (error) {
    console.error("Delete Task Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  getProjectTasks,
  createTask,
  updateTask,
  deleteTask,
  getProjectSprintAnalytics,
  addBounty,
  claimBounty,
  releaseBounty,
};

