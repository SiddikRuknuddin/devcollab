import { useEffect, useRef, useState } from "react";
import { getSocket } from "../services/socket";
import { useAuth } from "../context/AuthContext";

const INITIAL_FILES = {
  "App.jsx": `// Real-Time Collaborative Component
import React, { useState } from 'react';

export default function CollaborativeApp() {
  const [status, setStatus] = useState("Connected");

  return (
    <div style={{ padding: 24, textAlign: 'center' }}>
      <h1>⚡ Live Multiplayer Code Buffer</h1>
      <p>Edits made here broadcast instantly to active teammates.</p>
    </div>
  );
}`,
  "api.js": `// REST Client for DevCollab Microservices
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
});

export default api;`,
  "styles.css": `/* Modern Dark Neon Theme Variables */
:root {
  --primary: #6366f1;
  --accent: #ec4899;
  --bg-dark: #0b0f19;
  --surface-dark: #131b2e;
}`,
};

export default function MultiplayerCodeEditor({ projectId, projectName }) {
  const { user } = useAuth();
  const [activeFile, setActiveFile] = useState("App.jsx");
  const [files, setFiles] = useState(INITIAL_FILES);
  const [activePeers, setActivePeers] = useState([]);
  const [remoteTyping, setRemoteTyping] = useState(null);
  const [cursorLine, setCursorLine] = useState(1);
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef(null);
  const typingTimerRef = useRef(null);

  // Setup socket room and listeners
  useEffect(() => {
    if (!projectId) return;
    const socket = getSocket();
    if (!socket || typeof socket.emit !== "function") return;

    socket.emit("join_project", projectId);

    const handleCodeUpdate = (data) => {
      if (data.file && data.code !== undefined && data.sender?.id !== user?._id) {
        setFiles((prev) => ({ ...prev, [data.file]: data.code }));
        setRemoteTyping({
          name: data.sender?.name || "Teammate",
          line: data.cursorLine || 1,
          file: data.file,
        });

        if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
        typingTimerRef.current = setTimeout(() => setRemoteTyping(null), 3000);
      }
    };

    socket.on("code_updated", handleCodeUpdate);

    return () => {
      socket.off("code_updated", handleCodeUpdate);
    };
  }, [projectId, user]);

  const handleCodeChange = (e) => {
    const newCode = e.target.value;
    setFiles((prev) => ({ ...prev, [activeFile]: newCode }));

    // Compute cursor line
    const textBefore = newCode.substring(0, e.target.selectionStart);
    const line = textBefore.split("\n").length;
    setCursorLine(line);

    // Broadcast to teammates in project room
    const socket = getSocket();
    socket?.emit("code_sync", {
      projectId,
      file: activeFile,
      code: newCode,
      sender: { id: user?._id, name: user?.name },
      cursorLine: line,
    });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(files[activeFile] || "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([files[activeFile] || ""], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = activeFile;
    link.click();
    URL.revokeObjectURL(url);
  };

  const lineCount = (files[activeFile] || "").split("\n").length;

  return (
    <div style={{
      background: "#080c14",
      borderRadius: "18px",
      border: "1px solid var(--border)",
      overflow: "hidden",
      boxShadow: "0 10px 30px rgba(0,0,0,0.3)"
    }}>
      {/* Top Header & File Tabs */}
      <div style={{
        padding: "12px 18px",
        background: "#0d1322",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "10px"
      }}>
        {/* File tabs */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "1rem", marginRight: "6px" }}>💻</span>
          {Object.keys(files).map((fileName) => (
            <button
              key={fileName}
              onClick={() => setActiveFile(fileName)}
              style={{
                padding: "6px 14px",
                borderRadius: "8px",
                background: activeFile === fileName ? "rgba(99, 102, 241, 0.2)" : "transparent",
                border: activeFile === fileName ? "1px solid #6366f1" : "1px solid transparent",
                color: activeFile === fileName ? "#818cf8" : "var(--text-muted)",
                fontSize: "0.82rem",
                fontWeight: "600",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              <span>{fileName.endsWith(".jsx") ? "⚛️" : fileName.endsWith(".css") ? "🎨" : "📄"}</span>
              {fileName}
            </button>
          ))}
        </div>

        {/* Real-Time Collaborators Presence */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "0.78rem",
            color: "#34d399",
            background: "rgba(16, 185, 129, 0.12)",
            border: "1px solid rgba(16, 185, 129, 0.25)",
            padding: "4px 10px",
            borderRadius: "14px"
          }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#10b981", display: "inline-block", animation: "pulse 1.5s infinite" }} />
            Live Sync Active
          </div>

          <button
            onClick={handleCopy}
            style={{
              padding: "5px 12px",
              background: "var(--surface)",
              color: "var(--text-primary)",
              border: "1px solid var(--border)",
              borderRadius: "6px",
              fontSize: "0.78rem",
              fontWeight: "600",
              cursor: "pointer"
            }}
          >
            {copied ? "✓ Copied!" : "📋 Copy"}
          </button>

          <button
            onClick={handleDownload}
            style={{
              padding: "5px 12px",
              background: "var(--surface)",
              color: "var(--text-primary)",
              border: "1px solid var(--border)",
              borderRadius: "6px",
              fontSize: "0.78rem",
              fontWeight: "600",
              cursor: "pointer"
            }}
          >
            ⬇️ Save File
          </button>
        </div>
      </div>

      {/* Remote Peer Typing Notification Banner */}
      {remoteTyping && (
        <div style={{
          padding: "6px 18px",
          background: "rgba(99, 102, 241, 0.15)",
          borderBottom: "1px solid rgba(99, 102, 241, 0.25)",
          color: "#818cf8",
          fontSize: "0.78rem",
          display: "flex",
          alignItems: "center",
          gap: "8px"
        }}>
          <span>✍️</span>
          <span><strong>{remoteTyping.name}</strong> is editing {remoteTyping.file} (Line {remoteTyping.line})</span>
        </div>
      )}

      {/* Main Code Editor Window with Line Numbers */}
      <div style={{ display: "flex", minHeight: "440px", background: "#080c14" }}>
        {/* Line Numbers Gutter */}
        <div style={{
          padding: "16px 10px",
          background: "#060910",
          borderRight: "1px solid rgba(255,255,255,0.06)",
          color: "rgba(255,255,255,0.25)",
          fontSize: "0.85rem",
          lineHeight: "22px",
          fontFamily: "ui-monospace, monospace",
          textAlign: "right",
          userSelect: "none",
          width: "42px"
        }}>
          {Array.from({ length: lineCount }).map((_, i) => (
            <div key={i} style={{ color: i + 1 === cursorLine ? "#818cf8" : "inherit" }}>
              {i + 1}
            </div>
          ))}
        </div>

        {/* Textarea Code Buffer */}
        <textarea
          ref={textareaRef}
          value={files[activeFile] || ""}
          onChange={handleCodeChange}
          onKeyUp={(e) => {
            const line = (e.target.value.substring(0, e.target.selectionStart).match(/\n/g) || []).length + 1;
            setCursorLine(line);
          }}
          onClick={(e) => {
            const line = (e.target.value.substring(0, e.target.selectionStart).match(/\n/g) || []).length + 1;
            setCursorLine(line);
          }}
          placeholder={`// Real-time collaborative coding in ${activeFile}...`}
          style={{
            flex: 1,
            padding: "16px 18px",
            background: "transparent",
            color: "#f8fafc",
            border: "none",
            outline: "none",
            resize: "none",
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
            fontSize: "0.85rem",
            lineHeight: "22px",
            minHeight: "440px",
            boxSizing: "border-box"
          }}
        />
      </div>

      {/* Editor Status Footer */}
      <div style={{
        padding: "8px 18px",
        background: "#060910",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        display: "flex",
        justifyContent: "space-between",
        fontSize: "0.75rem",
        color: "var(--text-muted)"
      }}>
        <span>UTF-8 • {activeFile.endsWith(".jsx") ? "JavaScript React" : "Plain Text"} • Spaces: 2</span>
        <span>Line {cursorLine}, Column 1</span>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.3); }
        }
      `}</style>
    </div>
  );
}
