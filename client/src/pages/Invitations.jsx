import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const STATUS_CONFIG = {
  Accepted: {
    bg: "rgba(16,185,129,0.12)", color: "#34d399",
    border: "rgba(16,185,129,0.3)", dot: "#10b981",
    label: "✓ Joined", icon: "✅",
  },
  Pending: {
    bg: "rgba(245,158,11,0.12)", color: "#fbbf24",
    border: "rgba(245,158,11,0.3)", dot: "#f59e0b",
    label: "Awaiting response", icon: "⏳",
  },
  Rejected: {
    bg: "rgba(239,68,68,0.12)", color: "#f87171",
    border: "rgba(239,68,68,0.3)", dot: "#ef4444",
    label: "Declined", icon: "✕",
  },
};

const PageShell = ({ children }) => (
  <div style={{
    minHeight: "calc(100vh - 64px)",
    background: "var(--bg)",
    padding: "2rem 1.25rem 4rem",
  }}>
    <div style={{ maxWidth: "860px", margin: "0 auto" }}>{children}</div>
  </div>
);

function Invitations() {
  const { token } = useAuth();
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processingId, setProcessingId] = useState(null);

  const fetchInvitations = async () => {
    try {
      setLoading(true);
      const response = await api.get("/api/projects/my/invitations");
      setInvitations(response.data.invitations || []);
    } catch (err) {
      console.error("Invitations Error:", err.response?.data || err.message);
      setError("Unable to load project invitations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchInvitations();
  }, [token]);

  const handleResponse = async (memberId, status) => {
    setProcessingId(memberId);
    try {
      await api.put(`/api/projects/members/${memberId}/respond`, { status });
      setInvitations((prev) =>
        prev.map((inv) => inv._id === memberId ? { ...inv, status } : inv)
      );
    } catch (err) {
      alert(err.response?.data?.message || "Failed to respond to invitation");
    } finally {
      setProcessingId(null);
    }
  };

  const pendingCount = invitations.filter(inv => inv.status === "Pending").length;

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
        <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Loading invitations...</p>
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
        <p style={{ color: "var(--error)", marginBottom: "16px" }}>{error}</p>
        <button onClick={fetchInvitations} style={{
          padding: "9px 20px", background: "var(--primary)", color: "#fff",
          border: "none", borderRadius: "8px", cursor: "pointer",
          fontWeight: "600", fontFamily: "var(--font)",
        }}>Retry</button>
      </div>
    </PageShell>
  );

  return (
    <PageShell>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
          <span style={{
            width: "42px", height: "42px", borderRadius: "11px",
            background: "linear-gradient(135deg, #f59e0b, #ef4444)",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            fontSize: "20px", boxShadow: "0 6px 20px rgba(245,158,11,0.35)", flexShrink: 0,
          }}>✉️</span>
          <div>
            <h1 style={{
              margin: 0, fontSize: "2rem", fontWeight: "800",
              color: "var(--text-primary)", letterSpacing: "-0.03em",
              display: "flex", alignItems: "center", gap: "10px",
            }}>
              Project Invitations
              {pendingCount > 0 && (
                <span style={{
                  fontSize: "0.7rem", fontWeight: "800",
                  background: "linear-gradient(135deg, #f59e0b, #ef4444)",
                  color: "#fff", padding: "3px 9px", borderRadius: "20px",
                  boxShadow: "0 4px 12px rgba(245,158,11,0.4)",
                }}>
                  {pendingCount} pending
                </span>
              )}
            </h1>
            <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "0.95rem" }}>
              View and respond to collaboration requests
            </p>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {invitations.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "4rem 2rem",
          background: "var(--surface)", borderRadius: "18px",
          border: "1px solid var(--border)",
        }}>
          <div style={{
            width: "80px", height: "80px", borderRadius: "20px",
            background: "var(--surface-2)", border: "1px solid var(--border)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "2.5rem", margin: "0 auto 20px",
          }}>📬</div>
          <h3 style={{ margin: "0 0 8px", fontSize: "1.25rem", color: "var(--text-primary)" }}>
            No invitations yet
          </h3>
          <p style={{ color: "var(--text-secondary)", margin: "0 0 24px", fontSize: "0.95rem", maxWidth: "360px", marginLeft: "auto", marginRight: "auto" }}>
            When a project owner invites you to collaborate, you'll see it here.
          </p>
          <Link to="/developers" style={{
            display: "inline-flex", alignItems: "center", gap: "8px",
            padding: "11px 24px",
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            color: "#fff", borderRadius: "10px", textDecoration: "none",
            fontWeight: "700", fontSize: "0.9rem",
            boxShadow: "0 6px 20px rgba(99,102,241,0.35)",
          }}>
            Browse Developers
          </Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {invitations.map((inv) => {
            const sc = STATUS_CONFIG[inv.status] || STATUS_CONFIG.Pending;
            const isPending = inv.status === "Pending";
            const isProcessing = processingId === inv._id;

            return (
              <div
                key={inv._id}
                style={{
                  background: "var(--surface)",
                  borderRadius: "16px",
                  border: "1px solid var(--border)",
                  boxShadow: "var(--shadow)",
                  overflow: "hidden",
                  transition: "border-color 0.2s",
                }}
              >
                {/* Status accent top bar */}
                <div style={{ height: "3px", background: `linear-gradient(90deg, ${sc.dot}, transparent)` }} />

                <div style={{
                  padding: "1.25rem 1.5rem",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "1rem",
                  flexWrap: "wrap",
                }}>
                  {/* Left: Project Info */}
                  <div style={{ flex: 1, minWidth: "240px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                      <span style={{
                        width: "38px", height: "38px", borderRadius: "10px",
                        background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "16px", flexShrink: 0,
                        boxShadow: "0 4px 12px rgba(99,102,241,0.3)",
                      }}>💻</span>
                      <div>
                        <h2 style={{
                          margin: 0, fontSize: "1.05rem", fontWeight: "700",
                          color: "var(--text-primary)",
                        }}>
                          {inv.project?.title || "Untitled Project"}
                        </h2>
                      </div>
                    </div>

                    <p style={{
                      margin: "0 0 10px", color: "var(--text-secondary)",
                      fontSize: "0.875rem", lineHeight: 1.5,
                      display: "-webkit-box", WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical", overflow: "hidden",
                    }}>
                      {inv.project?.description || "No description provided"}
                    </p>

                    {/* Meta row */}
                    <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: "5px",
                        background: "var(--surface-2)", color: "var(--text-secondary)",
                        border: "1px solid var(--border)",
                        fontSize: "0.78rem", fontWeight: "600",
                        padding: "3px 10px", borderRadius: "20px",
                      }}>
                        🎭 {inv.role}
                      </span>
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: "5px",
                        background: sc.bg, color: sc.color,
                        border: `1px solid ${sc.border}`,
                        fontSize: "0.78rem", fontWeight: "700",
                        padding: "3px 10px", borderRadius: "20px",
                      }}>
                        <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: sc.dot, display: "inline-block" }} />
                        {inv.status}
                      </span>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div style={{ display: "flex", gap: "10px", flexShrink: 0, alignItems: "center" }}>
                    {isPending ? (
                      <>
                        <button
                          onClick={() => handleResponse(inv._id, "Accepted")}
                          disabled={isProcessing}
                          style={{
                            padding: "9px 20px",
                            background: isProcessing ? "var(--surface-2)" : "linear-gradient(135deg, #10b981, #059669)",
                            color: isProcessing ? "var(--text-muted)" : "#fff",
                            border: "none", borderRadius: "9px",
                            fontWeight: "700", fontSize: "0.875rem",
                            cursor: isProcessing ? "not-allowed" : "pointer",
                            fontFamily: "var(--font)",
                            boxShadow: isProcessing ? "none" : "0 4px 14px rgba(16,185,129,0.35)",
                            transition: "all 0.2s ease",
                          }}
                          onMouseEnter={e => { if (!isProcessing) e.currentTarget.style.transform = "translateY(-1px)"; }}
                          onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; }}
                        >
                          {isProcessing ? "..." : "✓ Accept"}
                        </button>
                        <button
                          onClick={() => handleResponse(inv._id, "Rejected")}
                          disabled={isProcessing}
                          style={{
                            padding: "9px 18px",
                            background: "var(--surface-2)",
                            color: "var(--error)",
                            border: "1px solid var(--error-border)",
                            borderRadius: "9px",
                            fontWeight: "700", fontSize: "0.875rem",
                            cursor: isProcessing ? "not-allowed" : "pointer",
                            fontFamily: "var(--font)",
                            transition: "all 0.2s ease",
                          }}
                          onMouseEnter={e => { if (!isProcessing) { e.currentTarget.style.background = "var(--error-bg)"; } }}
                          onMouseLeave={e => { e.currentTarget.style.background = "var(--surface-2)"; }}
                        >
                          Decline
                        </button>
                      </>
                    ) : (
                      <div style={{
                        display: "flex", alignItems: "center", gap: "8px",
                        padding: "9px 16px",
                        background: sc.bg, borderRadius: "9px",
                        border: `1px solid ${sc.border}`,
                      }}>
                        <span>{sc.icon}</span>
                        <span style={{ fontSize: "0.875rem", fontWeight: "700", color: sc.color }}>
                          {sc.label}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </PageShell>
  );
}

export default Invitations;