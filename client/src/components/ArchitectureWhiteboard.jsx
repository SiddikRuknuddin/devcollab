import { useEffect, useRef, useState } from "react";
import api from "../services/api";

const COLORS = [
  { label: "Indigo", value: "#6366f1" },
  { label: "Emerald", value: "#10b981" },
  { label: "Cyan", value: "#06b6d4" },
  { label: "Rose", value: "#f43f5e" },
  { label: "Amber", value: "#f59e0b" },
  { label: "Purple", value: "#a855f7" },
  { label: "White", value: "#f8fafc" },
  { label: "Muted", value: "#64748b" },
];

const TEMPLATES = {
  mern: [
    { type: "service", x: 60, y: 140, w: 140, h: 70, text: "React Vite Client\n(Port 5173)", color: "#06b6d4" },
    { type: "arrow", x1: 200, y1: 175, x2: 290, y2: 175, color: "#64748b" },
    { type: "service", x: 290, y: 130, w: 160, h: 90, text: "Express REST & Socket.IO\n(Port 5000 API Gateway)", color: "#6366f1" },
    { type: "arrow", x1: 450, y1: 155, x2: 540, y2: 115, color: "#64748b" },
    { type: "arrow", x1: 450, y1: 195, x2: 540, y2: 235, color: "#64748b" },
    { type: "database", x: 540, y: 80, w: 150, h: 70, text: "MongoDB Atlas\nCluster DB", color: "#10b981" },
    { type: "database", x: 540, y: 200, w: 150, h: 70, text: "Cloudinary / S3\nAsset Vault", color: "#f59e0b" },
  ],
  cloud: [
    { type: "cloud", x: 80, y: 130, w: 160, h: 80, text: "Cloudflare Edge\nDNS & SSL WAF", color: "#f59e0b" },
    { type: "arrow", x1: 240, y1: 170, x2: 330, y2: 170, color: "#64748b" },
    { type: "service", x: 330, y: 125, w: 170, h: 90, text: "Docker Container\nApp Server", color: "#6366f1" },
    { type: "arrow", x1: 500, y1: 170, x2: 580, y2: 170, color: "#64748b" },
    { type: "database", x: 580, y: 125, w: 160, h: 90, text: "Managed PostgreSQL\nPrimary + Replica", color: "#06b6d4" },
  ],
  clean: [
    { type: "service", x: 60, y: 140, w: 140, h: 80, text: "HTTP Routes &\nControllers", color: "#a855f7" },
    { type: "arrow", x1: 200, y1: 180, x2: 280, y2: 180, color: "#64748b" },
    { type: "service", x: 280, y: 140, w: 150, h: 80, text: "Domain Logic &\nService Layer", color: "#6366f1" },
    { type: "arrow", x1: 430, y1: 180, x2: 510, y2: 180, color: "#64748b" },
    { type: "database", x: 510, y: 140, w: 150, h: 80, text: "Data Repositories\n& Mongoose Models", color: "#10b981" },
  ],
};

export default function ArchitectureWhiteboard({ projectId, initialDiagram, isMemberOrOwner }) {
  const canvasRef = useRef(null);
  const [elements, setElements] = useState([]);
  const [currentTool, setCurrentTool] = useState("pen"); // pen, service, database, cloud, arrow, text, eraser
  const [selectedColor, setSelectedColor] = useState("#6366f1");
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentPenPath, setCurrentPenPath] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load diagram
  useEffect(() => {
    if (initialDiagram?.elements && Array.isArray(initialDiagram.elements)) {
      setElements(initialDiagram.elements);
    } else {
      // Default to MERN template if canvas is empty
      setElements(TEMPLATES.mern);
    }
  }, [initialDiagram]);

  // Redraw canvas whenever elements or active drawing changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    // Clear canvas
    ctx.fillStyle = "#090d16";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle grid dots background
    ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
    for (let x = 20; x < canvas.width; x += 25) {
      for (let y = 20; y < canvas.height; y += 25) {
        ctx.beginPath();
        ctx.arc(x, y, 1, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Draw all elements
    elements.forEach((el) => {
      drawElement(ctx, el);
    });

    // Draw active freehand pen path
    if (currentPenPath.length > 1) {
      ctx.strokeStyle = selectedColor;
      ctx.lineWidth = strokeWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(currentPenPath[0].x, currentPenPath[0].y);
      for (let i = 1; i < currentPenPath.length; i++) {
        ctx.lineTo(currentPenPath[i].x, currentPenPath[i].y);
      }
      ctx.stroke();
    }
  }, [elements, currentPenPath, selectedColor, strokeWidth]);

  const drawElement = (ctx, el) => {
    ctx.save();
    ctx.strokeStyle = el.color || "#6366f1";
    ctx.fillStyle = el.color || "#6366f1";
    ctx.lineWidth = el.strokeWidth || 2;
    ctx.font = "bold 12px ui-sans-serif, system-ui, sans-serif";

    if (el.type === "pen" && el.points?.length > 1) {
      ctx.strokeStyle = el.color;
      ctx.lineWidth = el.strokeWidth || 3;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(el.points[0].x, el.points[0].y);
      for (let i = 1; i < el.points.length; i++) {
        ctx.lineTo(el.points[i].x, el.points[i].y);
      }
      ctx.stroke();
    } else if (el.type === "service") {
      // Rounded card
      ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
      ctx.beginPath();
      ctx.roundRect(el.x, el.y, el.w, el.h, 10);
      ctx.fill();
      ctx.stroke();

      // Top bar header
      ctx.fillStyle = el.color;
      ctx.beginPath();
      ctx.roundRect(el.x, el.y, el.w, 8, [10, 10, 0, 0]);
      ctx.fill();

      // Text lines
      ctx.fillStyle = "#f8fafc";
      const lines = (el.text || "Service Node").split("\n");
      lines.forEach((line, i) => {
        ctx.fillText(line, el.x + 12, el.y + 32 + i * 18);
      });
    } else if (el.type === "database") {
      // Cylinder / Database node
      ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
      ctx.beginPath();
      ctx.roundRect(el.x, el.y, el.w, el.h, 14);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = el.color;
      ctx.fillText("🗄️ " + (el.text ? el.text.split("\n")[0] : "Database"), el.x + 10, el.y + 28);
      if (el.text?.includes("\n")) {
        ctx.fillStyle = "#94a3b8";
        ctx.font = "11px system-ui";
        ctx.fillText(el.text.split("\n")[1], el.x + 14, el.y + 48);
      }
    } else if (el.type === "cloud") {
      // Cloud node
      ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
      ctx.beginPath();
      ctx.roundRect(el.x, el.y, el.w, el.h, 18);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = el.color;
      ctx.fillText("☁️ " + (el.text ? el.text.split("\n")[0] : "Cloud Service"), el.x + 12, el.y + 30);
      if (el.text?.includes("\n")) {
        ctx.fillStyle = "#94a3b8";
        ctx.font = "11px system-ui";
        ctx.fillText(el.text.split("\n")[1], el.x + 14, el.y + 50);
      }
    } else if (el.type === "arrow") {
      // Arrow with tip
      ctx.beginPath();
      ctx.moveTo(el.x1, el.y1);
      ctx.lineTo(el.x2, el.y2);
      ctx.stroke();

      const angle = Math.atan2(el.y2 - el.y1, el.x2 - el.x1);
      ctx.beginPath();
      ctx.moveTo(el.x2, el.y2);
      ctx.lineTo(el.x2 - 10 * Math.cos(angle - Math.PI / 6), el.y2 - 10 * Math.sin(angle - Math.PI / 6));
      ctx.lineTo(el.x2 - 10 * Math.cos(angle + Math.PI / 6), el.y2 - 10 * Math.sin(angle + Math.PI / 6));
      ctx.closePath();
      ctx.fillStyle = el.color;
      ctx.fill();
    }
    ctx.restore();
  };

  const getCanvasCoords = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handleMouseDown = (e) => {
    const { x, y } = getCanvasCoords(e);
    setIsDrawing(true);
    setStartPos({ x, y });

    if (currentTool === "pen") {
      setCurrentPenPath([{ x, y }]);
    } else if (currentTool === "eraser") {
      // Remove elements within 25px
      setElements((prev) =>
        prev.filter((el) => {
          if (el.x && el.y) {
            const dist = Math.hypot(el.x + (el.w || 0) / 2 - x, el.y + (el.h || 0) / 2 - y);
            return dist > 50;
          }
          return true;
        })
      );
    }
  };

  const handleMouseMove = (e) => {
    if (!isDrawing) return;
    const { x, y } = getCanvasCoords(e);

    if (currentTool === "pen") {
      setCurrentPenPath((prev) => [...prev, { x, y }]);
    }
  };

  const handleMouseUp = (e) => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const { x, y } = getCanvasCoords(e);

    if (currentTool === "pen" && currentPenPath.length > 1) {
      setElements((prev) => [
        ...prev,
        { type: "pen", points: currentPenPath, color: selectedColor, strokeWidth },
      ]);
      setCurrentPenPath([]);
    } else if (currentTool === "service") {
      const title = prompt("Enter Service Name (e.g., Auth Service, Payment Worker):", "Microservice Node");
      if (title) {
        setElements((prev) => [
          ...prev,
          { type: "service", x: startPos.x, y: startPos.y, w: 150, h: 75, text: title, color: selectedColor },
        ]);
      }
    } else if (currentTool === "database") {
      const title = prompt("Enter Database / Cache Name (e.g., Redis Cache, Postgres):", "MongoDB Database");
      if (title) {
        setElements((prev) => [
          ...prev,
          { type: "database", x: startPos.x, y: startPos.y, w: 150, h: 70, text: title, color: selectedColor },
        ]);
      }
    } else if (currentTool === "cloud") {
      const title = prompt("Enter Cloud Service / Gateway Name:", "AWS S3 / Gateway");
      if (title) {
        setElements((prev) => [
          ...prev,
          { type: "cloud", x: startPos.x, y: startPos.y, w: 150, h: 70, text: title, color: selectedColor },
        ]);
      }
    } else if (currentTool === "arrow") {
      if (Math.hypot(x - startPos.x, y - startPos.y) > 15) {
        setElements((prev) => [
          ...prev,
          { type: "arrow", x1: startPos.x, y1: startPos.y, x2: x, y2: y, color: selectedColor },
        ]);
      }
    }
  };

  const handleSaveDiagram = async () => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      await api.put(`/api/projects/${projectId}/whiteboard`, {
        diagramData: { elements, updatedAt: new Date() },
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error("Save whiteboard diagram error:", err);
      alert("Failed to save architecture diagram.");
    } finally {
      setSaving(false);
    }
  };

  const handleExportPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `DevCollab_Architecture_${projectId || "diagram"}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const handleUndo = () => {
    setElements((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    if (window.confirm("Clear all nodes and drawings from whiteboard?")) {
      setElements([]);
    }
  };

  const handleLoadTemplate = (key) => {
    if (TEMPLATES[key]) {
      setElements(TEMPLATES[key]);
    }
  };

  return (
    <div style={{
      background: "var(--surface)",
      borderRadius: "18px",
      border: "1px solid var(--border)",
      overflow: "hidden",
      boxShadow: "0 8px 32px rgba(0,0,0,0.25)"
    }}>
      {/* Top Toolbar */}
      <div style={{
        padding: "14px 20px",
        background: "rgba(255,255,255,0.02)",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "12px"
      }}>
        {/* Left: Tools */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
          {[
            { id: "pen", label: "✏️ Pen" },
            { id: "service", label: "🔲 Service Box" },
            { id: "database", label: "🗄️ Database" },
            { id: "cloud", label: "☁️ Cloud / API" },
            { id: "arrow", label: "➡️ Connector" },
            { id: "eraser", label: "🧽 Eraser" },
          ].map((tool) => (
            <button
              key={tool.id}
              onClick={() => setCurrentTool(tool.id)}
              style={{
                padding: "6px 12px",
                borderRadius: "8px",
                background: currentTool === tool.id ? "rgba(99, 102, 241, 0.2)" : "var(--surface-2)",
                border: currentTool === tool.id ? "1px solid #6366f1" : "1px solid var(--border)",
                color: currentTool === tool.id ? "#818cf8" : "var(--text-primary)",
                fontSize: "0.82rem",
                fontWeight: "600",
                cursor: "pointer",
                transition: "all 0.15s ease"
              }}
            >
              {tool.label}
            </button>
          ))}
        </div>

        {/* Center: Color & Stroke */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {COLORS.map((c) => (
            <button
              key={c.value}
              onClick={() => setSelectedColor(c.value)}
              title={c.label}
              style={{
                width: "20px",
                height: "20px",
                borderRadius: "50%",
                background: c.value,
                border: selectedColor === c.value ? "2px solid #fff" : "1px solid rgba(0,0,0,0.3)",
                cursor: "pointer",
                transform: selectedColor === c.value ? "scale(1.2)" : "scale(1)",
                transition: "transform 0.15s ease"
              }}
            />
          ))}

          <select
            value={strokeWidth}
            onChange={(e) => setStrokeWidth(Number(e.target.value))}
            style={{
              padding: "4px 8px",
              background: "var(--surface-2)",
              color: "var(--text-primary)",
              border: "1px solid var(--border)",
              borderRadius: "6px",
              fontSize: "0.8rem",
              outline: "none"
            }}
          >
            <option value={2}>Thin</option>
            <option value={3}>Medium</option>
            <option value={5}>Thick</option>
          </select>
        </div>

        {/* Right: Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <select
            onChange={(e) => handleLoadTemplate(e.target.value)}
            defaultValue=""
            style={{
              padding: "6px 10px",
              background: "var(--surface-2)",
              color: "var(--text-secondary)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              fontSize: "0.82rem",
              outline: "none"
            }}
          >
            <option value="" disabled>Load Architecture Template...</option>
            <option value="mern">MERN Stack Microservices</option>
            <option value="cloud">Cloud Serverless Edge</option>
            <option value="clean">Clean Architecture Layers</option>
          </select>

          <button
            onClick={handleUndo}
            title="Undo last element"
            style={{
              padding: "6px 12px",
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              color: "var(--text-primary)",
              borderRadius: "8px",
              fontSize: "0.82rem",
              cursor: "pointer"
            }}
          >
            ↩️ Undo
          </button>

          <button
            onClick={handleClear}
            title="Clear canvas"
            style={{
              padding: "6px 12px",
              background: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.25)",
              color: "#f87171",
              borderRadius: "8px",
              fontSize: "0.82rem",
              cursor: "pointer"
            }}
          >
            🗑️ Clear
          </button>

          <button
            onClick={handleExportPNG}
            style={{
              padding: "6px 14px",
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              color: "var(--text-primary)",
              borderRadius: "8px",
              fontSize: "0.82rem",
              fontWeight: "600",
              cursor: "pointer"
            }}
          >
            📷 Export PNG
          </button>

          <button
            onClick={handleSaveDiagram}
            disabled={saving}
            style={{
              padding: "6px 16px",
              background: saveSuccess ? "#10b981" : "linear-gradient(135deg, #6366f1, #8b5cf6)",
              border: "none",
              color: "#fff",
              borderRadius: "8px",
              fontSize: "0.82rem",
              fontWeight: "700",
              cursor: saving ? "wait" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              boxShadow: "0 2px 10px rgba(99, 102, 241, 0.3)"
            }}
          >
            {saveSuccess ? "✓ Diagram Saved!" : saving ? "Saving..." : "💾 Save Layout"}
          </button>
        </div>
      </div>

      {/* Canvas Area */}
      <div style={{ position: "relative", overflow: "hidden", background: "#090d16", display: "flex", justifyContent: "center" }}>
        <canvas
          ref={canvasRef}
          width={1000}
          height={540}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => setIsDrawing(false)}
          style={{
            display: "block",
            cursor: currentTool === "pen" ? "crosshair" : currentTool === "eraser" ? "not-allowed" : "pointer",
            maxWidth: "100%",
            height: "auto",
          }}
        />

        {/* Instruction footer */}
        <div style={{
          position: "absolute",
          bottom: "10px",
          left: "16px",
          pointerEvents: "none",
          fontSize: "0.75rem",
          color: "rgba(255,255,255,0.4)"
        }}>
          💡 Tip: Click Service Box, Database or Cloud to place architecture nodes. Drag with Connector to link nodes.
        </div>
      </div>
    </div>
  );
}
