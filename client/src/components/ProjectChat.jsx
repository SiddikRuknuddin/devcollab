import { useEffect, useState, useRef } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { getSocket } from "../services/socket";

export default function ProjectChat({ projectId, projectName }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [typingUsers, setTypingUsers] = useState([]);
  const [showCodeSnippet, setShowCodeSnippet] = useState(false);
  const [snippetCode, setSnippetCode] = useState("");
  const [snippetLang, setSnippetLang] = useState("javascript");
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const socket = getSocket();

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Fetch past messages
  useEffect(() => {
    let isMounted = true;
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/api/messages/project/${projectId}`);
        if (isMounted) {
          setMessages(res.data.messages || []);
        }
      } catch (err) {
        console.error("Fetch messages error:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (projectId) {
      fetchHistory();
      socket.emit("join_project", projectId);
    }

    // Socket listeners
    const handleNewMessage = (msg) => {
      setMessages((prev) => [...prev, msg]);
    };

    const handleUserTyping = (data) => {
      if (data.userId !== user?._id) {
        setTypingUsers((prev) => Array.from(new Set([...prev, data.userName])));
      }
    };

    const handleUserStopTyping = (data) => {
      setTypingUsers((prev) => prev.filter((name) => name !== data.userName));
    };

    socket.on("new_project_message", handleNewMessage);
    socket.on("user_typing", handleUserTyping);
    socket.on("user_stop_typing", handleUserStopTyping);

    return () => {
      isMounted = false;
      socket.emit("leave_project", projectId);
      socket.off("new_project_message", handleNewMessage);
      socket.off("user_typing", handleUserTyping);
      socket.off("user_stop_typing", handleUserStopTyping);
    };
  }, [projectId, user?._id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleInputChange = (e) => {
    setInputText(e.target.value);
    if (!socket) return;

    socket.emit("typing", {
      projectId,
      userId: user?._id,
      userName: user?.name || "Someone",
    });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stop_typing", {
        projectId,
        userId: user?._id,
        userName: user?.name || "Someone",
      });
    }, 1500);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim() && !snippetCode.trim()) return;

    const payload = {
      projectId,
      senderId: user?._id,
      text: inputText.trim() || (snippetCode.trim() ? "Shared a code snippet:" : ""),
      codeSnippet: snippetCode.trim()
        ? { code: snippetCode.trim(), language: snippetLang }
        : undefined,
    };

    socket.emit("send_project_message", payload);

    setInputText("");
    setSnippetCode("");
    setShowCodeSnippet(false);

    socket.emit("stop_typing", {
      projectId,
      userId: user?._id,
      userName: user?.name,
    });
  };

  return (
    <div style={{
      background: "var(--surface)",
      borderRadius: "16px",
      border: "1px solid var(--border)",
      display: "flex",
      flexDirection: "column",
      height: "600px",
      overflow: "hidden",
      boxShadow: "var(--shadow)",
    }}>
      {/* Header */}
      <div style={{
        padding: "1rem 1.25rem",
        borderBottom: "1px solid var(--border)",
        background: "var(--surface-2)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <div>
          <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: "700", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "8px" }}>
            <span>💬</span> {projectName || "Project"} Team Chat
          </h3>
          <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-muted)" }}>
            Real-time collaboration with project members
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.78rem", color: "#34d399", fontWeight: "600" }}>
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#10b981", display: "inline-block" }} />
          Live
        </div>
      </div>

      {/* Message List */}
      <div style={{
        flex: 1,
        padding: "1.25rem",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
      }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "2rem", color: "var(--text-muted)", fontSize: "0.9rem" }}>
            Loading conversation...
          </div>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--text-muted)" }}>
            <div style={{ fontSize: "2rem", marginBottom: "8px" }}>👋</div>
            <p style={{ margin: 0, fontSize: "0.9rem" }}>No messages yet in this project.</p>
            <p style={{ margin: "4px 0 0", fontSize: "0.8rem" }}>Say hello and start collaborating with your team!</p>
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
                  gap: "4px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  {!isMe && <span style={{ fontWeight: "700", color: "var(--text-secondary)" }}>{msg.sender?.name || "Teammate"}</span>}
                  <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                </div>

                <div
                  style={{
                    maxWidth: "80%",
                    padding: "10px 14px",
                    borderRadius: isMe ? "14px 14px 2px 14px" : "14px 14px 14px 2px",
                    background: isMe ? "linear-gradient(135deg, #6366f1, #8b5cf6)" : "var(--surface-2)",
                    color: isMe ? "#fff" : "var(--text-primary)",
                    fontSize: "0.9rem",
                    lineHeight: 1.45,
                    border: isMe ? "none" : "1px solid var(--border)",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
                    wordBreak: "break-word",
                  }}
                >
                  {msg.text}

                  {/* Code snippet rendering if attached */}
                  {msg.codeSnippet?.code && (
                    <div style={{
                      marginTop: "8px",
                      background: "#0f172a",
                      color: "#38bdf8",
                      borderRadius: "8px",
                      padding: "10px 12px",
                      fontFamily: "monospace",
                      fontSize: "0.82rem",
                      overflowX: "auto",
                      border: "1px solid rgba(255,255,255,0.1)",
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "0.72rem", color: "#94a3b8" }}>
                        <span>{msg.codeSnippet.language}</span>
                        <button
                          onClick={() => navigator.clipboard.writeText(msg.codeSnippet.code)}
                          style={{ background: "none", border: "none", color: "#cbd5e1", cursor: "pointer", fontSize: "0.72rem" }}
                        >
                          Copy
                        </button>
                      </div>
                      <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>{msg.codeSnippet.code}</pre>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Typing indicator */}
      {typingUsers.length > 0 && (
        <div style={{ padding: "4px 1.25rem", fontSize: "0.75rem", color: "var(--text-muted)", fontStyle: "italic" }}>
          {typingUsers.join(", ")} {typingUsers.length === 1 ? "is" : "are"} typing...
        </div>
      )}

      {/* Code Snippet Modal Drawer */}
      {showCodeSnippet && (
        <div style={{
          padding: "12px 1.25rem",
          background: "var(--surface-2)",
          borderTop: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.82rem", fontWeight: "700", color: "var(--text-primary)" }}>Attach Code Snippet</span>
            <select
              value={snippetLang}
              onChange={(e) => setSnippetLang(e.target.value)}
              style={{
                padding: "4px 8px", borderRadius: "6px", border: "1px solid var(--border)",
                background: "var(--surface)", color: "var(--text-primary)", fontSize: "0.78rem",
              }}
            >
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="html">HTML</option>
              <option value="css">CSS</option>
              <option value="sql">SQL</option>
            </select>
          </div>
          <textarea
            rows={4}
            placeholder="Paste code here..."
            value={snippetCode}
            onChange={(e) => setSnippetCode(e.target.value)}
            style={{
              width: "100%", padding: "8px", borderRadius: "8px",
              border: "1px solid var(--border)", background: "#0f172a",
              color: "#38bdf8", fontFamily: "monospace", fontSize: "0.82rem",
              resize: "vertical", outline: "none", boxSizing: "border-box",
            }}
          />
        </div>
      )}

      {/* Input Box */}
      <form
        onSubmit={handleSendMessage}
        style={{
          padding: "12px 1.25rem",
          borderTop: "1px solid var(--border)",
          background: "var(--surface)",
          display: "flex",
          gap: "8px",
          alignItems: "center",
        }}
      >
        <button
          type="button"
          onClick={() => setShowCodeSnippet(!showCodeSnippet)}
          title="Share code snippet"
          style={{
            padding: "8px 12px",
            background: showCodeSnippet ? "var(--primary)" : "var(--surface-2)",
            color: showCodeSnippet ? "#fff" : "var(--text-secondary)",
            border: "1px solid var(--border)",
            borderRadius: "10px",
            cursor: "pointer",
            fontSize: "0.85rem",
            fontWeight: "700",
            fontFamily: "monospace",
          }}
        >
          {"</>"}
        </button>

        <input
          type="text"
          placeholder="Type a message to project team..."
          value={inputText}
          onChange={handleInputChange}
          style={{
            flex: 1,
            padding: "10px 14px",
            borderRadius: "10px",
            border: "1px solid var(--border)",
            background: "var(--surface-2)",
            color: "var(--text-primary)",
            fontSize: "0.9rem",
            outline: "none",
            fontFamily: "var(--font)",
          }}
        />

        <button
          type="submit"
          disabled={!inputText.trim() && !snippetCode.trim()}
          style={{
            padding: "10px 18px",
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            color: "#fff",
            border: "none",
            borderRadius: "10px",
            fontWeight: "700",
            fontSize: "0.88rem",
            cursor: !inputText.trim() && !snippetCode.trim() ? "not-allowed" : "pointer",
            opacity: !inputText.trim() && !snippetCode.trim() ? 0.6 : 1,
            boxShadow: "0 4px 14px rgba(99,102,241,0.35)",
            fontFamily: "var(--font)",
          }}
        >
          Send
        </button>
      </form>
    </div>
  );
}
