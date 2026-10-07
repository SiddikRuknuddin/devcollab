import { useEffect, useState, useRef } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { getSocket } from "../services/socket";

export default function DirectMessageModal({ targetUser, onClose }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const socket = getSocket();

  useEffect(() => {
    let isMounted = true;
    const fetchDMHistory = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/api/messages/direct/${targetUser._id}`);
        if (isMounted) {
          setMessages(res.data.messages || []);
        }
      } catch (err) {
        console.error("Fetch DM error:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (targetUser?._id && user?._id) {
      fetchDMHistory();
      socket.emit("join_user", user._id);
    }

    const handleNewDM = (msg) => {
      // Check if message belongs to this conversation
      const isRelevant =
        (msg.sender?._id === user?._id && msg.recipient?._id === targetUser?._id) ||
        (msg.sender?._id === targetUser?._id && msg.recipient?._id === user?._id);

      if (isRelevant) {
        setMessages((prev) => [...prev, msg]);
      }
    };

    socket.on("new_direct_message", handleNewDM);

    return () => {
      isMounted = false;
      socket.off("new_direct_message", handleNewDM);
    };
  }, [targetUser?._id, user?._id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    socket.emit("send_direct_message", {
      senderId: user?._id,
      recipientId: targetUser._id,
      text: inputText.trim(),
    });

    setInputText("");
  };

  if (!targetUser) return null;

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.7)",
      backdropFilter: "blur(6px)",
      zIndex: 1000,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "1rem",
    }}>
      <div style={{
        width: "100%",
        maxWidth: "500px",
        height: "560px",
        background: "var(--surface)",
        borderRadius: "20px",
        border: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        boxShadow: "var(--shadow-lg)",
      }}>
        {/* Modal Header */}
        <div style={{
          padding: "1rem 1.25rem",
          background: "var(--surface-2)",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              width: "36px", height: "36px", borderRadius: "10px",
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: "700", color: "#fff", fontSize: "0.85rem",
            }}>
              {targetUser.name?.charAt(0).toUpperCase() || "?"}
            </div>
            <div>
              <p style={{ margin: 0, fontWeight: "700", color: "var(--text-primary)", fontSize: "0.95rem" }}>
                {targetUser.name}
              </p>
              <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--text-muted)" }}>
                Direct Message
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none", border: "none", color: "var(--text-muted)",
              cursor: "pointer", fontSize: "1.2rem", padding: "4px",
            }}
          >
            ✕
          </button>
        </div>

        {/* Message Stream */}
        <div style={{
          flex: 1,
          padding: "1.25rem",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)" }}>
              Loading messages...
            </div>
          ) : messages.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--text-muted)" }}>
              <p style={{ margin: "0 0 6px", fontSize: "1.5rem" }}>💬</p>
              <p style={{ margin: 0, fontSize: "0.88rem" }}>Start a direct conversation with {targetUser.name}!</p>
            </div>
          ) : (
            messages.map((msg, i) => {
              const isMe = msg.sender?._id === user?._id;
              return (
                <div
                  key={msg._id || i}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: isMe ? "flex-end" : "flex-start",
                  }}
                >
                  <div
                    style={{
                      maxWidth: "75%",
                      padding: "9px 13px",
                      borderRadius: isMe ? "14px 14px 2px 14px" : "14px 14px 14px 2px",
                      background: isMe ? "linear-gradient(135deg, #6366f1, #8b5cf6)" : "var(--surface-2)",
                      color: isMe ? "#fff" : "var(--text-primary)",
                      fontSize: "0.88rem",
                      lineHeight: 1.4,
                      border: isMe ? "none" : "1px solid var(--border)",
                      wordBreak: "break-word",
                    }}
                  >
                    {msg.text}
                  </div>
                  <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "3px" }}>
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSend} style={{
          padding: "12px",
          borderTop: "1px solid var(--border)",
          background: "var(--surface)",
          display: "flex",
          gap: "8px",
        }}>
          <input
            type="text"
            placeholder={`Message ${targetUser.name}...`}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            style={{
              flex: 1, padding: "10px 14px", borderRadius: "10px",
              border: "1px solid var(--border)", background: "var(--surface-2)",
              color: "var(--text-primary)", outline: "none", fontSize: "0.88rem",
            }}
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            style={{
              padding: "10px 18px",
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              color: "#fff", border: "none", borderRadius: "10px",
              fontWeight: "700", cursor: !inputText.trim() ? "not-allowed" : "pointer",
              opacity: !inputText.trim() ? 0.6 : 1,
            }}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
