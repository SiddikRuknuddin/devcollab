import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const GRADIENTS = [
  "linear-gradient(135deg,#6366f1,#8b5cf6)",
  "linear-gradient(135deg,#06b6d4,#3b82f6)",
  "linear-gradient(135deg,#f59e0b,#ef4444)",
  "linear-gradient(135deg,#10b981,#06b6d4)",
  "linear-gradient(135deg,#ec4899,#8b5cf6)",
];

const STATUS_CFG = {
  Accepted: { color: "#34d399", bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.3)", dot: "#10b981" },
  Pending:  { color: "#fbbf24", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.3)", dot: "#f59e0b" },
  Rejected: { color: "#f87171", bg: "rgba(239,68,68,0.12)", border: "rgba(239,68,68,0.3)", dot: "#ef4444" },
};

const inputStyle = {
  flex: 1, minWidth: "240px", padding: "10px 14px",
  borderRadius: "10px", border: "1px solid var(--border)",
  background: "var(--surface-2)", color: "var(--text-primary)",
  fontFamily: "var(--font)", fontSize: "0.9rem", outline: "none",
  transition: "border-color 0.2s, box-shadow 0.2s",
};

const getInitials = (name) => name ? name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : "?";

const Shell = ({ children }) => (
  <div style={{ minHeight: "calc(100vh - 64px)", background: "var(--bg)", padding: "2rem 1.25rem 4rem" }}>
    <div style={{ maxWidth: "900px", margin: "0 auto" }}>{children}</div>
  </div>
);

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
  const [searchFocused, setSearchFocused] = useState(false);

  const clearFeedback = () => setFeedback({ message: "", error: "" });

  const fetchMembers = async () => {
    try {
      const res = await api.get(`/api/projects/${projectId}/members`);
      setMembers(res.data.members || []);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load project members");
    } finally { setLoading(false); }
  };

  useEffect(() => { if (token && projectId) fetchMembers(); }, [token, projectId]);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    clearFeedback();
    const query = searchQuery.trim();
    if (!query) { setSearchResults([]); setHasSearched(false); return; }
    setSearching(true); setHasSearched(true);
    try {
      const res = await api.get(`/api/users/developers?search=${encodeURIComponent(query)}`);
      setSearchResults(res.data.developers || []);
    } catch (err) {
      setFeedback({ error: err.response?.data?.message || "Failed to search developers" });
      setSearchResults([]);
    } finally { setSearching(false); }
  };

  useEffect(() => {
    const query = searchQuery.trim();
    if (!query) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }
    if (query.length < 2) return;
    const t = setTimeout(async () => {
      setSearching(true);
      setHasSearched(true);
      try {
        const res = await api.get(`/api/users/developers?search=${encodeURIComponent(query)}`);
        setSearchResults(res.data.developers || []);
      } catch (err) {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const handleInvite = async (dev) => {
    clearFeedback();
    const isAlreadyMember = members.some(m =>
      m.user?._id === dev._id || m.user?.email?.toLowerCase() === dev.email?.toLowerCase()
    );
    if (isAlreadyMember) { setFeedback({ error: `${dev.name} is already invited or a member` }); return; }
    setInvitingId(dev._id);
    try {
      const role = selectedRoles[dev._id] || "Developer";
      const res = await api.post(`/api/projects/${projectId}/members`, { userId: dev._id, role });
      setFeedback({ message: res.data.message || `Invitation sent to ${dev.name}!` });
      await fetchMembers();
    } catch (err) {
      setFeedback({ error: err.response?.data?.message || `Failed to invite ${dev.name}` });
    } finally { setInvitingId(null); }
  };

  const handleCancelInvitation = async (member) => {
    if (!window.confirm(`Cancel invitation for ${member.user?.name || "this developer"}?`)) return;
    setCancellingId(member._id); clearFeedback();
    try {
      await api.delete(`/api/projects/members/${member._id}/cancel`);
      setMembers(prev => prev.filter(m => m._id !== member._id));
      setFeedback({ message: "Invitation cancelled." });
    } catch (err) {
      setFeedback({ error: err.response?.data?.message || "Failed to cancel invitation" });
    } finally { setCancellingId(null); }
  };

  const handleRemove = async (member) => {
    if (!window.confirm(`Remove ${member.user?.name || "this member"} from the project?`)) return;
    setRemovingId(member._id); clearFeedback();
    try {
      await api.delete(`/api/projects/members/${member._id}`);
      setMembers(prev => prev.filter(m => m._id !== member._id));
      setFeedback({ message: "Member removed successfully." });
    } catch (err) {
      setFeedback({ error: err.response?.data?.message || "Failed to remove member" });
    } finally { setRemovingId(null); }
  };

  if (loading) return (
    <Shell>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "4rem 0", color: "var(--text-muted)" }}>
        <div style={{ width: "36px", height: "36px", border: "3px solid var(--border)", borderTopColor: "var(--primary)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        Loading members...
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </Shell>
  );

  if (error) return (
    <Shell>
      <Link to="/projects" style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--text-muted)", textDecoration: "none", fontWeight: "600", fontSize: "0.875rem", marginBottom: "20px" }}>← Back to Projects</Link>
      <div style={{ background: "var(--error-bg)", border: "1px solid var(--error-border)", borderRadius: "12px", padding: "1.5rem", color: "var(--error)" }}>{error}</div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </Shell>
  );

  const accepted = members.filter(m => m.status === "Accepted");
  const pending  = members.filter(m => m.status === "Pending");
  const rejected = members.filter(m => m.status === "Rejected");

  return (
    <Shell>
      <Link to="/projects" style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--text-muted)", textDecoration: "none", fontWeight: "600", fontSize: "0.875rem", marginBottom: "24px", transition: "color 0.2s" }}
        onMouseEnter={e => { e.currentTarget.style.color = "var(--primary)"; }}
        onMouseLeave={e => { e.currentTarget.style.color = "var(--text-muted)"; }}
      >← Back to Projects</Link>

      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ margin: "0 0 8px", fontSize: "2rem", fontWeight: "800", color: "var(--text-primary)", letterSpacing: "-0.03em", display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ width: "42px", height: "42px", borderRadius: "11px", background: "linear-gradient(135deg,#06b6d4,#3b82f6)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "20px", boxShadow: "0 6px 20px rgba(6,182,212,0.35)" }}>👥</span>
          Project Members
        </h1>
        <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "0.95rem" }}>
          Manage team members and invitations for this project.
        </p>
      </div>

      {/* Feedback */}
      {feedback.message && (
        <div style={{ padding: "12px 16px", background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: "10px", color: "#34d399", fontSize: "0.875rem", marginBottom: "16px" }}>
          ✓ {feedback.message}
        </div>
      )}
      {feedback.error && (
        <div style={{ padding: "12px 16px", background: "var(--error-bg)", border: "1px solid var(--error-border)", borderRadius: "10px", color: "var(--error)", fontSize: "0.875rem", marginBottom: "16px" }}>
          ⚠️ {feedback.error}
        </div>
      )}

      {/* Invite Section */}
      <div style={{ background: "var(--surface)", borderRadius: "16px", border: "1px solid var(--border)", padding: "1.5rem 1.75rem", marginBottom: "20px", boxShadow: "var(--shadow)" }}>
        <h2 style={{ margin: "0 0 6px", fontSize: "1.1rem", fontWeight: "800", color: "var(--text-primary)" }}>Search & Invite Developers</h2>
        <p style={{ margin: "0 0 16px", color: "var(--text-secondary)", fontSize: "0.875rem" }}>Search registered developers by name, email, or skills.</p>

        <form onSubmit={handleSearch} style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ position: "relative", flex: 1, minWidth: "240px", display: "flex", alignItems: "center" }}>
            <input
              type="text" placeholder="Search by name, email, or skill..."
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)} onBlur={() => setSearchFocused(false)}
              style={{ ...inputStyle, width: "100%", paddingRight: searchQuery ? "36px" : "14px", ...(searchFocused ? { borderColor: "var(--primary)", boxShadow: "0 0 0 3px var(--primary-light)" } : {}) }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => { setSearchQuery(""); setSearchResults([]); setHasSearched(false); }}
                style={{
                  position: "absolute", right: "10px",
                  background: "var(--surface-3, rgba(255,255,255,0.08))",
                  border: "none", borderRadius: "50%",
                  width: "20px", height: "20px",
                  color: "var(--text-muted)", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "11px",
                }}
              >✕</button>
            )}
          </div>
          <button type="submit" disabled={searching} style={{
            padding: "10px 22px", background: searching ? "var(--surface-2)" : "linear-gradient(135deg,#6366f1,#8b5cf6)",
            color: searching ? "var(--text-muted)" : "#fff",
            border: "none", borderRadius: "10px", fontWeight: "700",
            cursor: searching ? "not-allowed" : "pointer", fontFamily: "var(--font)",
            boxShadow: searching ? "none" : "0 4px 14px rgba(99,102,241,0.35)", transition: "all 0.2s ease",
          }}>
            {searching ? "Searching..." : "Search"}
          </button>
        </form>

        {hasSearched && (
          <div style={{ marginTop: "16px" }}>
            <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: "12px" }}>
              {searchResults.length === 0 ? `No developers found matching "${searchQuery}"` : `${searchResults.length} developer(s) found`}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {searchResults.map((dev, i) => {
                const existing = members.find(m => m.user?._id === dev._id || m.user?.email?.toLowerCase() === dev.email?.toLowerCase());
                const isInviting = invitingId === dev._id;
                const sc = existing ? STATUS_CFG[existing.status] : null;
                return (
                  <div key={dev._id} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "12px 16px", background: "var(--surface-2)",
                    borderRadius: "12px", border: "1px solid var(--border)", flexWrap: "wrap", gap: "10px",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1, minWidth: "200px" }}>
                      <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: dev.profileImage ? "#000" : GRADIENTS[i % GRADIENTS.length], display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", fontWeight: "800", color: "#fff", flexShrink: 0, overflow: "hidden" }}>
                        {dev.profileImage ? <img src={dev.profileImage} alt={dev.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : getInitials(dev.name)}
                      </div>
                      <div>
                        <p style={{ fontWeight: "700", margin: 0, color: "var(--text-primary)", fontSize: "0.92rem" }}>{dev.name}</p>
                        <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", margin: 0 }}>{dev.email}</p>
                        {dev.skills?.length > 0 && <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: "2px 0 0" }}>{dev.skills.slice(0, 4).join(", ")}</p>}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      {existing ? (
                        <span style={{ padding: "4px 12px", borderRadius: "20px", fontSize: "0.78rem", fontWeight: "700", color: sc.color, background: sc.bg, border: `1px solid ${sc.border}` }}>
                          {existing.status === "Accepted" ? "Active Member" : existing.status}
                        </span>
                      ) : (
                        <>
                          <select
                            value={selectedRoles[dev._id] || "Developer"}
                            onChange={e => setSelectedRoles(prev => ({ ...prev, [dev._id]: e.target.value }))}
                            style={{ padding: "7px 10px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text-primary)", fontFamily: "var(--font)", fontSize: "0.82rem", cursor: "pointer", outline: "none" }}
                          >
                            <option value="Developer">Developer</option>
                            <option value="Designer">Designer</option>
                            <option value="Manager">Manager</option>
                          </select>
                          <button
                            type="button" disabled={isInviting} onClick={() => handleInvite(dev)}
                            style={{
                              padding: "7px 16px", background: isInviting ? "var(--surface-2)" : "linear-gradient(135deg,#10b981,#059669)",
                              color: isInviting ? "var(--text-muted)" : "#fff", border: "none", borderRadius: "8px",
                              fontWeight: "700", fontSize: "0.82rem", cursor: isInviting ? "not-allowed" : "pointer",
                              fontFamily: "var(--font)", boxShadow: isInviting ? "none" : "0 4px 12px rgba(16,185,129,0.3)",
                            }}
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

      {/* Members List */}
      <div style={{ background: "var(--surface)", borderRadius: "16px", border: "1px solid var(--border)", padding: "1.5rem 1.75rem", boxShadow: "var(--shadow)" }}>
        <div style={{ marginBottom: "20px" }}>
          <h2 style={{ margin: "0 0 4px", fontSize: "1.1rem", fontWeight: "800", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "10px" }}>
            Team Members
            <span style={{ background: "var(--surface-2)", color: "var(--text-muted)", fontSize: "0.78rem", fontWeight: "600", padding: "2px 10px", borderRadius: "20px", border: "1px solid var(--border)" }}>
              {members.length} total
            </span>
          </h2>
          <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.82rem" }}>
            {accepted.length} active · {pending.length} pending · {rejected.length} rejected
          </p>
        </div>

        {members.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2.5rem", background: "var(--surface-2)", borderRadius: "12px", border: "1px solid var(--border)" }}>
            <div style={{ fontSize: "2rem", marginBottom: "12px" }}>👥</div>
            <p style={{ color: "var(--text-secondary)", margin: 0, fontSize: "0.9rem" }}>No developers invited yet. Use the search above to invite team members.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {members.map((member, i) => {
              const sc = STATUS_CFG[member.status] || STATUS_CFG.Pending;
              const isCancelling = cancellingId === member._id;
              const isRemoving = removingId === member._id;
              return (
                <div key={member._id} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "14px 16px", background: "var(--surface-2)",
                  border: "1px solid var(--border)", borderRadius: "12px",
                  flexWrap: "wrap", gap: "12px",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1, minWidth: "200px" }}>
                    <div style={{ width: "42px", height: "42px", borderRadius: "11px", background: member.user?.profileImage ? "#000" : GRADIENTS[i % GRADIENTS.length], display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.88rem", fontWeight: "800", color: "#fff", flexShrink: 0, overflow: "hidden", boxShadow: "0 4px 10px rgba(0,0,0,0.25)" }}>
                      {member.user?.profileImage
                        ? <img src={member.user.profileImage} alt={member.user.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { e.target.style.display = "none"; }} />
                        : getInitials(member.user?.name)}
                    </div>
                    <div>
                      <p style={{ fontWeight: "700", margin: 0, color: "var(--text-primary)", fontSize: "0.92rem" }}>{member.user?.name || "Unknown User"}</p>
                      <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", margin: 0 }}>{member.user?.email}</p>
                      {member.user?.skills?.length > 0 && <p style={{ fontSize: "0.73rem", color: "var(--text-muted)", margin: "2px 0 0" }}>{member.user.skills.slice(0, 3).join(", ")}</p>}
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <span style={{ padding: "4px 10px", borderRadius: "20px", fontSize: "0.78rem", fontWeight: "600", background: "var(--surface)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}>
                      🎭 {member.role}
                    </span>
                    <span style={{ padding: "4px 10px", borderRadius: "20px", fontSize: "0.78rem", fontWeight: "700", color: sc.color, background: sc.bg, border: `1px solid ${sc.border}` }}>
                      <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: sc.dot, display: "inline-block", marginRight: "5px" }} />
                      {member.status}
                    </span>

                    {member.status === "Pending" && (
                      <button onClick={() => handleCancelInvitation(member)} disabled={isCancelling} style={{ padding: "5px 12px", background: "var(--error-bg)", color: "var(--error)", border: "1px solid var(--error-border)", borderRadius: "8px", fontWeight: "700", fontSize: "0.78rem", cursor: isCancelling ? "not-allowed" : "pointer", fontFamily: "var(--font)" }}>
                        {isCancelling ? "Cancelling..." : "Cancel"}
                      </button>
                    )}
                    {member.status === "Accepted" && (
                      <button onClick={() => handleRemove(member)} disabled={isRemoving} style={{ padding: "5px 12px", background: "var(--error-bg)", color: "var(--error)", border: "1px solid var(--error-border)", borderRadius: "8px", fontWeight: "700", fontSize: "0.78rem", cursor: isRemoving ? "not-allowed" : "pointer", fontFamily: "var(--font)" }}>
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
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} select option{background:var(--surface);color:var(--text-primary)}`}</style>
    </Shell>
  );
}

export default ProjectMembers;