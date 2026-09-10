import { useEffect, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";

function Developers() {
  const { token } = useAuth();

  const [developers, setDevelopers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchDevelopers = async () => {
      try {
        const response = await api.get("/api/users/developers");
        setDevelopers(response.data.developers || []);
      } catch (err) {
        console.error(
          "Developers Fetch Error:",
          err.response?.data || err.message
        );

        setError("Unable to load developers");
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchDevelopers();
    }
  }, [token]);

  const filteredDevelopers = developers.filter((developer) => {
    const searchText = search.toLowerCase().trim();
    if (!searchText) return true;

    const name = developer.name?.toLowerCase() || "";
    const email = developer.email?.toLowerCase() || "";
    const bio = developer.bio?.toLowerCase() || "";
    const location = developer.location?.toLowerCase() || "";
    const skills = developer.skills?.join(" ").toLowerCase() || "";

    return (
      name.includes(searchText) ||
      email.includes(searchText) ||
      bio.includes(searchText) ||
      location.includes(searchText) ||
      skills.includes(searchText)
    );
  });

  if (loading) {
    return (
      <div className="developers-page">
        <p>Loading developers...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="developers-page">
        <p style={{ color: "#d9534f" }}>{error}</p>
      </div>
    );
  }

  return (
    <div className="developers-page" style={{ maxWidth: "1000px", margin: "0 auto", padding: "40px 20px" }}>
      <h1 style={{ marginBottom: "10px" }}>Find Developers</h1>

      <p style={{ color: "#666", marginBottom: "25px" }}>
        Discover developers and connect to collaborate on exciting projects.
      </p>

      <div style={{ marginBottom: "30px" }}>
        <input
          type="text"
          placeholder="Search by name, email, skills (e.g. React, Python), location, bio..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="developer-search"
          style={{
            width: "100%",
            maxWidth: "600px",
            padding: "12px 16px",
            fontSize: "15px",
            borderRadius: "8px",
            border: "1px solid #ccc",
            boxSizing: "border-box",
          }}
        />
      </div>

      {filteredDevelopers.length === 0 ? (
        <div style={{ background: "white", padding: "40px", borderRadius: "12px", border: "1px solid #ddd", textAlign: "center" }}>
          <h3>No developers found</h3>
          <p style={{ color: "#777", marginTop: "8px" }}>
            {search
              ? `No developers matching "${search}". Try searching for another skill or name.`
              : "No developers are registered yet."}
          </p>
        </div>
      ) : (
        <div
          className="developers-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "20px",
          }}
        >
          {filteredDevelopers.map((developer) => (
            <div
              className="developer-card"
              key={developer._id}
              style={{
                background: "white",
                border: "1px solid #ddd",
                borderRadius: "12px",
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                textAlign: "left",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                  marginBottom: "16px",
                }}
              >
                <div
                  className="developer-avatar"
                  style={{
                    width: "56px",
                    height: "56px",
                    borderRadius: "50%",
                    background: "#eee",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "26px",
                    overflow: "hidden",
                    flexShrink: 0,
                  }}
                >
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

                <div style={{ overflow: "hidden" }}>
                  <h2
                    style={{
                      margin: "0 0 4px 0",
                      fontSize: "19px",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {developer.name}
                  </h2>
                  {developer.location && (
                    <p style={{ fontSize: "13px", color: "#888", margin: 0 }}>
                      📍 {developer.location}
                    </p>
                  )}
                </div>
              </div>

              <p
                style={{
                  color: "#555",
                  fontSize: "14px",
                  marginBottom: "16px",
                  minHeight: "42px",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  lineHeight: "1.4",
                }}
              >
                {developer.bio || "No bio added yet."}
              </p>

              <div style={{ marginBottom: "20px", flex: "1" }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {developer.skills?.length > 0 ? (
                    developer.skills.slice(0, 4).map((skill, index) => (
                      <span
                        key={index}
                        style={{
                          background: "#f0f2f5",
                          color: "#444",
                          padding: "3px 8px",
                          borderRadius: "12px",
                          fontSize: "12px",
                          border: "1px solid #e0e0e0",
                        }}
                      >
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span style={{ fontSize: "12px", color: "#aaa" }}>
                      No skills listed
                    </span>
                  )}
                  {developer.skills?.length > 4 && (
                    <span
                      style={{
                        fontSize: "12px",
                        color: "#666",
                        padding: "3px 4px",
                      }}
                    >
                      +{developer.skills.length - 4} more
                    </span>
                  )}
                </div>
              </div>

              <Link
                to={`/developers/${developer._id}`}
                style={{
                  display: "block",
                  textAlign: "center",
                  padding: "10px 14px",
                  borderRadius: "6px",
                  background: "#222",
                  color: "white",
                  textDecoration: "none",
                  fontWeight: "500",
                  fontSize: "14px",
                }}
              >
                View Profile
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Developers;