import { useEffect, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";

// Deterministic gradient for developer avatars
const GRADIENTS = [
  "linear-gradient(135deg, #6366f1, #8b5cf6)",
  "linear-gradient(135deg, #06b6d4, #3b82f6)",
  "linear-gradient(135deg, #f59e0b, #ef4444)",
  "linear-gradient(135deg, #10b981, #06b6d4)",
  "linear-gradient(135deg, #ec4899, #8b5cf6)",
  "linear-gradient(135deg, #f97316, #f59e0b)",
];

const PageShell = ({ children }) => (
  <div style={{
    minHeight: "calc(100vh - 64px)",
    background: "var(--bg)",
    padding: "2rem 1.25rem 4rem",
  }}>
    <div style={{ maxWidth: "1100px", margin: "0 auto" }}>{children}</div>
  </div>
);

function Developers() {
  const { token } = useAuth();
  const [developers, setDevelopers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [hoveredCard, setHoveredCard] = useState(null);

  useEffect(() => {
    const fetchDevelopers = async () => {
      try {
        const response = await api.get("/api/users/developers");
        setDevelopers(response.data.developers || []);
      } catch (err) {
        console.error("Developers Fetch Error:", err.response?.data || err.message);
        setError("Unable to load developers");
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchDevelopers();
  }, [token]);

  const filtered = developers.filter((dev) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      dev.name?.toLowerCase().includes(q) ||
      dev.email?.toLowerCase().includes(q) ||
      dev.bio?.toLowerCase().includes(q) ||
      dev.location?.toLowerCase().includes(q) ||
      dev.skills?.some((s) => s.toLowerCase().includes(q))
    );
  });

  if (loading) return (
    <PageShell>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "40vh", gap: "16px" }}>
        <div style={{
          width: "44px", height: "44px",
          border: "3px solid var(--border)",
          borderTopColor: "var(--primary)",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }} />
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Discovering developers...</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </PageShell>
  );

  if (error) return (
    <PageShell>
      <div style={{
        background: "var(--error-bg)", border: "1px solid var(--error-border)",
        borderRadius: "12px", padding: "2rem", textAlign: "center",
      }}>
        <p style={{ color: "var(--error)" }}>{error}</p>
      </div>
    </PageShell>
  );

  return (
    <PageShell>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{
          margin: "0 0 8px", fontSize: "2rem", fontWeight: "800",
          color: "var(--text-primary)", letterSpacing: "-0.03em",
          display: "flex", alignItems: "center", gap: "12px",
        }}>
          <span style={{
            width: "42px", height: "42px", borderRadius: "11px",
            background: "linear-gradient(135deg, #06b6d4, #3b82f6)",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            fontSize: "20px", boxShadow: "0 6px 20px rgba(6,182,212,0.35)",
          }}>👥</span>
          Find Developers
        </h1>
        <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "0.95rem" }}>
          Discover talented developers and collaborate on exciting projects
          {developers.length > 0 && (
            <span style={{ marginLeft: "8px", color: "var(--text-muted)", fontSize: "0.85rem" }}>
              — {filtered.length} of {developers.length} developers
            </span>
          )}
        </p>
      </div>

      {/* Search Bar */}
      <div style={{
        background: "var(--surface)",
        border: `1px solid ${searchFocused ? "var(--primary)" : "var(--border)"}`,
        borderRadius: "14px",
        padding: "6px 16px",
        marginBottom: "2rem",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        boxShadow: searchFocused ? "0 0 0 3px var(--primary-light)" : "var(--shadow)",
        transition: "all 0.2s ease",
      }}>
        <span style={{ fontSize: "18px", opacity: 0.5 }}>🔍</span>
        <input
          type="text"
          placeholder="Search by name, skill (React, Python), location, bio..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          style={{
            flex: 1,
            padding: "10px 0",
            fontSize: "0.95rem",
            border: "none",
            outline: "none",
            background: "transparent",
            color: "var(--text-primary)",
            fontFamily: "var(--font)",
          }}
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            style={{
              background: "var(--surface-2)", border: "none",
              borderRadius: "6px", padding: "4px 8px",
              color: "var(--text-muted)", cursor: "pointer",
              fontSize: "0.8rem", fontFamily: "var(--font)",
            }}
          >✕ Clear</button>
        )}
      </div>

      {/* Empty State */}
      {filtered.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "4rem 2rem",
          background: "var(--surface)", borderRadius: "18px",
          border: "1px solid var(--border)",
        }}>
          <div style={{ fontSize: "3rem", marginBottom: "16px" }}>
            {search ? "🔍" : "👥"}
          </div>
          <h3 style={{ margin: "0 0 8px", color: "var(--text-primary)", fontSize: "1.2rem" }}>
            {search ? "No developers found" : "No developers yet"}
          </h3>
          <p style={{ color: "var(--text-secondary)", margin: 0, fontSize: "0.9rem" }}>
            {search
              ? `No developers match "${search}". Try a different skill or name.`
              : "No developers are registered yet."}
          </p>
          {search && (
            <button onClick={() => setSearch("")} style={{
              marginTop: "16px", padding: "9px 20px",
              background: "var(--primary)", color: "#fff",
              border: "none", borderRadius: "8px", cursor: "pointer",
              fontWeight: "600", fontFamily: "var(--font)",
            }}>
              Clear Search
            </button>
          )}
        </div>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))",
          gap: "1.25rem",
        }}>
          {filtered.map((dev, i) => {
            const isHovered = hoveredCard === dev._id;
            const gradient = GRADIENTS[i % GRADIENTS.length];
            const initials = dev.name ? dev.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) : "?";

            return (
              <div
                key={dev._id}
                onMouseEnter={() => setHoveredCard(dev._id)}
                onMouseLeave={() => setHoveredCard(null)}
                style={{
                  background: "var(--surface)",
                  border: `1px solid ${isHovered ? "var(--primary-border)" : "var(--border)"}`,
                  borderRadius: "16px",
                  padding: "1.5rem",
                  display: "flex", flexDirection: "column",
                  boxShadow: isHovered ? "var(--shadow-lg), 0 0 0 1px var(--primary-border)" : "var(--shadow)",
                  transition: "all 0.2s ease",
                  transform: isHovered ? "translateY(-3px)" : "translateY(0)",
                }}
              >
                {/* Avatar + Info */}
                <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "14px" }}>
                  <div style={{
                    width: "56px", height: "56px",
                    borderRadius: "14px",
                    background: dev.profileImage ? "#000" : gradient,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: dev.profileImage ? "0" : "1.1rem",
                    fontWeight: "800", color: "#fff",
                    flexShrink: 0,
                    overflow: "hidden",
                    boxShadow: `0 6px 16px rgba(0,0,0,0.3)`,
                  }}>
                    {dev.profileImage ? (
                      <img
                        src={dev.profileImage} alt={dev.name}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        onError={(e) => {
                          e.target.style.display = "none";
                          e.target.parentElement.style.fontSize = "1.1rem";
                          e.target.parentElement.innerHTML = initials;
                        }}
                      />
                    ) : initials}
                  </div>
                  <div style={{ overflow: "hidden" }}>
                    <h2 style={{
                      margin: "0 0 3px",
                      fontSize: "1.05rem", fontWeight: "700",
                      color: "var(--text-primary)",
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                    }}>
                      {dev.name}
                    </h2>
                    {dev.location && (
                      <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", margin: 0 }}>
                        📍 {dev.location}
                      </p>
                    )}
                  </div>
                </div>

                {/* Bio */}
                <p style={{
                  color: "var(--text-secondary)", fontSize: "0.875rem",
                  marginBottom: "14px", lineHeight: 1.55,
                  display: "-webkit-box", WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical", overflow: "hidden",
                  minHeight: "44px",
                }}>
                  {dev.bio || "No bio added yet."}
                </p>

                {/* Skills */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", marginBottom: "18px", flex: 1 }}>
                  {dev.skills?.length > 0 ? (
                    dev.skills.slice(0, 5).map((skill, idx) => (
                      <span key={idx} style={{
                        background: "var(--surface-2)", color: "var(--text-secondary)",
                        padding: "3px 9px", borderRadius: "20px",
                        fontSize: "0.75rem", fontWeight: "600",
                        border: "1px solid var(--border)",
                      }}>
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>No skills listed</span>
                  )}
                  {dev.skills?.length > 5 && (
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", padding: "3px 4px" }}>
                      +{dev.skills.length - 5}
                    </span>
                  )}
                </div>

                {/* View Profile Button */}
                <Link to={`/developers/${dev._id}`} style={{
                  display: "block", textAlign: "center",
                  padding: "10px 16px",
                  background: isHovered
                    ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
                    : "var(--surface-2)",
                  color: isHovered ? "#fff" : "var(--text-primary)",
                  textDecoration: "none", fontWeight: "700",
                  fontSize: "0.875rem", borderRadius: "10px",
                  border: `1px solid ${isHovered ? "transparent" : "var(--border)"}`,
                  transition: "all 0.2s ease",
                  boxShadow: isHovered ? "0 6px 16px rgba(99,102,241,0.4)" : "none",
                }}>
                  {isHovered ? "View Profile →" : "View Profile"}
                </Link>
              </div>
            );
          })}
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </PageShell>
  );
}

export default Developers;