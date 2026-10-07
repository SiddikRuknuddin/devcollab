import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

export default function TeammateRecommendations({ projectId, onInvited }) {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [invitingId, setInvitingId] = useState(null);
  const [feedback, setFeedback] = useState({});

  useEffect(() => {
    let isMounted = true;
    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/api/projects/${projectId}/recommended-teammates`);
        if (isMounted) {
          setRecommendations(res.data.recommendations || []);
        }
      } catch (err) {
        console.error("Fetch recommendations error:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (projectId) fetchRecommendations();

    return () => { isMounted = false; };
  }, [projectId]);

  const handleInvite = async (devId, devName) => {
    try {
      setInvitingId(devId);
      await api.post(`/api/projects/${projectId}/members`, {
        userId: devId,
        role: "Developer",
      });
      setFeedback((prev) => ({ ...prev, [devId]: "Invitation sent!" }));
      if (onInvited) onInvited();
    } catch (err) {
      setFeedback((prev) => ({
        ...prev,
        [devId]: err.response?.data?.message || "Failed to send invitation",
      }));
    } finally {
      setInvitingId(null);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)", background: "var(--surface)", borderRadius: "18px", border: "1px solid var(--border)" }}>
        🤖 AI is analyzing developer profiles and project tech stack...
      </div>
    );
  }

  return (
    <div style={{
      background: "var(--surface)",
      borderRadius: "18px",
      border: "1px solid var(--border)",
      padding: "1.75rem",
      boxShadow: "var(--shadow)",
    }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
          <span style={{ fontSize: "1.3rem" }}>🤖</span>
          <h2 style={{ margin: 0, fontSize: "1.2rem", fontWeight: "800", color: "var(--text-primary)" }}>
            AI-Matched Teammates
          </h2>
        </div>
        <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-secondary)" }}>
          Developers automatically recommended based on relevant skills and tech stack compatibility
        </p>
      </div>

      {recommendations.length === 0 ? (
        <div style={{
          padding: "2.5rem", textAlign: "center", color: "var(--text-muted)",
          background: "var(--surface-2)", borderRadius: "14px", border: "1px dashed var(--border)",
        }}>
          No new developer recommendations found at the moment.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {recommendations.map(({ developer, matchPercentage, matchedSkills }) => {
            const isInvited = feedback[developer._id] === "Invitation sent!";
            return (
              <div
                key={developer._id}
                style={{
                  padding: "16px",
                  background: "var(--surface-2)",
                  borderRadius: "14px",
                  border: "1px solid var(--border)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "14px",
                }}
              >
                {/* Developer Info */}
                <div style={{ display: "flex", alignItems: "center", gap: "14px", flex: 1, minWidth: "240px" }}>
                  <div style={{
                    width: "46px", height: "46px", borderRadius: "12px",
                    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: "800", color: "#fff", fontSize: "1rem", flexShrink: 0,
                  }}>
                    {developer.name?.charAt(0).toUpperCase() || "?"}
                  </div>

                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                      <Link
                        to={`/developers/${developer._id}`}
                        style={{ fontWeight: "700", color: "var(--text-primary)", fontSize: "0.95rem", textDecoration: "none" }}
                      >
                        {developer.name}
                      </Link>

                      <span style={{
                        padding: "2px 8px", borderRadius: "20px", fontSize: "0.72rem",
                        fontWeight: "800", background: "rgba(99,102,241,0.12)", color: "var(--primary)",
                        border: "1px solid var(--primary-border)",
                      }}>
                        ⚡ {matchPercentage}% Match
                      </span>
                    </div>

                    <p style={{ margin: "2px 0 6px", fontSize: "0.78rem", color: "var(--text-secondary)" }}>
                      {developer.title || developer.bio || "Full-stack Developer"}
                    </p>

                    {/* Matched Skills */}
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                      {matchedSkills.map((s) => (
                        <span
                          key={s}
                          style={{
                            padding: "2px 6px", borderRadius: "6px", fontSize: "0.72rem",
                            fontWeight: "700", background: "rgba(16,185,129,0.12)", color: "#34d399",
                            border: "1px solid rgba(16,185,129,0.3)",
                          }}
                        >
                          ✓ {s}
                        </span>
                      ))}
                      {(developer.skills || []).slice(0, 3).filter((s) => !matchedSkills.includes(s.toLowerCase())).map((s) => (
                        <span
                          key={s}
                          style={{
                            padding: "2px 6px", borderRadius: "6px", fontSize: "0.72rem",
                            background: "var(--surface)", color: "var(--text-muted)",
                            border: "1px solid var(--border)",
                          }}
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Action button */}
                <div>
                  <button
                    onClick={() => handleInvite(developer._id, developer.name)}
                    disabled={invitingId === developer._id || isInvited}
                    style={{
                      padding: "9px 18px",
                      background: isInvited ? "rgba(16,185,129,0.15)" : "linear-gradient(135deg, #6366f1, #8b5cf6)",
                      color: isInvited ? "#34d399" : "#fff",
                      border: isInvited ? "1px solid rgba(16,185,129,0.3)" : "none",
                      borderRadius: "10px",
                      fontWeight: "700",
                      fontSize: "0.85rem",
                      cursor: isInvited ? "default" : "pointer",
                      boxShadow: isInvited ? "none" : "0 4px 12px rgba(99,102,241,0.3)",
                    }}
                  >
                    {isInvited ? "✓ Invited" : invitingId === developer._id ? "Sending..." : "+ Quick Invite"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
