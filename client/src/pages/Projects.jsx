import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

function Projects() {
  const { token } = useAuth();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchProjects = async () => {
    try {
      const response = await api.get("/api/projects/my");
      setProjects(response.data.projects || []);
    } catch (err) {
      console.error("Projects Error:", err.response?.data || err.message);
      setError("Unable to load projects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchProjects();
    }
  }, [token]);

  const handleDelete = async (projectId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this project?"
    );

    if (!confirmDelete) return;

    try {
      await api.delete(`/api/projects/${projectId}`);
      setProjects((prev) => prev.filter((p) => p._id !== projectId));
    } catch (err) {
      console.error("Delete Project Error:", err.response?.data || err.message);
      alert(err.response?.data?.message || "Failed to delete project");
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: "1000px", margin: "2rem auto", padding: "0 1rem" }}>
        <p>Loading projects...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: "1000px", margin: "2rem auto", padding: "0 1rem" }}>
        <p style={{ color: "#ef4444" }}>{error}</p>
        <button onClick={fetchProjects}>Retry</button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1000px", margin: "2rem auto", padding: "0 1rem", textAlign: "left" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.5rem",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div>
          <h1 style={{ margin: "0 0 0.25rem 0", fontSize: "1.75rem", color: "#111827" }}>
            My Projects 💻
          </h1>
          <p style={{ margin: 0, color: "#6b7280", fontSize: "0.95rem" }}>
            Manage and track your development projects.
          </p>
        </div>

        <Link
          to="/projects/create"
          style={{
            padding: "0.6rem 1.25rem",
            backgroundColor: "#2563eb",
            color: "white",
            borderRadius: "6px",
            textDecoration: "none",
            fontWeight: 600,
            fontSize: "0.9rem",
          }}
        >
          + Create Project
        </Link>
      </div>

      {projects.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "3.5rem 1.5rem",
            backgroundColor: "#f9fafb",
            borderRadius: "8px",
            border: "1px solid #e5e7eb",
          }}
        >
          <span style={{ fontSize: "2.5rem" }}>📁</span>
          <h3 style={{ marginTop: "1rem", marginBottom: "0.5rem" }}>
            No projects yet
          </h3>
          <p style={{ color: "#6b7280", margin: "0 0 1.5rem 0" }}>
            Create your first project to collaborate with developers.
          </p>
          <Link
            to="/projects/create"
            style={{
              padding: "0.6rem 1.2rem",
              backgroundColor: "#2563eb",
              color: "white",
              borderRadius: "6px",
              textDecoration: "none",
              fontWeight: 500,
            }}
          >
            Create Your First Project
          </Link>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "1.25rem",
          }}
        >
          {projects.map((project) => (
            <div
              key={project._id}
              style={{
                backgroundColor: "#ffffff",
                padding: "1.25rem",
                borderRadius: "8px",
                border: "1px solid #e5e7eb",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: "0.5rem",
                    gap: "0.5rem",
                  }}
                >
                  <h2
                    style={{
                      margin: 0,
                      fontSize: "1.15rem",
                      color: "#111827",
                    }}
                  >
                    {project.title}
                  </h2>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      padding: "0.15rem 0.5rem",
                      borderRadius: "4px",
                      fontWeight: 600,
                      backgroundColor:
                        project.status === "Completed"
                          ? "#ecfdf5"
                          : project.status === "In Progress"
                          ? "#eff6ff"
                          : "#fffbeb",
                      color:
                        project.status === "Completed"
                          ? "#059669"
                          : project.status === "In Progress"
                          ? "#2563eb"
                          : "#d97706",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {project.status}
                  </span>
                </div>

                <p
                  style={{
                    margin: "0 0 0.75rem 0",
                    color: "#4b5563",
                    fontSize: "0.9rem",
                    lineHeight: 1.4,
                    display: "-webkit-box",
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {project.description}
                </p>

                {project.technologies?.length > 0 && (
                  <div
                    style={{
                      display: "flex",
                      gap: "0.35rem",
                      flexWrap: "wrap",
                      marginBottom: "0.75rem",
                    }}
                  >
                    {project.technologies.slice(0, 4).map((tech, idx) => (
                      <span
                        key={idx}
                        style={{
                          fontSize: "0.75rem",
                          backgroundColor: "#f3f4f6",
                          color: "#374151",
                          padding: "0.15rem 0.4rem",
                          borderRadius: "4px",
                        }}
                      >
                        {tech}
                      </span>
                    ))}
                    {project.technologies.length > 4 && (
                      <span
                        style={{
                          fontSize: "0.75rem",
                          color: "#6b7280",
                        }}
                      >
                        +{project.technologies.length - 4} more
                      </span>
                    )}
                  </div>
                )}

                {project.githubUrl && (
                  <div style={{ marginBottom: "0.75rem" }}>
                    <a
                      href={project.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontSize: "0.85rem",
                        color: "#2563eb",
                        textDecoration: "none",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.25rem",
                      }}
                    >
                      <span>🐙</span> GitHub
                    </a>
                  </div>
                )}
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "0.5rem",
                  borderTop: "1px solid #f3f4f6",
                  paddingTop: "0.75rem",
                  flexWrap: "wrap",
                  alignItems: "center",
                }}
              >
                <Link
                  to={`/projects/${project._id}`}
                  style={{
                    fontSize: "0.85rem",
                    color: "#2563eb",
                    textDecoration: "none",
                    fontWeight: 500,
                  }}
                >
                  View Details
                </Link>

                <span style={{ color: "#d1d5db" }}>•</span>

                <Link
                  to={`/projects/edit/${project._id}`}
                  style={{
                    fontSize: "0.85rem",
                    color: "#4b5563",
                    textDecoration: "none",
                    fontWeight: 500,
                  }}
                >
                  Edit
                </Link>

                <span style={{ color: "#d1d5db" }}>•</span>

                <Link
                  to={`/projects/${project._id}/members`}
                  style={{
                    fontSize: "0.85rem",
                    color: "#4b5563",
                    textDecoration: "none",
                    fontWeight: 500,
                  }}
                >
                  Members
                </Link>

                <span style={{ color: "#d1d5db" }}>•</span>

                <button
                  onClick={() => handleDelete(project._id)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#ef4444",
                    fontSize: "0.85rem",
                    cursor: "pointer",
                    padding: 0,
                    fontWeight: 500,
                  }}
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