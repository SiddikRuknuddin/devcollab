import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

function Projects() {
  const { token } = useAuth();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await axios.get(
          "http://localhost:5000/api/projects/my",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setProjects(response.data.projects);
      } catch (error) {
        console.error(
          "Projects Error:",
          error.response?.data || error.message
        );

        setError("Unable to load projects");
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchProjects();
    }
  }, [token]);

  const handleDelete = async (projectId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this project?"
    );

    if (!confirmDelete) {
      return;
    }

    try {
      await axios.delete(
        `http://localhost:5000/api/projects/${projectId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setProjects((prevProjects) =>
        prevProjects.filter(
          (project) => project._id !== projectId
        )
      );

      alert("Project deleted successfully!");
    } catch (error) {
      console.error(
        "Delete Project Error:",
        error.response?.data || error.message
      );

      alert(
        error.response?.data?.message ||
          "Failed to delete project"
      );
    }
  };

  if (loading) {
    return <p>Loading projects...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  return (
    <div className="projects-page">
      <div className="projects-header">
        <div>
          <h1>My Projects</h1>
          <p>Manage your development projects.</p>
        </div>

        <Link to="/projects/create">
          + Create Project
        </Link>
      </div>

      {projects.length === 0 ? (
        <div>
          <h2>No projects yet</h2>
          <p>
            Create your first project to get started.
          </p>
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map((project) => (
            <div
              className="project-card"
              key={project._id}
            >
              <h2>{project.title}</h2>

              <p>{project.description}</p>

              <p>
                <strong>Status:</strong>{" "}
                {project.status}
              </p>

              <p>
                <strong>Technologies:</strong>{" "}
                {project.technologies?.length
                  ? project.technologies.join(", ")
                  : "Not specified"}
              </p>

              {project.githubUrl && (
                <a
                  href={project.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  GitHub
                </a>
              )}

              <div className="project-actions">
                <Link
                  to={`/projects/edit/${project._id}`}
                >
                  Edit
                </Link>

                <button
                  onClick={() =>
                    handleDelete(project._id)
                  }
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Projects;