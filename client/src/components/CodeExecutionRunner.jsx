import { useState } from "react";

const RUNNER_PRESETS = {
  algorithms: `// Algorithm Benchmark: Memoized Fibonacci & Performance
function fibonacci(n, memo = {}) {
  if (n in memo) return memo[n];
  if (n <= 1) return n;
  memo[n] = fibonacci(n - 1, memo) + fibonacci(n - 2, memo);
  return memo[n];
}

console.log("⚡ Calculating Fibonacci sequence...");
for (let i = 1; i <= 15; i++) {
  console.log(\`Fib(\${i}) = \${fibonacci(i)}\`);
}
console.log("✅ Computation completed cleanly!");
`,

  dataPipeline: `// Data Pipeline: Map, Filter, and Aggregate Team Metrics
const teamMembers = [
  { name: "Alice", role: "Frontend", points: 21, active: true },
  { name: "Bob", role: "Backend", points: 34, active: true },
  { name: "Charlie", role: "DevOps", points: 13, active: false },
  { name: "Dana", role: "Fullstack", points: 28, active: true },
];

console.log("📊 Active Team Members:");
const active = teamMembers.filter(m => m.active);
console.log(active);

const totalPoints = active.reduce((acc, m) => acc + m.points, 0);
console.log(\`🏆 Total Team Velocity Points: \${totalPoints} pts\`);
`,

  asyncMock: `// Async/Await Microtask Queue Simulation
async function simulateMicroserviceCall(serviceName, delayMs) {
  console.log(\`[DISPATCH] Calling \${serviceName} microservice...\`);
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ service: serviceName, status: 200, timestamp: Date.now() });
    }, delayMs);
  });
}

(async () => {
  console.log("🚀 Starting microservice orchestration...");
  const authRes = await simulateMicroserviceCall("AuthService", 100);
  console.log("✓ Auth Verified:", authRes);

  const billingRes = await simulateMicroserviceCall("StripeEscrow", 150);
  console.log("✓ Escrow Released:", billingRes);
  console.log("🎉 All downstream calls resolved.");
})();
`,
};

export default function CodeExecutionRunner() {
  const [code, setCode] = useState(RUNNER_PRESETS.algorithms);
  const [logs, setLogs] = useState([]);
  const [running, setRunning] = useState(false);
  const [metrics, setMetrics] = useState(null);

  const handleRun = () => {
    setRunning(true);
    const capturedLogs = [];
    const startTime = performance.now();

    // Intercept console.log
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    console.log = (...args) => {
      capturedLogs.push({
        type: "log",
        text: args.map((a) => (typeof a === "object" ? JSON.stringify(a, null, 2) : String(a))).join(" "),
      });
      originalLog.apply(console, args);
    };

    console.error = (...args) => {
      capturedLogs.push({
        type: "error",
        text: args.map((a) => (typeof a === "object" ? JSON.stringify(a, null, 2) : String(a))).join(" "),
      });
      originalError.apply(console, args);
    };

    console.warn = (...args) => {
      capturedLogs.push({
        type: "warn",
        text: args.map((a) => (typeof a === "object" ? JSON.stringify(a, null, 2) : String(a))).join(" "),
      });
      originalWarn.apply(console, args);
    };

    try {
      // Evaluate in safe local function scope
      const runFn = new Function(code);
      runFn();

      const duration = (performance.now() - startTime).toFixed(2);
      setMetrics({
        durationMs: duration,
        status: "Success",
        code: 0,
      });
    } catch (err) {
      capturedLogs.push({
        type: "error",
        text: `Runtime Exception: ${err.message}`,
      });
      const duration = (performance.now() - startTime).toFixed(2);
      setMetrics({
        durationMs: duration,
        status: "Runtime Error",
        code: 1,
      });
    } finally {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
      setLogs(capturedLogs);
      setRunning(false);
    }
  };

  const handleClear = () => {
    setLogs([]);
    setMetrics(null);
  };

  return (
    <div style={{
      background: "var(--surface)",
      borderRadius: "18px",
      border: "1px solid var(--border)",
      overflow: "hidden",
      boxShadow: "0 10px 30px rgba(0,0,0,0.25)"
    }}>
      {/* Top Header */}
      <div style={{
        padding: "14px 20px",
        background: "rgba(255,255,255,0.02)",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "10px"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: "36px",
            height: "36px",
            borderRadius: "10px",
            background: "linear-gradient(135deg, #f59e0b, #ef4444)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "18px"
          }}>
            ⚡
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: "700", color: "var(--text-primary)" }}>
              In-Browser Live Code Execution Runner
            </h3>
            <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-muted)" }}>
              Execute scripts instantly with stdout interception, timing benchmarks, and error diagnostics
            </p>
          </div>
        </div>

        {/* Presets */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Load Preset:</span>
          <button
            onClick={() => { setCode(RUNNER_PRESETS.algorithms); setLogs([]); setMetrics(null); }}
            style={{
              padding: "5px 10px",
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              color: "var(--text-primary)",
              borderRadius: "6px",
              fontSize: "0.75rem",
              cursor: "pointer"
            }}
          >
            Fibonacci Benchmark
          </button>
          <button
            onClick={() => { setCode(RUNNER_PRESETS.dataPipeline); setLogs([]); setMetrics(null); }}
            style={{
              padding: "5px 10px",
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              color: "var(--text-primary)",
              borderRadius: "6px",
              fontSize: "0.75rem",
              cursor: "pointer"
            }}
          >
            Data Pipeline
          </button>
          <button
            onClick={() => { setCode(RUNNER_PRESETS.asyncMock); setLogs([]); setMetrics(null); }}
            style={{
              padding: "5px 10px",
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              color: "var(--text-primary)",
              borderRadius: "6px",
              fontSize: "0.75rem",
              cursor: "pointer"
            }}
          >
            Async Orchestrator
          </button>
        </div>
      </div>

      {/* Main Split Interface */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
        minHeight: "480px"
      }}>
        {/* Left: Code Editor Input */}
        <div style={{
          padding: "16px",
          borderRight: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          background: "#080c14"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
              JavaScript Sandbox Buffer
            </span>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
              {code.split("\n").length} lines
            </span>
          </div>

          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            style={{
              flex: 1,
              width: "100%",
              minHeight: "340px",
              background: "#060910",
              color: "#f8fafc",
              border: "1px solid var(--border)",
              borderRadius: "10px",
              padding: "14px",
              fontFamily: "ui-monospace, SFMono-Regular, Consolas, monospace",
              fontSize: "0.85rem",
              lineHeight: 1.5,
              resize: "vertical",
              outline: "none",
              boxSizing: "border-box"
            }}
          />

          <button
            onClick={handleRun}
            disabled={running}
            style={{
              padding: "12px",
              background: "linear-gradient(135deg, #10b981, #06b6d4)",
              color: "#fff",
              border: "none",
              borderRadius: "10px",
              fontWeight: "700",
              fontSize: "0.95rem",
              cursor: running ? "wait" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              boxShadow: "0 4px 14px rgba(16, 185, 129, 0.3)"
            }}
          >
            <span>▶</span> Run Code Snippet
          </button>
        </div>

        {/* Right: Terminal Console Output */}
        <div style={{
          padding: "16px",
          background: "#060910",
          display: "flex",
          flexDirection: "column",
          gap: "10px"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "0.82rem", fontWeight: "700", color: "#94a3b8" }}>
                📟 Terminal stdout
              </span>
              {metrics && (
                <span style={{
                  fontSize: "0.72rem",
                  padding: "2px 8px",
                  borderRadius: "10px",
                  background: metrics.code === 0 ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.2)",
                  color: metrics.code === 0 ? "#34d399" : "#f87171",
                  fontWeight: "700"
                }}>
                  {metrics.status} ({metrics.durationMs}ms)
                </span>
              )}
            </div>

            <button
              onClick={handleClear}
              style={{
                padding: "4px 10px",
                background: "var(--surface)",
                border: "1px solid var(--border)",
                color: "var(--text-muted)",
                borderRadius: "6px",
                fontSize: "0.75rem",
                cursor: "pointer"
              }}
            >
              Clear Console
            </button>
          </div>

          {/* Terminal log output */}
          <div style={{
            flex: 1,
            background: "#03060b",
            borderRadius: "10px",
            border: "1px solid rgba(255,255,255,0.08)",
            padding: "14px",
            fontFamily: "ui-monospace, Consolas, monospace",
            fontSize: "0.82rem",
            lineHeight: 1.6,
            overflowY: "auto",
            maxHeight: "380px"
          }}>
            {logs.length === 0 ? (
              <div style={{ color: "rgba(255,255,255,0.3)", fontStyle: "italic" }}>
                $ Ready to execute. Click "Run Code Snippet" to view stdout output...
              </div>
            ) : (
              logs.map((log, idx) => (
                <div
                  key={idx}
                  style={{
                    color: log.type === "error" ? "#f87171" : log.type === "warn" ? "#fbbf24" : "#e2e8f0",
                    whiteSpace: "pre-wrap",
                    marginBottom: "4px"
                  }}
                >
                  {log.text}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
