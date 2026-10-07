export default function GitHubLiveFeed({ githubData, loading, error, rawUrl }) {
  if (loading) {
    return (
      <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)", background: "var(--surface)", borderRadius: "16px", border: "1px solid var(--border)" }}>
        Fetching live repository stats from GitHub...
      </div>
    );
  }

  if (error || !githubData) {
    return (
      <div style={{
        padding: "2rem", textAlign: "center", background: "var(--surface)",
        borderRadius: "16px", border: "1px solid var(--border)",
      }}>
        <p style={{ margin: "0 0 8px", fontSize: "1.5rem" }}>🐙</p>
        <p style={{ margin: "0 0 12px", color: "var(--text-secondary)", fontSize: "0.9rem" }}>
          {error || "No GitHub repository linked to this project."}
        </p>
        {rawUrl && (
          rawUrl.toLowerCase().includes("github.com") ? (
            <a
              href={rawUrl} target="_blank" rel="noopener noreferrer"
              style={{ color: "var(--primary)", fontWeight: "700", textDecoration: "none", fontSize: "0.88rem" }}
            >
              Visit Repository on GitHub →
            </a>
          ) : (
            <div style={{ marginTop: "12px", padding: "12px", background: "rgba(245, 158, 11, 0.1)", borderRadius: "10px", border: "1px solid rgba(245, 158, 11, 0.25)" }}>
              <p style={{ margin: "0 0 6px", fontSize: "0.86rem", color: "#f59e0b", fontWeight: "600" }}>
                ⚠️ Saved link is not a GitHub repository:
              </p>
              <a
                href={rawUrl} target="_blank" rel="noopener noreferrer"
                style={{ color: "var(--text-primary)", fontSize: "0.82rem", wordBreak: "break-all" }}
              >
                {rawUrl} ↗
              </a>
              <p style={{ margin: "8px 0 0", color: "var(--text-muted)", fontSize: "0.8rem" }}>
                Click "Edit Project" and update the GitHub URL to: <code>https://github.com/owner/repository</code>
              </p>
            </div>
          )
        )}
      </div>
    );
  }

  const { name, fullName, description, stars, forks, openIssues, language, htmlUrl, defaultBranch, recentCommits = [], languages = {} } = githubData;

  // Language calculations
  const totalLangBytes = Object.values(languages).reduce((a, b) => a + b, 0);
  const topLanguages = Object.entries(languages)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([lang, bytes]) => ({
      name: lang,
      percentage: totalLangBytes > 0 ? Math.round((bytes / totalLangBytes) * 100) : 0,
    }));

  return (
    <div style={{
      background: "var(--surface)",
      borderRadius: "18px",
      border: "1px solid var(--border)",
      padding: "1.75rem",
      display: "flex",
      flexDirection: "column",
      gap: "20px",
      boxShadow: "var(--shadow)",
    }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <span style={{ fontSize: "1.3rem" }}>🐙</span>
            <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: "800", color: "var(--text-primary)" }}>
              {fullName || name}
            </h3>
          </div>
          <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-secondary)" }}>
            {description}
          </p>
        </div>

        <a
          href={htmlUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            padding: "8px 16px",
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            color: "var(--text-primary)",
            fontWeight: "700",
            fontSize: "0.82rem",
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          View on GitHub ↗
        </a>
      </div>

      {/* Stats Counter Bar */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
        gap: "10px",
      }}>
        <div style={{ padding: "12px", background: "var(--surface-2)", borderRadius: "10px", border: "1px solid var(--border)", textAlign: "center" }}>
          <div style={{ fontSize: "1.2rem", fontWeight: "800", color: "#fbbf24" }}>⭐ {stars}</div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>Stars</div>
        </div>
        <div style={{ padding: "12px", background: "var(--surface-2)", borderRadius: "10px", border: "1px solid var(--border)", textAlign: "center" }}>
          <div style={{ fontSize: "1.2rem", fontWeight: "800", color: "#818cf8" }}>🍴 {forks}</div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>Forks</div>
        </div>
        <div style={{ padding: "12px", background: "var(--surface-2)", borderRadius: "10px", border: "1px solid var(--border)", textAlign: "center" }}>
          <div style={{ fontSize: "1.2rem", fontWeight: "800", color: "#34d399" }}>⚠️ {openIssues}</div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>Open Issues</div>
        </div>
        <div style={{ padding: "12px", background: "var(--surface-2)", borderRadius: "10px", border: "1px solid var(--border)", textAlign: "center" }}>
          <div style={{ fontSize: "1.2rem", fontWeight: "800", color: "#06b6d4" }}>🌿 {defaultBranch}</div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>Branch</div>
        </div>
      </div>

      {/* Languages Breakdown */}
      {topLanguages.length > 0 && (
        <div>
          <div style={{ fontSize: "0.82rem", fontWeight: "700", color: "var(--text-muted)", marginBottom: "8px" }}>
            Codebase Languages Breakdown
          </div>
          <div style={{ display: "flex", height: "8px", borderRadius: "4px", overflow: "hidden", gap: "2px" }}>
            {topLanguages.map((l, idx) => {
              const colors = ["#6366f1", "#06b6d4", "#f59e0b", "#10b981"];
              return (
                <div
                  key={l.name}
                  style={{
                    width: `${l.percentage}%`,
                    background: colors[idx % colors.length],
                  }}
                  title={`${l.name}: ${l.percentage}%`}
                />
              );
            })}
          </div>
          <div style={{ display: "flex", gap: "14px", marginTop: "8px", flexWrap: "wrap", fontSize: "0.78rem" }}>
            {topLanguages.map((l, idx) => {
              const colors = ["#6366f1", "#06b6d4", "#f59e0b", "#10b981"];
              return (
                <span key={l.name} style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-secondary)" }}>
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: colors[idx % colors.length] }} />
                  {l.name} ({l.percentage}%)
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Commits Feed */}
      <div>
        <div style={{ fontSize: "0.88rem", fontWeight: "700", color: "var(--text-primary)", marginBottom: "10px", display: "flex", alignItems: "center", gap: "6px" }}>
          <span>📜</span> Recent Commit History
        </div>

        {recentCommits.length === 0 ? (
          <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--text-muted)" }}>No recent commits recorded.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {recentCommits.map((c, i) => (
              <div
                key={c.sha || i}
                style={{
                  padding: "10px 14px",
                  background: "var(--surface-2)",
                  borderRadius: "10px",
                  border: "1px solid var(--border)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "8px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, minWidth: "220px" }}>
                  <span style={{
                    fontFamily: "monospace",
                    fontSize: "0.75rem",
                    padding: "2px 6px",
                    background: "var(--surface)",
                    borderRadius: "4px",
                    color: "var(--primary)",
                    border: "1px solid var(--border)",
                  }}>
                    {c.sha}
                  </span>
                  <span style={{ fontSize: "0.88rem", fontWeight: "600", color: "var(--text-primary)" }}>
                    {c.message}
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "0.78rem", color: "var(--text-muted)" }}>
                  <span>{c.author}</span>
                  {c.date && <span>{new Date(c.date).toLocaleDateString()}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
