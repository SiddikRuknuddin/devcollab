import { useEffect, useState } from "react";
import { getSocket } from "../services/socket";
import { useAuth } from "../context/AuthContext";

export default function VoiceHuddleBar({ projectId, projectName }) {
  const { user } = useAuth();
  const [inHuddle, setInHuddle] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [peers, setPeers] = useState([]);
  const [speakingPeers, setSpeakingPeers] = useState({});

  useEffect(() => {
    if (!projectId) return;
    const socket = getSocket();
    if (!socket || typeof socket.on !== "function") return;

    const handlePeerJoined = (data) => {
      if (data.user && data.user._id !== user?._id) {
        setPeers((prev) => {
          if (prev.some((p) => p._id === data.user._id)) return prev;
          return [...prev, data.user];
        });
      }
    };

    const handlePeerLeft = (data) => {
      setPeers((prev) => prev.filter((p) => p._id !== data.userId));
      setSpeakingPeers((prev) => {
        const next = { ...prev };
        delete next[data.userId];
        return next;
      });
    };

    const handlePeerSpeaking = (data) => {
      setSpeakingPeers((prev) => ({ ...prev, [data.userId]: data.isSpeaking }));
    };

    socket.on("huddle_peer_joined", handlePeerJoined);
    socket.on("huddle_peer_left", handlePeerLeft);
    socket.on("peer_speaking", handlePeerSpeaking);

    return () => {
      socket.off("huddle_peer_joined", handlePeerJoined);
      socket.off("huddle_peer_left", handlePeerLeft);
      socket.off("peer_speaking", handlePeerSpeaking);
    };
  }, [projectId, user]);

  const handleJoin = () => {
    const socket = getSocket();
    setInHuddle(true);
    socket?.emit("huddle_join", {
      projectId,
      user: {
        _id: user?._id,
        name: user?.name,
        profileImage: user?.profileImage,
      },
    });
  };

  const handleLeave = () => {
    const socket = getSocket();
    setInHuddle(false);
    socket?.emit("huddle_leave", {
      projectId,
      user: { _id: user?._id },
    });
    setPeers([]);
  };

  const handleToggleMute = () => {
    const socket = getSocket();
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    socket?.emit("huddle_speaking", {
      projectId,
      userId: user?._id,
      isSpeaking: !nextMute,
    });
  };

  const handleToggleDeafen = () => {
    setIsDeafened(!isDeafened);
  };

  return (
    <div style={{
      position: "fixed",
      bottom: "24px",
      right: "24px",
      zIndex: 90,
      background: inHuddle ? "rgba(15, 23, 42, 0.95)" : "rgba(30, 41, 59, 0.95)",
      backdropFilter: "blur(12px)",
      border: inHuddle ? "1px solid rgba(16, 185, 129, 0.4)" : "1px solid var(--border)",
      borderRadius: "20px",
      padding: inHuddle ? "12px 20px" : "10px 18px",
      boxShadow: inHuddle ? "0 10px 30px rgba(16, 185, 129, 0.25)" : "0 8px 24px rgba(0,0,0,0.3)",
      display: "flex",
      alignItems: "center",
      gap: "14px",
      transition: "all 0.25s ease"
    }}>
      {!inHuddle ? (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "1.2rem" }}>🎙️</span>
            <div>
              <div style={{ fontSize: "0.85rem", fontWeight: "700", color: "var(--text-primary)" }}>
                Voice Huddle
              </div>
              <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                Discord-style drop-in audio
              </div>
            </div>
          </div>

          <button
            onClick={handleJoin}
            style={{
              padding: "7px 16px",
              background: "linear-gradient(135deg, #10b981, #06b6d4)",
              color: "#fff",
              border: "none",
              borderRadius: "10px",
              fontSize: "0.82rem",
              fontWeight: "700",
              cursor: "pointer",
              boxShadow: "0 2px 10px rgba(16, 185, 129, 0.3)"
            }}
          >
            Join Huddle
          </button>
        </>
      ) : (
        <>
          {/* Active Voice Pill */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              background: "#10b981",
              boxShadow: "0 0 10px #10b981"
            }} />
            <div>
              <div style={{ fontSize: "0.82rem", fontWeight: "700", color: "#34d399", display: "flex", alignItems: "center", gap: "6px" }}>
                <span>Voice Connected</span>
                <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: "normal" }}>({peers.length + 1} online)</span>
              </div>
              <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                🟢 24ms • HQ Spatial Audio
              </div>
            </div>
          </div>

          {/* Connected User Avatars */}
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            {/* Self Avatar */}
            <div style={{
              width: "28px",
              height: "28px",
              borderRadius: "50%",
              background: user?.profileImage ? `url(${user.profileImage}) center/cover` : "#6366f1",
              border: !isMuted ? "2px solid #10b981" : "2px solid var(--border)",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "11px",
              fontWeight: "700"
            }} title={`${user?.name} (You)`}>
              {!user?.profileImage && (user?.name?.[0] || "Y")}
            </div>

            {/* Peer Avatars */}
            {peers.map((p) => {
              const isSpeaking = speakingPeers[p._id];
              return (
                <div
                  key={p._id}
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    background: p.profileImage ? `url(${p.profileImage}) center/cover` : "#ec4899",
                    border: isSpeaking ? "2px solid #10b981" : "2px solid var(--border)",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "11px",
                    fontWeight: "700",
                    animation: isSpeaking ? "speechPulse 1s infinite" : "none"
                  }}
                  title={p.name}
                >
                  {!p.profileImage && (p.name?.[0] || "U")}
                </div>
              );
            })}
          </div>

          {/* Quick Mic Controls */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <button
              onClick={handleToggleMute}
              title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                background: isMuted ? "rgba(239, 68, 68, 0.2)" : "rgba(255,255,255,0.08)",
                border: isMuted ? "1px solid #ef4444" : "1px solid var(--border)",
                color: isMuted ? "#f87171" : "#f8fafc",
                fontSize: "14px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              {isMuted ? "🔇" : "🎙️"}
            </button>

            <button
              onClick={handleToggleDeafen}
              title={isDeafened ? "Undeafen Audio" : "Deafen Audio"}
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                background: isDeafened ? "rgba(239, 68, 68, 0.2)" : "rgba(255,255,255,0.08)",
                border: isDeafened ? "1px solid #ef4444" : "1px solid var(--border)",
                color: isDeafened ? "#f87171" : "#f8fafc",
                fontSize: "14px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              {isDeafened ? "🔕" : "🎧"}
            </button>

            <button
              onClick={handleLeave}
              title="Disconnect from Voice Huddle"
              style={{
                padding: "6px 12px",
                borderRadius: "8px",
                background: "rgba(239, 68, 68, 0.15)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                color: "#f87171",
                fontSize: "0.78rem",
                fontWeight: "700",
                cursor: "pointer"
              }}
            >
              Leave
            </button>
          </div>
        </>
      )}

      <style>{`
        @keyframes speechPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
          50% { box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
        }
      `}</style>
    </div>
  );
}
