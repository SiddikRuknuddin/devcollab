const Project = require("../models/Project");
const ProjectMember = require("../models/ProjectMember");
const { Notification } = require("../models/Notification");
const {
  extractRepoFromUrl,
  getPublicRepoInfo,
} = require("../services/githubService");

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

module.exports = {
  createProject,
  getMyProjects,
  getProjectById,
  updateProject,
  deleteProject,
  getProjectGithubInfo,
};