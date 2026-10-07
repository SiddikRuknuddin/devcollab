import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import KanbanBoard from "../components/KanbanBoard";
import ProjectChat from "../components/ProjectChat";
import ProjectMilestones from "../components/ProjectMilestones";
import ProjectFiles from "../components/ProjectFiles";
import GitHubLiveFeed from "../components/GitHubLiveFeed";
import VideoMeetingModal from "../components/VideoMeetingModal";
import CodeSandbox from "../components/CodeSandbox";
import TeammateRecommendations from "../components/TeammateRecommendations";
import AICodeReviewer from "../components/AICodeReviewer";
import ArchitectureWhiteboard from "../components/ArchitectureWhiteboard";
import ProjectWebhooks from "../components/ProjectWebhooks";
import SprintAnalytics from "../components/SprintAnalytics";
import MultiplayerCodeEditor from "../components/MultiplayerCodeEditor";
import VoiceHuddleBar from "../components/VoiceHuddleBar";
import ProjectDeployments from "../components/ProjectDeployments";
import CodeExecutionRunner from "../components/CodeExecutionRunner";

const STATUS_CONFIG = {
  Planning: { color: "#a78bfa", bg: "rgba(167,139,250,0.12)", border: "rgba(167,139,250,0.3)", dot: "#8b5cf6", label: "📋 Planning" },
  "In Progress": { color: "#60a5fa", bg: "rgba(96,165,250,0.12)", border: "rgba(96,165,250,0.3)", dot: "#3b82f6", label: "⚡ In Progress" },
  Completed: { color: "#34d399", bg: "rgba(52,211,153,0.12)", border: "rgba(52,211,153,0.3)", dot: "#10b981", label: "✅ Completed" },
};

const Shell = ({ children }) => (
  <div style={{ minHeight: "calc(100vh - 64px)", background: "var(--bg)", padding: "2rem 1.25rem 4rem" }}>
    <div style={{ maxWidth: "1100px", margin: "0 auto" }}>{children}</div>
  </div>
);

const BackLink = () => (
  <Link to="/projects" style={{
    display: "inline-flex", alignItems: "center", gap: "6px",
    color: "var(--text-muted)", textDecoration: "none",
    fontSize: "0.875rem", fontWeight: "600", marginBottom: "20px", transition: "color 0.2s",
  }}
    onMouseEnter={e => { e.currentTarget.style.color = "var(--primary)"; }}
    onMouseLeave={e => { e.currentTarget.style.color = "var(--text-muted)"; }}
  >
    ← Back to Projects
  </Link>
);

function ProjectDetails() {
  const { id, projectId } = useParams();
  const currentProjectId = projectId || id;
  const { user, token } = useAuth();

  const [project, setProject] = useState(null);
  const [members, setMembers] = useState([]);
  const [githubData, setGithubData] = useState(null);
  const [githubLoading, setGithubLoading] = useState(false);
  const [githubError, setGithubError] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [activeTab, setActiveTab] = useState("overview");
  const [showVideoModal, setShowVideoModal] = useState(false);

  const fetchProject = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/projects/${currentProjectId}`);
      const p = res.data.project;
      setProject(p);

      // Fetch members
      try {
        const mRes = await api.get(`/api/projects/${currentProjectId}/members`);
        setMembers(mRes.data.members || []);
      } catch (_) {}

      // Fetch GitHub data
      if (p?.githubUrl) {
        setGithubLoading(true);
        try {
          const gh = await api.get(`/api/projects/${currentProjectId}/github`);
          if (gh.data.repo) setGithubData(gh.data.repo);
          else if (gh.data.message) setGithubError(gh.data.message);
        } catch {
          setGithubError("Could not load GitHub metadata");
        } finally {
          setGithubLoading(false);
        }
      }
    } catch (err) {
      setError(err.response?.status === 404 ? "Project not found" : err.response?.data?.message || "Unable to load project details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && currentProjectId) fetchProject();
  }, [token, currentProjectId]);

  if (loading) return (
    <Shell>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", padding: "4rem 0" }}>
        <div style={{ width: "44px", height: "44px", border: "3px solid var(--border)", borderTopColor: "var(--primary)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <p style={{ color: "var(--text-muted)" }}>Loading project workspace...</p>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </Shell>
  );

  if (error || !project) return (
    <Shell>
      <BackLink />
      <div style={{ background: "var(--error-bg)", border: "1px solid var(--error-border)", borderRadius: "12px", padding: "1.5rem", color: "var(--error)" }}>
        {error || "Project not found."}
      </div>
    </Shell>
  );

  const sc = STATUS_CONFIG[project.status] || STATUS_CONFIG.Planning;
  const isOwner = project.owner?._id === user?._id;
  const isMember = members.some((m) => m.user?._id === user?._id && m.status === "Accepted");
  const isMemberOrOwner = isOwner || isMember;

  const TABS = [
    { id: "overview", label: "📋 Overview" },
    { id: "tasks", label: "📌 Kanban Board" },
    { id: "multiplayerEditor", label: "👥 Live Pair Code" },
    { id: "analytics", label: "📈 Velocity & Sprints" },
    { id: "deployments", label: "🚀 Deployments" },
    { id: "runner", label: "⚡ Code Runner" },
    { id: "chat", label: "💬 Team Chat" },
    { id: "milestones", label: "🎯 Roadmap" },
    { id: "whiteboard", label: "🎨 Whiteboard" },
    { id: "aiReview", label: "🛡️ AI Reviewer" },
    { id: "files", label: "📁 Files & Assets" },
    { id: "github", label: "🐙 GitHub Live" },
    { id: "webhooks", label: "🔔 Webhooks" },
    { id: "teammates", label: "🤖 AI Teammates" },
    { id: "sandbox", label: "💻 Code Sandbox" },
  ];

  return (
    <Shell>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
        <BackLink />

        {/* Action controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          {/* 1-Click Video Standup (Feature 9) */}
          <button
            onClick={() => setShowVideoModal(true)}
            style={{
              padding: "8px 16px",
              background: "linear-gradient(135deg, #10b981, #06b6d4)",
              color: "#fff",
              border: "none",
              borderRadius: "10px",
              fontWeight: "700",
              fontSize: "0.85rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              boxShadow: "0 4px 12px rgba(16,185,129,0.3)",
            }}
          >
            <span>🎙️</span> Video Standup
          </button>

          <Link
            to={`/projects/${currentProjectId}/members`}
            style={{
              padding: "8px 16px",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "10px",
              color: "var(--text-primary)",
              textDecoration: "none",
              fontWeight: "700",
              fontSize: "0.85rem",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span>👥</span> Members ({members.length})
          </Link>

          {isOwner && (
            <Link
              to={`/projects/edit/${currentProjectId}`}
              style={{
                padding: "8px 16px",
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "10px",
                color: "var(--text-secondary)",
                textDecoration: "none",
                fontWeight: "600",
                fontSize: "0.85rem",
              }}
            >
              Edit Project
            </Link>
          )}
        </div>
      </div>

      {/* Project Banner Header */}
      <div style={{
        background: "var(--surface)", borderRadius: "20px",
        border: "1px solid var(--border)", padding: "1.75rem 2rem",
        boxShadow: "var(--shadow)", marginBottom: "1.5rem",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "4px", background: `linear-gradient(180deg, ${sc.dot}, transparent)` }} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px", marginBottom: "10px" }}>
          <div>
            <h1 style={{ margin: "0 0 6px", fontSize: "1.75rem", fontWeight: "800", color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
              {project.title}
            </h1>
            <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "0.95rem" }}>
              Lead by <strong>{project.owner?.name}</strong> • Created {new Date(project.createdAt).toLocaleDateString()}
            </p>
          </div>

          <span style={{
            padding: "5px 14px", borderRadius: "20px", fontSize: "0.82rem", fontWeight: "700",
            color: sc.color, background: sc.bg, border: `1px solid ${sc.border}`,
          }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: sc.dot, display: "inline-block", marginRight: "6px" }} />
            {project.status}
          </span>
        </div>

        {/* Tech tags */}
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "12px" }}>
          {(project.technologies || []).map((t, idx) => (
            <span key={idx} style={{
              background: "var(--surface-2)", color: "var(--text-primary)",
              padding: "3px 10px", borderRadius: "6px", fontSize: "0.78rem", fontWeight: "600",
              border: "1px solid var(--border)",
            }}>
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* Modern Navigation Tabs */}
      <div style={{
        display: "flex",
        gap: "6px",
        overflowX: "auto",
        marginBottom: "1.75rem",
        paddingBottom: "4px",
      }}>
        {TABS.map((tab) => {
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: "9px 16px",
                borderRadius: "10px",
                border: isSelected ? "1px solid var(--primary-border)" : "1px solid var(--border)",
                background: isSelected ? "var(--primary)" : "var(--surface)",
                color: isSelected ? "#fff" : "var(--text-secondary)",
                fontWeight: isSelected ? "700" : "500",
                fontSize: "0.85rem",
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.15s ease",
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      {activeTab === "overview" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Description Section */}
          <div style={{
            background: "var(--surface)", borderRadius: "18px",
            border: "1px solid var(--border)", padding: "1.75rem 2rem",
            boxShadow: "var(--shadow)",
          }}>
            <h3 style={{ margin: "0 0 10px", fontSize: "0.85rem", fontWeight: "700", color: "var(--text-muted)", textTransform: "uppercase" }}>
              Project Summary & Objectives
            </h3>
            <p style={{ margin: 0, color: "var(--text-secondary)", lineHeight: 1.7, fontSize: "0.95rem" }}>
              {project.description}
            </p>
          </div>

          {/* Quick Stats Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
            <div style={{ background: "var(--surface)", padding: "1.25rem", borderRadius: "14px", border: "1px solid var(--border)" }}>
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "4px" }}>Active Team</div>
              <div style={{ fontSize: "1.25rem", fontWeight: "800", color: "var(--text-primary)" }}>
                {members.length + 1} Contributors
              </div>
            </div>

            <div style={{ background: "var(--surface)", padding: "1.25rem", borderRadius: "14px", border: "1px solid var(--border)" }}>
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "4px" }}>Milestones Progress</div>
              <div style={{ fontSize: "1.25rem", fontWeight: "800", color: "var(--primary)" }}>
                {(project.milestones || []).filter((m) => m.isCompleted).length} of {(project.milestones || []).length} Reached
              </div>
            </div>

            <div style={{ background: "var(--surface)", padding: "1.25rem", borderRadius: "14px", border: "1px solid var(--border)" }}>
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "4px" }}>Attached Documents</div>
              <div style={{ fontSize: "1.25rem", fontWeight: "800", color: "var(--text-primary)" }}>
                {(project.files || []).length} Files
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "tasks" && (
        <KanbanBoard projectId={currentProjectId} members={members} />
      )}

      {activeTab === "analytics" && (
        <SprintAnalytics projectId={currentProjectId} />
      )}

      {activeTab === "deployments" && (
        <ProjectDeployments
          projectId={currentProjectId}
          deployments={project.deployments || []}
          isOwner={isOwner}
          onUpdate={(newDeps) => setProject({ ...project, deployments: newDeps })}
        />
      )}

      {activeTab === "runner" && (
        <CodeExecutionRunner />
      )}

      {activeTab === "chat" && (
        <ProjectChat projectId={currentProjectId} projectName={project.title} />
      )}



      {activeTab === "milestones" && (
        <ProjectMilestones
          projectId={currentProjectId}
          milestones={project.milestones || []}
          isOwner={isOwner}
          onUpdate={(newMilestones) => setProject({ ...project, milestones: newMilestones })}
        />
      )}

      {activeTab === "files" && (
        <ProjectFiles
          projectId={currentProjectId}
          files={project.files || []}
          isMemberOrOwner={isMemberOrOwner}
          onUpdate={(newFiles) => setProject({ ...project, files: newFiles })}
        />
      )}

      {activeTab === "github" && (
        <GitHubLiveFeed
          githubData={githubData}
          loading={githubLoading}
          error={githubError}
          rawUrl={project.githubUrl}
        />
      )}

      {activeTab === "teammates" && (
        <TeammateRecommendations
          projectId={currentProjectId}
          onInvited={fetchProject}
        />
      )}

      {activeTab === "whiteboard" && (
        <ArchitectureWhiteboard
          projectId={currentProjectId}
          initialDiagram={project.architectureDiagram}
          isMemberOrOwner={isMemberOrOwner}
        />
      )}

      {activeTab === "aiReview" && (
        <AICodeReviewer />
      )}

      {activeTab === "webhooks" && (
        <ProjectWebhooks
          projectId={currentProjectId}
          isOwner={isOwner}
        />
      )}

      {activeTab === "multiplayerEditor" && (
        <MultiplayerCodeEditor projectId={currentProjectId} projectName={project.title} />
      )}

      {activeTab === "sandbox" && (
        <CodeSandbox />
      )}

      {/* Persistent Voice Huddle Floating Dock */}
      <VoiceHuddleBar
        projectId={currentProjectId}
        projectName={project.title}
      />

      {/* Video Standup Modal */}
      {showVideoModal && (
        <VideoMeetingModal
          projectId={currentProjectId}
          projectName={project.title}
          onClose={() => setShowVideoModal(false)}
        />
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </Shell>
  );
}


export default ProjectDetails;
