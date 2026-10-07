import { useState, useRef } from "react";
import api, { API_BASE_URL } from "../services/api";

export default function ProjectFiles({ projectId, files = [], isMemberOrOwner, onUpdate }) {
  const [tab, setTab] = useState("upload"); // "upload" | "link"
  const [fileName, setFileName] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [fileType, setFileType] = useState("document");
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const getFullUrl = (url) => {
    if (!url) return "#";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    return `${API_BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return "";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 25 * 1024 * 1024) {
        setUploadError("File must be smaller than 25MB.");
        return;
      }
      setSelectedFile(file);
      setUploadError("");
      if (!fileName.trim()) {
        setFileName(file.name);
      }
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (file.size > 25 * 1024 * 1024) {
        setUploadError("File must be smaller than 25MB.");
        return;
      }
      setSelectedFile(file);
      setUploadError("");
      if (!fileName.trim()) {
        setFileName(file.name);
      }
    }
  };

  const handleUploadLocalFile = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setUploadError("Please choose a file to upload.");
      return;
    }

    try {
      setUploading(true);
      setUploadError("");
      const formData = new FormData();
      formData.append("file", selectedFile);

      const res = await api.post(`/api/projects/${projectId}/files/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data?.files) {
        onUpdate(res.data.files);
      }
      handleCloseModal();
    } catch (err) {
      setUploadError(err.response?.data?.message || "Failed to upload file. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleAddLink = async (e) => {
    e.preventDefault();
    if (!fileName.trim() || !fileUrl.trim()) return;

    try {
      setUploading(true);
      setUploadError("");
      const res = await api.post(`/api/projects/${projectId}/files`, {
        name: fileName.trim(),
        url: fileUrl.trim(),
        fileType,
      });

      if (res.data?.files) {
        onUpdate(res.data.files);
      }
      handleCloseModal();
    } catch (err) {
      setUploadError(err.response?.data?.message || "Failed to attach link.");
    } finally {
      setUploading(false);
    }
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setSelectedFile(null);
    setFileName("");
    setFileUrl("");
    setUploadError("");
    setTab("upload");
  };

  const handleDeleteFile = async (fileId) => {
    if (!window.confirm("Remove this file / asset?")) return;
    try {
      const res = await api.delete(`/api/projects/${projectId}/files/${fileId}`);
      if (res.data?.files) {
        onUpdate(res.data.files);
      }
    } catch (err) {
      alert("Failed to delete file");
    }
  };

  const getFileIcon = (type) => {
    switch (type) {
      case "design": return "🎨";
      case "code": return "💻";
      case "pdf": return "📑";
      case "document": return "📄";
      default: return "📁";
    }
  };

  return (
    <div style={{
      background: "var(--surface)",
      borderRadius: "18px",
      border: "1px solid var(--border)",
      padding: "1.75rem",
      boxShadow: "var(--shadow)",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "10px" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "1.2rem", fontWeight: "800", color: "var(--text-primary)" }}>
            📁 Project Files & Asset Vault
          </h2>
          <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
            Upload PDFs, documents, diagrams, or link Figma design boards & PRDs
          </p>
        </div>

        {isMemberOrOwner && (
          <button
            onClick={() => setShowAddModal(true)}
            style={{
              padding: "9px 18px",
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              color: "#fff",
              border: "none",
              borderRadius: "10px",
              fontWeight: "700",
              cursor: "pointer",
              fontSize: "0.88rem",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              boxShadow: "0 4px 12px rgba(99, 102, 241, 0.25)",
            }}
          >
            <span>+</span> Upload / Add Asset
          </button>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "14px" }}>
        {files.length === 0 ? (
          <div style={{
            gridColumn: "1 / -1", padding: "3rem 1rem", textAlign: "center",
            color: "var(--text-muted)", background: "var(--surface-2)",
            borderRadius: "14px", border: "1px dashed var(--border)",
          }}>
            <p style={{ fontSize: "2.4rem", margin: "0 0 8px" }}>📦</p>
            <p style={{ margin: "0 0 6px", fontSize: "1rem", fontWeight: "600", color: "var(--text-primary)" }}>
              No project files or assets attached yet
            </p>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-secondary)" }}>
              Team members can upload architecture diagrams, specifications, and design files directly.
            </p>
          </div>
        ) : (
          files.map((file) => (
            <div
              key={file._id}
              style={{
                padding: "16px",
                background: "var(--surface-2)",
                borderRadius: "14px",
                border: "1px solid var(--border)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: "12px",
                transition: "transform 0.2s, box-shadow 0.2s",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                <span style={{ fontSize: "1.7rem", lineHeight: 1 }}>{getFileIcon(file.fileType)}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    margin: "0 0 3px",
                    fontWeight: "700",
                    fontSize: "0.92rem",
                    color: "var(--text-primary)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap"
                  }} title={file.name}>
                    {file.name}
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    {file.size ? <span>{formatFileSize(file.size)}</span> : null}
                    {file.size ? <span>•</span> : null}
                    <span>{new Date(file.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border)", paddingTop: "10px" }}>
                <a
                  href={getFullUrl(file.url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: "#6366f1",
                    textDecoration: "none",
                    fontSize: "0.82rem",
                    fontWeight: "700",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  Open / Download ↗
                </a>

                {isMemberOrOwner && (
                  <button
                    onClick={() => handleDeleteFile(file._id)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--text-muted)",
                      cursor: "pointer",
                      fontSize: "12px",
                      padding: "4px 8px",
                      borderRadius: "6px",
                    }}
                    onMouseEnter={(e) => (e.target.style.color = "#ef4444")}
                    onMouseLeave={(e) => (e.target.style.color = "var(--text-muted)")}
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Asset Modal */}
      {showAddModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
          backdropFilter: "blur(6px)", zIndex: 1000, display: "flex",
          alignItems: "center", justifyContent: "center", padding: "1rem",
        }}>
          <div style={{
            background: "var(--surface)", borderRadius: "20px", border: "1px solid var(--border)",
            maxWidth: "480px", width: "100%", padding: "1.75rem", boxShadow: "var(--shadow-lg)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: "800", color: "var(--text-primary)" }}>
                Add Project Asset
              </h3>
              <button
                onClick={handleCloseModal}
                style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "1.2rem" }}
              >
                ✕
              </button>
            </div>

            {/* Tab Switcher */}
            <div style={{ display: "flex", gap: "8px", background: "var(--surface-2)", padding: "4px", borderRadius: "10px", marginBottom: "1.25rem" }}>
              <button
                type="button"
                onClick={() => { setTab("upload"); setUploadError(""); }}
                style={{
                  flex: 1, padding: "8px", border: "none", borderRadius: "8px", cursor: "pointer",
                  fontSize: "0.85rem", fontWeight: "700",
                  background: tab === "upload" ? "var(--surface)" : "transparent",
                  color: tab === "upload" ? "var(--text-primary)" : "var(--text-muted)",
                  boxShadow: tab === "upload" ? "var(--shadow-sm)" : "none",
                  transition: "all 0.15s ease",
                }}
              >
                💾 Upload File (PDF/Img/Doc)
              </button>
              <button
                type="button"
                onClick={() => { setTab("link"); setUploadError(""); }}
                style={{
                  flex: 1, padding: "8px", border: "none", borderRadius: "8px", cursor: "pointer",
                  fontSize: "0.85rem", fontWeight: "700",
                  background: tab === "link" ? "var(--surface)" : "transparent",
                  color: tab === "link" ? "var(--text-primary)" : "var(--text-muted)",
                  boxShadow: tab === "link" ? "var(--shadow-sm)" : "none",
                  transition: "all 0.15s ease",
                }}
              >
                🔗 External Link (Figma/Drive)
              </button>
            </div>

            {uploadError && (
              <div style={{
                padding: "10px 14px", borderRadius: "10px", background: "rgba(239, 68, 68, 0.1)",
                color: "#ef4444", border: "1px solid rgba(239, 68, 68, 0.2)", fontSize: "0.84rem",
                marginBottom: "1rem"
              }}>
                {uploadError}
              </div>
            )}

            {tab === "upload" ? (
              <form onSubmit={handleUploadLocalFile} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                />

                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    padding: "24px 16px",
                    borderRadius: "14px",
                    border: `2px dashed ${isDragging ? "#6366f1" : "var(--border)"}`,
                    background: isDragging ? "rgba(99, 102, 241, 0.08)" : "var(--surface-2)",
                    textAlign: "center",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  <p style={{ fontSize: "2rem", margin: "0 0 6px" }}>
                    {selectedFile ? "📄" : "📤"}
                  </p>
                  {selectedFile ? (
                    <div>
                      <p style={{ margin: "0 0 4px", fontWeight: "700", color: "var(--text-primary)", fontSize: "0.92rem" }}>
                        {selectedFile.name}
                      </p>
                      <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--text-muted)" }}>
                        {formatFileSize(selectedFile.size)} • Click to change file
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p style={{ margin: "0 0 4px", fontWeight: "700", color: "var(--text-primary)", fontSize: "0.9rem" }}>
                        Click to browse or drop file here
                      </p>
                      <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--text-muted)" }}>
                        Supports PDF, images, zip archives, docs, & source code (Max 25MB)
                      </p>
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "6px" }}>
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    style={{
                      padding: "9px 16px", background: "var(--surface-2)", border: "1px solid var(--border)",
                      borderRadius: "10px", color: "var(--text-secondary)", cursor: "pointer", fontWeight: "600",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploading || !selectedFile}
                    style={{
                      padding: "9px 20px", background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                      color: "#fff", border: "none", borderRadius: "10px", fontWeight: "700",
                      cursor: !selectedFile || uploading ? "not-allowed" : "pointer",
                      opacity: !selectedFile || uploading ? 0.6 : 1,
                    }}
                  >
                    {uploading ? "Uploading..." : "Upload File"}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleAddLink} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "700", color: "var(--text-muted)", marginBottom: "4px" }}>
                    Asset Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Figma UI Kit / Architecture Docs"
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    style={{
                      width: "100%", padding: "10px", borderRadius: "10px",
                      border: "1px solid var(--border)", background: "var(--surface-2)",
                      color: "var(--text-primary)", outline: "none", boxSizing: "border-box",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "700", color: "var(--text-muted)", marginBottom: "4px" }}>
                    URL or Web Link *
                  </label>
                  <input
                    type="url"
                    required
                    placeholder="https://figma.com/... or https://drive.google.com/..."
                    value={fileUrl}
                    onChange={(e) => setFileUrl(e.target.value)}
                    style={{
                      width: "100%", padding: "10px", borderRadius: "10px",
                      border: "1px solid var(--border)", background: "var(--surface-2)",
                      color: "var(--text-primary)", outline: "none", boxSizing: "border-box",
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: "700", color: "var(--text-muted)", marginBottom: "4px" }}>
                    Asset Type
                  </label>
                  <select
                    value={fileType}
                    onChange={(e) => setFileType(e.target.value)}
                    style={{
                      width: "100%", padding: "10px", borderRadius: "10px",
                      border: "1px solid var(--border)", background: "var(--surface-2)",
                      color: "var(--text-primary)", outline: "none",
                    }}
                  >
                    <option value="document">📄 Document / PRD</option>
                    <option value="design">🎨 Figma / Design Asset</option>
                    <option value="code">💻 Code / Schema</option>
                    <option value="pdf">📑 PDF Specification</option>
                  </select>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    style={{
                      padding: "9px 16px", background: "var(--surface-2)", border: "1px solid var(--border)",
                      borderRadius: "10px", color: "var(--text-secondary)", cursor: "pointer", fontWeight: "600",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploading || !fileName.trim() || !fileUrl.trim()}
                    style={{
                      padding: "9px 20px", background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                      color: "#fff", border: "none", borderRadius: "10px", fontWeight: "700",
                      cursor: "pointer",
                    }}
                  >
                    {uploading ? "Attaching..." : "Attach Asset Link"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
