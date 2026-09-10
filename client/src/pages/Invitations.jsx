import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

function Invitations() {
  const { token } = useAuth();

  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processingId, setProcessingId] = useState(null);

  const fetchInvitations = async () => {
    try {
      const response = await api.get("/api/projects/my/invitations");
      setInvitations(response.data.invitations || []);
    } catch (err) {
      console.error(
        "Invitations Error:",
        err.response?.data || err.message
      );
      setError("Unable to load project invitations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchInvitations();
    }
  }, [token]);

  const handleResponse = async (memberId, status) => {
    setProcessingId(memberId);
    try {
      await api.put(`/api/projects/members/${memberId}/respond`, { status });

      setInvitations((prevInvitations) =>
        prevInvitations.map((invitation) =>
          invitation._id === memberId ? { ...invitation, status } : invitation
        )
      );
    } catch (err) {
      console.error(
        "Invitation Response Error:",
        err.response?.data || err.message
      );
      alert(
        err.response?.data?.message || "Failed to respond to invitation"
      );
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: "900px", margin: "2rem auto", padding: "0 1rem" }}>
        <p>Loading project invitations...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: "900px", margin: "2rem auto", padding: "0 1rem" }}>
        <p style={{ color: "#ef4444" }}>{error}</p>
        <button onClick={fetchInvitations}>Retry</button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "900px", margin: "2rem auto", padding: "0 1rem", textAlign: "left" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ margin: "0 0 0.25rem 0", fontSize: "1.75rem", color: "#111827" }}>
          Project Invitations ✉️
        </h1>
        <p style={{ margin: 0, color: "#6b7280", fontSize: "0.95rem" }}>
          View and respond to collaboration requests from project owners.
        </p>
      </div>

      {invitations.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "3rem 1.5rem",
            backgroundColor: "#f9fafb",
            borderRadius: "8px",
            border: "1px solid #e5e7eb",
          }}
        >
          <span style={{ fontSize: "2.5rem" }}>📬</span>
          <h3 style={{ marginTop: "1rem", marginBottom: "0.5rem" }}>
            No invitations yet
          </h3>
          <p style={{ color: "#6b7280", margin: "0 0 1.5rem 0" }}>
            When a project owner invites you to their project, you will see it here.
          </p>
          <Link
            to="/projects"
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: "#2563eb",
              color: "white",
              borderRadius: "6px",
              textDecoration: "none",
              fontWeight: 500,
              fontSize: "0.9rem",
            }}
          >
            Explore Projects
          </Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {invitations.map((invitation) => (
            <div
              key={invitation._id}
              style={{
                backgroundColor: "#ffffff",
                padding: "1.25rem 1.5rem",
                borderRadius: "8px",
                border: "1px solid #e5e7eb",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "1rem",
              }}
            >
              <div style={{ flex: 1, minWidth: "240px" }}>
                <h2 style={{ margin: "0 0 0.4rem 0", fontSize: "1.15rem", color: "#111827" }}>
                  {invitation.project?.title || "Untitled Project"}
                </h2>
                <p style={{ margin: "0 0 0.6rem 0", color: "#4b5563", fontSize: "0.9rem", lineHeight: 1.4 }}>
                  {invitation.project?.description || "No description provided"}
                </p>

                <div
                  style={{
                    display: "flex",
                    gap: "1rem",
                    alignItems: "center",
                    fontSize: "0.85rem",
                    flexWrap: "wrap",
                  }}
                >
                  <span>
                    <strong>Role:</strong> {invitation.role}
                  </span>
                  <span>•</span>
                  <span>
                    <strong>Status:</strong>{" "}
                    <span
                      style={{
                        padding: "0.15rem 0.5rem",
                        borderRadius: "4px",
                        fontWeight: 600,
                        backgroundColor:
                          invitation.status === "Accepted"
                            ? "#ecfdf5"
                            : invitation.status === "Pending"
                            ? "#fffbeb"
                            : "#fef2f2",
                        color:
                          invitation.status === "Accepted"
                            ? "#059669"
                            : invitation.status === "Pending"
                            ? "#d97706"
                            : "#dc2626",
                      }}
                    >
                      {invitation.status}
                    </span>
                  </span>
                </div>
              </div>

              {invitation.status === "Pending" ? (
                <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
                  <button
                    onClick={() => handleResponse(invitation._id, "Accepted")}
                    disabled={processingId === invitation._id}
                    style={{
                      padding: "0.5rem 1rem",
                      backgroundColor: "#10b981",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      fontWeight: 600,
                      fontSize: "0.9rem",
                      cursor: processingId === invitation._id ? "not-allowed" : "pointer",
                    }}
                  >
                    Accept
                  </button>

                  <button
                    onClick={() => handleResponse(invitation._id, "Rejected")}
                    disabled={processingId === invitation._id}
                    style={{
                      padding: "0.5rem 1rem",
                      backgroundColor: "#ffffff",
                      color: "#ef4444",
                      border: "1px solid #fca5a5",
                      borderRadius: "6px",
                      fontWeight: 600,
                      fontSize: "0.9rem",
                      cursor: processingId === invitation._id ? "not-allowed" : "pointer",
                    }}
                  >
                    Decline
                  </button>
                </div>
              ) : (
                <span style={{ fontSize: "0.85rem", color: "#6b7280" }}>
                  {invitation.status === "Accepted" ? "Joined Project" : "Declined"}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Invitations;