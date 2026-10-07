import { useState, useRef } from "react";
import api from "../services/api";

const SAMPLE_CODES = {
  vulnerable: `// Sample 1: SQL Injection & Secret Exposure
const express = require('express');
const app = express();
const API_SECRET = "sk_live_9817294817293847129";

app.get('/api/users', async (req, res) => {
  const query = "SELECT * FROM users WHERE role = '" + req.query.role + "'";
  const results = await db.query(query);
  
  // Potential XSS
  document.getElementById("output").innerHTML = req.query.role;
  res.json(results);
});`,

  unoptimized: `// Sample 2: Async in forEach & O(N^2) Nested Iteration
async function syncTeamMembers(userIds, allProjects) {
  const synced = [];
  
  // Anti-pattern: forEach with async
  userIds.forEach(async (id) => {
    // Nested search: O(N * M)
    for (let i = 0; i < allProjects.length; i++) {
      if (allProjects[i].owner === id) {
        synced.push(allProjects[i]);
      }
    }
  });

  return synced;
}`,

  secured: `// Sample 3: Secured, Parameterized & Robust
const express = require('express');
const app = express();

app.get('/api/users', async (req, res) => {
  try {
    const role = req.query.role;
    // Parameterized query prevents SQL injection
    const results = await db.query('SELECT id, name, email FROM users WHERE role = $1', [role]);
    res.status(200).json({ success: true, data: results });
  } catch (error) {
    console.error("Database query error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});`
};

export default function AICodeReviewer() {
  const [code, setCode] = useState(SAMPLE_CODES.vulnerable);
  const [language, setLanguage] = useState("javascript");
  const [loading, setLoading] = useState(false);
  const [review, setReview] = useState(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("analysis"); // analysis | refactored
  const [loadedFileName, setLoadedFileName] = useState("");
  const fileInputRef = useRef(null);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError("File is too large (max 2MB for code review).");
      return;
    }

    const ext = file.name.split(".").pop().toLowerCase();
    const langMap = {
      js: "javascript",
      jsx: "javascript",
      mjs: "javascript",
      cjs: "javascript",
      ts: "typescript",
      tsx: "typescript",
      py: "python",
      sql: "sql",
      html: "html",
      css: "html",
      go: "go",
      java: "java",
      cpp: "cpp",
      cc: "cpp",
      c: "cpp",
      h: "cpp",
      hpp: "cpp",
    };

    if (langMap[ext]) {
      setLanguage(langMap[ext]);
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === "string") {
        setCode(content);
        setLoadedFileName(file.name);
        setError(null);
      }
    };
    reader.onerror = () => {
      setError("Failed to read file.");
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleReview = async () => {
    if (!code || !code.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.post("/api/ai/code-review", { code, language });
      if (res.data?.success && res.data?.review) {
        setReview(res.data.review);
      } else {
        setError("Unable to complete code analysis. Please try again.");
      }
    } catch (err) {
      console.error("AI Review error:", err);
      setError(err.response?.data?.message || "Failed to scan code. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getScoreColor = (score) => {
    if (score >= 80) return "#10b981";
    if (score >= 50) return "#f59e0b";
    return "#ef4444";
  };

  const getSeverityStyle = (sev) => {
    switch (sev?.toLowerCase()) {
      case "critical":
        return { bg: "rgba(239, 68, 68, 0.15)", color: "#f87171", border: "rgba(239, 68, 68, 0.3)" };
      case "high":
        return { bg: "rgba(249, 115, 22, 0.15)", color: "#fb923c", border: "rgba(249, 115, 22, 0.3)" };
      case "medium":
        return { bg: "rgba(245, 158, 11, 0.15)", color: "#fbbf24", border: "rgba(245, 158, 11, 0.3)" };
      default:
        return { bg: "rgba(59, 130, 246, 0.15)", color: "#60a5fa", border: "rgba(59, 130, 246, 0.3)" };
    }
  };

  return (
    <div style={{
      background: "var(--surface)",
      borderRadius: "18px",
      border: "1px solid var(--border)",
      overflow: "hidden",
      boxShadow: "0 10px 30px rgba(0,0,0,0.25)"
    }}>
      {/* Header bar */}
      <div style={{
        padding: "16px 22px",
        background: "rgba(255,255,255,0.02)",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "12px"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: "36px",
            height: "36px",
            borderRadius: "10px",
            background: "linear-gradient(135deg, #6366f1, #ec4899)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "18px"
          }}>
            🛡️
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: "700", color: "var(--text-primary)" }}>
              AI Code Reviewer & Vulnerability Scanner
            </h3>
            <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-muted)" }}>
              Detect security flaws, SQLi, secrets leaks, and compute Big-O complexity
            </p>
          </div>
        </div>

        {/* Preset Selectors */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Load Sample:</span>
          <button
            onClick={() => { setCode(SAMPLE_CODES.vulnerable); setReview(null); }}
            style={{
              padding: "5px 10px",
              background: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.25)",
              color: "#f87171",
              borderRadius: "6px",
              fontSize: "0.75rem",
              cursor: "pointer"
            }}
          >
            SQLi / Leak
          </button>
          <button
            onClick={() => { setCode(SAMPLE_CODES.unoptimized); setReview(null); }}
            style={{
              padding: "5px 10px",
              background: "rgba(245, 158, 11, 0.1)",
              border: "1px solid rgba(245, 158, 11, 0.25)",
              color: "#fbbf24",
              borderRadius: "6px",
              fontSize: "0.75rem",
              cursor: "pointer"
            }}
          >
            O(N²) Async Smell
          </button>
          <button
            onClick={() => { setCode(SAMPLE_CODES.secured); setReview(null); }}
            style={{
              padding: "5px 10px",
              background: "rgba(16, 185, 129, 0.1)",
              border: "1px solid rgba(16, 185, 129, 0.25)",
              color: "#34d399",
              borderRadius: "6px",
              fontSize: "0.75rem",
              cursor: "pointer"
            }}
          >
            Clean Code
          </button>
        </div>
      </div>

      {/* Main split workbench */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
        gap: "0",
        minHeight: "520px"
      }}>
        {/* Left Column: Code Input */}
        <div style={{
          padding: "16px",
          borderRight: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          background: "#0b0f19"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Language:</span>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                style={{
                  padding: "4px 8px",
                  background: "var(--surface)",
                  color: "var(--text-primary)",
                  border: "1px solid var(--border)",
                  borderRadius: "6px",
                  fontSize: "0.8rem",
                  outline: "none"
                }}
              >
                <option value="javascript">JavaScript / Node.js</option>
                <option value="typescript">TypeScript</option>
                <option value="python">Python</option>
                <option value="sql">SQL</option>
                <option value="html">HTML / CSS</option>
                <option value="go">Go</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
              </select>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".js,.jsx,.ts,.tsx,.py,.sql,.html,.css,.go,.java,.cpp,.c,.h,.json,.md,.txt"
                style={{ display: "none" }}
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                  padding: "4px 10px",
                  background: "var(--surface-2)",
                  border: "1px solid var(--border)",
                  borderRadius: "6px",
                  color: "var(--text-primary)",
                  fontSize: "0.78rem",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
                title="Load code from a file on your computer (.js, .py, .ts, etc.)"
              >
                <span>📂</span> Upload File
              </button>

              {loadedFileName && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    background: "rgba(99, 102, 241, 0.15)",
                    color: "#818cf8",
                    padding: "3px 8px",
                    borderRadius: "6px",
                    fontSize: "0.75rem",
                    fontWeight: "600",
                    maxWidth: "160px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap"
                  }}
                  title={loadedFileName}
                >
                  📄 {loadedFileName}
                  <button
                    onClick={() => setLoadedFileName("")}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#818cf8",
                      cursor: "pointer",
                      fontSize: "10px",
                      padding: "0 2px"
                    }}
                  >
                    ✕
                  </button>
                </span>
              )}
            </div>

            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
              {code.split("\n").length} lines
            </span>
          </div>

          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Paste your source code or component logic here to audit..."
            style={{
              flex: 1,
              width: "100%",
              minHeight: "360px",
              background: "#080c14",
              color: "#e2e8f0",
              border: "1px solid var(--border)",
              borderRadius: "10px",
              padding: "14px",
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
              fontSize: "0.85rem",
              lineHeight: 1.5,
              resize: "vertical",
              outline: "none",
              boxSizing: "border-box"
            }}
          />

          <button
            onClick={handleReview}
            disabled={loading || !code.trim()}
            style={{
              padding: "12px 20px",
              background: loading ? "var(--surface)" : "linear-gradient(135deg, #6366f1, #8b5cf6)",
              color: "#fff",
              border: "none",
              borderRadius: "10px",
              fontWeight: "700",
              fontSize: "0.95rem",
              cursor: loading ? "wait" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              boxShadow: "0 4px 14px rgba(99, 102, 241, 0.35)",
              transition: "all 0.2s ease"
            }}
          >
            {loading ? (
              <>
                <span style={{ display: "inline-block", animation: "spin 1s linear infinite" }}>🔄</span>
                Scanning Code with AI Engine...
              </>
            ) : (
              <>
                <span>⚡</span> Run Deep Vulnerability & Complexity Scan
              </>
            )}
          </button>
        </div>

        {/* Right Column: AI Analysis Report */}
        <div style={{
          padding: "20px",
          background: "rgba(255,255,255,0.01)",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          overflowY: "auto",
          maxHeight: "620px"
        }}>
          {error && (
            <div style={{
              padding: "12px 16px",
              background: "rgba(239, 68, 68, 0.15)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              color: "#f87171",
              borderRadius: "10px",
              fontSize: "0.85rem"
            }}>
              ⚠️ {error}
            </div>
          )}

          {!review && !loading && !error && (
            <div style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              minHeight: "360px",
              color: "var(--text-muted)",
              textAlign: "center",
              padding: "30px"
            }}>
              <div style={{ fontSize: "42px", marginBottom: "12px", opacity: 0.8 }}>🔍</div>
              <h4 style={{ margin: "0 0 8px 0", color: "var(--text-primary)", fontSize: "1.1rem" }}>
                Ready to Analyze Your Code
              </h4>
              <p style={{ margin: 0, fontSize: "0.85rem", maxWidth: "340px", lineHeight: 1.5 }}>
                Click the scan button to evaluate SQL injection, XSS vectors, secret leaks, Big-O complexity, and generate hardened refactored code.
              </p>
            </div>
          )}

          {review && (
            <>
              {/* Score & Metrics Bar */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
                gap: "12px"
              }}>
                {/* Health Score */}
                <div style={{
                  padding: "14px",
                  background: "var(--surface)",
                  borderRadius: "12px",
                  border: "1px solid var(--border)",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px"
                }}>
                  <div style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.1rem",
                    fontWeight: "800",
                    color: "#fff",
                    background: getScoreColor(review.score),
                    boxShadow: `0 0 16px ${getScoreColor(review.score)}44`
                  }}>
                    {review.score}
                  </div>
                  <div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Health Score</div>
                    <div style={{ fontSize: "0.95rem", fontWeight: "700", color: getScoreColor(review.score) }}>
                      {review.status || (review.score >= 80 ? "Pass" : review.score >= 50 ? "Warning" : "Fail")}
                    </div>
                  </div>
                </div>

                {/* Big-O Complexity */}
                <div style={{
                  padding: "14px",
                  background: "var(--surface)",
                  borderRadius: "12px",
                  border: "1px solid var(--border)",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px"
                }}>
                  <div style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "10px",
                    background: "rgba(99, 102, 241, 0.15)",
                    border: "1px solid rgba(99, 102, 241, 0.3)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1rem"
                  }}>
                    ⏱️
                  </div>
                  <div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Time Complexity</div>
                    <div style={{ fontSize: "0.95rem", fontWeight: "700", color: "#818cf8" }}>
                      {review.timeComplexity || "O(N)"}
                    </div>
                  </div>
                </div>

                {/* Issue Count */}
                <div style={{
                  padding: "14px",
                  background: "var(--surface)",
                  borderRadius: "12px",
                  border: "1px solid var(--border)",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px"
                }}>
                  <div style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "10px",
                    background: review.vulnerabilities?.length > 0 ? "rgba(239, 68, 68, 0.15)" : "rgba(16, 185, 129, 0.15)",
                    border: review.vulnerabilities?.length > 0 ? "1px solid rgba(239, 68, 68, 0.3)" : "1px solid rgba(16, 185, 129, 0.3)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1rem"
                  }}>
                    {review.vulnerabilities?.length > 0 ? "⚠️" : "✅"}
                  </div>
                  <div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Issues Detected</div>
                    <div style={{ fontSize: "0.95rem", fontWeight: "700", color: review.vulnerabilities?.length > 0 ? "#f87171" : "#34d399" }}>
                      {review.vulnerabilities?.length || 0} Flaws
                    </div>
                  </div>
                </div>
              </div>

              {/* View Switcher: Analysis vs Refactored Code */}
              <div style={{
                display: "flex",
                gap: "8px",
                borderBottom: "1px solid var(--border)",
                paddingBottom: "8px"
              }}>
                <button
                  onClick={() => setActiveTab("analysis")}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "8px",
                    background: activeTab === "analysis" ? "rgba(99, 102, 241, 0.2)" : "transparent",
                    color: activeTab === "analysis" ? "#818cf8" : "var(--text-muted)",
                    border: activeTab === "analysis" ? "1px solid rgba(99, 102, 241, 0.4)" : "none",
                    fontWeight: "600",
                    fontSize: "0.85rem",
                    cursor: "pointer"
                  }}
                >
                  📊 Analysis & Flaws
                </button>
                <button
                  onClick={() => setActiveTab("refactored")}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "8px",
                    background: activeTab === "refactored" ? "rgba(99, 102, 241, 0.2)" : "transparent",
                    color: activeTab === "refactored" ? "#818cf8" : "var(--text-muted)",
                    border: activeTab === "refactored" ? "1px solid rgba(99, 102, 241, 0.4)" : "none",
                    fontWeight: "600",
                    fontSize: "0.85rem",
                    cursor: "pointer"
                  }}
                >
                  ✨ AI Refactored Code
                </button>
              </div>

              {activeTab === "analysis" ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  {/* Summary */}
                  {review.summary && (
                    <div style={{
                      padding: "14px 16px",
                      background: "rgba(99, 102, 241, 0.08)",
                      border: "1px solid rgba(99, 102, 241, 0.2)",
                      borderRadius: "10px",
                      fontSize: "0.85rem",
                      color: "var(--text-primary)",
                      lineHeight: 1.5
                    }}>
                      <strong>💡 AI Summary:</strong> {review.summary}
                    </div>
                  )}

                  {/* Vulnerabilities list */}
                  <div>
                    <h5 style={{ margin: "0 0 8px 0", fontSize: "0.9rem", color: "var(--text-primary)" }}>
                      Vulnerabilities & Security Warnings
                    </h5>
                    {review.vulnerabilities && review.vulnerabilities.length > 0 ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {review.vulnerabilities.map((v, idx) => {
                          const style = getSeverityStyle(v.severity);
                          return (
                            <div
                              key={idx}
                              style={{
                                padding: "12px 14px",
                                background: style.bg,
                                border: `1px solid ${style.border}`,
                                borderRadius: "8px",
                                display: "flex",
                                flexDirection: "column",
                                gap: "4px"
                              }}
                            >
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <span style={{ fontWeight: "700", color: style.color, fontSize: "0.85rem" }}>
                                  {v.type}
                                </span>
                                <span style={{
                                  padding: "2px 8px",
                                  borderRadius: "4px",
                                  background: style.border,
                                  color: style.color,
                                  fontSize: "0.7rem",
                                  fontWeight: "700",
                                  textTransform: "uppercase"
                                }}>
                                  {v.severity}
                                </span>
                              </div>
                              <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-muted)", lineHeight: 1.4 }}>
                                {v.message}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div style={{
                        padding: "12px",
                        borderRadius: "8px",
                        background: "rgba(16, 185, 129, 0.1)",
                        border: "1px solid rgba(16, 185, 129, 0.2)",
                        color: "#34d399",
                        fontSize: "0.85rem"
                      }}>
                        🎉 No severe vulnerabilities or common injection vectors detected!
                      </div>
                    )}
                  </div>

                  {/* Optimizations */}
                  {review.optimizations && review.optimizations.length > 0 && (
                    <div>
                      <h5 style={{ margin: "0 0 8px 0", fontSize: "0.9rem", color: "var(--text-primary)" }}>
                        Performance & Clean Code Suggestions
                      </h5>
                      <ul style={{ margin: 0, paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "6px" }}>
                        {review.optimizations.map((opt, i) => (
                          <li key={i} style={{ fontSize: "0.82rem", color: "var(--text-muted)", lineHeight: 1.4 }}>
                            {opt}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                /* Refactored Code View */
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                      Hardened & Optimized Recommendation
                    </span>
                    <button
                      onClick={() => handleCopy(review.refactoredCode || code)}
                      style={{
                        padding: "5px 12px",
                        background: copied ? "#10b981" : "var(--surface)",
                        color: copied ? "#fff" : "var(--text-primary)",
                        border: "1px solid var(--border)",
                        borderRadius: "6px",
                        fontSize: "0.75rem",
                        fontWeight: "600",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px"
                      }}
                    >
                      {copied ? "✓ Copied!" : "📋 Copy Code"}
                    </button>
                  </div>
                  <pre style={{
                    margin: 0,
                    padding: "14px",
                    background: "#080c14",
                    border: "1px solid var(--border)",
                    borderRadius: "10px",
                    color: "#34d399",
                    fontSize: "0.82rem",
                    lineHeight: 1.5,
                    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                    overflowX: "auto",
                    maxHeight: "360px"
                  }}>
                    <code>{review.refactoredCode || "// No refactored version generated"}</code>
                  </pre>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
