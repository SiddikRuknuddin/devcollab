const Project = require("../models/Project");

const createProject = async (req, res) => {
  try {
    const {
      title,
      description,
      technologies,
      githubUrl,
      status,
    } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: "Title and description are required",
      });
    }

    const project = await Project.create({
      title,
      description,
      technologies: technologies || [],
      githubUrl: githubUrl || "",
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
      message: "Server error",
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
      message: "Server error",
    });
  }
};

const updateProject = async (req, res) => {
  try {
    const {
      title,
      description,
      technologies,
      githubUrl,
      status,
    } = req.body;

    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    if (project.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to update this project",
      });
    }

    project.title = title ?? project.title;
    project.description = description ?? project.description;
    project.technologies =
      technologies ?? project.technologies;
    project.githubUrl = githubUrl ?? project.githubUrl;
    project.status = status ?? project.status;

    await project.save();

    res.status(200).json({
      success: true,
      message: "Project updated successfully",
      project,
    });
  } catch (error) {
    console.error("Update Project Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    if (project.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to delete this project",
      });
    }

    await Project.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Project deleted successfully",
    });
  } catch (error) {
    console.error("Delete Project Error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
module.exports = {
  createProject,
  getMyProjects,
  updateProject,
  deleteProject,
};