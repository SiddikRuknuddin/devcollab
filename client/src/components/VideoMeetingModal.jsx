import { useState } from "react";

export default function VideoMeetingModal({ projectId, projectName, onClose }) {
  const roomName = `devcollab-${projectId.slice(-8)}`;
  const [isJoined, setIsJoined] = useState(false);

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.8)",
      backdropFilter: "blur(8px)",
      zIndex: 2000,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "1rem",
    }}>
      <div style={{
        background: "var(--surface)",
        borderRadius: "20px",
        border: "1px solid var(--border)",
        maxWidth: "960px",
        width: "100%",
        height: "680px",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        boxShadow: "var(--shadow-lg)",
      }}>
        {/* Header */}
        <div style={{
          padding: "1rem 1.5rem",
          background: "var(--surface-2)",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "800", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "8px" }}>
              <span>🎙️</span> {projectName || "Project"} Video Standup Room
            </h3>
            <p style={{ margin: "2px 0 0", fontSize: "0.78rem", color: "var(--text-muted)" }}>
              Instant peer-to-peer audio, video & screen sharing for agile standups & pair programming
            </p>
          </div>

          <button
            onClick={onClose}
            style={{
              padding: "6px 14px",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              color: "var(--text-primary)",
              cursor: "pointer",
              fontWeight: "700",
              fontSize: "0.85rem",
            }}
          >
            Leave Call ✕
          </button>
        </div>

        {/* Video Frame */}
        <div style={{ flex: 1, position: "relative", background: "#0b0f19" }}>
          <iframe
            src={`https://meet.jit.si/${roomName}#config.prejoinPageEnabled=false&config.startWithAudioMuted=false&config.startWithVideoMuted=false`}
            title="Video Standup Meeting"
            allow="camera; microphone; fullscreen; display-capture; autoplay"
            style={{
              width: "100%",
              height: "100%",
              border: "none",
            }}
          />
        </div>
      </div>
    </div>
  );
}
