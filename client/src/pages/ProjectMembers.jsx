import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

function ProjectMembers() {
  const { projectId } = useParams();
  const { token } = useAuth();

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState({});

  const [invitingId, setInvitingId] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  const [removingId, setRemovingId] = useState(null);
  const [feedback, setFeedback] = useState({ message: "", error: "" });

  const clearFeedback = () => setFeedback({ message: "", error: "" });

  const fetchMembers = async () => {
    try {
      const response = await api.get(`/api/projects/${projectId}/members`);
      setMembers(response.data.members || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load project members");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && projectId) fetchMembers();
  }, [token, projectId]);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    clearFeedback();
    const query = searchQuery.trim();
    if (!query) { setSearchResults([]); setHasSearched(false); return; }

    setSearching(true);
    setHasSearched(true);

    try {
      const response = await api.get(`/api/users/developers?search=${encodeURIComponent(query)}`);
      setSearchResults(response.data.developers || []);
    } catch (err) {
      setFeedback({ message: "", error: err.response?.data?.message || "Failed to search developers" });
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleRoleChange = (devId, role) => {
    setSelectedRoles((prev) => ({ ...prev, [devId]: role }));
  };

  const handleInvite = async (developer) => {
    clearFeedback();
    const isAlreadyMember = members.some(
      (m) => m.user?._id === developer._id || m.user?.email?.toLowerCase() === developer.email?.toLowerCase()
    );
    if (isAlreadyMember) {
      setFeedback({ message: "", error: `${developer.name || "Developer"} is already invited or a member` });
      return;
    }

    setInvitingId(developer._id);
    try {
      const role = selectedRoles[developer._id] || "Developer";
      const res = await api.post(`/api/projects/${projectId}/members`, { userId: developer._id, role });
      setFeedback({ message: res.data.message || `Invitation sent to ${developer.name}!`, error: "" });
      await fetchMembers();
    } catch (err) {
      setFeedback({ message: "", error: err.response?.data?.message || `Failed to invite ${developer.name}` });
    } finally {
      setInvitingId(null);
    }
  };

  const handleCancelInvitation = async (member) => {
    if (!window.confirm(`Cancel invitation for ${member.user?.name || "this developer"}?`)) return;
    setCancellingId(member._id);
    clearFeedback();
    try {
      await api.delete(`/api/projects/members/${member._id}/cancel`);
      setMembers((prev) => prev.filter((m) => m._id !== member._id));
      setFeedback({ message: "Invitation cancelled.", error: "" });
    } catch (err) {
      setFeedback({ message: "", error: err.response?.data?.message || "Failed to cancel invitation" });
    } finally {
      setCancellingId(null);
    }
  };

  const handleRemove = async (member) => {
    if (!window.confirm(`Remove ${member.user?.name || "this member"} from the project?`)) return;
    setRemovingId(member._id);
    clearFeedback();
    try {
      await api.delete(`/api/projects/members/${member._id}`);
      setMembers((prev) => prev.filter((m) => m._id !== member._id));
      setFeedback({ message: "Member removed successfully.", error: "" });
    } catch (err) {
      setFeedback({ message: "", error: err.response?.data?.message || "Failed to remove member" });
    } finally {
      setRemovingId(null);
    }
  };

  const getStatusStyle = (status) => {
    if (status === "Accepted") return { background: "#dcfce7", color: "#166534", borderColor: "#bbf7d0" };
    if (status === "Pending")  return { background: "#fef3c7", color: "#92400e", borderColor: "#fde68a" };
    if (status === "Rejected") return { background: "#fee2e2", color: "#991b1b", borderColor: "#fecaca" };
    return { background: "#f1f5f9", color: "#475569", borderColor: "#e2e8f0" };
  };

  const getInitials = (name) =>
    name ? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) : "?";

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-container">Loading members...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <Link to="/projects" style={{ color: "var(--primary)", fontSize: "0.875rem", display: "inline-block", marginBottom: "16px" }}>
          ← Back to Projects
        </Link>
        <div className="alert alert-error">{error}</div>
      </div>
    );
  }

  const acceptedMembers = members.filter((m) => m.status === "Accepted");
  const pendingMembers  = members.filter((m) => m.status === "Pending");
  const rejectedMembers = members.filter((m) => m.status === "Rejected");

  return (
    <div className="page-container">
      <Link to="/projects" style={{ color: "var(--primary)", fontSize: "0.875rem", display: "inline-block", marginBottom: "16px" }}>
        ← Back to Projects
      </Link>

      <div className="page-header">
        <h1>Project Members</h1>
        <p>Manage team members and invitations for this project.</p>
      </div>

      {/* Feedback */}
      {feedback.message && <div className="alert alert-success">{feedback.message}</div>}
      {feedback.error   && <div className="alert alert-error">{feedback.error}</div>}

      {/* ── Invite Section ───────────────────────────────────────────────────── */}
      <div className="card" style={{ marginBottom: "24px" }}>
        <h2 style={{ marginBottom: "6px" }}>Search &amp; Invite Developers</h2>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginBottom: "16px" }}>
          Search registered developers by name, email, or skills.
        </p>

        <form onSubmit={handleSearch} style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <input
            type="text"
            className="form-input"
            placeholder="Search by name, email, or skill (e.g. react, node)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ flex: 1, minWidth: "240px" }}
          />
          <button type="submit" className="btn btn-primary" disabled={searching}>
            {searching ? "Searching..." : "Search"}
          </button>
        </form>

        {hasSearched && (
          <div style={{ marginTop: "16px" }}>
            <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "12px" }}>
              {searchResults.length === 0
                ? `No developers found matching "${searchQuery}"`
                : `${searchResults.length} developer(s) found`}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {searchResults.map((dev) => {
                const existing = members.find(
                  (m) => m.user?._id === dev._id || m.user?.email?.toLowerCase() === dev.email?.toLowerCase()
                );
                const isInviting = invitingId === dev._id;

                return (
                  <div key={dev._id} style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "12px 16px",
                    background: "var(--surface-2)",
                    borderRadius: "var(--radius)",
                    border: "1px solid var(--border)",
                    flexWrap: "wrap",
                    gap: "10px",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1, minWidth: "200px" }}>
                      <div style={{
                        width: "36px", height: "36px",
                        borderRadius: "50%",
                        overflow: "hidden",
                        background: "var(--primary-light)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "13px", fontWeight: "700", color: "var(--primary)",
                        flexShrink: 0,
                      }}>
                        {dev.profileImage
                          ? <img src={dev.profileImage} alt={dev.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          : getInitials(dev.name)}
                      </div>
                      <div>
                        <p style={{ fontWeight: "600", margin: 0 }}>{dev.name}</p>
                        <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", margin: 0 }}>{dev.email}</p>
                        {dev.skills?.length > 0 && (
                          <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", margin: 0 }}>
                            {dev.skills.slice(0, 4).join(", ")}
                          </p>
                        )}
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      {existing ? (
                        <span style={{
                          padding: "4px 10px",
                          borderRadius: "9999px",
                          fontSize: "0.78rem",
                          fontWeight: "600",
                          border: "1px solid",
                          ...getStatusStyle(existing.status),
                        }}>
                          {existing.status === "Accepted" ? "Active Member" : `${existing.status}`}
                        </span>
                      ) : (
                        <>
                          <select
                            value={selectedRoles[dev._id] || "Developer"}
                            onChange={(e) => handleRoleChange(dev._id, e.target.value)}
                            className="form-select"
                            style={{ width: "auto", padding: "6px 10px" }}
                          >
                            <option value="Developer">Developer</option>
                            <option value="Designer">Designer</option>
                            <option value="Manager">Manager</option>
                          </select>
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            disabled={isInviting}
                            onClick={() => handleInvite(dev)}
                          >
                            {isInviting ? "Inviting..." : "Invite"}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Members Table ────────────────────────────────────────────────────── */}
      <div className="card">
        <h2 style={{ marginBottom: "6px" }}>
          Team Members
          <span style={{
            marginLeft: "10px",
            background: "var(--surface-2)",
            color: "var(--text-secondary)",
            fontSize: "0.8rem",
            fontWeight: "500",
            padding: "2px 10px",
            borderRadius: "9999px",
          }}>
            {members.length} total
          </span>
        </h2>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginBottom: "20px" }}>
          {acceptedMembers.length} active · {pendingMembers.length} pending · {rejectedMembers.length} rejected
        </p>

        {members.length === 0 ? (
          <div className="empty-state">
            <p>No developers invited yet. Use the search above to invite team members.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {members.map((member) => {
              const statusStyle = getStatusStyle(member.status);
              const isCancelling = cancellingId === member._id;
              const isRemoving   = removingId   === member._id;

              return (
                <div key={member._id} style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "14px 16px",
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius)",
                  flexWrap: "wrap",
                  gap: "12px",
                }}>
                  {/* Member info */}
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1, minWidth: "200px" }}>
                    <div style={{
                      width: "40px", height: "40px",
                      borderRadius: "50%",
                      overflow: "hidden",
                      background: "var(--primary-light)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "14px", fontWeight: "700", color: "var(--primary)",
                      flexShrink: 0,
                    }}>
                      {member.user?.profileImage
                        ? <img src={member.user.profileImage} alt={member.user.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={(e) => { e.target.style.display = "none"; }} />
                        : getInitials(member.user?.name)}
                    </div>
                    <div>
                      <p style={{ fontWeight: "600", margin: 0 }}>
                        {member.user?.name || "Unknown User"}
                      </p>
                      <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", margin: 0 }}>
                        {member.user?.email}
                      </p>
                      {member.user?.skills?.length > 0 && (
                        <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: "2px 0 0" }}>
                          {member.user.skills.slice(0, 3).join(", ")}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Role + Status + Actions */}
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                    <span style={{
                      padding: "3px 10px",
                      borderRadius: "9999px",
                      fontSize: "0.78rem",
                      fontWeight: "500",
                      background: "var(--surface-2)",
                      color: "var(--text-secondary)",
                      border: "1px solid var(--border)",
                    }}>
                      {member.role}
                    </span>

                    <span style={{
                      padding: "3px 10px",
                      borderRadius: "9999px",
                      fontSize: "0.78rem",
                      fontWeight: "600",
                      border: "1px solid",
                      ...statusStyle,
                    }}>
                      {member.status}
                    </span>

                    {/* Action: Cancel for Pending, Remove for Accepted */}
                    {member.status === "Pending" && (
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleCancelInvitation(member)}
                        disabled={isCancelling}
                        title="Cancel pending invitation"
                      >
                        {isCancelling ? "Cancelling..." : "Cancel Invite"}
                      </button>
                    )}
                    {member.status === "Accepted" && (
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleRemove(member)}
                        disabled={isRemoving}
                        title="Remove member from project"
                      >
                        {isRemoving ? "Removing..." : "Remove"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default ProjectMembers;