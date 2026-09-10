import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const CATEGORIES = [
  "General",
  "Programming",
  "Web Development",
  "Mobile Development",
  "Machine Learning",
  "DevOps",
  "Database",
  "Career",
  "Projects",
  "Help",
];

// Decode JWT payload to get current user ID
function getUserIdFromToken(token) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.id;
  } catch {
    return null;
  }
}

function DiscussionDetails() {
  const { id } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  const currentUserId = getUserIdFromToken(token);

  const [discussion, setDiscussion] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Comment adding state
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  // Discussion editing state
  const [isEditingDiscussion, setIsEditingDiscussion] = useState(false);
  const [editDiscussionData, setEditDiscussionData] = useState({
    title: "",
    content: "",
    category: "General",
    tags: "",
  });
  const [savingDiscussion, setSavingDiscussion] = useState(false);

  // Comment editing state
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentContent, setEditingCommentContent] = useState("");
  const [savingComment, setSavingComment] = useState(false);

  useEffect(() => {
    const fetchDiscussion = async () => {
      try {
        const response = await api.get(`/api/discussions/${id}`);

        const d = response.data.discussion;
        setDiscussion(d);
        setComments(response.data.comments || []);

        setEditDiscussionData({
          title: d.title || "",
          content: d.content || "",
          category: d.category || "General",
          tags: d.tags?.join(", ") || "",
        });
      } catch (err) {
        console.error(
          "Discussion Details Error:",
          err.response?.data || err.message
        );
        if (err.response?.status === 404) {
          setError("Discussion not found");
        } else {
          setError("Unable to load discussion details");
        }
      } finally {
        setLoading(false);
      }
    };

    if (token && id) {
      fetchDiscussion();
    }
  }, [token, id]);

  // Ownership helper
  const isDiscussionAuthor =
    currentUserId &&
    discussion &&
    (discussion.author?._id === currentUserId ||
      discussion.author === currentUserId);

  // Add Comment
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmittingComment(true);

    try {
      const response = await api.post(
        `/api/discussions/${id}/comments`,
        { content: newComment.trim() }
      );

      setComments([...comments, response.data.comment]);
      setNewComment("");
    } catch (err) {
      console.error("Add Comment Error:", err.response?.data || err.message);
      alert(err.response?.data?.message || "Failed to add comment");
    } finally {
      setSubmittingComment(false);
    }
  };

  // Edit Discussion
  const handleUpdateDiscussion = async (e) => {
    e.preventDefault();
    setSavingDiscussion(true);

    try {
      const tagsArray = editDiscussionData.tags
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      const response = await api.put(`/api/discussions/${id}`, {
        title: editDiscussionData.title.trim(),
        content: editDiscussionData.content.trim(),
        category: editDiscussionData.category,
        tags: tagsArray,
      });

      setDiscussion(response.data.discussion);
      setIsEditingDiscussion(false);
    } catch (err) {
      console.error(
        "Update Discussion Error:",
        err.response?.data || err.message
      );
      alert(err.response?.data?.message || "Failed to update discussion");
    } finally {
      setSavingDiscussion(false);
    }
  };

  // Delete Discussion
  const handleDeleteDiscussion = async () => {
    if (
      !window.confirm(
        "Are you sure you want to delete this discussion and all its comments?"
      )
    ) {
      return;
    }

    try {
      await api.delete(`/api/discussions/${id}`);

      navigate("/discussions");
    } catch (err) {
      console.error(
        "Delete Discussion Error:",
        err.response?.data || err.message
      );
      alert(err.response?.data?.message || "Failed to delete discussion");
    }
  };

  // Edit Comment
  const handleSaveCommentEdit = async (commentId) => {
    if (!editingCommentContent.trim()) return;

    setSavingComment(true);

    try {
      const response = await api.put(`/api/comments/${commentId}`, {
        content: editingCommentContent.trim(),
      });

      setComments(
        comments.map((c) =>
          c._id === commentId ? response.data.comment : c
        )
      );
      setEditingCommentId(null);
      setEditingCommentContent("");
    } catch (err) {
      console.error("Edit Comment Error:", err.response?.data || err.message);
      alert(err.response?.data?.message || "Failed to update comment");
    } finally {
      setSavingComment(false);
    }
  };

  // Delete Comment
  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("Are you sure you want to delete this comment?")) {
      return;
    }

    try {
      await api.delete(`/api/comments/${commentId}`);

      setComments(comments.filter((c) => c._id !== commentId));
    } catch (err) {
      console.error("Delete Comment Error:", err.response?.data || err.message);
      alert(err.response?.data?.message || "Failed to delete comment");
    }
  };

  if (loading) {
    return (
      <div className="discussion-details-page" style={{ padding: "40px 20px" }}>
        <p>Loading discussion details...</p>
      </div>
    );
  }

  if (error || !discussion) {
    return (
      <div
        className="discussion-details-page"
        style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 20px" }}
      >
        <Link
          to="/discussions"
          style={{ display: "inline-block", marginBottom: "20px" }}
        >
          ← Back to Discussions
        </Link>
        <p style={{ color: "#d9534f" }}>{error || "Discussion not found."}</p>
      </div>
    );
  }

  return (
    <div
      className="discussion-details-page"
      style={{
        maxWidth: "900px",
        margin: "0 auto",
        padding: "40px 20px",
        textAlign: "left",
      }}
    >
      <Link
        to="/discussions"
        style={{
          display: "inline-block",
          marginBottom: "20px",
          color: "#0366d6",
          textDecoration: "none",
          fontWeight: "500",
        }}
      >
        ← Back to Discussions
      </Link>

      {/* Main Discussion Container */}
      <div
        style={{
          background: "white",
          borderRadius: "14px",
          border: "1px solid #ddd",
          padding: "30px",
          marginBottom: "35px",
        }}
      >
        {!isEditingDiscussion ? (
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: "16px",
                flexWrap: "wrap",
                marginBottom: "12px",
              }}
            >
              <h1
                style={{
                  margin: "0 0 10px 0",
                  fontSize: "28px",
                  lineHeight: "1.3",
                  flex: 1,
                }}
              >
                {discussion.title}
              </h1>

              <span
                style={{
                  background: "#eef2ff",
                  color: "#4338ca",
                  fontSize: "13px",
                  fontWeight: "600",
                  padding: "4px 12px",
                  borderRadius: "12px",
                }}
              >
                {discussion.category}
              </span>
            </div>

            {/* Author & Date metadata */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "20px",
                color: "#666",
                fontSize: "14px",
              }}
            >
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  background: "#eee",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                }}
              >
                {discussion.author?.profileImage ? (
                  <img
                    src={discussion.author.profileImage}
                    alt={discussion.author.name}
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
              <span>
                Posted by <strong>{discussion.author?.name || "Developer"}</strong>
              </span>
              <span>•</span>
              <span>{new Date(discussion.createdAt).toLocaleString()}</span>
            </div>

            {/* Content */}
            <div
              style={{
                fontSize: "16px",
                lineHeight: "1.7",
                color: "#222",
                whiteSpace: "pre-line",
                marginBottom: "20px",
              }}
            >
              {discussion.content}
            </div>

            {/* Tags */}
            {discussion.tags && discussion.tags.length > 0 && (
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "8px",
                  marginBottom: "20px",
                }}
              >
                {discussion.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    style={{
                      background: "#f3f4f6",
                      color: "#4b5563",
                      fontSize: "13px",
                      padding: "4px 10px",
                      borderRadius: "12px",
                      fontWeight: "500",
                    }}
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Author Controls */}
            {isDiscussionAuthor && (
              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  borderTop: "1px solid #eee",
                  paddingTop: "16px",
                  marginTop: "16px",
                }}
              >
                <button
                  onClick={() => setIsEditingDiscussion(true)}
                  style={{
                    padding: "6px 14px",
                    background: "#f0f2f5",
                    color: "#333",
                    border: "1px solid #ccc",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontWeight: "500",
                  }}
                >
                  ✏️ Edit Discussion
                </button>

                <button
                  onClick={handleDeleteDiscussion}
                  style={{
                    padding: "6px 14px",
                    background: "#fee2e2",
                    color: "#dc2626",
                    border: "1px solid #fca5a5",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontWeight: "500",
                  }}
                >
                  🗑️ Delete Discussion
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Discussion Edit Form */
          <form onSubmit={handleUpdateDiscussion}>
            <h2 style={{ marginTop: 0, marginBottom: "16px" }}>Edit Discussion</h2>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", marginBottom: "6px", fontWeight: "600" }}>
                Title *
              </label>
              <input
                type="text"
                value={editDiscussionData.title}
                onChange={(e) =>
                  setEditDiscussionData({
                    ...editDiscussionData,
                    title: e.target.value,
                  })
                }
                required
                style={{
                  width: "100%",
                  padding: "10px",
                  fontSize: "15px",
                  borderRadius: "6px",
                  border: "1px solid #ccc",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "16px",
                marginBottom: "16px",
              }}
            >
              <div>
                <label style={{ display: "block", marginBottom: "6px", fontWeight: "600" }}>
                  Category *
                </label>
                <select
                  value={editDiscussionData.category}
                  onChange={(e) =>
                    setEditDiscussionData({
                      ...editDiscussionData,
                      category: e.target.value,
                    })
                  }
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "6px",
                    border: "1px solid #ccc",
                    boxSizing: "border-box",
                    background: "white",
                  }}
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "6px", fontWeight: "600" }}>
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={editDiscussionData.tags}
                  onChange={(e) =>
                    setEditDiscussionData({
                      ...editDiscussionData,
                      tags: e.target.value,
                    })
                  }
                  placeholder="React, CSS, Vite"
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "6px",
                    border: "1px solid #ccc",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", marginBottom: "6px", fontWeight: "600" }}>
                Content *
              </label>
              <textarea
                value={editDiscussionData.content}
                onChange={(e) =>
                  setEditDiscussionData({
                    ...editDiscussionData,
                    content: e.target.value,
                  })
                }
                rows="6"
                required
                style={{
                  width: "100%",
                  padding: "10px",
                  fontSize: "15px",
                  borderRadius: "6px",
                  border: "1px solid #ccc",
                  boxSizing: "border-box",
                  resize: "vertical",
                }}
              />
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                type="submit"
                disabled={savingDiscussion}
                style={{
                  padding: "10px 18px",
                  background: "#222",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                {savingDiscussion ? "Saving..." : "Save Changes"}
              </button>

              <button
                type="button"
                onClick={() => setIsEditingDiscussion(false)}
                style={{
                  padding: "10px 16px",
                  background: "#eee",
                  color: "#333",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Comments Section */}
      <div>
        <h2 style={{ fontSize: "22px", marginBottom: "20px" }}>
          💬 Comments ({comments.length})
        </h2>

        {/* Add Comment Form */}
        <form
          onSubmit={handleAddComment}
          style={{
            background: "white",
            padding: "20px",
            borderRadius: "12px",
            border: "1px solid #ddd",
            marginBottom: "25px",
          }}
        >
          <label
            style={{
              display: "block",
              fontWeight: "600",
              marginBottom: "8px",
              color: "#333",
            }}
          >
            Leave a Reply
          </label>
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a constructive comment or answer..."
            rows="3"
            required
            style={{
              width: "100%",
              padding: "10px",
              fontSize: "14px",
              borderRadius: "8px",
              border: "1px solid #ccc",
              boxSizing: "border-box",
              marginBottom: "12px",
              resize: "vertical",
            }}
          />

          <button
            type="submit"
            disabled={submittingComment || !newComment.trim()}
            style={{
              padding: "9px 18px",
              background: "#222",
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontWeight: "600",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            {submittingComment ? "Posting Comment..." : "Submit Comment"}
          </button>
        </form>

        {/* Comments Listing */}
        {comments.length === 0 ? (
          <div
            style={{
              background: "#fafafa",
              padding: "25px",
              borderRadius: "10px",
              border: "1px dashed #ccc",
              textAlign: "center",
              color: "#777",
            }}
          >
            No comments yet. Be the first to join the conversation!
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {comments.map((comment) => {
              const isCommentAuthor =
                currentUserId &&
                (comment.author?._id === currentUserId ||
                  comment.author === currentUserId);

              return (
                <div
                  key={comment._id}
                  style={{
                    background: "white",
                    borderRadius: "10px",
                    border: "1px solid #e2e8f0",
                    padding: "18px 20px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "10px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                      }}
                    >
                      <div
                        style={{
                          width: "28px",
                          height: "28px",
                          borderRadius: "50%",
                          background: "#eee",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          overflow: "hidden",
                          fontSize: "12px",
                        }}
                      >
                        {comment.author?.profileImage ? (
                          <img
                            src={comment.author.profileImage}
                            alt={comment.author.name}
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

                      <strong style={{ fontSize: "14px", color: "#333" }}>
                        {comment.author?.name || "Developer"}
                      </strong>

                      <span style={{ fontSize: "12px", color: "#888" }}>
                        • {new Date(comment.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Comment Author Actions */}
                    {isCommentAuthor && editingCommentId !== comment._id && (
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          onClick={() => {
                            setEditingCommentId(comment._id);
                            setEditingCommentContent(comment.content);
                          }}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "#0366d6",
                            cursor: "pointer",
                            fontSize: "12px",
                            fontWeight: "500",
                          }}
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => handleDeleteComment(comment._id)}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "#dc2626",
                            cursor: "pointer",
                            fontSize: "12px",
                            fontWeight: "500",
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>

                  {editingCommentId === comment._id ? (
                    /* Inline Comment Edit */
                    <div style={{ marginTop: "10px" }}>
                      <textarea
                        value={editingCommentContent}
                        onChange={(e) =>
                          setEditingCommentContent(e.target.value)
                        }
                        rows="3"
                        style={{
                          width: "100%",
                          padding: "8px",
                          fontSize: "14px",
                          borderRadius: "6px",
                          border: "1px solid #ccc",
                          boxSizing: "border-box",
                          marginBottom: "8px",
                        }}
                      />
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          onClick={() => handleSaveCommentEdit(comment._id)}
                          disabled={savingComment}
                          style={{
                            padding: "6px 12px",
                            background: "#222",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            fontSize: "12px",
                            cursor: "pointer",
                          }}
                        >
                          {savingComment ? "Saving..." : "Save"}
                        </button>

                        <button
                          onClick={() => {
                            setEditingCommentId(null);
                            setEditingCommentContent("");
                          }}
                          style={{
                            padding: "6px 12px",
                            background: "#eee",
                            border: "none",
                            borderRadius: "4px",
                            fontSize: "12px",
                            cursor: "pointer",
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p
                      style={{
                        margin: "0",
                        fontSize: "14px",
                        lineHeight: "1.5",
                        color: "#333",
                        whiteSpace: "pre-line",
                      }}
                    >
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
  );
}

export default DiscussionDetails;
