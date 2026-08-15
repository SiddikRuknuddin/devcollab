import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

function EditProject() {
  const { id } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    technologies: "",
    githubUrl: "",
    status: "Planning",
  });

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await axios.get(
          `http://localhost:5000/api/projects/my`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const project = response.data.projects.find(
          (project) => project._id === id
        );

        if (!project) {
          setError("Project not found");
          return;
        }

        setFormData({
          title: project.title || "",
          description: project.description || "",
          technologies:
            project.technologies?.join(", ") || "",
          githubUrl: project.githubUrl || "",
          status: project.status || "Planning",
        });
      } catch (error) {
        console.error(
          "Fetch Project Error:",
          error.response?.data || error.message
        );

        setError("Unable to load project");
      } finally {
        setLoading(false);
      }
    };

    if (token && id) {
      fetchProject();
    }
  }, [token, id]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setSaving(true);
    setError("");

    try {
      const technologiesArray = formData.technologies
        .split(",")
        .map((tech) => tech.trim())
        .filter((tech) => tech !== "");

      await axios.put(
        `http://localhost:5000/api/projects/${id}`,
        {
          title: formData.title,
          description: formData.description,
          technologies: technologiesArray,
          githubUrl: formData.githubUrl,
          status: formData.status,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      alert("Project updated successfully!");

      navigate("/projects");
    } catch (error) {
      console.error(
        "Update Project Error:",
        error.response?.data || error.message
      );

      setError(
        error.response?.data?.message ||
          "Failed to update project"
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p>Loading project...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  return (
    <div className="edit-project-page">
      <h1>Edit Project</h1>

      <p>Update your project information.</p>

      {error && <p>{error}</p>}

      <form onSubmit={handleSubmit}>
        <label>Project Title</label>

        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          required
        />

        <label>Description</label>

        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          required
        />

        <label>Technologies</label>

        <input
          type="text"
          name="technologies"
          value={formData.technologies}
          onChange={handleChange}
          placeholder="React, Node.js, MongoDB"
        />

        <label>GitHub URL</label>

        <input
          type="url"
          name="githubUrl"
          value={formData.githubUrl}
          onChange={handleChange}
          placeholder="https://github.com/username/project"
        />

        <label>Status</label>

        <select
          name="status"
          value={formData.status}
          onChange={handleChange}
        >
          <option value="Planning">Planning</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
        </select>

        <button type="submit" disabled={saving}>
          {saving ? "Updating..." : "Update Project"}
        </button>

        <button
          type="button"
          onClick={() => navigate("/projects")}
        >
          Cancel
        </button>
      </form>
    </div>
  );
}

export default EditProject;