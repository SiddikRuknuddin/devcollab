import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Home() {
  const { isAuthenticated } = useAuth();

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "3rem 1.5rem", textAlign: "center" }}>
      {/* Hero Section */}
      <div style={{ marginBottom: "3.5rem" }}>
        <span
          style={{
            display: "inline-block",
            padding: "0.35rem 0.9rem",
            backgroundColor: "#eff6ff",
            color: "#2563eb",
            borderRadius: "9999px",
            fontSize: "0.85rem",
            fontWeight: 600,
            marginBottom: "1.25rem",
            border: "1px solid #dbeafe",
          }}
        >
          🚀 The Developer Collaboration Platform
        </span>

        <h1
          style={{
            fontSize: "clamp(2rem, 5vw, 3.25rem)",
            fontWeight: "800",
            color: "#111827",
            lineHeight: 1.15,
            margin: "0 0 1rem 0",
            letterSpacing: "-0.02em",
          }}
        >
          Build Projects, Find Teammates, <br />
          <span style={{ color: "#2563eb" }}>Grow Together.</span>
        </h1>

        <p
          style={{
            fontSize: "clamp(1rem, 2vw, 1.2rem)",
            color: "#4b5563",
            maxWidth: "700px",
            margin: "0 auto 2rem auto",
            lineHeight: 1.6,
          }}
        >
          DevCollab connects developers across the globe. Share projects, discover talent,
          collaborate in real-time, inspect GitHub repositories, and participate in community discussions.
        </p>

        {/* Action Buttons */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "1rem",
            flexWrap: "wrap",
          }}
        >
          {isAuthenticated ? (
            <>
              <Link
                to="/dashboard"
                style={{
                  padding: "0.75rem 1.75rem",
                  backgroundColor: "#2563eb",
                  color: "white",
                  borderRadius: "8px",
                  textDecoration: "none",
                  fontWeight: 600,
                  fontSize: "1rem",
                  boxShadow: "0 4px 6px -1px rgba(37,99,235,0.2)",
                }}
              >
                Go to Dashboard →
              </Link>
              <Link
                to="/projects"
                style={{
                  padding: "0.75rem 1.75rem",
                  backgroundColor: "#ffffff",
                  color: "#374151",
                  borderRadius: "8px",
                  textDecoration: "none",
                  fontWeight: 600,
                  fontSize: "1rem",
                  border: "1px solid #d1d5db",
                }}
              >
                View Projects
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/register"
                style={{
                  padding: "0.75rem 1.75rem",
                  backgroundColor: "#2563eb",
                  color: "white",
                  borderRadius: "8px",
                  textDecoration: "none",
                  fontWeight: 600,
                  fontSize: "1rem",
                  boxShadow: "0 4px 6px -1px rgba(37,99,235,0.2)",
                }}
              >
                Get Started Free →
              </Link>
              <Link
                to="/login"
                style={{
                  padding: "0.75rem 1.75rem",
                  backgroundColor: "#ffffff",
                  color: "#374151",
                  borderRadius: "8px",
                  textDecoration: "none",
                  fontWeight: 600,
                  fontSize: "1rem",
                  border: "1px solid #d1d5db",
                }}
              >
                Sign In
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Feature Highlights Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "1.5rem",
          textAlign: "left",
          marginBottom: "3rem",
        }}
      >
        {/* Card 1 */}
        <div
          style={{
            padding: "1.5rem",
            backgroundColor: "#ffffff",
            borderRadius: "10px",
            border: "1px solid #e5e7eb",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          }}
        >
          <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>💻</div>
          <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "1.1rem", color: "#111827" }}>
            Project Management
          </h3>
          <p style={{ margin: 0, color: "#6b7280", fontSize: "0.9rem", lineHeight: 1.5 }}>
            Create projects, organize tech stacks, track planning to completion, and invite developers.
          </p>
        </div>

        {/* Card 2 */}
        <div
          style={{
            padding: "1.5rem",
            backgroundColor: "#ffffff",
            borderRadius: "10px",
            border: "1px solid #e5e7eb",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          }}
        >
          <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>🐙</div>
          <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "1.1rem", color: "#111827" }}>
            GitHub Integration
          </h3>
          <p style={{ margin: 0, color: "#6b7280", fontSize: "0.9rem", lineHeight: 1.5 }}>
            Link public GitHub repositories to display live star counts, forks, open issues, and languages.
          </p>
        </div>

        {/* Card 3 */}
        <div
          style={{
            padding: "1.5rem",
            backgroundColor: "#ffffff",
            borderRadius: "10px",
            border: "1px solid #e5e7eb",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          }}
        >
          <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>💬</div>
          <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "1.1rem", color: "#111827" }}>
            Community Discussions
          </h3>
          <p style={{ margin: 0, color: "#6b7280", fontSize: "0.9rem", lineHeight: 1.5 }}>
            Engage with fellow developers across topics, ask questions, share insights, and get instant notifications.
          </p>
        </div>

        {/* Card 4 */}
        <div
          style={{
            padding: "1.5rem",
            backgroundColor: "#ffffff",
            borderRadius: "10px",
            border: "1px solid #e5e7eb",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          }}
        >
          <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>👥</div>
          <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "1.1rem", color: "#111827" }}>
            Developer Directory
          </h3>
          <p style={{ margin: 0, color: "#6b7280", fontSize: "0.9rem", lineHeight: 1.5 }}>
            Search developers by skills, location, or name to find the right teammates for your next build.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Home;