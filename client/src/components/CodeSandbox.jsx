import { useState } from "react";

const STARTER_SNIPPETS = {
  web: `<!-- Interactive Live HTML/CSS/JS Web Sandbox -->
<div style="font-family: system-ui, sans-serif; text-align: center; padding: 40px; background: #0f172a; color: #f8fafc; border-radius: 12px;">
  <h2 style="color: #818cf8; margin-bottom: 8px;">🚀 DevCollab Code Sandbox</h2>
  <p style="color: #94a3b8; font-size: 14px;">Edit HTML & CSS on the left, watch live reload on the right!</p>
  <button id="counterBtn" style="padding: 10px 20px; background: #6366f1; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; margin-top: 12px;">
    Clicks: 0
  </button>
</div>

<script>
  let count = 0;
  const btn = document.getElementById('counterBtn');
  btn.addEventListener('click', () => {
    count++;
    btn.innerText = 'Clicks: ' + count;
    btn.style.transform = 'scale(1.05)';
    setTimeout(() => btn.style.transform = 'scale(1)', 150);
  });
</script>`,
  api: `// Async REST API Fetch Pattern
async function fetchDeveloperData(userId) {
  try {
    const response = await fetch(\`/api/users/developers/\${userId}\`);
    if (!response.ok) throw new Error("Developer not found");
    const data = await response.json();
    console.log("Developer Profile:", data.developer);
    return data.developer;
  } catch (error) {
    console.error("API Fetch Error:", error.message);
  }
}`,
  python: `# Python Fast Algorithm Snippet
def match_developers(project_skills, developer_pool):
    recommendations = []
    for dev in developer_pool:
        shared = set(project_skills).intersection(set(dev.get("skills", [])))
        score = len(shared) / max(len(project_skills), 1) * 100
        recommendations.append({"developer": dev["name"], "match": round(score)})
    return sorted(recommendations, key=lambda x: x["match"], reverse=True)
`,
};

export default function CodeSandbox() {
  const [code, setCode] = useState(STARTER_SNIPPETS.web);
  const [activeTab, setActiveTab] = useState("preview");
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      background: "var(--surface)",
      borderRadius: "18px",
      border: "1px solid var(--border)",
      overflow: "hidden",
      boxShadow: "var(--shadow)",
      display: "flex",
      flexDirection: "column",
    }}>
      {/* Top Bar */}
      <div style={{
        padding: "12px 1.25rem",
        background: "var(--surface-2)",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "10px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "1.1rem" }}>💻</span>
          <span style={{ fontWeight: "800", fontSize: "0.95rem", color: "var(--text-primary)" }}>
            Interactive Code Sandbox & Playground
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {/* Preset Buttons */}
          <div style={{ display: "flex", gap: "4px" }}>
            <button
              onClick={() => setCode(STARTER_SNIPPETS.web)}
              style={{ padding: "4px 10px", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text-secondary)", fontSize: "0.75rem", cursor: "pointer" }}
            >
              Web Sandbox
            </button>
            <button
              onClick={() => setCode(STARTER_SNIPPETS.api)}
              style={{ padding: "4px 10px", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text-secondary)", fontSize: "0.75rem", cursor: "pointer" }}
            >
              Async JS
            </button>
            <button
              onClick={() => setCode(STARTER_SNIPPETS.python)}
              style={{ padding: "4px 10px", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text-secondary)", fontSize: "0.75rem", cursor: "pointer" }}
            >
              Python
            </button>
          </div>

          <button
            onClick={handleCopy}
            style={{
              padding: "5px 12px", background: "var(--surface)", border: "1px solid var(--border)",
              borderRadius: "6px", color: copied ? "#34d399" : "var(--text-primary)", fontSize: "0.78rem",
              fontWeight: "700", cursor: "pointer",
            }}
          >
            {copied ? "✓ Copied!" : "📋 Copy"}
          </button>
        </div>
      </div>

      {/* Code Editor & Live Preview Split */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
        minHeight: "420px",
      }}>
        {/* Editor Area */}
        <div style={{
          borderRight: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          background: "#0b0f19",
        }}>
          <div style={{
            padding: "8px 14px",
            background: "#080c14",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            fontSize: "0.75rem",
            color: "#94a3b8",
            display: "flex",
            justifyContent: "space-between",
          }}>
            <span>Code Input</span>
            <span>Editable</span>
          </div>

          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            spellCheck="false"
            style={{
              flex: 1,
              width: "100%",
              padding: "14px",
              background: "transparent",
              color: "#e2e8f0",
              fontFamily: "monospace",
              fontSize: "0.85rem",
              lineHeight: 1.5,
              border: "none",
              outline: "none",
              resize: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Live Output Sandbox */}
        <div style={{ display: "flex", flexDirection: "column", background: "var(--surface)" }}>
          <div style={{
            padding: "8px 14px",
            background: "var(--surface-2)",
            borderBottom: "1px solid var(--border)",
            fontSize: "0.75rem",
            color: "var(--text-muted)",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#10b981" }} />
            Live Preview Output
          </div>

          <iframe
            srcDoc={code}
            title="Sandbox Live Output"
            sandbox="allow-scripts"
            style={{
              flex: 1,
              width: "100%",
              height: "100%",
              border: "none",
              background: "#020617",
            }}
          />
        </div>
      </div>
    </div>
  );
}
