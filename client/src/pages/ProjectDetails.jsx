import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

function ProjectDetails() {
  const { id, projectId } = useParams();
  const currentProjectId = projectId || id;
  const { token } = useAuth();

  const [project, setProject] = useState(null);
  const [githubData, setGithubData] = useState(null);
  const [githubLoading, setGithubLoading] = useState(false);
  const [githubError, setGithubError] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await api.get(`/api/projects/${currentProjectId}`);
        const projectData = response.data.project;
        setProject(projectData);

        if (projectData?.githubUrl) {
          fetchGithubStats(currentProjectId);
        }
      } catch (err) {
        console.error("Project Details Error:", err.response?.data || err.message);

        if (err.response?.status === 404) {
          setError("Project not found");
        } else {
          setError(
            err.response?.data?.message || "Unable to load project details"
          );
        }
      } finally {
        setLoading(false);
      }
    };

    const fetchGithubStats = async (pId) => {
      setGithubLoading(true);
      setGithubError("");
      try {
        const res = await api.get(`/api/projects/${pId}/github`);

        if (res.data.repo) {
          setGithubData(res.data.repo);
        } else if (res.data.message) {
          setGithubError(res.data.message);
        }
      } catch (gErr) {
        console.error("GitHub Info Error:", gErr);
        setGithubError("Could not load GitHub metadata");
      } finally {
        setGithubLoading(false);
      }
    };

    if (token && currentProjectId) {
      fetchProject();
    }
  }, [token, currentProjectId]);

  if (loading) {
    return (
      <div style={{ maxWidth: "850px", margin: "2rem auto", padding: "0 1rem" }}>
        <p>Loading project details...</p>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div style={{ maxWidth: "850px", margin: "2rem auto", padding: "0 1rem", textAlign: "left" }}>
        <Link
          to="/projects"
          style={{
            display: "inline-block",
            marginBottom: "1rem",
            color: "#2563eb",
            textDecoration: "none",
            fontWeight: 500,
          }}
        >
          ← Back to Projects
        </Link>
        <p style={{ color: "#ef4444", marginTop: "1rem" }}>
          {error || "Project not found."}
        </p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "850px", margin: "2rem auto", padding: "0 1rem", textAlign: "left" }}>
      <Link
        to="/projects"
        style={{
          display: "inline-block",
          marginBottom: "1rem",
          color: "#2563eb",
          textDecoration: "none",
          fontWeight: 500,
          fontSize: "0.9rem",
        }}
      >
        ← Back to Projects
      </Link>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.25rem",
          flexWrap: "wrap",
          gap: "0.5rem",
        }}
      >
        <h1 style={{ margin: 0, fontSize: "1.85rem", color: "#111827" }}>
          {project.title}
        </h1>
        <span
          style={{
            padding: "0.25rem 0.75rem",
            borderRadius: "9999px",
            fontSize: "0.85rem",
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
          }}
        >
          {project.status}
        </span>
      </div>

      {/* Main Info Card */}
      <div
        style={{
          backgroundColor: "#ffffff",
          padding: "1.5rem",
          borderRadius: "8px",
          border: "1px solid #e5e7eb",
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          marginBottom: "1.5rem",
        }}
      >
        <div style={{ marginBottom: "1.25rem" }}>
          <h3 style={{ margin: "0 0 0.4rem 0", fontSize: "0.95rem", color: "#374151", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Description
          </h3>
          <p style={{ margin: 0, color: "#4b5563", lineHeight: 1.6, fontSize: "1rem" }}>
            {project.description}
          </p>
        </div>

        <div style={{ marginBottom: "1.25rem" }}>
          <h3 style={{ margin: "0 0 0.4rem 0", fontSize: "0.95rem", color: "#374151", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Technologies
          </h3>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {project.technologies?.length > 0 ? (
              project.technologies.map((tech, idx) => (
                <span
                  key={idx}
                  style={{
                    backgroundColor: "#f3f4f6",
                    color: "#374151",
                    padding: "0.25rem 0.65rem",
                    borderRadius: "6px",
                    fontSize: "0.85rem",
                    fontWeight: 500,
                  }}
                >
                  {tech}
                </span>
              ))
            ) : (
              <span style={{ color: "#9ca3af", fontSize: "0.9rem" }}>
                Not specified
              </span>
            )}
          </div>
        </div>

        {/* Project Owner Info */}
        {project.owner && (
          <div
            style={{
              padding: "1rem 1.25rem",
              backgroundColor: "#f9fafb",
              borderRadius: "6px",
              border: "1px solid #f3f4f6",
              marginTop: "1.25rem",
            }}
          >
            <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "0.95rem", color: "#111827" }}>
              👤 Project Owner
            </h3>
            <p style={{ margin: "0 0 0.25rem 0", fontSize: "0.9rem", color: "#374151" }}>
              <strong>Name:</strong> {project.owner.name || "N/A"}
            </p>
            {project.owner.email && (
              <p style={{ margin: "0 0 0.25rem 0", fontSize: "0.9rem", color: "#374151" }}>
                <strong>Email:</strong> {project.owner.email}
              </p>
            )}
            {project.owner.bio && (
              <p style={{ margin: "0 0 0.25rem 0", fontSize: "0.9rem", color: "#374151" }}>
                <strong>Bio:</strong> {project.owner.bio}
              </p>
            )}
            {project.owner.skills?.length > 0 && (
              <p style={{ margin: "0", fontSize: "0.9rem", color: "#374151" }}>
                <strong>Skills:</strong> {project.owner.skills.join(", ")}
              </p>
            )}
          </div>
        )}
      </div>

      {/* GitHub Repository Section */}
      <div
        style={{
          backgroundColor: "#ffffff",
          padding: "1.5rem",
          borderRadius: "8px",
          border: "1px solid #e5e7eb",
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "1rem",
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: "1.2rem",
              color: "#111827",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <span>🐙</span> GitHub Repository
          </h2>

          {project.githubUrl && (
            <a
              href={project.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: "0.85rem",
                color: "#2563eb",
                textDecoration: "none",
                fontWeight: 500,
              }}
            >
              Open in GitHub ↗
            </a>
          )}
        </div>

        {!project.githubUrl ? (
          <div
            style={{
              padding: "1.5rem",
              backgroundColor: "#f9fafb",
              borderRadius: "6px",
              textAlign: "center",
              color: "#6b7280",
              fontSize: "0.95rem",
            }}
          >
            <p style={{ margin: 0 }}>No GitHub repository linked to this project.</p>
          </div>
        ) : githubLoading ? (
          <div style={{ color: "#6b7280", fontSize: "0.9rem", padding: "1rem 0" }}>
            Fetching repository information from GitHub...
          </div>
        ) : githubData ? (
          <div
            style={{
              padding: "1.25rem",
              backgroundColor: "#f8fafc",
              borderRadius: "6px",
              border: "1px solid #e2e8f0",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: "0.75rem",
                flexWrap: "wrap",
                gap: "0.5rem",
              }}
            >
              <div>
                <h3 style={{ margin: "0 0 0.25rem 0", fontSize: "1.1rem", color: "#0f172a" }}>
                  {githubData.fullName || githubData.name}
                </h3>
                <p style={{ margin: 0, color: "#64748b", fontSize: "0.9rem" }}>
                  {githubData.description}
                </p>
              </div>

              {githubData.language && (
                <span
                  style={{
                    backgroundColor: "#e0e7ff",
                    color: "#3730a3",
                    padding: "0.2rem 0.6rem",
                    borderRadius: "4px",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                  }}
                >
                  {githubData.language}
                </span>
              )}
            </div>

            {/* Metrics Chips */}
            <div
              style={{
                display: "flex",
                gap: "1rem",
                flexWrap: "wrap",
                margin: "1rem 0 0 0",
                paddingTop: "0.75rem",
                borderTop: "1px solid #e2e8f0",
                fontSize: "0.85rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                <span>⭐</span>
                <strong>Stars:</strong> {githubData.stars}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                <span>🍴</span>
                <strong>Forks:</strong> {githubData.forks}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                <span>⚠️</span>
                <strong>Open Issues:</strong> {githubData.openIssues}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                <span>🌿</span>
                <strong>Branch:</strong> {githubData.defaultBranch}
              </div>
            </div>
          </div>
        ) : (
          <div
            style={{
              padding: "1rem 1.25rem",
              backgroundColor: "#f9fafb",
              borderRadius: "6px",
              border: "1px solid #e5e7eb",
            }}
          >
            <p style={{ margin: "0 0 0.5rem 0", color: "#374151", fontSize: "0.9rem" }}>
              <strong>Repository Link:</strong>{" "}
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#2563eb" }}
              >
                {project.githubUrl}
              </a>
            </p>
            {githubError && (
              <p style={{ margin: 0, color: "#6b7280", fontSize: "0.85rem" }}>
                <em>Note: {githubError}</em>
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ProjectDetails;
