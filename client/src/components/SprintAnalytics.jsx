import { useEffect, useState } from "react";
import api from "../services/api";

export default function SprintAnalytics({ projectId }) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/api/tasks/project/${projectId}/analytics`);
      if (res.data?.success) {
        setAnalytics(res.data.analytics);
      }
    } catch (err) {
      console.error("Fetch sprint analytics error:", err);
      setError("Unable to compute velocity metrics for this project.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) fetchAnalytics();
  }, [projectId]);

  if (loading) {
    return (
      <div style={{
        padding: "40px",
        textAlign: "center",
        background: "var(--surface)",
        borderRadius: "18px",
        border: "1px solid var(--border)",
        color: "var(--text-muted)"
      }}>
        Calculating sprint velocity & burndown trajectory...
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div style={{
        padding: "30px",
        textAlign: "center",
        background: "var(--surface)",
        borderRadius: "18px",
        border: "1px solid var(--border)",
        color: "#f87171"
      }}>
        ⚠️ {error || "No task data available to calculate burndown."}
      </div>
    );
  }

  const {
    totalTasks,
    completedCount,
    inProgressCount,
    todoCount,
    totalPoints,
    completedPoints,
    remainingPoints,
    completionRate,
    burndownTimeline = [],
    memberVelocity = [],
    totalBountiesAmount,
    bountyCount,
  } = analytics;

  // SVG Chart Dimensions
  const chartWidth = 700;
  const chartHeight = 240;
  const padding = { top: 20, right: 30, bottom: 40, left: 40 };
  const graphWidth = chartWidth - padding.left - padding.right;
  const graphHeight = chartHeight - padding.top - padding.bottom;

  const maxPoints = Math.max(totalPoints, 1);
  const nPoints = Math.max(burndownTimeline.length - 1, 1);

  // Generate SVG path for actual points
  const actualPath = burndownTimeline
    .map((item, idx) => {
      const x = padding.left + (idx / nPoints) * graphWidth;
      const y = padding.top + graphHeight - (item.actual / maxPoints) * graphHeight;
      return `${idx === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  // Generate SVG path for ideal points
  const idealPath = burndownTimeline
    .map((item, idx) => {
      const x = padding.left + (idx / nPoints) * graphWidth;
      const y = padding.top + graphHeight - (item.ideal / maxPoints) * graphHeight;
      return `${idx === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Top KPI row */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: "14px"
      }}>
        <div style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "16px",
          padding: "18px 20px"
        }}>
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "4px" }}>
            Total Scope (Points)
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: "800", color: "#6366f1" }}>
            {totalPoints} <span style={{ fontSize: "0.85rem", fontWeight: "500", color: "var(--text-muted)" }}>pts ({totalTasks} tasks)</span>
          </div>
        </div>

        <div style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "16px",
          padding: "18px 20px"
        }}>
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "4px" }}>
            Delivered Velocity
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: "800", color: "#10b981" }}>
            {completedPoints} <span style={{ fontSize: "0.85rem", fontWeight: "500", color: "var(--text-muted)" }}>pts ({completionRate}%)</span>
          </div>
        </div>

        <div style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "16px",
          padding: "18px 20px"
        }}>
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "4px" }}>
            Remaining In-Flight
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: "800", color: "#f59e0b" }}>
            {remainingPoints} <span style={{ fontSize: "0.85rem", fontWeight: "500", color: "var(--text-muted)" }}>pts</span>
          </div>
        </div>

        <div style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "16px",
          padding: "18px 20px"
        }}>
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "4px" }}>
            Task Bounties Escrow
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: "800", color: "#ec4899" }}>
            ${totalBountiesAmount} <span style={{ fontSize: "0.85rem", fontWeight: "500", color: "var(--text-muted)" }}>({bountyCount} bounties)</span>
          </div>
        </div>
      </div>

      {/* Main Burndown Chart Card */}
      <div style={{
        background: "var(--surface)",
        borderRadius: "18px",
        border: "1px solid var(--border)",
        padding: "24px",
        boxShadow: "0 8px 30px rgba(0,0,0,0.2)"
      }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "18px",
          flexWrap: "wrap",
          gap: "10px"
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "700", color: "var(--text-primary)" }}>
              📉 Sprint Velocity Burndown
            </h3>
            <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--text-muted)" }}>
              Real-time scope remaining vs. ideal linear pace
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "16px", fontSize: "0.8rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: "12px", height: "3px", background: "#6366f1", borderRadius: "2px" }} />
              <span style={{ color: "var(--text-secondary)" }}>Actual Remaining</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: "12px", height: "3px", background: "#64748b", borderTop: "1px dashed #94a3b8" }} />
              <span style={{ color: "var(--text-muted)" }}>Ideal Burndown</span>
            </div>
          </div>
        </div>

        {/* SVG Container */}
        <div style={{ width: "100%", overflowX: "auto" }}>
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            style={{ width: "100%", height: "auto", minWidth: "500px", display: "block" }}
          >
            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
              const y = padding.top + graphHeight * (1 - ratio);
              return (
                <g key={i}>
                  <line
                    x1={padding.left}
                    y1={y}
                    x2={chartWidth - padding.right}
                    y2={y}
                    stroke="rgba(255,255,255,0.06)"
                    strokeWidth="1"
                  />
                  <text
                    x={padding.left - 8}
                    y={y + 4}
                    textAnchor="end"
                    fill="var(--text-muted)"
                    fontSize="10"
                    fontFamily="monospace"
                  >
                    {Math.round(ratio * maxPoints)}
                  </text>
                </g>
              );
            })}

            {/* Ideal dashed line */}
            <path
              d={idealPath}
              fill="none"
              stroke="#64748b"
              strokeWidth="2"
              strokeDasharray="4 4"
            />

            {/* Actual solid line */}
            <path
              d={actualPath}
              fill="none"
              stroke="#6366f1"
              strokeWidth="3.5"
              strokeLinecap="round"
            />

            {/* Data points */}
            {burndownTimeline.map((item, idx) => {
              const cx = padding.left + (idx / nPoints) * graphWidth;
              const cy = padding.top + graphHeight - (item.actual / maxPoints) * graphHeight;
              return (
                <g key={idx}>
                  <circle
                    cx={cx}
                    cy={cy}
                    r="4"
                    fill="#6366f1"
                    stroke="#fff"
                    strokeWidth="2"
                  />
                  {/* Date labels */}
                  <text
                    x={cx}
                    y={chartHeight - 12}
                    textAnchor="middle"
                    fill="var(--text-muted)"
                    fontSize="10"
                    fontFamily="monospace"
                  >
                    {item.date}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Split section: Member velocity & Task Distribution */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
        gap: "18px"
      }}>
        {/* Member Velocity Table */}
        <div style={{
          background: "var(--surface)",
          borderRadius: "18px",
          border: "1px solid var(--border)",
          padding: "22px"
        }}>
          <h4 style={{ margin: "0 0 14px 0", fontSize: "0.95rem", fontWeight: "700" }}>
            👥 Team Velocity & Throughput
          </h4>

          {memberVelocity.length === 0 ? (
            <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
              Assign tasks to team members to track personal velocity.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {memberVelocity.map((m, idx) => {
                const pct = totalPoints > 0 ? Math.round((m.completedPoints / totalPoints) * 100) : 0;
                return (
                  <div
                    key={idx}
                    style={{
                      padding: "12px 14px",
                      background: "var(--surface-2)",
                      borderRadius: "10px",
                      border: "1px solid var(--border)"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={{
                          width: "28px",
                          height: "28px",
                          borderRadius: "50%",
                          background: m.user.profileImage ? `url(${m.user.profileImage}) center/cover` : "#6366f1",
                          color: "#fff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "12px",
                          fontWeight: "700"
                        }}>
                          {!m.user.profileImage && (m.user.name?.[0] || "U")}
                        </div>
                        <span style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--text-primary)" }}>
                          {m.user.name}
                        </span>
                      </div>

                      <span style={{ fontSize: "0.8rem", color: "#10b981", fontWeight: "700" }}>
                        {m.completedPoints} pts ({m.completedTasks} done)
                      </span>
                    </div>

                    <div style={{ height: "5px", background: "var(--surface)", borderRadius: "4px", overflow: "hidden" }}>
                      <div style={{ width: `${pct}%`, height: "100%", background: "#6366f1", borderRadius: "4px" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Task Column Distribution */}
        <div style={{
          background: "var(--surface)",
          borderRadius: "18px",
          border: "1px solid var(--border)",
          padding: "22px"
        }}>
          <h4 style={{ margin: "0 0 14px 0", fontSize: "0.95rem", fontWeight: "700" }}>
            📊 Workflow Scope Balance
          </h4>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {[
              { label: "Done & Verified", count: completedCount, color: "#10b981", bg: "rgba(16, 185, 129, 0.15)" },
              { label: "In Progress / Review", count: inProgressCount, color: "#6366f1", bg: "rgba(99, 102, 241, 0.15)" },
              { label: "To Do Backlog", count: todoCount, color: "#f59e0b", bg: "rgba(245, 158, 11, 0.15)" },
            ].map((col, i) => {
              const colPct = totalTasks > 0 ? Math.round((col.count / totalTasks) * 100) : 0;
              return (
                <div key={i} style={{ padding: "12px", borderRadius: "10px", background: col.bg, border: `1px solid ${col.color}33` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <span style={{ fontSize: "0.85rem", fontWeight: "600", color: col.color }}>{col.label}</span>
                    <span style={{ fontSize: "0.82rem", fontWeight: "700", color: col.color }}>
                      {col.count} tasks ({colPct}%)
                    </span>
                  </div>
                  <div style={{ height: "6px", background: "rgba(0,0,0,0.3)", borderRadius: "4px", overflow: "hidden" }}>
                    <div style={{ width: `${colPct}%`, height: "100%", background: col.color, borderRadius: "4px" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
