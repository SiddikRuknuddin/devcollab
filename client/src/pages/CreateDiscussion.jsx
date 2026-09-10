import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const CATEGORIES = [
  "General",
  "Programming",
  "Web Development",
  "Mobile Development",
  "Machine Learning",
  "DevOps",
  "Database",
  "Career",
  "Projects",
  "Help",
];

function CreateDiscussion() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "General",
    tags: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      setError("Please enter a discussion title");
      return;
    }

    if (!formData.content.trim()) {
      setError("Please enter discussion content");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const tagsArray = formData.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      const response = await api.post("/api/discussions", {
        title: formData.title.trim(),
        content: formData.content.trim(),
        category: formData.category,
        tags: tagsArray,
      });

      const createdDiscussion = response.data.discussion;
      navigate(`/discussions/${createdDiscussion._id}`);
    } catch (err) {
      console.error(
        "Create Discussion Error:",
        err.response?.data || err.message
      );
      setError(
        err.response?.data?.message || "Failed to create discussion. Try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="create-discussion-page"
      style={{
        maxWidth: "800px",
        margin: "0 auto",
        padding: "40px 20px",
        textAlign: "left",
      }}
    >
      <Link
        to="/discussions"
        style={{
          display: "inline-block",
          marginBottom: "20px",
          color: "#0366d6",
          textDecoration: "none",
          fontWeight: "500",
        }}
      >
        ← Back to Discussions
      </Link>

      <h1 style={{ margin: "0 0 10px 0" }}>Start a New Discussion</h1>
      <p style={{ color: "#666", marginBottom: "25px" }}>
        Share a thought, ask for help, or kick off a conversation with the DevCollab community.
      </p>

      {error && (
        <div
          style={{
            background: "#ffebee",
            color: "#c62828",
            padding: "12px 16px",
            borderRadius: "8px",
            marginBottom: "20px",
            border: "1px solid #ffcdd2",
          }}
        >
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        style={{
          background: "white",
          padding: "30px",
          borderRadius: "14px",
          border: "1px solid #ddd",
        }}
      >
        <div style={{ marginBottom: "20px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "8px",
              fontWeight: "600",
              color: "#333",
            }}
          >
            Discussion Title *
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="e.g. Best state management library for React in 2026?"
            required
            style={{
              width: "100%",
              padding: "12px",
              fontSize: "15px",
              borderRadius: "8px",
              border: "1px solid #ccc",
              boxSizing: "border-box",
            }}
          />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "16px",
            marginBottom: "20px",
          }}
        >
          <div>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: "600",
                color: "#333",
              }}
            >
              Category *
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              style={{
                width: "100%",
                padding: "12px",
                fontSize: "15px",
                borderRadius: "8px",
                border: "1px solid #ccc",
                boxSizing: "border-box",
                background: "white",
              }}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontWeight: "600",
                color: "#333",
              }}
            >
              Tags (comma-separated)
            </label>
            <input
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              placeholder="e.g. React, Redux, Zustand"
              style={{
                width: "100%",
                padding: "12px",
                fontSize: "15px",
                borderRadius: "8px",
                border: "1px solid #ccc",
                boxSizing: "border-box",
              }}
            />
          </div>
        </div>

        <div style={{ marginBottom: "25px" }}>
          <label
            style={{
              display: "block",
              marginBottom: "8px",
              fontWeight: "600",
              color: "#333",
            }}
          >
            Content *
          </label>
          <textarea
            name="content"
            value={formData.content}
            onChange={handleChange}
            rows="8"
            placeholder="Describe your question or discussion in detail..."
            required
            style={{
              width: "100%",
              padding: "12px",
              fontSize: "15px",
              borderRadius: "8px",
              border: "1px solid #ccc",
              boxSizing: "border-box",
              resize: "vertical",
              lineHeight: "1.5",
            }}
          />
        </div>

        <div style={{ display: "flex", gap: "12px" }}>
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "12px 24px",
              background: "#222",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "15px",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            {loading ? "Publishing Discussion..." : "Publish Discussion"}
          </button>

          <button
            type="button"
            onClick={() => navigate("/discussions")}
            style={{
              padding: "12px 20px",
              background: "#eee",
              color: "#333",
              border: "none",
              borderRadius: "8px",
              fontSize: "15px",
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

export default CreateDiscussion;
