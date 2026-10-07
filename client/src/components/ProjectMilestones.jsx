import { useState } from "react";
import api from "../services/api";

export default function ProjectMilestones({ projectId, milestones = [], isOwner, onUpdate }) {
  const [newTitle, setNewTitle] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const completedCount = milestones.filter((m) => m.isCompleted).length;
  const progressPercentage = milestones.length > 0
    ? Math.round((completedCount / milestones.length) * 100)
    : 0;

  const handleAddMilestone = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      setSubmitting(true);
      const res = await api.post(`/api/projects/${projectId}/milestones`, {
        title: newTitle.trim(),
        dueDate: newDueDate || null,
      });
      onUpdate(res.data.milestones);
      setNewTitle("");
      setNewDueDate("");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to add milestone");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (milestoneId) => {
    try {
      const res = await api.put(`/api/projects/${projectId}/milestones/${milestoneId}`);
      onUpdate(res.data.milestones);
    } catch (err) {
      alert("Failed to update milestone");
    }
  };

  const handleDelete = async (milestoneId) => {
    if (!window.confirm("Remove this milestone?")) return;
    try {
      const res = await api.delete(`/api/projects/${projectId}/milestones/${milestoneId}`);
      onUpdate(res.data.milestones);
    } catch (err) {
      alert("Failed to delete milestone");
    }
  };

  return (
    <div style={{
      background: "var(--surface)",
      borderRadius: "18px",
      border: "1px solid var(--border)",
      padding: "1.75rem",
      boxShadow: "var(--shadow)",
    }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "1.2rem", fontWeight: "800", color: "var(--text-primary)" }}>
              🎯 Roadmap & Milestones
            </h2>
            <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
              Track major project phases and progress
            </p>
          </div>
          <div style={{
            fontSize: "1.25rem",
            fontWeight: "800",
            color: progressPercentage === 100 ? "#34d399" : "var(--primary)",
          }}>
            {progressPercentage}%
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{
          height: "10px",
          background: "var(--surface-2)",
          borderRadius: "10px",
          overflow: "hidden",
          border: "1px solid var(--border)",
        }}>
          <div style={{
            height: "100%",
            width: `${progressPercentage}%`,
            background: progressPercentage === 100
              ? "linear-gradient(90deg, #10b981, #34d399)"
              : "linear-gradient(90deg, #6366f1, #8b5cf6)",
            borderRadius: "10px",
            transition: "width 0.4s ease",
          }} />
        </div>
        <div style={{ marginTop: "6px", fontSize: "0.78rem", color: "var(--text-muted)", textAlign: "right" }}>
          {completedCount} of {milestones.length} milestones completed
        </div>
      </div>

      {/* Milestone List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "1.5rem" }}>
        {milestones.length === 0 ? (
          <div style={{
            padding: "2rem",
            textAlign: "center",
            color: "var(--text-muted)",
            fontSize: "0.88rem",
            background: "var(--surface-2)",
            borderRadius: "12px",
            border: "1px dashed var(--border)",
          }}>
            No milestones added yet. Add phases like "Design Complete", "API V1", "Beta Launch".
          </div>
        ) : (
          milestones.map((m) => (
            <div
              key={m._id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 16px",
                background: m.isCompleted ? "rgba(16,185,129,0.06)" : "var(--surface-2)",
                border: `1px solid ${m.isCompleted ? "rgba(16,185,129,0.25)" : "var(--border)"}`,
                borderRadius: "12px",
                gap: "12px",
                transition: "all 0.2s ease",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1 }}>
                <input
                  type="checkbox"
                  checked={m.isCompleted}
                  onChange={() => handleToggle(m._id)}
                  style={{ width: "18px", height: "18px", cursor: "pointer", accentColor: "var(--primary)" }}
                />
                <div>
                  <p style={{
                    margin: 0,
                    fontSize: "0.92rem",
                    fontWeight: "700",
                    color: m.isCompleted ? "var(--text-muted)" : "var(--text-primary)",
                    textDecoration: m.isCompleted ? "line-through" : "none",
                  }}>
                    {m.title}
                  </p>
                  {m.dueDate && (
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      Target: {new Date(m.dueDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>

              {isOwner && (
                <button
                  onClick={() => handleDelete(m._id)}
                  style={{
                    background: "none", border: "none", color: "var(--text-muted)",
                    cursor: "pointer", fontSize: "14px", padding: "4px",
                  }}
                  title="Remove milestone"
                >
                  ✕
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add Milestone Form */}
      {isOwner && (
        <form onSubmit={handleAddMilestone} style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <input
            type="text"
            required
            placeholder="New Milestone (e.g. Backend API Ready)..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            style={{
              flex: 1, minWidth: "220px", padding: "10px 14px", borderRadius: "10px",
              border: "1px solid var(--border)", background: "var(--surface-2)",
              color: "var(--text-primary)", outline: "none", fontSize: "0.88rem",
            }}
          />
          <input
            type="date"
            value={newDueDate}
            onChange={(e) => setNewDueDate(e.target.value)}
            style={{
              padding: "10px 14px", borderRadius: "10px",
              border: "1px solid var(--border)", background: "var(--surface-2)",
              color: "var(--text-primary)", outline: "none", fontSize: "0.88rem",
            }}
          />
          <button
            type="submit"
            disabled={submitting || !newTitle.trim()}
            style={{
              padding: "10px 20px", background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              color: "#fff", border: "none", borderRadius: "10px",
              fontWeight: "700", cursor: "pointer",
            }}
          >
            {submitting ? "Adding..." : "+ Add"}
          </button>
        </form>
      )}
    </div>
  );
}
