const fs = require("fs");
const path = require("path");
const Project = require("../models/Project");
const ProjectMember = require("../models/ProjectMember");
const { Notification } = require("../models/Notification");
const {
  extractRepoFromUrl,
  getPublicRepoInfo,
} = require("../services/githubService");
const { sendWebhookNotification } = require("../utils/webhookNotifier");
const { uploadToCloudinary } = require("../utils/cloudinary");

const isCloudinaryConfigured = () => {
  return (
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_CLOUD_NAME !== "your_cloud_name" &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_KEY !== "your_api_key"
  );
};

const createProject = async (req, res) => {
  try {
    const {
      title,
      description,
      technologies,
      githubUrl,
      status,
    } = req.body;

    if (!title || !title.trim() || !description || !description.trim()) {
      return res.status(400).json({
        success: false,
        message: "Title and description are required",
      });
    }

    const normalizedTechnologies = Array.isArray(technologies)
      ? technologies.map((t) => (typeof t === "string" ? t.trim() : "")).filter(Boolean)
      : typeof technologies === "string"
      ? technologies
          .split(",")
          .map((tech) => tech.trim())
          .filter(Boolean)
      : [];

    const project = await Project.create({
      title: title.trim(),
      description: description.trim(),
      technologies: normalizedTechnologies,
      githubUrl: githubUrl ? githubUrl.trim() : "",
      status: status || "Planning",
      owner: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: "Project created successfully",
      project,
    });
  } catch (error) {
    console.error("Create Project Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error creating project",
    });
  }
};

const getMyProjects = async (req, res) => {
  try {
    const projects = await Project.find({
      owner: req.user.id,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: projects.length,
      projects,
    });
  } catch (error) {
    console.error("Get My Projects Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error retrieving projects",
    });
  }
};

const getProjectById = async (req, res) => {
  try {
    const { id } = req.params;

    const project = await Project.findById(id).populate(
      "owner",
      "name email bio skills profileImage"
    );

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    res.status(200).json({
      success: true,
      project,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    console.error("Get Project By ID Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error retrieving project details",
    });
  }
};

const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, technologies, githubUrl, status } = req.body;

    const project = await Project.findById(id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    if (project.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this project",
      });
    }

    if (title !== undefined) {
      if (!title.trim()) {
        return res.status(400).json({
          success: false,
          message: "Title cannot be empty",
        });
      }
      project.title = title.trim();
    }

    if (description !== undefined) {
      if (!description.trim()) {
        return res.status(400).json({
          success: false,
          message: "Description cannot be empty",
        });
      }
      project.description = description.trim();
    }

    if (technologies !== undefined) {
      project.technologies = Array.isArray(technologies)
        ? technologies.map((t) => (typeof t === "string" ? t.trim() : "")).filter(Boolean)
        : typeof technologies === "string"
        ? technologies
            .split(",")
            .map((tech) => tech.trim())
            .filter(Boolean)
        : [];
    }

    if (githubUrl !== undefined) project.githubUrl = githubUrl.trim();
    if (status !== undefined) {
      if (!["Planning", "In Progress", "Completed"].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Status must be Planning, In Progress, or Completed",
        });
      }
      project.status = status;
    }

    await project.save();

    res.status(200).json({
      success: true,
      message: "Project updated successfully",
      project,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    console.error("Update Project Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error updating project",
    });
  }
};

const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;

    const project = await Project.findById(id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    if (project.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this project",
      });
    }

    // Cascade delete associated members and notifications
    await Promise.all([
      ProjectMember.deleteMany({ project: id }),
      Notification.deleteMany({ relatedProject: id }),
      Project.findByIdAndDelete(id),
    ]);

    res.status(200).json({
      success: true,
      message: "Project and associated data deleted successfully",
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    console.error("Delete Project Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error deleting project",
    });
  }
};

const getProjectGithubInfo = async (req, res) => {
  try {
    const { id } = req.params;

    const project = await Project.findById(id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    if (!project.githubUrl || !project.githubUrl.trim()) {
      return res.status(200).json({
        success: true,
        hasGithub: false,
        message: "No GitHub repository linked",
        repo: null,
      });
    }

    const parsed = extractRepoFromUrl(project.githubUrl);

    if (!parsed) {
      return res.status(200).json({
        success: true,
        hasGithub: true,
        isValidGithubUrl: false,
        message: "Invalid GitHub repository URL format",
        rawUrl: project.githubUrl,
        repo: null,
      });
    }

    const githubResult = await getPublicRepoInfo(parsed.owner, parsed.repo);

    if (!githubResult.success) {
      return res.status(200).json({
        success: true,
        hasGithub: true,
        isValidGithubUrl: true,
        message: githubResult.message || "Unable to fetch GitHub repository details",
        notFound: !!githubResult.notFound,
        rateLimited: !!githubResult.rateLimited,
        rawUrl: project.githubUrl,
        repo: null,
      });
    }

    res.status(200).json({
      success: true,
      hasGithub: true,
      isValidGithubUrl: true,
      rawUrl: project.githubUrl,
      repo: githubResult.repo,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    console.error("Get Project GitHub Info Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching GitHub information",
    });
  }
};

// ── Feature 8: Milestones Controllers ──────────────────────────────────────────
const addMilestone = async (req, res) => {
  try {
    const { title, dueDate } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: "Milestone title is required" });
    }

    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: "Project not found" });

    project.milestones.push({
      title: title.trim(),
      dueDate: dueDate || null,
      isCompleted: false,
    });

    await project.save();
    res.status(201).json({ success: true, milestones: project.milestones });
  } catch (error) {
    console.error("Add Milestone Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const toggleMilestone = async (req, res) => {
  try {
    const { id, milestoneId } = req.params;
    const project = await Project.findById(id);
    if (!project) return res.status(404).json({ success: false, message: "Project not found" });

    const ms = project.milestones.id(milestoneId);
    if (!ms) return res.status(404).json({ success: false, message: "Milestone not found" });

    ms.isCompleted = !ms.isCompleted;
    ms.completedAt = ms.isCompleted ? new Date() : null;

    await project.save();
    res.status(200).json({ success: true, milestones: project.milestones });
  } catch (error) {
    console.error("Toggle Milestone Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const deleteMilestone = async (req, res) => {
  try {
    const { id, milestoneId } = req.params;
    const project = await Project.findById(id);
    if (!project) return res.status(404).json({ success: false, message: "Project not found" });

    project.milestones.pull(milestoneId);
    await project.save();
    res.status(200).json({ success: true, milestones: project.milestones });
  } catch (error) {
    console.error("Delete Milestone Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── Feature 7: Project File Vault Controllers ─────────────────────────────────
const addProjectFile = async (req, res) => {
  try {
    const { name, url, fileType, size } = req.body;
    if (!name || !url) {
      return res.status(400).json({ success: false, message: "File name and URL are required" });
    }

    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: "Project not found" });

    project.files.push({
      name: name.trim(),
      url: url.trim(),
      fileType: fileType || "file",
      size: size || 0,
      uploadedBy: req.user._id,
      createdAt: new Date(),
    });

    await project.save();

    const populated = await Project.findById(project._id).populate("files.uploadedBy", "name profileImage");
    res.status(201).json({ success: true, files: populated.files });
  } catch (error) {
    console.error("Add Project File Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const deleteProjectFile = async (req, res) => {
  try {
    const { id, fileId } = req.params;
    const project = await Project.findById(id);
    if (!project) return res.status(404).json({ success: false, message: "Project not found" });

    project.files.pull(fileId);
    await project.save();
    res.status(200).json({ success: true, files: project.files });
  } catch (error) {
    console.error("Delete Project File Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const uploadProjectFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file provided" });
    }

    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: "Project not found" });

    let fileUrl = "";
    const originalName = req.file.originalname || "attachment";
    const fileSize = req.file.size || (req.file.buffer ? req.file.buffer.length : 0);
    const ext = path.extname(originalName).toLowerCase().replace(".", "");

    let fileType = "file";
    if (["png", "jpg", "jpeg", "webp", "gif", "svg"].includes(ext)) {
      fileType = "design";
    } else if (ext === "pdf") {
      fileType = "pdf";
    } else if (["zip", "rar", "tar", "gz", "7z"].includes(ext)) {
      fileType = "file";
    } else if (["js", "jsx", "ts", "tsx", "py", "html", "css", "json", "md", "sql", "java", "cpp", "c"].includes(ext)) {
      fileType = "code";
    } else if (["doc", "docx", "txt", "rtf", "md"].includes(ext)) {
      fileType = "document";
    }

    // 1. Try Cloudinary if properly configured
    if (isCloudinaryConfigured()) {
      try {
        const result = await uploadToCloudinary(req.file.buffer, {
          folder: "devcollab/projects",
          resource_type: "auto",
        });
        fileUrl = result.secure_url;
      } catch (cloudErr) {
        console.warn("Cloudinary project file upload failed, falling back to local:", cloudErr.message);
      }
    }

    // 2. Local disk fallback
    if (!fileUrl) {
      const uploadDir = path.join(__dirname, "../uploads/projects");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const fileExt = path.extname(originalName) || "";
      const filename = `proj_${project._id}_${Date.now()}${fileExt}`;
      const filePath = path.join(uploadDir, filename);

      fs.writeFileSync(filePath, req.file.buffer);
      fileUrl = `/uploads/projects/${filename}`;
    }

    project.files.push({
      name: originalName,
      url: fileUrl,
      fileType,
      size: fileSize,
      uploadedBy: req.user._id,
      createdAt: new Date(),
    });

    await project.save();

    const populated = await Project.findById(project._id).populate("files.uploadedBy", "name profileImage");
    res.status(201).json({ success: true, files: populated.files });
  } catch (error) {
    console.error("Upload Project File Error:", error);
    res.status(500).json({ success: false, message: "Server error uploading file" });
  }
};

// ── Feature 10: Public Explore Projects & Applications ─────────────────────────
const getExploreProjects = async (req, res) => {
  try {
    const { search, tech } = req.query;
    const query = { isPublic: true };

    if (search && search.trim()) {
      const q = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      query.$or = [{ title: q }, { description: q }, { technologies: q }];
    }

    if (tech && tech !== "All") {
      query.technologies = { $regex: new RegExp(tech.trim(), "i") };
    }

    const projects = await Project.find(query)
      .populate("owner", "name email profileImage title")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: projects.length, projects });
  } catch (error) {
    console.error("Get Explore Projects Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const applyToProject = async (req, res) => {
  try {
    const { message } = req.body;
    const projectId = req.params.id;

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ success: false, message: "Project not found" });

    if (project.owner.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: "You are the owner of this project" });
    }

    const alreadyApplied = project.applications?.some(
      (a) => a.applicant.toString() === req.user._id.toString()
    );
    if (alreadyApplied) {
      return res.status(400).json({ success: false, message: "You have already applied to this project" });
    }

    project.applications.push({
      applicant: req.user._id,
      message: message ? message.trim() : "",
      status: "Pending",
      createdAt: new Date(),
    });

    await project.save();
    res.status(201).json({ success: true, message: "Application submitted successfully" });
  } catch (error) {
    console.error("Apply To Project Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── Feature 4: AI Teammate Matchmaker ─────────────────────────────────────────
const getRecommendedTeammates = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: "Project not found" });

    const User = require("../models/User");
    const ProjectMember = require("../models/ProjectMember");

    // Existing members
    const existingMembers = await ProjectMember.find({ project: project._id });
    const excludedUserIds = [
      project.owner.toString(),
      ...existingMembers.map((m) => m.user.toString()),
    ];

    // Candidate developers
    const candidates = await User.find({ _id: { $nin: excludedUserIds } })
      .select("name email profileImage skills bio location experience title")
      .limit(30);

    const projectTechs = (project.technologies || []).map((t) => t.toLowerCase().trim());
    const projectKeywords = [
      ...projectTechs,
      ...project.title.toLowerCase().split(/\s+/),
      ...project.description.toLowerCase().split(/\s+/).filter((w) => w.length > 3),
    ];

    // Match scoring algorithm
    const recommendations = candidates
      .map((dev) => {
        let score = 0;
        const matchedSkills = [];
        const devSkills = (dev.skills || []).map((s) => s.toLowerCase().trim());

        // Score based on tech stack match (heavy weight)
        projectTechs.forEach((pt) => {
          if (devSkills.some((ds) => ds.includes(pt) || pt.includes(ds))) {
            score += 35;
            matchedSkills.push(pt);
          }
        });

        // Score based on bio / title keywords
        const devText = `${dev.bio || ""} ${dev.title || ""}`.toLowerCase();
        projectKeywords.forEach((kw) => {
          if (devText.includes(kw)) score += 5;
        });

        // Base confidence percentage capped between 55% and 98%
        const finalPercentage = Math.min(98, Math.max(55, Math.round(50 + score)));

        return {
          developer: dev,
          matchPercentage: finalPercentage,
          matchedSkills: Array.from(new Set(matchedSkills)),
        };
      })
      .sort((a, b) => b.matchPercentage - a.matchPercentage)
      .slice(0, 5); // Top 5 matches

    res.status(200).json({ success: true, recommendations });
  } catch (error) {
    console.error("Get Recommended Teammates Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── Feature 3: Collaborative Architecture Whiteboard ─────────────────────────
const saveArchitectureDiagram = async (req, res) => {
  try {
    const { diagramData } = req.body;
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: "Project not found" });

    project.architectureDiagram = diagramData;
    await project.save();

    res.status(200).json({ success: true, message: "Architecture diagram saved", diagramData });
  } catch (error) {
    console.error("Save Architecture Diagram Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ── Feature 4: Project Discord & Slack Webhooks ───────────────────────────────
const getWebhooks = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).select("webhooks");
    if (!project) return res.status(404).json({ success: false, message: "Project not found" });

    res.status(200).json({ success: true, webhooks: project.webhooks || [] });
  } catch (error) {
    console.error("Get Webhooks Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const addWebhook = async (req, res) => {
  try {
    const { platform, url, events } = req.body;
    if (!url || !url.startsWith("http")) {
      return res.status(400).json({ success: false, message: "Valid webhook URL is required" });
    }

    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: "Project not found" });

    const newHook = {
      platform: platform || "discord",
      url: url.trim(),
      events: events && events.length > 0 ? events : ["task.created", "task.completed", "milestone.completed"],
      active: true,
      createdAt: new Date(),
    };

    project.webhooks.push(newHook);
    await project.save();

    res.status(201).json({ success: true, webhooks: project.webhooks });
  } catch (error) {
    console.error("Add Webhook Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const deleteWebhook = async (req, res) => {
  try {
    const { id, webhookId } = req.params;
    const project = await Project.findById(id);
    if (!project) return res.status(404).json({ success: false, message: "Project not found" });

    project.webhooks.pull(webhookId);
    await project.save();

    res.status(200).json({ success: true, webhooks: project.webhooks });
  } catch (error) {
    console.error("Delete Webhook Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const testWebhook = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: "Project not found" });

    await sendWebhookNotification(project, "test.ping", {
      description: "DevCollab integration test ping! Your webhook is properly connected and active.",
      userName: req.user?.name || "DevCollab Admin",
      extra: "Automated event delivery channel established successfully.",
    });

    res.status(200).json({ success: true, message: "Test webhook dispatched successfully!" });
  } catch (error) {
    console.error("Test Webhook Error:", error);
    res.status(500).json({ success: false, message: "Server error dispatching webhook" });
  }
};

// ── Feature 9: Cloud Deployment Status & Preview Links ───────────────────────
const addDeployment = async (req, res) => {
  try {
    const { environment, provider, url } = req.body;
    if (!url || !url.startsWith("http")) {
      return res.status(400).json({ success: false, message: "Valid URL is required" });
    }

    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, message: "Project not found" });

    const newDep = {
      environment: environment || "Production",
      provider: provider || "Vercel",
      url: url.trim(),
      status: "Live",
      lastChecked: new Date(),
      latencyMs: 120,
      createdAt: new Date(),
    };

    project.deployments.push(newDep);
    await project.save();

    res.status(201).json({ success: true, deployments: project.deployments });
  } catch (error) {
    console.error("Add Deployment Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const deleteDeployment = async (req, res) => {
  try {
    const { id, depId } = req.params;
    const project = await Project.findById(id);
    if (!project) return res.status(404).json({ success: false, message: "Project not found" });

    project.deployments.pull(depId);
    await project.save();

    res.status(200).json({ success: true, deployments: project.deployments });
  } catch (error) {
    console.error("Delete Deployment Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const pingDeployment = async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ success: false, message: "URL is required" });

    const start = Date.now();
    try {
      const response = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(6000) });
      const latencyMs = Date.now() - start;
      const isLive = response.status < 400 || response.status === 401 || response.status === 403;

      res.status(200).json({
        success: true,
        status: isLive ? "Live" : "Offline",
        statusCode: response.status,
        latencyMs,
        checkedAt: new Date(),
      });
    } catch (netErr) {
      res.status(200).json({
        success: true,
        status: "Offline",
        latencyMs: 0,
        error: netErr.message,
        checkedAt: new Date(),
      });
    }
  } catch (error) {
    console.error("Ping Deployment Error:", error);
    res.status(500).json({ success: false, message: "Server error pinging deployment" });
  }
};

module.exports = {
  createProject,
  getMyProjects,
  getProjectById,
  updateProject,
  deleteProject,
  getProjectGithubInfo,
  addMilestone,
  toggleMilestone,
  deleteMilestone,
  addProjectFile,
  uploadProjectFile,
  deleteProjectFile,
  getExploreProjects,
  applyToProject,
  getRecommendedTeammates,
  saveArchitectureDiagram,
  getWebhooks,
  addWebhook,
  deleteWebhook,
  testWebhook,
  addDeployment,
  deleteDeployment,
  pingDeployment,
};