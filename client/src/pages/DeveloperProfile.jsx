import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

function DeveloperProfile() {
  const { id } = useParams();
  const { token } = useAuth();

  const [developer, setDeveloper] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDeveloper = async () => {
      try {
        const response = await api.get(`/api/users/developers/${id}`);
        setDeveloper(response.data.developer);
      } catch (err) {
        console.error(
          "Developer Profile Error:",
          err.response?.data || err.message
        );

        if (err.response?.status === 404) {
          setError("Developer not found");
        } else {
          setError(
            err.response?.data?.message || "Unable to load developer profile"
          );
        }
      } finally {
        setLoading(false);
      }
    };

    if (token && id) {
      fetchDeveloper();
    }
  }, [token, id]);

  if (loading) {
    return (
      <div className="profile-page">
        <p>Loading developer profile...</p>
      </div>
    );
  }

  if (error || !developer) {
    return (
      <div className="profile-page">
        <Link
          to="/developers"
          style={{ display: "inline-block", marginBottom: "20px" }}
        >
          ← Back to Developers
        </Link>
        <p style={{ color: "#d9534f" }}>{error || "Developer not found."}</p>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <Link
        to="/developers"
        style={{
          display: "inline-block",
          marginBottom: "20px",
          color: "#0366d6",
          textDecoration: "none",
          fontWeight: "500",
        }}
      >
        ← Back to Developers
      </Link>

      <h1>Developer Profile</h1>

      <div className="profile-card" style={{ display: "block" }}>
        {/* Header section */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "24px",
            marginBottom: "24px",
            flexWrap: "wrap",
          }}
        >
          <div className="profile-avatar" style={{ overflow: "hidden" }}>
            {developer.profileImage ? (
              <img
                src={developer.profileImage}
                alt={developer.name}
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

          <div className="profile-info" style={{ flex: "1 1 300px" }}>
            <h2 style={{ margin: "0 0 6px 0", fontSize: "28px" }}>
              {developer.name}
            </h2>
            <p style={{ color: "#666", margin: "0 0 6px 0" }}>
              ✉️ <strong>Email:</strong> {developer.email}
            </p>
            {developer.location && (
              <p style={{ color: "#666", margin: "0 0 6px 0" }}>
                📍 <strong>Location:</strong> {developer.location}
              </p>
            )}
            {developer.bio && (
              <p style={{ color: "#444", marginTop: "8px", lineHeight: "1.5" }}>
                {developer.bio}
              </p>
            )}
          </div>
        </div>

        <hr style={{ border: "0", borderTop: "1px solid #eee", margin: "20px 0" }} />

        {/* Skills */}
        <div style={{ marginBottom: "20px" }}>
          <h3 style={{ fontSize: "18px", marginBottom: "12px" }}>
            🛠️ Skills & Expertise
          </h3>
          {developer.skills && developer.skills.length > 0 ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {developer.skills.map((skill, index) => (
                <span
                  key={index}
                  style={{
                    background: "#f0f2f5",
                    color: "#333",
                    padding: "6px 12px",
                    borderRadius: "16px",
                    fontSize: "14px",
                    fontWeight: "500",
                    border: "1px solid #e0e0e0",
                  }}
                >
                  {skill}
                </span>
              ))}
            </div>
          ) : (
            <p style={{ color: "#888" }}>No skills listed.</p>
          )}
        </div>

        {/* Experience & Education */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "20px",
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              background: "#fafafa",
              padding: "16px",
              borderRadius: "8px",
              border: "1px solid #eee",
            }}
          >
            <h4 style={{ margin: "0 0 8px 0", color: "#333" }}>
              💼 Experience
            </h4>
            <p style={{ color: "#666", whiteSpace: "pre-line" }}>
              {developer.experience || "No experience details listed."}
            </p>
          </div>

          <div
            style={{
              background: "#fafafa",
              padding: "16px",
              borderRadius: "8px",
              border: "1px solid #eee",
            }}
          >
            <h4 style={{ margin: "0 0 8px 0", color: "#333" }}>
              🎓 Education
            </h4>
            <p style={{ color: "#666", whiteSpace: "pre-line" }}>
              {developer.education || "No education details listed."}
            </p>
          </div>
        </div>

        {/* Links */}
        <div>
          <h3 style={{ fontSize: "18px", marginBottom: "12px" }}>
            🌐 Links & Social
          </h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "16px" }}>
            {developer.github ? (
              <a
                href={
                  developer.github.startsWith("http")
                    ? developer.github
                    : `https://${developer.github}`
                }
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  color: "#0366d6",
                  textDecoration: "none",
                  fontWeight: "500",
                }}
              >
                🐙 GitHub
              </a>
            ) : (
              <span style={{ color: "#aaa" }}>GitHub not provided</span>
            )}

            {developer.linkedin ? (
              <a
                href={
                  developer.linkedin.startsWith("http")
                    ? developer.linkedin
                    : `https://${developer.linkedin}`
                }
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  color: "#0a66c2",
                  textDecoration: "none",
                  fontWeight: "500",
                }}
              >
                💼 LinkedIn
              </a>
            ) : (
              <span style={{ color: "#aaa" }}>LinkedIn not provided</span>
            )}

            {developer.portfolio ? (
              <a
                href={
                  developer.portfolio.startsWith("http")
                    ? developer.portfolio
                    : `https://${developer.portfolio}`
                }
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  color: "#7c3aed",
                  textDecoration: "none",
                  fontWeight: "500",
                }}
              >
                🚀 Portfolio
              </a>
            ) : (
              <span style={{ color: "#aaa" }}>Portfolio not provided</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DeveloperProfile;