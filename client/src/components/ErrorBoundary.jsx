import React from "react";

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: "80vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
          background: "var(--bg, #0b0f19)",
          color: "var(--text-primary, #f8fafc)",
          fontFamily: "Inter, system-ui, sans-serif",
        }}>
          <div style={{
            maxWidth: "540px",
            width: "100%",
            background: "var(--surface, #1e293b)",
            border: "1px solid var(--border, #334155)",
            borderRadius: "16px",
            padding: "2rem",
            boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
            textAlign: "center",
          }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>⚠️</div>
            <h2 style={{ fontSize: "1.4rem", fontWeight: "800", marginBottom: "0.5rem" }}>
              Something went wrong
            </h2>
            <p style={{ color: "var(--text-secondary, #94a3b8)", fontSize: "0.95rem", lineHeight: 1.6, marginBottom: "1.5rem" }}>
              An unexpected error occurred while rendering this page. You can reload or return to the projects dashboard.
            </p>
            {this.state.error && (
              <pre style={{
                background: "rgba(0,0,0,0.3)",
                padding: "12px",
                borderRadius: "8px",
                fontSize: "0.78rem",
                color: "#f87171",
                textAlign: "left",
                overflowX: "auto",
                marginBottom: "1.5rem",
              }}>
                {this.state.error.message || String(this.state.error)}
              </pre>
            )}
            <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
              <button
                onClick={this.handleReset}
                style={{
                  padding: "10px 20px",
                  background: "var(--primary, #6366f1)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "10px",
                  fontWeight: "700",
                  cursor: "pointer",
                }}
              >
                Reload Page
              </button>
              <a
                href="/projects"
                style={{
                  padding: "10px 20px",
                  background: "var(--surface-2, #334155)",
                  color: "var(--text-primary, #f8fafc)",
                  textDecoration: "none",
                  borderRadius: "10px",
                  fontWeight: "700",
                  display: "inline-flex",
                  alignItems: "center",
                }}
              >
                Projects List
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
