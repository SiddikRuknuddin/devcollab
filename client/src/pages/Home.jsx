import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

const features = [
  {
    icon: "💻",
    title: "Project Management",
    desc: "Create projects, organize tech stacks, track planning to completion, and invite developers.",
    color: "#6366f1",
    glow: "rgba(99,102,241,0.15)",
  },
  {
    icon: "🐙",
    title: "GitHub Integration",
    desc: "Link public GitHub repositories to display live star counts, forks, open issues, and languages.",
    color: "#8b5cf6",
    glow: "rgba(139,92,246,0.15)",
  },
  {
    icon: "💬",
    title: "Community Discussions",
    desc: "Engage with fellow developers across topics, ask questions, share insights, and get instant notifications.",
    color: "#06b6d4",
    glow: "rgba(6,182,212,0.15)",
  },
  {
    icon: "👥",
    title: "Developer Directory",
    desc: "Search developers by skills, location, or name to find the right teammates for your next build.",
    color: "#ec4899",
    glow: "rgba(236,72,153,0.15)",
  },
];

const stats = [
  { value: "10K+", label: "Developers" },
  { value: "3K+", label: "Projects" },
  { value: "50K+", label: "Discussions" },
  { value: "99%", label: "Uptime" },
];

function Home() {
  const { isAuthenticated } = useAuth();
  const { isDark } = useTheme();

  return (
    <div style={{ background: "var(--bg)", minHeight: "calc(100vh - 64px)", overflow: "hidden", position: "relative" }}>

      {/* Background Gradient Orbs */}
      <div style={{
        position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0,
      }}>
        <div style={{
          position: "absolute",
          top: "-200px", left: "50%", transform: "translateX(-50%)",
          width: "800px", height: "600px",
          background: "radial-gradient(ellipse at center, rgba(99,102,241,0.15) 0%, transparent 70%)",
          filter: "blur(40px)",
        }} />
        <div style={{
          position: "absolute",
          top: "300px", left: "-100px",
          width: "500px", height: "500px",
          background: "radial-gradient(ellipse at center, rgba(139,92,246,0.08) 0%, transparent 70%)",
          filter: "blur(60px)",
        }} />
        <div style={{
          position: "absolute",
          top: "200px", right: "-100px",
          width: "500px", height: "500px",
          background: "radial-gradient(ellipse at center, rgba(6,182,212,0.08) 0%, transparent 70%)",
          filter: "blur(60px)",
        }} />
        {/* Grid pattern */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
          opacity: isDark ? 1 : 0,
        }} />
      </div>

      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "5rem 1.5rem 4rem", textAlign: "center", position: "relative", zIndex: 1 }}>

        {/* Hero Section */}
        <div style={{ marginBottom: "5rem", animation: "fadeIn 0.6s ease" }}>

          {/* Badge */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "8px",
            padding: "6px 16px",
            background: "var(--primary-light)",
            border: "1px solid var(--primary-border)",
            borderRadius: "9999px",
            fontSize: "0.82rem", fontWeight: 600, marginBottom: "2rem",
            color: "var(--primary)",
            boxShadow: "0 0 20px var(--primary-glow)",
          }}>
            <span style={{ fontSize: "1rem" }}>🚀</span>
            The Developer Collaboration Platform
          </div>

          {/* Headline */}
          <h1 style={{
            fontSize: "clamp(2.2rem, 5.5vw, 3.8rem)",
            fontWeight: "800",
            color: "var(--text-primary)",
            lineHeight: 1.12,
            margin: "0 0 1.5rem 0",
            letterSpacing: "-0.03em",
          }}>
            Build Projects, Find Teammates,{" "}
            <br />
            <span style={{
              background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #06b6d4 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              Grow Together.
            </span>
          </h1>

          {/* Subtitle */}
          <p style={{
            fontSize: "clamp(1rem, 2vw, 1.2rem)",
            color: "var(--text-secondary)",
            maxWidth: "680px",
            margin: "0 auto 2.5rem auto",
            lineHeight: 1.7,
          }}>
            DevCollab connects developers across the globe. Share projects, discover talent,
            collaborate in real-time, inspect GitHub repositories, and participate in community discussions.
          </p>

          {/* Action Buttons */}
          <div style={{ display: "flex", justifyContent: "center", gap: "14px", flexWrap: "wrap", marginBottom: "1rem" }}>
            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: "8px",
                    padding: "13px 28px",
                    background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                    color: "#fff",
                    borderRadius: "10px",
                    textDecoration: "none",
                    fontWeight: 700,
                    fontSize: "1rem",
                    boxShadow: "0 8px 24px rgba(99,102,241,0.4)",
                    transition: "all 0.25s ease",
                    border: "none",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 12px 32px rgba(99,102,241,0.5)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 8px 24px rgba(99,102,241,0.4)";
                  }}
                >
                  Go to Dashboard →
                </Link>
                <Link
                  to="/projects"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: "8px",
                    padding: "13px 28px",
                    background: "var(--surface)",
                    color: "var(--text-primary)",
                    borderRadius: "10px",
                    textDecoration: "none",
                    fontWeight: 600,
                    fontSize: "1rem",
                    border: "1px solid var(--border)",
                    transition: "all 0.25s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.borderColor = "var(--primary-border)";
                    e.currentTarget.style.background = "var(--surface-2)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.borderColor = "var(--border)";
                    e.currentTarget.style.background = "var(--surface)";
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
                    display: "inline-flex", alignItems: "center", gap: "8px",
                    padding: "13px 28px",
                    background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                    color: "#fff",
                    borderRadius: "10px",
                    textDecoration: "none",
                    fontWeight: 700,
                    fontSize: "1rem",
                    boxShadow: "0 8px 24px rgba(99,102,241,0.4)",
                    transition: "all 0.25s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 12px 32px rgba(99,102,241,0.5)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 8px 24px rgba(99,102,241,0.4)";
                  }}
                >
                  Get Started Free →
                </Link>
                <Link
                  to="/login"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: "8px",
                    padding: "13px 28px",
                    background: "var(--surface)",
                    color: "var(--text-primary)",
                    borderRadius: "10px",
                    textDecoration: "none",
                    fontWeight: 600,
                    fontSize: "1rem",
                    border: "1px solid var(--border)",
                    transition: "all 0.25s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.borderColor = "var(--primary-border)";
                    e.currentTarget.style.background = "var(--surface-2)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.borderColor = "var(--border)";
                    e.currentTarget.style.background = "var(--surface)";
                  }}
                >
                  Sign In
                </Link>
              </>
            )}
          </div>

          {/* Trust line */}
          <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>
            Free to join · No credit card required · Open source
          </p>
        </div>

        {/* Stats Row */}
        <div style={{
          display: "flex", justifyContent: "center", gap: "0",
          marginBottom: "5rem",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "16px",
          overflow: "hidden",
          boxShadow: "var(--shadow)",
          maxWidth: "700px",
          margin: "0 auto 5rem",
        }}>
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              style={{
                flex: 1, padding: "24px 16px", textAlign: "center",
                borderRight: i < stats.length - 1 ? "1px solid var(--border)" : "none",
              }}
            >
              <div style={{
                fontSize: "1.9rem", fontWeight: "800", lineHeight: 1.1, marginBottom: "4px",
                background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
              }}>
                {stat.value}
              </div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 500 }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Feature Cards */}
        <div style={{ marginBottom: "4rem" }}>
          <p style={{
            fontSize: "0.82rem", fontWeight: 600, color: "var(--primary)",
            letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.75rem",
          }}>
            Everything you need
          </p>
          <h2 style={{
            fontSize: "clamp(1.5rem, 3vw, 2.2rem)", fontWeight: "800", color: "var(--text-primary)",
            marginBottom: "3rem", letterSpacing: "-0.02em",
          }}>
            Built for modern developers
          </h2>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "1.25rem",
            textAlign: "left",
          }}>
            {features.map((feat) => (
              <div
                key={feat.title}
                style={{
                  padding: "1.75rem",
                  background: "var(--surface)",
                  borderRadius: "14px",
                  border: "1px solid var(--border)",
                  boxShadow: "var(--shadow-sm)",
                  transition: "all 0.25s ease",
                  cursor: "default",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.borderColor = feat.color + "50";
                  e.currentTarget.style.boxShadow = `0 12px 32px ${feat.glow}, 0 0 0 1px ${feat.color}30`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.borderColor = "var(--border)";
                  e.currentTarget.style.boxShadow = "var(--shadow-sm)";
                }}
              >
                <div style={{
                  width: "44px", height: "44px",
                  background: feat.glow,
                  border: `1px solid ${feat.color}30`,
                  borderRadius: "10px",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "1.4rem", marginBottom: "1rem",
                }}>
                  {feat.icon}
                </div>
                <h3 style={{
                  margin: "0 0 0.5rem 0", fontSize: "1rem", fontWeight: 700,
                  color: "var(--text-primary)",
                }}>
                  {feat.title}
                </h3>
                <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "0.875rem", lineHeight: 1.6 }}>
                  {feat.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        {!isAuthenticated && (
          <div style={{
            padding: "3rem 2rem",
            background: "linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(139,92,246,0.08) 100%)",
            border: "1px solid var(--primary-border)",
            borderRadius: "20px",
            textAlign: "center",
            boxShadow: "0 0 40px rgba(99,102,241,0.1)",
          }}>
            <h2 style={{
              fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: "800",
              color: "var(--text-primary)", marginBottom: "1rem",
            }}>
              Ready to build something amazing?
            </h2>
            <p style={{ color: "var(--text-secondary)", marginBottom: "2rem", fontSize: "1rem" }}>
              Join thousands of developers collaborating on the platform.
            </p>
            <Link
              to="/register"
              style={{
                display: "inline-flex", alignItems: "center", gap: "8px",
                padding: "14px 32px",
                background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                color: "#fff", borderRadius: "10px",
                textDecoration: "none", fontWeight: 700, fontSize: "1rem",
                boxShadow: "0 8px 24px rgba(99,102,241,0.4)",
                transition: "all 0.25s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 12px 32px rgba(99,102,241,0.5)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 8px 24px rgba(99,102,241,0.4)";
              }}
            >
              🚀 Get Started — It's Free
            </Link>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

export default Home;