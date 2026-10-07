import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const CATEGORIES = [
  "General", "Programming", "Web Development", "Mobile Development",
  "Machine Learning", "DevOps", "Database", "Career", "Projects", "Help",
];

const CATEGORY_ICONS = {
  General: "💡", Programming: "💻", "Web Development": "🌍",
  "Mobile Development": "📱", "Machine Learning": "🤖", DevOps: "⚙️",
  Database: "🗄️", Career: "🚀", Projects: "📁", Help: "🆘",
};

const GRADIENTS = [
  "linear-gradient(135deg,#6366f1,#8b5cf6)",
  "linear-gradient(135deg,#06b6d4,#3b82f6)",
  "linear-gradient(135deg,#f59e0b,#ef4444)",
  "linear-gradient(135deg,#10b981,#06b6d4)",
  "linear-gradient(135deg,#ec4899,#8b5cf6)",
];

function getUserIdFromToken(token) {
  try { return JSON.parse(atob(token.split(".")[1])).id; } catch { return null; }
}

function timeAgo(d) {
  const m = Math.floor((Date.now() - new Date(d)) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const inputStyle = {
  width: "100%", padding: "11px 14px", boxSizing: "border-box",
  borderRadius: "10px", border: "1px solid var(--border)",
  fontSize: "0.9rem", background: "var(--surface-2)", color: "var(--text-primary)",
  fontFamily: "var(--font)", outline: "none",
  transition: "border-color 0.2s, box-shadow 0.2s",
};

function DiscussionDetails() {
  const { id } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  const currentUserId = getUserIdFromToken(token);

  const [discussion, setDiscussion] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [isEditingDiscussion, setIsEditingDiscussion] = useState(false);
  const [editDiscussionData, setEditDiscussionData] = useState({ title: "", content: "", category: "General", tags: "" });
  const [savingDiscussion, setSavingDiscussion] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentContent, setEditingCommentContent] = useState("");
  const [savingComment, setSavingComment] = useState(false);
  const [commentFocused, setCommentFocused] = useState(false);

  useEffect(() => {
    const fetchDiscussion = async () => {
      try {
        const response = await api.get(`/api/discussions/${id}`);
        const d = response.data.discussion;
        setDiscussion(d);
        setComments(response.data.comments || []);
        setEditDiscussionData({ title: d.title || "", content: d.content || "", category: d.category || "General", tags: d.tags?.join(", ") || "" });
      } catch (err) {
        setError(err.response?.status === 404 ? "Discussion not found" : "Unable to load discussion details");
      } finally { setLoading(false); }
    };
    if (token && id) fetchDiscussion();
  }, [token, id]);

  const isDiscussionAuthor = currentUserId && discussion &&
    (discussion.author?._id === currentUserId || discussion.author === currentUserId);

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSubmittingComment(true);
    try {
      const res = await api.post(`/api/discussions/${id}/comments`, { content: newComment.trim() });
      setComments([...comments, res.data.comment]);
      setNewComment("");
    } catch (err) { alert(err.response?.data?.message || "Failed to add comment"); }
    finally { setSubmittingComment(false); }
  };

  const handleUpdateDiscussion = async (e) => {
    e.preventDefault();
    setSavingDiscussion(true);
    try {
      const tagsArray = editDiscussionData.tags.split(",").map(t => t.trim()).filter(t => t.length > 0);
      const res = await api.put(`/api/discussions/${id}`, {
        title: editDiscussionData.title.trim(),
        content: editDiscussionData.content.trim(),
        category: editDiscussionData.category,
        tags: tagsArray,
      });
      setDiscussion(res.data.discussion);
      setIsEditingDiscussion(false);
    } catch (err) { alert(err.response?.data?.message || "Failed to update discussion"); }
    finally { setSavingDiscussion(false); }
  };

  const handleDeleteDiscussion = async () => {
    if (!window.confirm("Delete this discussion and all its comments?")) return;
    try {
      await api.delete(`/api/discussions/${id}`);
      navigate("/discussions");
    } catch (err) { alert(err.response?.data?.message || "Failed to delete discussion"); }
  };

  const handleSaveCommentEdit = async (commentId) => {
    if (!editingCommentContent.trim()) return;
    setSavingComment(true);
    try {
      const res = await api.put(`/api/comments/${commentId}`, { content: editingCommentContent.trim() });
      setComments(comments.map(c => c._id === commentId ? res.data.comment : c));
      setEditingCommentId(null);
      setEditingCommentContent("");
    } catch (err) { alert(err.response?.data?.message || "Failed to update comment"); }
    finally { setSavingComment(false); }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("Delete this comment?")) return;
    try {
      await api.delete(`/api/comments/${commentId}`);
      setComments(comments.filter(c => c._id !== commentId));
    } catch (err) { alert(err.response?.data?.message || "Failed to delete comment"); }
  };

  if (loading) return (
    <div style={{ minHeight: "calc(100vh - 64px)", background: "var(--bg)", padding: "2rem 1.25rem", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px" }}>
      <div style={{ width: "44px", height: "44px", border: "3px solid var(--border)", borderTopColor: "var(--primary)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <p style={{ color: "var(--text-muted)" }}>Loading discussion...</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (error || !discussion) return (
    <div style={{ minHeight: "calc(100vh - 64px)", background: "var(--bg)", padding: "2rem 1.25rem", maxWidth: "900px", margin: "0 auto" }}>
      <Link to="/discussions" style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--text-muted)", textDecoration: "none", fontWeight: "600", fontSize: "0.875rem", marginBottom: "20px" }}>← Back to Discussions</Link>
      <div style={{ background: "var(--error-bg)", border: "1px solid var(--error-border)", borderRadius: "12px", padding: "1.5rem", color: "var(--error)" }}>{error || "Discussion not found."}</div>
    </div>
  );

  const catIcon = CATEGORY_ICONS[discussion.category] || "💡";
  const authorInitials = (discussion.author?.name || "D")[0].toUpperCase();

  return (
    <div style={{ minHeight: "calc(100vh - 64px)", background: "var(--bg)", padding: "2rem 1.25rem 4rem" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        <Link to="/discussions" style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--text-muted)", textDecoration: "none", fontWeight: "600", fontSize: "0.875rem", marginBottom: "24px", transition: "color 0.2s" }}
          onMouseEnter={e => { e.currentTarget.style.color = "var(--primary)"; }}
          onMouseLeave={e => { e.currentTarget.style.color = "var(--text-muted)"; }}
        >← Back to Discussions</Link>

        {/* ── Main Discussion Card ── */}
        <div style={{ background: "var(--surface)", borderRadius: "20px", border: "1px solid var(--border)", padding: "2rem 2.25rem", marginBottom: "20px", boxShadow: "var(--shadow-lg)", position: "relative", overflow: "hidden" }}>
          {/* left accent bar */}
          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "4px", background: "linear-gradient(180deg,#6366f1,#ec4899)" }} />

          {!isEditingDiscussion ? (
            <>
              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px", flexWrap: "wrap", marginBottom: "16px" }}>
                <h1 style={{ margin: 0, fontSize: "1.65rem", fontWeight: "800", color: "var(--text-primary)", flex: 1, letterSpacing: "-0.02em", lineHeight: 1.3 }}>
                  {discussion.title}
                </h1>
                {discussion.category && (
                  <span style={{ padding: "5px 14px", borderRadius: "20px", fontSize: "0.82rem", fontWeight: "700", background: "rgba(99,102,241,0.12)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.25)", whiteSpace: "nowrap" }}>
                    {catIcon} {discussion.category}
                  </span>
                )}
              </div>

              {/* Author & Date */}
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px", flexWrap: "wrap" }}>
                <div style={{ width: "34px", height: "34px", borderRadius: "10px", background: discussion.author?.profileImage ? "#000" : GRADIENTS[0], display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", fontWeight: "800", color: "#fff", overflow: "hidden", flexShrink: 0 }}>
                  {discussion.author?.profileImage
                    ? <img src={discussion.author.profileImage} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { e.target.style.display = "none"; e.target.parentElement.innerHTML = authorInitials; }} />
                    : authorInitials}
                </div>
                <span style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
                  Posted by <strong style={{ color: "var(--text-primary)" }}>{discussion.author?.name || "Developer"}</strong>
                </span>
                <span style={{ color: "var(--text-muted)" }}>·</span>
                <span style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>{timeAgo(discussion.createdAt)}</span>
                <span style={{ color: "var(--text-muted)" }}>·</span>
                <span style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>💬 {comments.length} comment{comments.length !== 1 ? "s" : ""}</span>
              </div>

              {/* Content */}
              <p style={{ margin: "0 0 20px", color: "var(--text-secondary)", lineHeight: 1.8, fontSize: "0.975rem", whiteSpace: "pre-line" }}>
                {discussion.content}
              </p>

              {/* Tags */}
              {discussion.tags?.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "20px" }}>
                  {discussion.tags.map((tag, i) => (
                    <span key={i} style={{ background: "var(--surface-2)", color: "var(--text-muted)", fontSize: "0.78rem", padding: "4px 10px", borderRadius: "20px", fontWeight: "600", border: "1px solid var(--border)" }}>
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Author Controls */}
              {isDiscussionAuthor && (
                <div style={{ display: "flex", gap: "10px", borderTop: "1px solid var(--border)", paddingTop: "16px" }}>
                  <button onClick={() => setIsEditingDiscussion(true)} style={{ padding: "7px 16px", background: "var(--surface-2)", color: "var(--text-secondary)", border: "1px solid var(--border)", borderRadius: "8px", cursor: "pointer", fontWeight: "700", fontSize: "0.82rem", fontFamily: "var(--font)", transition: "all 0.2s ease" }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--primary-border)"; e.currentTarget.style.color = "var(--primary)"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text-secondary)"; }}
                  >
                    ✏️ Edit
                  </button>
                  <button onClick={handleDeleteDiscussion} style={{ padding: "7px 16px", background: "var(--error-bg)", color: "var(--error)", border: "1px solid var(--error-border)", borderRadius: "8px", cursor: "pointer", fontWeight: "700", fontSize: "0.82rem", fontFamily: "var(--font)" }}>
                    🗑️ Delete
                  </button>
                </div>
              )}
            </>
          ) : (
            /* Edit Discussion Form */
            <form onSubmit={handleUpdateDiscussion}>
              <h2 style={{ margin: "0 0 20px", fontSize: "1.2rem", fontWeight: "800", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "8px" }}>
                ✏️ Edit Discussion
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "700", color: "var(--text-secondary)", marginBottom: "6px" }}>Title *</label>
                  <input type="text" required value={editDiscussionData.title}
                    onChange={e => setEditDiscussionData({ ...editDiscussionData, title: e.target.value })}
                    style={inputStyle}
                  />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "700", color: "var(--text-secondary)", marginBottom: "6px" }}>Category</label>
                    <select value={editDiscussionData.category}
                      onChange={e => setEditDiscussionData({ ...editDiscussionData, category: e.target.value })}
                      style={{ ...inputStyle, cursor: "pointer" }}
                    >
                      {CATEGORIES.map(cat => <option key={cat} value={cat}>{CATEGORY_ICONS[cat]} {cat}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "700", color: "var(--text-secondary)", marginBottom: "6px" }}>Tags (comma-separated)</label>
                    <input type="text" value={editDiscussionData.tags} placeholder="React, CSS, Vite"
                      onChange={e => setEditDiscussionData({ ...editDiscussionData, tags: e.target.value })}
                      style={inputStyle}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "700", color: "var(--text-secondary)", marginBottom: "6px" }}>Content *</label>
                  <textarea required rows="6" value={editDiscussionData.content}
                    onChange={e => setEditDiscussionData({ ...editDiscussionData, content: e.target.value })}
                    style={{ ...inputStyle, resize: "vertical", lineHeight: 1.7 }}
                  />
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button type="submit" disabled={savingDiscussion} style={{
                    padding: "10px 22px", background: savingDiscussion ? "var(--surface-2)" : "linear-gradient(135deg,#6366f1,#8b5cf6)",
                    color: savingDiscussion ? "var(--text-muted)" : "#fff", border: "none", borderRadius: "9px",
                    fontWeight: "700", cursor: savingDiscussion ? "not-allowed" : "pointer", fontFamily: "var(--font)",
                    boxShadow: savingDiscussion ? "none" : "0 4px 14px rgba(99,102,241,0.35)",
                  }}>
                    {savingDiscussion ? "Saving..." : "💾 Save Changes"}
                  </button>
                  <button type="button" onClick={() => setIsEditingDiscussion(false)} style={{
                    padding: "10px 18px", background: "var(--surface-2)", color: "var(--text-secondary)",
                    border: "1px solid var(--border)", borderRadius: "9px",
                    fontWeight: "600", cursor: "pointer", fontFamily: "var(--font)",
                  }}>
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* ── Comments Section ── */}
        <div>
          <h2 style={{ margin: "0 0 18px", fontSize: "1.2rem", fontWeight: "800", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "8px" }}>
            💬 Comments <span style={{ background: "var(--surface-2)", color: "var(--text-muted)", fontSize: "0.78rem", fontWeight: "600", padding: "2px 10px", borderRadius: "20px", border: "1px solid var(--border)" }}>{comments.length}</span>
          </h2>

          {/* Add Comment */}
          <div style={{ background: "var(--surface)", borderRadius: "16px", border: "1px solid var(--border)", padding: "1.5rem 1.75rem", marginBottom: "18px", boxShadow: "var(--shadow)" }}>
            <label style={{ display: "block", fontSize: "0.9rem", fontWeight: "700", color: "var(--text-primary)", marginBottom: "10px" }}>
              Leave a Reply
            </label>
            <form onSubmit={handleAddComment}>
              <textarea
                value={newComment} onChange={e => setNewComment(e.target.value)} rows="3" required
                placeholder="Write a thoughtful comment or answer..."
                onFocus={() => setCommentFocused(true)} onBlur={() => setCommentFocused(false)}
                style={{
                  ...inputStyle, resize: "vertical", lineHeight: 1.7, marginBottom: "12px",
                  ...(commentFocused ? { borderColor: "var(--primary)", boxShadow: "0 0 0 3px var(--primary-light)" } : {}),
                }}
              />
              <button type="submit" disabled={submittingComment || !newComment.trim()} style={{
                padding: "9px 22px",
                background: (submittingComment || !newComment.trim()) ? "var(--surface-2)" : "linear-gradient(135deg,#6366f1,#8b5cf6)",
                color: (submittingComment || !newComment.trim()) ? "var(--text-muted)" : "#fff",
                border: "none", borderRadius: "9px", fontWeight: "700",
                cursor: (submittingComment || !newComment.trim()) ? "not-allowed" : "pointer",
                fontFamily: "var(--font)", fontSize: "0.9rem",
                boxShadow: (submittingComment || !newComment.trim()) ? "none" : "0 4px 14px rgba(99,102,241,0.35)",
                transition: "all 0.2s ease",
              }}>
                {submittingComment ? "Posting..." : "Submit Comment"}
              </button>
            </form>
          </div>

          {/* Comments List */}
          {comments.length === 0 ? (
            <div style={{ background: "var(--surface)", borderRadius: "12px", border: "1px dashed var(--border)", padding: "2.5rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.9rem" }}>
              No comments yet. Be the first to join the conversation!
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {comments.map((comment, ci) => {
                const isCommentAuthor = currentUserId &&
                  (comment.author?._id === currentUserId || comment.author === currentUserId);
                const cInitials = (comment.author?.name || "D")[0].toUpperCase();

                return (
                  <div key={comment._id} style={{
                    background: "var(--surface)", borderRadius: "14px",
                    border: "1px solid var(--border)", padding: "16px 20px",
                    boxShadow: "var(--shadow)",
                  }}>
                    {/* Comment header */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", gap: "10px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{ width: "32px", height: "32px", borderRadius: "9px", background: comment.author?.profileImage ? "#000" : GRADIENTS[ci % GRADIENTS.length], display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.72rem", fontWeight: "800", color: "#fff", overflow: "hidden", flexShrink: 0 }}>
                          {comment.author?.profileImage
                            ? <img src={comment.author.profileImage} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { e.target.style.display = "none"; e.target.parentElement.innerHTML = cInitials; }} />
                            : cInitials}
                        </div>
                        <span style={{ fontWeight: "700", fontSize: "0.875rem", color: "var(--text-primary)" }}>{comment.author?.name || "Developer"}</span>
                        <span style={{ color: "var(--text-muted)" }}>·</span>
                        <span style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>{timeAgo(comment.createdAt)}</span>
                      </div>

                      {isCommentAuthor && editingCommentId !== comment._id && (
                        <div style={{ display: "flex", gap: "6px" }}>
                          <button onClick={() => { setEditingCommentId(comment._id); setEditingCommentContent(comment.content); }}
                            style={{ background: "transparent", border: "none", color: "var(--primary)", cursor: "pointer", fontSize: "0.78rem", fontWeight: "700", fontFamily: "var(--font)", padding: "3px 8px", borderRadius: "6px", transition: "background 0.2s" }}
                            onMouseEnter={e => { e.currentTarget.style.background = "var(--surface-2)"; }}
                            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                          >Edit</button>
                          <button onClick={() => handleDeleteComment(comment._id)}
                            style={{ background: "transparent", border: "none", color: "var(--error)", cursor: "pointer", fontSize: "0.78rem", fontWeight: "700", fontFamily: "var(--font)", padding: "3px 8px", borderRadius: "6px", transition: "background 0.2s" }}
                            onMouseEnter={e => { e.currentTarget.style.background = "var(--error-bg)"; }}
                            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                          >Delete</button>
                        </div>
                      )}
                    </div>

                    {editingCommentId === comment._id ? (
                      <div>
                        <textarea
                          value={editingCommentContent}
                          onChange={e => setEditingCommentContent(e.target.value)}
                          rows="3"
                          style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6, marginBottom: "10px" }}
                        />
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button onClick={() => handleSaveCommentEdit(comment._id)} disabled={savingComment}
                            style={{ padding: "6px 14px", background: savingComment ? "var(--surface-2)" : "linear-gradient(135deg,#6366f1,#8b5cf6)", color: savingComment ? "var(--text-muted)" : "#fff", border: "none", borderRadius: "7px", fontSize: "0.8rem", fontWeight: "700", cursor: savingComment ? "not-allowed" : "pointer", fontFamily: "var(--font)" }}
                          >
                            {savingComment ? "Saving..." : "Save"}
                          </button>
                          <button onClick={() => { setEditingCommentId(null); setEditingCommentContent(""); }}
                            style={{ padding: "6px 12px", background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-secondary)", borderRadius: "7px", fontSize: "0.8rem", cursor: "pointer", fontFamily: "var(--font)", fontWeight: "600" }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p style={{ margin: 0, fontSize: "0.9rem", lineHeight: 1.7, color: "var(--text-secondary)", whiteSpace: "pre-line" }}>
                        {comment.content}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} select option{background:var(--surface);color:var(--text-primary)}`}</style>
    </div>
  );
}

export default DiscussionDetails;
