import { useEffect, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const COLUMNS = ["To Do", "In Progress", "In Review", "Done"];

const PRIORITY_CFG = {
  Low: { color: "#34d399", bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.3)" },
  Medium: { color: "#fbbf24", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.3)" },
  High: { color: "#f97316", bg: "rgba(249,115,22,0.12)", border: "rgba(249,115,22,0.3)" },
  Urgent: { color: "#ef4444", bg: "rgba(239,68,68,0.15)", border: "rgba(239,68,68,0.35)" },
};

export default function KanbanBoard({ projectId, members = [] }) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [targetColumn, setTargetColumn] = useState("To Do");
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    priority: "Medium",
    assignedTo: "",
    dueDate: "",
    points: 3,
    bountyAmount: 0,
  });
  const [submitting, setSubmitting] = useState(false);
  const [bountyModalTask, setBountyModalTask] = useState(null);
  const [bountyAmountInput, setBountyAmountInput] = useState("50");

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/tasks/project/${projectId}`);
      setTasks(res.data.tasks || []);
    } catch (err) {
      console.error("Fetch tasks error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) fetchTasks();
  }, [projectId]);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!taskForm.title.trim()) return;

    try {
      setSubmitting(true);
      const res = await api.post("/api/tasks", {
        project: projectId,
        title: taskForm.title.trim(),
        description: taskForm.description.trim(),
        column: targetColumn,
        priority: taskForm.priority,
        assignedTo: taskForm.assignedTo || null,
        dueDate: taskForm.dueDate || null,
        points: Number(taskForm.points) || 3,
      });

      let createdTask = res.data.task;
      if (taskForm.bountyAmount > 0) {
        const bRes = await api.post(`/api/tasks/${createdTask._id}/bounty`, {
          amount: Number(taskForm.bountyAmount),
        });
        if (bRes.data?.success) createdTask = bRes.data.task;
      }

      setTasks((prev) => [createdTask, ...prev]);
      setShowCreateModal(false);
      setTaskForm({ title: "", description: "", priority: "Medium", assignedTo: "", dueDate: "", points: 3, bountyAmount: 0 });
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create task");
    } finally {
      setSubmitting(false);
    }
  };

  const handleFundBounty = async () => {
    if (!bountyModalTask || !bountyAmountInput) return;
    try {
      const res = await api.post(`/api/tasks/${bountyModalTask._id}/bounty`, {
        amount: Number(bountyAmountInput),
      });
      if (res.data?.success) {
        setTasks((prev) => prev.map((t) => (t._id === bountyModalTask._id ? res.data.task : t)));
        setBountyModalTask(null);
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to fund bounty");
    }
  };

  const handleClaimBounty = async (task) => {
    try {
      const res = await api.post(`/api/tasks/${task._id}/bounty/claim`);
      if (res.data?.success) {
        setTasks((prev) => prev.map((t) => (t._id === task._id ? res.data.task : t)));
        if (bountyModalTask?._id === task._id) setBountyModalTask(res.data.task);
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to claim bounty");
    }
  };

  const handleReleaseBounty = async (task) => {
    try {
      const res = await api.post(`/api/tasks/${task._id}/bounty/release`);
      if (res.data?.success) {
        setTasks((prev) => prev.map((t) => (t._id === task._id ? res.data.task : t)));
        if (bountyModalTask?._id === task._id) setBountyModalTask(res.data.task);
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to release bounty");
    }
  };


  const handleMoveColumn = async (task, direction) => {
    const currentIndex = COLUMNS.indexOf(task.column);
    const newIndex = currentIndex + direction;
    if (newIndex < 0 || newIndex >= COLUMNS.length) return;

    const newColumn = COLUMNS[newIndex];

    // Optimistic UI update
    setTasks((prev) =>
      prev.map((t) => (t._id === task._id ? { ...t, column: newColumn } : t))
    );

    try {
      await api.put(`/api/tasks/${task._id}`, { column: newColumn });
    } catch (err) {
      // Revert on failure
      fetchTasks();
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm("Delete this task?")) return;
    setTasks((prev) => prev.filter((t) => t._id !== taskId));
    try {
      await api.delete(`/api/tasks/${taskId}`);
    } catch (err) {
      fetchTasks();
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Board Top Actions */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h2 style={{ margin: "0 0 4px", fontSize: "1.25rem", fontWeight: "800", color: "var(--text-primary)" }}>
            Project Tasks
          </h2>
          <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-secondary)" }}>
            Manage sprints, features, and bug fixes across 4 kanban workflow stages
          </p>
        </div>

        <button
          onClick={() => {
            setTargetColumn("To Do");
            setShowCreateModal(true);
          }}
          style={{
            padding: "9px 18px",
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            color: "#fff",
            border: "none",
            borderRadius: "10px",
            fontWeight: "700",
            fontSize: "0.88rem",
            cursor: "pointer",
            boxShadow: "0 4px 14px rgba(99,102,241,0.35)",
          }}
        >
          + Add New Task
        </button>
      </div>

      {/* Kanban Columns Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
        gap: "16px",
        alignItems: "start",
      }}>
        {COLUMNS.map((colName) => {
          const colTasks = tasks.filter((t) => t.column === colName);
          return (
            <div
              key={colName}
              style={{
                background: "var(--surface)",
                borderRadius: "16px",
                border: "1px solid var(--border)",
                padding: "14px",
                minHeight: "420px",
                display: "flex",
                flexDirection: "column",
                boxShadow: "var(--shadow)",
              }}
            >
              {/* Column Header */}
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "14px",
                paddingBottom: "10px",
                borderBottom: "1px solid var(--border)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontWeight: "700", fontSize: "0.95rem", color: "var(--text-primary)" }}>
                    {colName}
                  </span>
                  <span style={{
                    background: "var(--surface-2)",
                    padding: "2px 8px",
                    borderRadius: "12px",
                    fontSize: "0.75rem",
                    fontWeight: "700",
                    color: "var(--text-muted)",
                  }}>
                    {colTasks.length}
                  </span>
                </div>

                <button
                  onClick={() => {
                    setTargetColumn(colName);
                    setShowCreateModal(true);
                  }}
                  title={`Add to ${colName}`}
                  style={{
                    background: "var(--surface-2)",
                    border: "none",
                    borderRadius: "6px",
                    width: "24px",
                    height: "24px",
                    cursor: "pointer",
                    color: "var(--text-primary)",
                    fontWeight: "bold",
                    fontSize: "14px",
                  }}
                >
                  +
                </button>
              </div>

              {/* Task Cards */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", flex: 1 }}>
                {colTasks.map((task) => {
                  const pcfg = PRIORITY_CFG[task.priority] || PRIORITY_CFG.Medium;
                  const colIdx = COLUMNS.indexOf(task.column);
                  return (
                    <div
                      key={task._id}
                      style={{
                        background: "var(--surface-2)",
                        borderRadius: "12px",
                        border: "1px solid var(--border)",
                        padding: "12px",
                        boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "6px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                          <span style={{
                            fontSize: "0.7rem",
                            fontWeight: "700",
                            padding: "2px 8px",
                            borderRadius: "6px",
                            background: pcfg.bg,
                            color: pcfg.color,
                            border: `1px solid ${pcfg.border}`,
                          }}>
                            {task.priority}
                          </span>

                          <span style={{
                            fontSize: "0.7rem",
                            fontWeight: "600",
                            padding: "2px 6px",
                            borderRadius: "6px",
                            background: "var(--surface)",
                            color: "var(--text-muted)",
                            border: "1px solid var(--border)",
                          }}>
                            ⚡ {task.points || 3} pts
                          </span>

                          {task.bounty?.amount > 0 ? (
                            <button
                              onClick={() => setBountyModalTask(task)}
                              style={{
                                padding: "2px 8px",
                                borderRadius: "6px",
                                background: task.bounty.status === "Released" ? "rgba(16, 185, 129, 0.2)" : "rgba(236, 72, 153, 0.18)",
                                color: task.bounty.status === "Released" ? "#34d399" : "#f472b6",
                                border: "1px solid rgba(236, 72, 153, 0.3)",
                                fontSize: "0.7rem",
                                fontWeight: "700",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "3px",
                              }}
                            >
                              💰 ${task.bounty.amount} ({task.bounty.status})
                            </button>
                          ) : (
                            <button
                              onClick={() => setBountyModalTask(task)}
                              style={{
                                padding: "2px 6px",
                                borderRadius: "6px",
                                background: "transparent",
                                color: "var(--text-muted)",
                                border: "1px dashed var(--border)",
                                fontSize: "0.68rem",
                                cursor: "pointer",
                              }}
                            >
                              + Bounty
                            </button>
                          )}
                        </div>

                        <button
                          onClick={() => handleDeleteTask(task._id)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "var(--text-muted)",
                            cursor: "pointer",
                            fontSize: "12px",
                          }}
                          title="Delete task"
                        >
                          ✕
                        </button>
                      </div>


                      <h4 style={{ margin: 0, fontSize: "0.92rem", fontWeight: "700", color: "var(--text-primary)" }}>
                        {task.title}
                      </h4>

                      {task.description && (
                        <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-secondary)", lineHeight: 1.4 }}>
                          {task.description}
                        </p>
                      )}

                      {/* Footer: Assignee, Due Date, Move Controls */}
                      <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginTop: "4px",
                        paddingTop: "6px",
                        borderTop: "1px solid var(--border)",
                        fontSize: "0.75rem",
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          {task.assignedTo ? (
                            <span style={{ color: "var(--text-secondary)", fontWeight: "600" }}>
                              👤 {task.assignedTo.name?.split(" ")[0]}
                            </span>
                          ) : (
                            <span style={{ color: "var(--text-muted)" }}>Unassigned</span>
                          )}
                        </div>

                        {/* Column shift controls */}
                        <div style={{ display: "flex", gap: "4px" }}>
                          {colIdx > 0 && (
                            <button
                              onClick={() => handleMoveColumn(task, -1)}
                              title="Move left"
                              style={{
                                background: "var(--surface)",
                                border: "1px solid var(--border)",
                                borderRadius: "4px",
                                width: "22px",
                                height: "22px",
                                cursor: "pointer",
                                color: "var(--text-muted)",
                                fontSize: "10px",
                              }}
                            >
                              ◀
                            </button>
                          )}
                          {colIdx < COLUMNS.length - 1 && (
                            <button
                              onClick={() => handleMoveColumn(task, 1)}
                              title="Move right"
                              style={{
                                background: "var(--surface)",
                                border: "1px solid var(--border)",
                                borderRadius: "4px",
                                width: "22px",
                                height: "22px",
                                cursor: "pointer",
                                color: "var(--text-muted)",
                                fontSize: "10px",
                              }}
                            >
                              ▶
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {colTasks.length === 0 && (
                  <div style={{
                    textAlign: "center",
                    padding: "2rem 1rem",
                    color: "var(--text-muted)",
                    fontSize: "0.82rem",
                    border: "1px dashed var(--border)",
                    borderRadius: "10px",
                  }}>
                    No tasks in {colName}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Task Modal */}
      {showCreateModal && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.7)",
          backdropFilter: "blur(6px)",
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1rem",
        }}>
          <div style={{
            background: "var(--surface)",
            borderRadius: "20px",
            border: "1px solid var(--border)",
            maxWidth: "480px",
            width: "100%",
            padding: "1.75rem",
            boxShadow: "var(--shadow-lg)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: "800", color: "var(--text-primary)" }}>
                Add Task to "{targetColumn}"
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "1.2rem" }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTask} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "700", color: "var(--text-muted)", marginBottom: "6px" }}>
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Implement authentication JWT middleware"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  style={{
                    width: "100%", padding: "10px 14px", borderRadius: "10px",
                    border: "1px solid var(--border)", background: "var(--surface-2)",
                    color: "var(--text-primary)", outline: "none", boxSizing: "border-box",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "700", color: "var(--text-muted)", marginBottom: "6px" }}>
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Task details and acceptance criteria..."
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  style={{
                    width: "100%", padding: "10px 14px", borderRadius: "10px",
                    border: "1px solid var(--border)", background: "var(--surface-2)",
                    color: "var(--text-primary)", outline: "none", boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "700", color: "var(--text-muted)", marginBottom: "6px" }}>
                    Priority
                  </label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                    style={{
                      width: "100%", padding: "10px", borderRadius: "10px",
                      border: "1px solid var(--border)", background: "var(--surface-2)",
                      color: "var(--text-primary)", outline: "none",
                    }}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "700", color: "var(--text-muted)", marginBottom: "6px" }}>
                    Assignee
                  </label>
                  <select
                    value={taskForm.assignedTo}
                    onChange={(e) => setTaskForm({ ...taskForm, assignedTo: e.target.value })}
                    style={{
                      width: "100%", padding: "10px", borderRadius: "10px",
                      border: "1px solid var(--border)", background: "var(--surface-2)",
                      color: "var(--text-primary)", outline: "none",
                    }}
                  >
                    <option value="">Unassigned</option>
                    {members.map((m) => (
                      <option key={m.user?._id || m._id} value={m.user?._id || m._id}>
                        {m.user?.name || "Member"}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Story Points & Optional Initial Bounty */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "700", color: "var(--text-muted)", marginBottom: "6px" }}>
                    ⚡ Story Points (Weight)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="21"
                    value={taskForm.points}
                    onChange={(e) => setTaskForm({ ...taskForm, points: e.target.value })}
                    style={{
                      width: "100%", padding: "10px", borderRadius: "10px",
                      border: "1px solid var(--border)", background: "var(--surface-2)",
                      color: "var(--text-primary)", outline: "none", boxSizing: "border-box"
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "700", color: "var(--text-muted)", marginBottom: "6px" }}>
                    💰 Escrow Bounty ($ USD)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    placeholder="0 (Optional)"
                    value={taskForm.bountyAmount}
                    onChange={(e) => setTaskForm({ ...taskForm, bountyAmount: e.target.value })}
                    style={{
                      width: "100%", padding: "10px", borderRadius: "10px",
                      border: "1px solid var(--border)", background: "var(--surface-2)",
                      color: "var(--text-primary)", outline: "none", boxSizing: "border-box"
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{
                    padding: "9px 18px", background: "var(--surface-2)", border: "1px solid var(--border)",
                    borderRadius: "10px", color: "var(--text-secondary)", cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !taskForm.title.trim()}
                  style={{
                    padding: "9px 20px", background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                    color: "#fff", border: "none", borderRadius: "10px", fontWeight: "700",
                    cursor: submitting ? "not-allowed" : "pointer",
                  }}
                >
                  {submitting ? "Adding..." : "Add Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task Bounty Escrow Modal */}
      {bountyModalTask && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.7)",
          backdropFilter: "blur(5px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
          zIndex: 100,
        }}>
          <div style={{
            maxWidth: "460px",
            width: "100%",
            background: "var(--surface)",
            borderRadius: "18px",
            border: "1px solid var(--border)",
            padding: "26px",
            boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "24px" }}>💰</span>
                <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: "700" }}>Task Bounty & Escrow</h3>
              </div>
              <button
                onClick={() => setBountyModalTask(null)}
                style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "1.2rem" }}
              >
                ✕
              </button>
            </div>

            <p style={{ margin: "0 0 16px 0", fontSize: "0.88rem", color: "var(--text-primary)", fontWeight: "600" }}>
              {bountyModalTask.title}
            </p>

            {bountyModalTask.bounty?.amount > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div style={{
                  padding: "16px",
                  background: "var(--surface-2)",
                  borderRadius: "12px",
                  border: "1px solid var(--border)",
                  textAlign: "center"
                }}>
                  <div style={{ fontSize: "2rem", fontWeight: "800", color: "#ec4899" }}>
                    ${bountyModalTask.bounty.amount} {bountyModalTask.bounty.currency}
                  </div>
                  <div style={{
                    display: "inline-block",
                    padding: "3px 10px",
                    borderRadius: "12px",
                    background: bountyModalTask.bounty.status === "Released" ? "rgba(16, 185, 129, 0.2)" : "rgba(236, 72, 153, 0.2)",
                    color: bountyModalTask.bounty.status === "Released" ? "#34d399" : "#f472b6",
                    fontSize: "0.75rem",
                    fontWeight: "700",
                    marginTop: "6px"
                  }}>
                    Status: {bountyModalTask.bounty.status}
                  </div>
                  {bountyModalTask.bounty.funder && (
                    <p style={{ margin: "8px 0 0 0", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                      Funded by {bountyModalTask.bounty.funder.name || "Project Sponsor"}
                    </p>
                  )}
                </div>

                {/* Actions depending on status */}
                {bountyModalTask.bounty.status === "Funded" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--text-muted)" }}>
                      Complete this task and verify acceptance to claim this bounty reward.
                    </p>
                    <button
                      onClick={() => handleClaimBounty(bountyModalTask)}
                      style={{
                        padding: "10px",
                        background: "linear-gradient(135deg, #10b981, #06b6d4)",
                        border: "none",
                        color: "#fff",
                        borderRadius: "10px",
                        fontWeight: "700",
                        cursor: "pointer"
                      }}
                    >
                      🎯 Claim Bounty as Assignee
                    </button>
                  </div>
                )}

                {bountyModalTask.bounty.status === "Claimed" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--text-muted)" }}>
                      Claimed by {bountyModalTask.bounty.claimer?.name || "Developer"}. Sponsor can now release funds.
                    </p>
                    <button
                      onClick={() => handleReleaseBounty(bountyModalTask)}
                      style={{
                        padding: "10px",
                        background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                        border: "none",
                        color: "#fff",
                        borderRadius: "10px",
                        fontWeight: "700",
                        cursor: "pointer"
                      }}
                    >
                      🤝 Verify & Release Escrow Funds
                    </button>
                  </div>
                )}

                {bountyModalTask.bounty.status === "Released" && (
                  <div style={{
                    padding: "10px",
                    background: "rgba(16, 185, 129, 0.15)",
                    border: "1px solid rgba(16, 185, 129, 0.3)",
                    borderRadius: "8px",
                    color: "#34d399",
                    fontSize: "0.85rem",
                    textAlign: "center"
                  }}>
                    ✓ Bounty verified and successfully released!
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-muted)" }}>
                  Fund this task with an escrow reward to accelerate delivery and reward contributors.
                </p>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "4px" }}>
                    Bounty Reward Amount ($ USD)
                  </label>
                  <input
                    type="number"
                    min="10"
                    step="10"
                    value={bountyAmountInput}
                    onChange={(e) => setBountyAmountInput(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      background: "var(--surface-2)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      color: "var(--text-primary)",
                      outline: "none",
                      boxSizing: "border-box"
                    }}
                  />
                </div>
                <button
                  onClick={handleFundBounty}
                  style={{
                    marginTop: "6px",
                    padding: "11px",
                    background: "linear-gradient(135deg, #ec4899, #8b5cf6)",
                    border: "none",
                    color: "#fff",
                    borderRadius: "10px",
                    fontWeight: "700",
                    cursor: "pointer"
                  }}
                >
                  Deposit & Fund Bounty 💰
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

