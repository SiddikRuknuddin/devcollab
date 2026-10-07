import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const CATEGORIES = [
  "All", "General", "Programming", "Web Development",
  "Mobile Development", "Machine Learning", "DevOps",
  "Database", "Career", "Projects", "Help",
];

const CATEGORY_ICONS = {
  All: "🌐", General: "💡", Programming: "💻",
  "Web Development": "🌍", "Mobile Development": "📱",
  "Machine Learning": "🤖", DevOps: "⚙️",
  Database: "🗄️", Career: "🚀", Projects: "📁", Help: "🆘",
};

const GRADIENTS = [
  "linear-gradient(135deg, #6366f1, #8b5cf6)",
  "linear-gradient(135deg, #06b6d4, #3b82f6)",
  "linear-gradient(135deg, #f59e0b, #ef4444)",
  "linear-gradient(135deg, #10b981, #06b6d4)",
  "linear-gradient(135deg, #ec4899, #8b5cf6)",
];

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function Discussions() {
  const { token } = useAuth();
  const [discussions, setDiscussions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("newest");
  const [searchFocused, setSearchFocused] = useState(false);
  const [hoveredId, setHoveredId] = useState(null);

  useEffect(() => {
    if (!token) return;
    const fetchDiscussions = async () => {
      setError("");
      try {
        const params = new URLSearchParams();
        if (search.trim()) params.append("search", search.trim());
        if (category && category !== "All") params.append("category", category);
        if (sort) params.append("sort", sort);
        const response = await api.get(`/api/discussions?${params.toString()}`);
        setDiscussions(response.data.discussions || []);
      } catch (err) {
        setError("Unable to load discussions");
      } finally {
        setLoading(false);
      }
    };
    const t = setTimeout(fetchDiscussions, 250);
    return () => clearTimeout(t);
  }, [token, search, category, sort]);

  return (
    <div style={{
      minHeight: "calc(100vh - 64px)",
      background: "var(--bg)",
      padding: "2rem 1.25rem 4rem",
    }}>
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{
          display: "flex", justifyContent: "space-between",
          alignItems: "flex-start", flexWrap: "wrap",
          gap: "16px", marginBottom: "2rem",
        }}>
          <div>
            <h1 style={{
              margin: "0 0 8px", fontSize: "2rem", fontWeight: "800",
              color: "var(--text-primary)", letterSpacing: "-0.03em",
              display: "flex", alignItems: "center", gap: "12px",
            }}>
              <span style={{
                width: "42px", height: "42px", borderRadius: "11px",
                background: "linear-gradient(135deg, #ec4899, #8b5cf6)",
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                fontSize: "20px", boxShadow: "0 6px 20px rgba(236,72,153,0.35)",
              }}>💬</span>
              Community Discussions
            </h1>
            <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "0.95rem" }}>
              Ask questions, share ideas, and connect with developers
            </p>
          </div>

          <Link to="/discussions/create" style={{
            display: "inline-flex", alignItems: "center", gap: "8px",
            padding: "10px 20px",
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            color: "#fff", borderRadius: "10px", textDecoration: "none",
            fontWeight: "700", fontSize: "0.9rem",
            boxShadow: "0 6px 20px rgba(99,102,241,0.35)",
            transition: "all 0.2s ease",
            whiteSpace: "nowrap",
            alignSelf: "flex-start",
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(99,102,241,0.5)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(99,102,241,0.35)"; }}
          >
            + New Discussion
          </Link>
        </div>

        {/* Filter Bar */}
        <div style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "16px",
          padding: "16px 20px",
          marginBottom: "24px",
          display: "flex", flexWrap: "wrap",
          gap: "12px", alignItems: "center",
          boxShadow: "var(--shadow)",
        }}>
          {/* Search */}
          <div style={{
            flex: "1 1 280px",
            display: "flex", alignItems: "center", gap: "10px",
            background: searchFocused ? "var(--surface)" : "var(--surface-2)",
            border: `1px solid ${searchFocused ? "var(--primary)" : "var(--border)"}`,
            borderRadius: "10px",
            padding: "8px 14px",
            transition: "all 0.2s ease",
            boxShadow: searchFocused ? "0 0 0 3px var(--primary-light)" : "none",
          }}>
            <span style={{ fontSize: "15px", opacity: 0.5 }}>🔍</span>
            <input
              type="text"
              placeholder="Search by title, content, tag..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              style={{
                flex: 1, border: "none", outline: "none",
                background: "transparent", fontSize: "0.9rem",
                color: "var(--text-primary)", fontFamily: "var(--font)",
              }}
            />
            {search && (
              <button onClick={() => setSearch("")} style={{
                background: "none", border: "none", cursor: "pointer",
                color: "var(--text-muted)", fontSize: "12px", padding: "2px 4px",
              }}>✕</button>
            )}
          </div>

          {/* Category select */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <label style={{ fontSize: "0.82rem", fontWeight: "600", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{
                padding: "8px 12px",
                borderRadius: "9px",
                border: "1px solid var(--border)",
                fontSize: "0.875rem",
                background: "var(--surface-2)",
                color: "var(--text-primary)",
                cursor: "pointer",
                fontFamily: "var(--font)",
                outline: "none",
              }}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{CATEGORY_ICONS[cat]} {cat}</option>
              ))}
            </select>
          </div>

          {/* Sort select */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <label style={{ fontSize: "0.82rem", fontWeight: "600", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
              Sort by
            </label>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              style={{
                padding: "8px 12px",
                borderRadius: "9px",
                border: "1px solid var(--border)",
                fontSize: "0.875rem",
                background: "var(--surface-2)",
                color: "var(--text-primary)",
                cursor: "pointer",
                fontFamily: "var(--font)",
                outline: "none",
              }}
            >
              <option value="newest">🕐 Newest First</option>
              <option value="oldest">📅 Oldest First</option>
            </select>
          </div>
        </div>

        {/* Category Pills */}
        {category !== "All" && (
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "20px", alignItems: "center" }}>
            <span style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>Filtering by:</span>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: "6px",
              background: "rgba(99,102,241,0.12)", color: "var(--primary)",
              border: "1px solid var(--primary-border)",
              padding: "4px 12px", borderRadius: "20px",
              fontSize: "0.82rem", fontWeight: "700",
            }}>
              {CATEGORY_ICONS[category]} {category}
              <button onClick={() => setCategory("All")} style={{
                background: "none", border: "none", cursor: "pointer",
                color: "var(--primary)", fontSize: "10px", padding: "0 2px", lineHeight: 1,
              }}>✕</button>
            </span>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", padding: "4rem 0" }}>
            <div style={{
              width: "44px", height: "44px",
              border: "3px solid var(--border)",
              borderTopColor: "var(--primary)",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
            }} />
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Loading discussions...</p>
          </div>
        ) : error ? (
          <div style={{
            background: "var(--error-bg)", border: "1px solid var(--error-border)",
            borderRadius: "12px", padding: "1.5rem", textAlign: "center",
            color: "var(--error)", fontSize: "0.9rem",
          }}>
            ⚠️ {error}
          </div>
        ) : discussions.length === 0 ? (
          <div style={{
            textAlign: "center", padding: "4rem 2rem",
            background: "var(--surface)", borderRadius: "18px",
            border: "1px solid var(--border)",
          }}>
            <div style={{ fontSize: "3rem", marginBottom: "16px" }}>
              {search || category !== "All" ? "🔍" : "💬"}
            </div>
            <h3 style={{ margin: "0 0 8px", color: "var(--text-primary)", fontSize: "1.2rem" }}>
              No discussions found
            </h3>
            <p style={{ color: "var(--text-secondary)", margin: "0 0 24px", fontSize: "0.9rem" }}>
              {search || category !== "All"
                ? "Try clearing the filters or searching for something else."
                : "Be the first developer to start a discussion!"}
            </p>
            <Link to="/discussions/create" style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              padding: "11px 24px",
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              color: "#fff", borderRadius: "10px", textDecoration: "none",
              fontWeight: "700", fontSize: "0.9rem",
              boxShadow: "0 6px 20px rgba(99,102,241,0.35)",
            }}>
              Start a Discussion →
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {discussions.map((disc, i) => {
              const isHovered = hoveredId === disc._id;
              const initials = disc.author?.name
                ? disc.author.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
                : "?";
              const gradient = GRADIENTS[i % GRADIENTS.length];

              return (
                <div
                  key={disc._id}
                  onMouseEnter={() => setHoveredId(disc._id)}
                  onMouseLeave={() => setHoveredId(null)}
                  style={{
                    background: "var(--surface)",
                    border: `1px solid ${isHovered ? "var(--primary-border)" : "var(--border)"}`,
                    borderRadius: "16px",
                    padding: "1.25rem 1.5rem",
                    transition: "all 0.2s ease",
                    transform: isHovered ? "translateY(-2px)" : "translateY(0)",
                    boxShadow: isHovered ? "var(--shadow-lg)" : "var(--shadow)",
                    position: "relative", overflow: "hidden",
                  }}
                >
                  {/* Hover left glow accent */}
                  {isHovered && (
                    <div style={{
                      position: "absolute", left: 0, top: 0, bottom: 0,
                      width: "3px",
                      background: "linear-gradient(180deg, #6366f1, #8b5cf6)",
                      borderRadius: "3px 0 0 3px",
                    }} />
                  )}

                  {/* Title row */}
                  <div style={{
                    display: "flex", justifyContent: "space-between",
                    alignItems: "flex-start", gap: "12px", marginBottom: "10px",
                  }}>
                    <Link to={`/discussions/${disc._id}`} style={{
                      fontSize: "1.05rem", fontWeight: "700",
                      color: isHovered ? "var(--primary)" : "var(--text-primary)",
                      textDecoration: "none", flex: 1, lineHeight: 1.35,
                      transition: "color 0.2s",
                    }}>
                      {disc.title}
                    </Link>
                    <span style={{
                      background: "rgba(99,102,241,0.12)",
                      color: "#818cf8",
                      fontSize: "0.72rem", fontWeight: "700",
                      padding: "4px 10px", borderRadius: "20px",
                      border: "1px solid rgba(99,102,241,0.25)",
                      whiteSpace: "nowrap", flexShrink: 0,
                    }}>
                      {CATEGORY_ICONS[disc.category] || "💡"} {disc.category}
                    </span>
                  </div>

                  {/* Excerpt */}
                  <p style={{
                    color: "var(--text-secondary)", fontSize: "0.875rem",
                    lineHeight: 1.6, marginBottom: "12px",
                    display: "-webkit-box", WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical", overflow: "hidden",
                  }}>
                    {disc.content}
                  </p>

                  {/* Tags */}
                  {disc.tags?.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", marginBottom: "14px" }}>
                      {disc.tags.map((tag, idx) => (
                        <span key={idx} style={{
                          background: "var(--surface-2)", color: "var(--text-muted)",
                          fontSize: "0.72rem", fontWeight: "600",
                          padding: "2px 9px", borderRadius: "20px",
                          border: "1px solid var(--border)",
                        }}>
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Footer */}
                  <div style={{
                    display: "flex", justifyContent: "space-between",
                    alignItems: "center", fontSize: "0.8rem",
                    color: "var(--text-muted)",
                    borderTop: "1px solid var(--border)",
                    paddingTop: "12px", flexWrap: "wrap", gap: "8px",
                  }}>
                    {/* Author */}
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div style={{
                        width: "26px", height: "26px", borderRadius: "8px",
                        background: disc.author?.profileImage ? "#000" : gradient,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "0.65rem", fontWeight: "800", color: "#fff",
                        overflow: "hidden", flexShrink: 0,
                      }}>
                        {disc.author?.profileImage ? (
                          <img
                            src={disc.author.profileImage} alt=""
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            onError={e => { e.target.style.display = "none"; e.target.parentElement.innerHTML = initials; }}
                          />
                        ) : initials}
                      </div>
                      <span style={{ color: "var(--text-secondary)", fontSize: "0.82rem" }}>
                        <strong style={{ color: "var(--text-primary)", fontWeight: "600" }}>
                          {disc.author?.name || "Developer"}
                        </strong>
                        {" · "}{timeAgo(disc.createdAt)}
                      </span>
                    </div>

                    {/* Comment count */}
                    <div style={{
                      display: "flex", alignItems: "center", gap: "5px",
                      background: "var(--surface-2)", border: "1px solid var(--border)",
                      padding: "4px 10px", borderRadius: "20px",
                      fontSize: "0.78rem", fontWeight: "600", color: "var(--text-secondary)",
                    }}>
                      💬 {disc.commentCount || 0} {disc.commentCount === 1 ? "reply" : "replies"}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        select option {
          background: var(--surface);
          color: var(--text-primary);
        }
      `}</style>
    </div>
  );
}

export default Discussions;
