import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const CATEGORIES = [
  "All",
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

function Discussions() {
  const { token } = useAuth();

  const [discussions, setDiscussions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("newest");

  useEffect(() => {
    const fetchDiscussions = async () => {
      setLoading(true);
      setError("");

      try {
        const params = new URLSearchParams();
        if (search.trim()) params.append("search", search.trim());
        if (category && category !== "All") params.append("category", category);
        if (sort) params.append("sort", sort);

        const response = await api.get(
          `/api/discussions?${params.toString()}`
        );

        setDiscussions(response.data.discussions || []);
      } catch (err) {
        console.error(
          "Discussions Fetch Error:",
          err.response?.data || err.message
        );
        setError("Unable to load discussions");
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      const debounceTimer = setTimeout(() => {
        fetchDiscussions();
      }, 300);

      return () => clearTimeout(debounceTimer);
    }
  }, [token, search, category, sort]);

  return (
    <div
      className="discussions-page"
      style={{
        maxWidth: "1000px",
        margin: "0 auto",
        padding: "40px 20px",
        textAlign: "left",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
          marginBottom: "20px",
        }}
      >
        <div>
          <h1 style={{ margin: "0 0 8px 0", fontSize: "32px" }}>
            💬 Community Discussions
          </h1>
          <p style={{ color: "#666", margin: 0 }}>
            Ask questions, share ideas, and connect with fellow developers.
          </p>
        </div>

        <Link
          to="/discussions/create"
          style={{
            display: "inline-block",
            padding: "10px 20px",
            background: "#222",
            color: "white",
            textDecoration: "none",
            borderRadius: "8px",
            fontWeight: "500",
          }}
        >
          + Create Discussion
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          background: "white",
          padding: "16px 20px",
          borderRadius: "12px",
          border: "1px solid #ddd",
          marginBottom: "24px",
          display: "flex",
          flexWrap: "wrap",
          gap: "16px",
          alignItems: "center",
        }}
      >
        <div style={{ flex: "1 1 260px" }}>
          <input
            type="text"
            placeholder="Search discussions by title, content, or tag..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 14px",
              borderRadius: "6px",
              border: "1px solid #ccc",
              boxSizing: "border-box",
              fontSize: "14px",
            }}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <label style={{ fontSize: "14px", fontWeight: "500", color: "#555" }}>
            Category:
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={{
              padding: "10px 12px",
              borderRadius: "6px",
              border: "1px solid #ccc",
              fontSize: "14px",
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

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <label style={{ fontSize: "14px", fontWeight: "500", color: "#555" }}>
            Sort:
          </label>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            style={{
              padding: "10px 12px",
              borderRadius: "6px",
              border: "1px solid #ccc",
              fontSize: "14px",
              background: "white",
            }}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
      </div>

      {loading ? (
        <p style={{ textAlign: "center", color: "#666" }}>
          Loading discussions...
        </p>
      ) : error ? (
        <div
          style={{
            background: "#ffebee",
            color: "#c62828",
            padding: "16px",
            borderRadius: "8px",
            border: "1px solid #ffcdd2",
            textAlign: "center",
          }}
        >
          {error}
        </div>
      ) : discussions.length === 0 ? (
        <div
          style={{
            background: "white",
            padding: "40px",
            borderRadius: "12px",
            border: "1px solid #ddd",
            textAlign: "center",
          }}
        >
          <h3>No discussions found</h3>
          <p style={{ color: "#777", margin: "10px 0 20px 0" }}>
            {search || category !== "All"
              ? "No discussions match your filter criteria. Try clearing search or selecting a different category."
              : "Be the first developer to start a discussion!"}
          </p>
          <Link
            to="/discussions/create"
            style={{
              display: "inline-block",
              padding: "10px 18px",
              background: "#222",
              color: "white",
              textDecoration: "none",
              borderRadius: "6px",
              fontSize: "14px",
            }}
          >
            Start a Discussion
          </Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {discussions.map((discussion) => (
            <div
              key={discussion._id}
              style={{
                background: "white",
                border: "1px solid #ddd",
                borderRadius: "12px",
                padding: "20px 24px",
                transition: "border-color 0.2s ease",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: "12px",
                  marginBottom: "8px",
                }}
              >
                <Link
                  to={`/discussions/${discussion._id}`}
                  style={{
                    fontSize: "20px",
                    fontWeight: "600",
                    color: "#111",
                    textDecoration: "none",
                    flex: 1,
                  }}
                >
                  {discussion.title}
                </Link>

                <span
                  style={{
                    background: "#eef2ff",
                    color: "#4338ca",
                    fontSize: "12px",
                    fontWeight: "600",
                    padding: "4px 10px",
                    borderRadius: "12px",
                    whiteSpace: "nowrap",
                  }}
                >
                  {discussion.category}
                </span>
              </div>

              <p
                style={{
                  color: "#555",
                  fontSize: "15px",
                  lineHeight: "1.5",
                  marginBottom: "14px",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {discussion.content}
              </p>

              {discussion.tags && discussion.tags.length > 0 && (
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "6px",
                    marginBottom: "14px",
                  }}
                >
                  {discussion.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      style={{
                        background: "#f3f4f6",
                        color: "#4b5563",
                        fontSize: "12px",
                        padding: "2px 8px",
                        borderRadius: "10px",
                      }}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: "13px",
                  color: "#777",
                  borderTop: "1px solid #f0f0f0",
                  paddingTop: "12px",
                  flexWrap: "wrap",
                  gap: "8px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div
                    style={{
                      width: "24px",
                      height: "24px",
                      borderRadius: "50%",
                      background: "#eee",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden",
                      fontSize: "12px",
                    }}
                  >
                    {discussion.author?.profileImage ? (
                      <img
                        src={discussion.author.profileImage}
                        alt={discussion.author.name}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                        onError={(e) => {
                          e.target.style.display = "none";
                          e.target.parentElement.innerHTML = "👤";
                        }}
                      />
                    ) : (
                      "👤"
                    )}
                  </div>
                  <span>
                    Posted by <strong>{discussion.author?.name || "Developer"}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    {new Date(discussion.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    fontWeight: "500",
                    color: "#555",
                  }}
                >
                  💬 {discussion.commentCount || 0}{" "}
                  {discussion.commentCount === 1 ? "comment" : "comments"}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Discussions;
