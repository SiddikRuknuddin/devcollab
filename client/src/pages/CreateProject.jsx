import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";

function CreateProject() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    technologies: "",
    githubUrl: "",
    status: "Planning",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.description.trim()) {
      setError("Title and description are required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const technologiesArray = formData.technologies
        .split(",")
        .map((tech) => tech.trim())
        .filter((tech) => tech !== "");

      await api.post("/api/projects", {
        title: formData.title.trim(),
        description: formData.description.trim(),
        technologies: technologiesArray,
        githubUrl: formData.githubUrl.trim(),
        status: formData.status,
      });

      navigate("/projects");
    } catch (err) {
      console.error(
        "Create Project Error:",
        err.response?.data || err.message
      );

      setError(
        err.response?.data?.message || "Failed to create project. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: "600px",
        margin: "2rem auto",
        padding: "2rem",
        backgroundColor: "#ffffff",
        borderRadius: "12px",
        border: "1px solid #e5e7eb",
        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        textAlign: "left",
      }}
    >
      <Link
        to="/projects"
        style={{
          display: "inline-block",
          marginBottom: "1rem",
          color: "#2563eb",
          textDecoration: "none",
          fontSize: "0.9rem",
          fontWeight: 500,
        }}
      >
        ← Back to Projects
      </Link>

      <h1 style={{ margin: "0 0 0.25rem 0", fontSize: "1.75rem", color: "#111827" }}>
        Create Project 🚀
      </h1>
      <p style={{ margin: "0 0 1.5rem 0", color: "#6b7280", fontSize: "0.95rem" }}>
        Start a new development project and invite teammates.
      </p>

      {error && (
        <div
          style={{
            padding: "0.75rem 1rem",
            backgroundColor: "#fef2f2",
            border: "1px solid #fee2e2",
            borderRadius: "6px",
            color: "#ef4444",
            fontSize: "0.9rem",
            marginBottom: "1.25rem",
          }}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "1.25rem" }}>
          <label
            htmlFor="proj-title"
            style={{
              display: "block",
              fontSize: "0.9rem",
              fontWeight: 600,
              color: "#374151",
              marginBottom: "0.4rem",
            }}
          >
            Project Title *
          </label>
          <input
            id="proj-title"
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="e.g. AI Code Assistant"
            required
            style={{
              width: "100%",
              padding: "0.75rem 0.9rem",
              borderRadius: "6px",
              border: "1px solid #d1d5db",
              fontSize: "0.95rem",
              boxSizing: "border-box",
            }}
          />
        </div>

        <div style={{ marginBottom: "1.25rem" }}>
          <label
            htmlFor="proj-desc"
            style={{
              display: "block",
              fontSize: "0.9rem",
              fontWeight: 600,
              color: "#374151",
              marginBottom: "0.4rem",
            }}
          >
            Description *
          </label>
          <textarea
            id="proj-desc"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="What does this project do?"
            required
            rows="4"
            style={{
              width: "100%",
              padding: "0.75rem 0.9rem",
              borderRadius: "6px",
              border: "1px solid #d1d5db",
              fontSize: "0.95rem",
              boxSizing: "border-box",
              resize: "vertical",
            }}
          />
        </div>

        <div style={{ marginBottom: "1.25rem" }}>
          <label
            htmlFor="proj-tech"
            style={{
              display: "block",
              fontSize: "0.9rem",
              fontWeight: 600,
              color: "#374151",
              marginBottom: "0.4rem",
            }}
          >
            Technologies (comma-separated)
          </label>
          <input
            id="proj-tech"
            type="text"
            name="technologies"
            value={formData.technologies}
            onChange={handleChange}
            placeholder="React, Node.js, MongoDB, TypeScript"
            style={{
              width: "100%",
              padding: "0.75rem 0.9rem",
              borderRadius: "6px",
              border: "1px solid #d1d5db",
              fontSize: "0.95rem",
              boxSizing: "border-box",
            }}
          />
        </div>

        <div style={{ marginBottom: "1.25rem" }}>
          <label
            htmlFor="proj-github"
            style={{
              display: "block",
              fontSize: "0.9rem",
              fontWeight: 600,
              color: "#374151",
              marginBottom: "0.4rem",
            }}
          >
            GitHub URL
          </label>
          <input
            id="proj-github"
            type="url"
            name="githubUrl"
            value={formData.githubUrl}
            onChange={handleChange}
            placeholder="https://github.com/username/repository"
            style={{
              width: "100%",
              padding: "0.75rem 0.9rem",
              borderRadius: "6px",
              border: "1px solid #d1d5db",
              fontSize: "0.95rem",
              boxSizing: "border-box",
            }}
          />
        </div>

        <div style={{ marginBottom: "1.5rem" }}>
          <label
            htmlFor="proj-status"
            style={{
              display: "block",
              fontSize: "0.9rem",
              fontWeight: 600,
              color: "#374151",
              marginBottom: "0.4rem",
            }}
          >
            Project Status
          </label>
          <select
            id="proj-status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            style={{
              width: "100%",
              padding: "0.75rem 0.9rem",
              borderRadius: "6px",
              border: "1px solid #d1d5db",
              fontSize: "0.95rem",
              boxSizing: "border-box",
              backgroundColor: "#ffffff",
            }}
          >
            <option value="Planning">Planning</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>
        </div>

        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "0.75rem 1.5rem",
              backgroundColor: "#2563eb",
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontWeight: 600,
              fontSize: "0.95rem",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Creating..." : "Create Project"}
          </button>

          <button
            type="button"
            onClick={() => navigate("/projects")}
            style={{
              padding: "0.75rem 1.25rem",
              backgroundColor: "#f3f4f6",
              color: "#374151",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              fontWeight: 500,
              fontSize: "0.95rem",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreateProject;