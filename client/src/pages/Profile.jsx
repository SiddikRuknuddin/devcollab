import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api, { API_BASE_URL } from "../services/api";
import { useAuth } from "../context/AuthContext";

function Profile() {
  const { token, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Modals state
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddCertModal, setShowAddCertModal] = useState(false);
  const [deleteProjectId, setDeleteProjectId] = useState(null);
  const [deletingProject, setDeletingProject] = useState(false);

  // Inline Skill Input
  const [newSkillInput, setNewSkillInput] = useState("");
  const [addingSkill, setAddingSkill] = useState(false);

  // Certification Form state
  const [certFormData, setCertFormData] = useState({
    name: "",
    completed: "",
    issuer: "",
    certificateUrl: "",
  });
  const [uploadingCert, setUploadingCert] = useState(false);
  const [certFileName, setCertFileName] = useState("");
  const [certUploadError, setCertUploadError] = useState("");
  const certFileInputRef = useRef(null);

  // Image upload state
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState("");
  const fileInputRef = useRef(null);

  // Main Edit Form Data
  const [formData, setFormData] = useState({
    name: "",
    title: "",
    bio: "",
    location: "",
    experience: "",
    education: "",
    github: "",
    linkedin: "",
    portfolio: "",
  });

  // ── Fetch Profile & Projects ───────────────────────────────────────────────
  const fetchProfileData = async () => {
    try {
      setLoading(true);
      setError("");
      const [profileRes, projectsRes] = await Promise.allSettled([
        api.get("/api/users/profile"),
        api.get("/api/projects/my"),
      ]);

      if (profileRes.status === "fulfilled") {
        const userData = profileRes.value.data.user;
        setUser(userData);
        setFormData({
          name: userData.name || "",
          title: userData.title || "",
          bio: userData.bio || "",
          location: userData.location || "",
          experience: userData.experience || "",
          education: userData.education || "",
          github: userData.github || "",
          linkedin: userData.linkedin || "",
          portfolio: userData.portfolio || "",
        });
      }

      if (projectsRes.status === "fulfilled") {
        setProjects(projectsRes.value.data.projects || []);
      }
    } catch (err) {
      setError("Unable to load profile data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchProfileData();
  }, [token]);

  // ── Input Change ───────────────────────────────────────────────────────────
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ── Image Upload & Remove ──────────────────────────────────────────────────
  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageError("");
    const ALLOWED = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!ALLOWED.includes(file.type)) {
      setImageError("Only JPEG, JPG, PNG, or WEBP images are allowed.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setImageError("Image must be under 5MB.");
      return;
    }

    const form = new FormData();
    form.append("profileImage", file);

    try {
      setUploadingImage(true);
      const res = await api.post("/api/users/profile/image", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setUser((prev) => ({ ...prev, profileImage: res.data.profileImage }));
      setSuccessMessage("Profile photo updated successfully!");
      if (refreshProfile) await refreshProfile();
    } catch (err) {
      setImageError(err.response?.data?.message || "Failed to upload image.");
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveImage = async () => {
    if (!window.confirm("Remove your profile photo?")) return;
    try {
      setUploadingImage(true);
      const res = await api.put("/api/users/profile", { profileImage: "" });
      setUser(res.data.user);
      setSuccessMessage("Profile photo removed.");
      if (refreshProfile) await refreshProfile();
    } catch (err) {
      setError("Failed to remove profile photo.");
    } finally {
      setUploadingImage(false);
    }
  };

  // ── Save Profile Details ───────────────────────────────────────────────────
  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const response = await api.put("/api/users/profile", {
        name: formData.name.trim(),
        title: formData.title.trim(),
        bio: formData.bio.trim(),
        location: formData.location.trim(),
        experience: formData.experience.trim(),
        education: formData.education.trim(),
        github: formData.github.trim(),
        linkedin: formData.linkedin.trim(),
        portfolio: formData.portfolio.trim(),
      });

      setUser(response.data.user);
      setShowEditModal(false);
      setSuccessMessage("Profile updated successfully!");
      if (refreshProfile) await refreshProfile();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  // ── Skills Management (Clean, Fast Tag Add/Remove) ─────────────────────────
  const handleAddSkill = async (e) => {
    e?.preventDefault();
    const skillName = newSkillInput.trim();
    if (!skillName) return;

    const currentSkills = user?.skills || [];
    if (currentSkills.some((s) => s.toLowerCase() === skillName.toLowerCase())) {
      setError(`Skill "${skillName}" is already added.`);
      setNewSkillInput("");
      return;
    }

    const updatedSkills = [...currentSkills, skillName];
    try {
      setAddingSkill(true);
      const res = await api.put("/api/users/profile", { skills: updatedSkills });
      setUser(res.data.user);
      setNewSkillInput("");
      setSuccessMessage(`Added "${skillName}" to skills.`);
    } catch (err) {
      setError("Failed to add skill.");
    } finally {
      setAddingSkill(false);
    }
  };

  const handleRemoveSkill = async (skillToRemove) => {
    const updatedSkills = (user?.skills || []).filter((s) => s !== skillToRemove);
    try {
      const res = await api.put("/api/users/profile", { skills: updatedSkills });
      setUser(res.data.user);
    } catch (err) {
      setError("Failed to remove skill.");
    }
  };

  // ── Certificate File Upload Handler ────────────────────────────────────────
  const handleCertificateFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCertUploadError("");
    const ALLOWED = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "application/pdf",
    ];

    if (!ALLOWED.includes(file.type)) {
      setCertUploadError("Only PDF documents and JPEG/PNG/WEBP images are allowed.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setCertUploadError("Certificate file must be under 10MB.");
      return;
    }

    const form = new FormData();
    form.append("certificateFile", file);

    try {
      setUploadingCert(true);
      const res = await api.post("/api/users/profile/certificate-upload", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setCertFormData((prev) => ({
        ...prev,
        certificateUrl: res.data.certificateUrl,
      }));
      setCertFileName(res.data.fileName || file.name);
    } catch (err) {
      setCertUploadError(err.response?.data?.message || "Failed to upload certificate file.");
    } finally {
      setUploadingCert(false);
      if (certFileInputRef.current) certFileInputRef.current.value = "";
    }
  };

  // ── Certifications Management ──────────────────────────────────────────────
  const handleSaveCertification = async (e) => {
    e.preventDefault();
    if (!certFormData.name.trim()) return;

    const newCert = {
      name: certFormData.name.trim(),
      issuer: certFormData.issuer.trim(),
      completed: certFormData.completed.trim(),
      certificateUrl: certFormData.certificateUrl.trim(),
    };

    const updatedCerts = [...(user?.certifications || []), newCert];
    try {
      const res = await api.put("/api/users/profile", { certifications: updatedCerts });
      setUser(res.data.user);
      setShowAddCertModal(false);
      setCertFormData({ name: "", completed: "", issuer: "", certificateUrl: "" });
      setCertFileName("");
      setCertUploadError("");
      setSuccessMessage("Certification added successfully!");
    } catch (err) {
      setError("Failed to add certification.");
    }
  };

  const handleDeleteCertification = async (indexToDelete) => {
    const certToDelete = user?.certifications?.[indexToDelete];
    if (!window.confirm(`Delete certification "${certToDelete?.name}"?`)) return;

    const updatedCerts = (user?.certifications || []).filter((_, i) => i !== indexToDelete);
    try {
      const res = await api.put("/api/users/profile", { certifications: updatedCerts });
      setUser(res.data.user);
      setSuccessMessage("Certification deleted.");
    } catch (err) {
      setError("Failed to delete certification.");
    }
  };

  // ── Delete Project ─────────────────────────────────────────────────────────
  const handleDeleteProject = async () => {
    if (!deleteProjectId) return;
    try {
      setDeletingProject(true);
      await api.delete(`/api/projects/${deleteProjectId}`);
      setProjects((prev) => prev.filter((p) => p._id !== deleteProjectId));
      setDeleteProjectId(null);
      setSuccessMessage("Project deleted successfully.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete project.");
    } finally {
      setDeletingProject(false);
    }
  };

  // Helpers
  const initials = user?.name
    ? user.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
    : "DC";

  const cleanUrl = (url) => (url && !url.startsWith("http") ? `https://${url}` : url);

  const getFullUrl = (url) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    return `${API_BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: "calc(100vh - 64px)",
          background: "var(--bg)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "16px",
        }}
      >
        <div
          style={{
            width: "44px",
            height: "44px",
            border: "3px solid var(--border)",
            borderTopColor: "var(--primary)",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>Loading profile...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "calc(100vh - 64px)",
        background: "var(--bg)",
        color: "var(--text-primary)",
        padding: "2rem 1.25rem 4rem",
      }}
    >
      <div style={{ maxWidth: "1160px", margin: "0 auto" }}>
        {/* Top Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "16px",
            marginBottom: "24px",
          }}
        >
          <div>
            <h1
              style={{
                fontSize: "2rem",
                fontWeight: "800",
                letterSpacing: "-0.5px",
                margin: 0,
                color: "var(--text-primary)",
              }}
            >
              My Profile
            </h1>
            <p style={{ margin: "4px 0 0", color: "var(--text-muted)", fontSize: "0.875rem" }}>
              Your personal developer identity, technical skills, verified certificates, and projects
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            {user?._id && (
              <a
                href={`/portfolio/${user._id}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "var(--surface)",
                  color: "var(--text-primary)",
                  border: "1px solid var(--border)",
                  borderRadius: "10px",
                  padding: "10px 16px",
                  fontSize: "0.875rem",
                  fontWeight: "600",
                  textDecoration: "none",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                }}
              >
                🌐 Public Portfolio ↗
              </a>
            )}

            <button
              type="button"
              onClick={() => setShowEditModal(true)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                background: "linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)",
                color: "#ffffff",
                border: "none",
                borderRadius: "10px",
                padding: "10px 20px",
                fontSize: "0.875rem",
                fontWeight: "700",
                cursor: "pointer",
                boxShadow: "0 4px 14px var(--primary-glow)",
                transition: "transform 0.2s, box-shadow 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 6px 20px var(--primary-glow)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 14px var(--primary-glow)";
              }}
            >
              ✏️ Edit Profile
            </button>
          </div>
        </div>


        {/* Global Notifications */}
        {successMessage && (
          <div
            style={{
              background: "var(--success-bg)",
              border: "1px solid var(--success-border)",
              borderRadius: "12px",
              padding: "12px 18px",
              marginBottom: "20px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              color: "var(--success)",
              fontSize: "0.9rem",
              fontWeight: "600",
            }}
          >
            <span>✅ {successMessage}</span>
            <button
              onClick={() => setSuccessMessage("")}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontWeight: "bold",
                color: "var(--success)",
                fontSize: "1rem",
              }}
            >
              ✕
            </button>
          </div>
        )}

        {error && (
          <div
            style={{
              background: "var(--error-bg)",
              border: "1px solid var(--error-border)",
              borderRadius: "12px",
              padding: "12px 18px",
              marginBottom: "20px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              color: "var(--error)",
              fontSize: "0.9rem",
              fontWeight: "600",
            }}
          >
            <span>⚠️ {error}</span>
            <button
              onClick={() => setError("")}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontWeight: "bold",
                color: "var(--error)",
                fontSize: "1rem",
              }}
            >
              ✕
            </button>
          </div>
        )}

        {/* ── Main Hero Profile Card ────────────────────────────────────── */}
        <div
          style={{
            background: "var(--surface)",
            borderRadius: "20px",
            border: "1px solid var(--border)",
            padding: "32px",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
            marginBottom: "24px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Ambient light */}
          <div
            style={{
              position: "absolute",
              top: "-60px",
              right: "-60px",
              width: "240px",
              height: "240px",
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(99, 102, 241, 0.12) 0%, transparent 70%)",
              pointerEvents: "none",
            }}
          />

          <div
            style={{
              display: "flex",
              gap: "28px",
              alignItems: "flex-start",
              flexWrap: "wrap",
            }}
          >
            {/* Avatar & Photo Upload Actions */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <div style={{ position: "relative" }}>
                <div
                  style={{
                    width: "110px",
                    height: "110px",
                    borderRadius: "24px",
                    overflow: "hidden",
                    border: "2px solid var(--border)",
                    background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#ffffff",
                    fontSize: "38px",
                    fontWeight: "800",
                    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.4)",
                  }}
                >
                  {user?.profileImage ? (
                    <img
                      src={getFullUrl(user.profileImage)}
                      alt={user?.name}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    initials
                  )}
                </div>

                {/* Online Dot */}
                <span
                  style={{
                    position: "absolute",
                    bottom: "-2px",
                    right: "-2px",
                    width: "16px",
                    height: "16px",
                    borderRadius: "50%",
                    backgroundColor: "#22c55e",
                    border: "3px solid var(--surface)",
                    boxShadow: "0 0 10px rgba(34, 197, 94, 0.6)",
                  }}
                  title="Active"
                />
              </div>

              {/* Hidden File Input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                style={{ display: "none" }}
                onChange={handleImageChange}
              />

              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  style={{
                    background: "var(--surface-2)",
                    border: "1px solid var(--border)",
                    color: "var(--text-secondary)",
                    borderRadius: "8px",
                    padding: "6px 12px",
                    fontSize: "0.78rem",
                    fontWeight: "600",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--primary)";
                    e.currentTarget.style.color = "var(--text-primary)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--border)";
                    e.currentTarget.style.color = "var(--text-secondary)";
                  }}
                >
                  {uploadingImage ? "Uploading..." : "📷 Change Photo"}
                </button>

                {user?.profileImage && (
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    disabled={uploadingImage}
                    style={{
                      background: "var(--error-bg)",
                      border: "1px solid var(--error-border)",
                      color: "var(--error)",
                      borderRadius: "8px",
                      padding: "6px 10px",
                      fontSize: "0.78rem",
                      fontWeight: "600",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                    title="Remove profile photo"
                  >
                    🗑️
                  </button>
                )}
              </div>
              {imageError && (
                <span style={{ color: "var(--error)", fontSize: "0.75rem", textAlign: "center" }}>
                  {imageError}
                </span>
              )}
            </div>

            {/* Profile Info Details */}
            <div style={{ flex: 1, minWidth: "280px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "12px",
                  marginBottom: "8px",
                }}
              >
                <h2
                  style={{
                    fontSize: "1.8rem",
                    fontWeight: "800",
                    color: "var(--text-primary)",
                    margin: 0,
                    letterSpacing: "-0.5px",
                  }}
                >
                  {user?.name || "Developer"}
                </h2>

                <span
                  style={{
                    background: "var(--primary-light)",
                    color: "var(--primary)",
                    border: "1px solid var(--primary-border)",
                    borderRadius: "20px",
                    padding: "4px 12px",
                    fontSize: "0.8rem",
                    fontWeight: "700",
                  }}
                >
                  {user?.title || "Full-stack Web Developer"}
                </span>
              </div>

              {/* Metadata row: Email, Location, Experience, Education */}
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "16px",
                  fontSize: "0.875rem",
                  color: "var(--text-secondary)",
                  marginBottom: "14px",
                }}
              >
                {user?.email && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                    ✉️ {user.email}
                    {user?.isEmailVerified && (
                      <span
                        style={{
                          background: "var(--success-bg)",
                          color: "var(--success)",
                          border: "1px solid var(--success-border)",
                          borderRadius: "4px",
                          fontSize: "0.7rem",
                          fontWeight: "700",
                          padding: "1px 5px",
                        }}
                      >
                        Verified
                      </span>
                    )}
                  </span>
                )}
                {user?.location && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                    📍 {user.location}
                  </span>
                )}
                {user?.experience && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                    💼 {user.experience}
                  </span>
                )}
                {user?.education && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                    🎓 {user.education}
                  </span>
                )}
              </div>

              {/* Bio */}
              <p
                style={{
                  margin: "0 0 18px",
                  fontSize: "0.92rem",
                  lineHeight: "1.6",
                  color: user?.bio ? "var(--text-secondary)" : "var(--text-muted)",
                  fontStyle: user?.bio ? "normal" : "italic",
                }}
              >
                {user?.bio || "No personal bio provided. Click 'Edit Profile' to add your summary and background."}
              </p>

              {/* Social Link Badges */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                {user?.github ? (
                  <a
                    href={cleanUrl(user.github)}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      background: "var(--surface-2)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      padding: "6px 14px",
                      fontSize: "0.82rem",
                      fontWeight: "700",
                      color: "var(--text-primary)",
                      textDecoration: "none",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "var(--primary)";
                      e.currentTarget.style.color = "var(--primary)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "var(--border)";
                      e.currentTarget.style.color = "var(--text-primary)";
                    }}
                  >
                    🐙 GitHub ↗
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowEditModal(true)}
                    style={{
                      background: "none",
                      border: "1px dashed var(--border)",
                      borderRadius: "8px",
                      padding: "6px 12px",
                      fontSize: "0.78rem",
                      color: "var(--text-muted)",
                      cursor: "pointer",
                    }}
                  >
                    + Add GitHub
                  </button>
                )}

                {user?.linkedin ? (
                  <a
                    href={cleanUrl(user.linkedin)}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      background: "rgba(10, 102, 194, 0.15)",
                      border: "1px solid rgba(10, 102, 194, 0.35)",
                      borderRadius: "8px",
                      padding: "6px 14px",
                      fontSize: "0.82rem",
                      fontWeight: "700",
                      color: "#38bdf8",
                      textDecoration: "none",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#38bdf8")}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(10, 102, 194, 0.35)")}
                  >
                    💼 LinkedIn ↗
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowEditModal(true)}
                    style={{
                      background: "none",
                      border: "1px dashed var(--border)",
                      borderRadius: "8px",
                      padding: "6px 12px",
                      fontSize: "0.78rem",
                      color: "var(--text-muted)",
                      cursor: "pointer",
                    }}
                  >
                    + Add LinkedIn
                  </button>
                )}

                {user?.portfolio ? (
                  <a
                    href={cleanUrl(user.portfolio)}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      background: "var(--success-bg)",
                      border: "1px solid var(--success-border)",
                      borderRadius: "8px",
                      padding: "6px 14px",
                      fontSize: "0.82rem",
                      fontWeight: "700",
                      color: "var(--success)",
                      textDecoration: "none",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--success)")}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--success-border)")}
                  >
                    🌐 Portfolio ↗
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowEditModal(true)}
                    style={{
                      background: "none",
                      border: "1px dashed var(--border)",
                      borderRadius: "8px",
                      padding: "6px 12px",
                      fontSize: "0.78rem",
                      color: "var(--text-muted)",
                      cursor: "pointer",
                    }}
                  >
                    + Add Portfolio
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── 2-Column Responsive Layout ────────────────────────────────── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.3fr) minmax(0, 1.7fr)",
            gap: "24px",
            alignItems: "start",
          }}
        >
          {/* ════ LEFT COLUMN: Skills & Certifications ════ */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Skills Card */}
            <div
              style={{
                background: "var(--surface)",
                borderRadius: "20px",
                border: "1px solid var(--border)",
                padding: "24px",
                boxShadow: "0 8px 30px rgba(0, 0, 0, 0.25)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "16px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "1.2rem" }}>🛠️</span>
                  <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "700" }}>
                    Technical Skills ({user?.skills?.length || 0})
                  </h3>
                </div>
              </div>

              {/* Fast Inline Add Form */}
              <form
                onSubmit={handleAddSkill}
                style={{
                  display: "flex",
                  gap: "8px",
                  marginBottom: "16px",
                }}
              >
                <input
                  type="text"
                  placeholder="Add a skill (e.g. React, Node.js)..."
                  value={newSkillInput}
                  onChange={(e) => setNewSkillInput(e.target.value)}
                  style={{
                    flex: 1,
                    background: "var(--surface-2)",
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    padding: "8px 12px",
                    color: "var(--text-primary)",
                    fontSize: "0.85rem",
                    outline: "none",
                  }}
                />
                <button
                  type="submit"
                  disabled={addingSkill || !newSkillInput.trim()}
                  style={{
                    background: "var(--primary)",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "8px",
                    padding: "8px 14px",
                    fontSize: "0.82rem",
                    fontWeight: "700",
                    cursor: "pointer",
                    opacity: !newSkillInput.trim() ? 0.6 : 1,
                  }}
                >
                  {addingSkill ? "Adding..." : "+ Add"}
                </button>
              </form>

              {/* Skills Chips */}
              {user?.skills && user.skills.length > 0 ? (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {user.skills.map((skill, idx) => (
                    <span
                      key={idx}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        background: "var(--surface-2)",
                        border: "1px solid var(--border)",
                        borderRadius: "8px",
                        padding: "5px 10px",
                        fontSize: "0.82rem",
                        fontWeight: "600",
                        color: "var(--text-primary)",
                      }}
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "var(--text-muted)",
                          cursor: "pointer",
                          fontSize: "0.75rem",
                          padding: "0 2px",
                          lineHeight: 1,
                          transition: "color 0.2s",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--error)")}
                        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
                        title={`Remove ${skill}`}
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.85rem" }}>
                  No skills added yet. Type above to showcase your expertise.
                </p>
              )}
            </div>

            {/* Certifications Card with Real Certificate Link/View */}
            <div
              style={{
                background: "var(--surface)",
                borderRadius: "20px",
                border: "1px solid var(--border)",
                padding: "24px",
                boxShadow: "0 8px 30px rgba(0, 0, 0, 0.25)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "16px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "1.2rem" }}>📜</span>
                  <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "700" }}>
                    Certifications ({user?.certifications?.length || 0})
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setCertFormData({ name: "", completed: "", issuer: "", certificateUrl: "" });
                    setCertFileName("");
                    setCertUploadError("");
                    setShowAddCertModal(true);
                  }}
                  style={{
                    background: "var(--primary-light)",
                    border: "1px solid var(--primary-border)",
                    borderRadius: "8px",
                    padding: "5px 12px",
                    color: "var(--primary)",
                    fontSize: "0.8rem",
                    fontWeight: "700",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "var(--primary)";
                    e.currentTarget.style.color = "#ffffff";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "var(--primary-light)";
                    e.currentTarget.style.color = "var(--primary)";
                  }}
                >
                  + Add Certificate
                </button>
              </div>

              {user?.certifications && user.certifications.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {user.certifications.map((cert, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: "var(--surface-2)",
                        border: "1px solid var(--border)",
                        borderRadius: "12px",
                        padding: "12px 16px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "12px",
                        flexWrap: "wrap",
                      }}
                    >
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div
                          style={{
                            fontWeight: "700",
                            fontSize: "0.9rem",
                            color: "var(--text-primary)",
                            marginBottom: "2px",
                          }}
                        >
                          {cert.name}
                        </div>
                        <div
                          style={{
                            fontSize: "0.78rem",
                            color: "var(--text-muted)",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            flexWrap: "wrap",
                          }}
                        >
                          {cert.issuer && (
                            <span
                              style={{
                                background: "rgba(99, 102, 241, 0.12)",
                                color: "var(--primary)",
                                padding: "2px 8px",
                                borderRadius: "4px",
                                fontWeight: "600",
                                fontSize: "0.72rem",
                              }}
                            >
                              {cert.issuer}
                            </span>
                          )}
                          {cert.completed && <span>{cert.completed}</span>}
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        {cert.certificateUrl && (
                          <a
                            href={getFullUrl(cert.certificateUrl)}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "5px",
                              background: "rgba(16, 185, 129, 0.15)",
                              border: "1px solid rgba(16, 185, 129, 0.35)",
                              color: "var(--success)",
                              borderRadius: "6px",
                              padding: "4px 10px",
                              fontSize: "0.75rem",
                              fontWeight: "700",
                              textDecoration: "none",
                              transition: "all 0.2s",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = "var(--success)";
                              e.currentTarget.style.color = "#ffffff";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = "rgba(16, 185, 129, 0.15)";
                              e.currentTarget.style.color = "var(--success)";
                            }}
                            title="Open Real Certificate"
                          >
                            📄 View File ↗
                          </a>
                        )}

                        <button
                          type="button"
                          onClick={() => handleDeleteCertification(idx)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "var(--text-muted)",
                            cursor: "pointer",
                            fontSize: "0.85rem",
                            padding: "4px",
                            transition: "color 0.2s",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--error)")}
                          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
                          title="Delete certification"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  style={{
                    background: "var(--surface-2)",
                    border: "1px dashed var(--border)",
                    borderRadius: "12px",
                    padding: "20px",
                    textAlign: "center",
                    color: "var(--text-muted)",
                    fontSize: "0.85rem",
                  }}
                >
                  No certifications listed yet. Click <strong>+ Add Certificate</strong> to upload your credential document or verification link!
                </div>
              )}
            </div>
          </div>

          {/* ════ RIGHT COLUMN: My Projects ════ */}
          <div
            style={{
              background: "var(--surface)",
              borderRadius: "20px",
              border: "1px solid var(--border)",
              padding: "24px",
              boxShadow: "0 8px 30px rgba(0, 0, 0, 0.25)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "18px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "1.2rem" }}>💼</span>
                <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "700" }}>
                  My Projects ({projects.length})
                </h3>
              </div>

              <Link
                to="/projects/create"
                style={{
                  background: "var(--primary-light)",
                  color: "var(--primary)",
                  border: "1px solid var(--primary-border)",
                  borderRadius: "8px",
                  padding: "6px 12px",
                  fontSize: "0.78rem",
                  fontWeight: "700",
                  textDecoration: "none",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--primary)";
                  e.currentTarget.style.color = "#ffffff";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "var(--primary-light)";
                  e.currentTarget.style.color = "var(--primary)";
                }}
              >
                + Create Project
              </Link>
            </div>

            {projects.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {projects.map((proj) => (
                  <div
                    key={proj._id}
                    style={{
                      background: "var(--surface-2)",
                      border: "1px solid var(--border)",
                      borderRadius: "12px",
                      padding: "14px",
                      transition: "border-color 0.2s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--primary-border)")}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: "10px",
                        marginBottom: "4px",
                      }}
                    >
                      <Link
                        to={`/projects/${proj._id}`}
                        style={{
                          fontSize: "0.95rem",
                          fontWeight: "700",
                          color: "var(--text-primary)",
                          textDecoration: "none",
                        }}
                      >
                        {proj.title}
                      </Link>

                      <span
                        style={{
                          fontSize: "0.7rem",
                          fontWeight: "700",
                          padding: "2px 8px",
                          borderRadius: "6px",
                          background:
                            proj.status === "Completed"
                              ? "var(--success-bg)"
                              : proj.status === "In Progress"
                                ? "var(--info-bg)"
                                : "var(--warning-bg)",
                          color:
                            proj.status === "Completed"
                              ? "var(--success)"
                              : proj.status === "In Progress"
                                ? "var(--info)"
                                : "var(--warning)",
                          border: `1px solid ${proj.status === "Completed"
                            ? "var(--success-border)"
                            : proj.status === "In Progress"
                              ? "var(--info-border)"
                              : "var(--warning-border)"
                            }`,
                        }}
                      >
                        {proj.status || "Planning"}
                      </span>
                    </div>

                    <p
                      style={{
                        fontSize: "0.82rem",
                        color: "var(--text-muted)",
                        margin: "0 0 10px",
                        lineHeight: "1.4",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {proj.description}
                    </p>

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: "8px",
                      }}
                    >
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                        {(proj.technologies || []).slice(0, 3).map((tag, idx) => (
                          <span
                            key={idx}
                            style={{
                              background: "rgba(255, 255, 255, 0.05)",
                              color: "var(--text-secondary)",
                              fontSize: "0.7rem",
                              fontWeight: "600",
                              padding: "2px 6px",
                              borderRadius: "4px",
                            }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                        <button
                          type="button"
                          onClick={() => navigate(`/projects/${proj._id}/edit`)}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            fontSize: "0.78rem",
                            color: "var(--primary)",
                            fontWeight: "600",
                            padding: 0,
                          }}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteProjectId(proj._id)}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            fontSize: "0.78rem",
                            color: "var(--error)",
                            fontWeight: "600",
                            padding: 0,
                          }}
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div
                style={{
                  background: "var(--surface-2)",
                  border: "1px dashed var(--border)",
                  borderRadius: "12px",
                  padding: "32px 16px",
                  textAlign: "center",
                }}
              >
                <p style={{ margin: "0 0 10px", fontSize: "0.875rem", color: "var(--text-muted)" }}>
                  You haven't created any projects yet.
                </p>
                <Link
                  to="/projects/create"
                  style={{
                    display: "inline-block",
                    background: "var(--primary)",
                    color: "#ffffff",
                    borderRadius: "8px",
                    padding: "6px 14px",
                    fontSize: "0.8rem",
                    fontWeight: "700",
                    textDecoration: "none",
                  }}
                >
                  Create Your First Project
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL 1: FULL PROFILE EDIT
         ═══════════════════════════════════════════════════════════════════════ */}
      {showEditModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 999,
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "var(--surface)",
              borderRadius: "20px",
              border: "1px solid var(--border)",
              width: "100%",
              maxWidth: "600px",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "26px",
              boxShadow: "0 24px 60px rgba(0, 0, 0, 0.8)",
              color: "var(--text-primary)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
              }}
            >
              <h2 style={{ margin: 0, fontSize: "1.3rem", fontWeight: "800" }}>
                Edit Profile
              </h2>
              <button
                onClick={() => setShowEditModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "1.2rem",
                  cursor: "pointer",
                  color: "var(--text-muted)",
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdate}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "14px",
                  marginBottom: "14px",
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.82rem",
                      fontWeight: "700",
                      marginBottom: "6px",
                      color: "var(--text-secondary)",
                    }}
                  >
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: "8px",
                      border: "1px solid var(--border)",
                      background: "var(--surface-2)",
                      color: "var(--text-primary)",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.82rem",
                      fontWeight: "700",
                      marginBottom: "6px",
                      color: "var(--text-secondary)",
                    }}
                  >
                    Professional Title
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="e.g. Full-stack Developer"
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: "8px",
                      border: "1px solid var(--border)",
                      background: "var(--surface-2)",
                      color: "var(--text-primary)",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "14px",
                  marginBottom: "14px",
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.82rem",
                      fontWeight: "700",
                      marginBottom: "6px",
                      color: "var(--text-secondary)",
                    }}
                  >
                    Location
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="e.g. Karachi, Pakistan / Remote"
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: "8px",
                      border: "1px solid var(--border)",
                      background: "var(--surface-2)",
                      color: "var(--text-primary)",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.82rem",
                      fontWeight: "700",
                      marginBottom: "6px",
                      color: "var(--text-secondary)",
                    }}
                  >
                    Experience
                  </label>
                  <input
                    type="text"
                    name="experience"
                    value={formData.experience}
                    onChange={handleChange}
                    placeholder="e.g. 3+ Years Experience"
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: "8px",
                      border: "1px solid var(--border)",
                      background: "var(--surface-2)",
                      color: "var(--text-primary)",
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: "14px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.82rem",
                    fontWeight: "700",
                    marginBottom: "6px",
                    color: "var(--text-secondary)",
                  }}
                >
                  Education
                </label>
                <input
                  type="text"
                  name="education"
                  value={formData.education}
                  onChange={handleChange}
                  placeholder="e.g. BS in Computer Science - FAST NUCES"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: "1px solid var(--border)",
                    background: "var(--surface-2)",
                    color: "var(--text-primary)",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ marginBottom: "14px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.82rem",
                    fontWeight: "700",
                    marginBottom: "6px",
                    color: "var(--text-secondary)",
                  }}
                >
                  Bio / Summary
                </label>
                <textarea
                  name="bio"
                  rows="3"
                  value={formData.bio}
                  onChange={handleChange}
                  placeholder="Tell other developers about yourself..."
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: "1px solid var(--border)",
                    background: "var(--surface-2)",
                    color: "var(--text-primary)",
                    outline: "none",
                    fontFamily: "inherit",
                    resize: "vertical",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: "10px",
                  marginBottom: "20px",
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.78rem",
                      fontWeight: "700",
                      marginBottom: "6px",
                      color: "var(--text-secondary)",
                    }}
                  >
                    GitHub
                  </label>
                  <input
                    type="text"
                    name="github"
                    value={formData.github}
                    onChange={handleChange}
                    placeholder="github.com/username"
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      borderRadius: "8px",
                      border: "1px solid var(--border)",
                      background: "var(--surface-2)",
                      color: "var(--text-primary)",
                      outline: "none",
                      boxSizing: "border-box",
                      fontSize: "0.82rem",
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.78rem",
                      fontWeight: "700",
                      marginBottom: "6px",
                      color: "var(--text-secondary)",
                    }}
                  >
                    LinkedIn
                  </label>
                  <input
                    type="text"
                    name="linkedin"
                    value={formData.linkedin}
                    onChange={handleChange}
                    placeholder="linkedin.com/in/user"
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      borderRadius: "8px",
                      border: "1px solid var(--border)",
                      background: "var(--surface-2)",
                      color: "var(--text-primary)",
                      outline: "none",
                      boxSizing: "border-box",
                      fontSize: "0.82rem",
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.78rem",
                      fontWeight: "700",
                      marginBottom: "6px",
                      color: "var(--text-secondary)",
                    }}
                  >
                    Portfolio
                  </label>
                  <input
                    type="text"
                    name="portfolio"
                    value={formData.portfolio}
                    onChange={handleChange}
                    placeholder="myportfolio.com"
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      borderRadius: "8px",
                      border: "1px solid var(--border)",
                      background: "var(--surface-2)",
                      color: "var(--text-primary)",
                      outline: "none",
                      boxSizing: "border-box",
                      fontSize: "0.82rem",
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  style={{
                    background: "var(--surface-2)",
                    border: "1px solid var(--border)",
                    color: "var(--text-secondary)",
                    borderRadius: "8px",
                    padding: "8px 16px",
                    fontSize: "0.85rem",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    background: "var(--primary)",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "8px",
                    padding: "8px 20px",
                    fontSize: "0.85rem",
                    fontWeight: "700",
                    cursor: "pointer",
                  }}
                >
                  {saving ? "Saving..." : "Save Profile"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL 2: ADD CERTIFICATION (With Real Certificate Upload & Link)
         ═══════════════════════════════════════════════════════════════════════ */}
      {showAddCertModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 999,
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "var(--surface)",
              borderRadius: "20px",
              border: "1px solid var(--border)",
              width: "100%",
              maxWidth: "460px",
              padding: "26px",
              boxShadow: "0 24px 60px rgba(0, 0, 0, 0.8)",
              color: "var(--text-primary)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
              }}
            >
              <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: "800" }}>
                Add Certification
              </h3>
              <button
                onClick={() => setShowAddCertModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--text-muted)",
                  fontSize: "1.2rem",
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCertification}>
              <div style={{ marginBottom: "14px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.82rem",
                    fontWeight: "700",
                    marginBottom: "6px",
                    color: "var(--text-secondary)",
                  }}
                >
                  Certification Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. AWS Certified Solutions Architect"
                  value={certFormData.name}
                  onChange={(e) => setCertFormData({ ...certFormData, name: e.target.value })}
                  required
                  autoFocus
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: "8px",
                    border: "1px solid var(--border)",
                    background: "var(--surface-2)",
                    color: "var(--text-primary)",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ marginBottom: "14px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.82rem",
                    fontWeight: "700",
                    marginBottom: "6px",
                    color: "var(--text-secondary)",
                  }}
                >
                  Issuing Organization
                </label>
                <input
                  type="text"
                  placeholder="e.g. AWS, Google Cloud, Meta, Coursera"
                  value={certFormData.issuer}
                  onChange={(e) => setCertFormData({ ...certFormData, issuer: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: "8px",
                    border: "1px solid var(--border)",
                    background: "var(--surface-2)",
                    color: "var(--text-primary)",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ marginBottom: "14px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.82rem",
                    fontWeight: "700",
                    marginBottom: "6px",
                    color: "var(--text-secondary)",
                  }}
                >
                  Issue Date / Year
                </label>
                <input
                  type="text"
                  placeholder="e.g. Aug 2024 or 2024"
                  value={certFormData.completed}
                  onChange={(e) => setCertFormData({ ...certFormData, completed: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: "8px",
                    border: "1px solid var(--border)",
                    background: "var(--surface-2)",
                    color: "var(--text-primary)",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* ── REAL CERTIFICATE UPLOAD SECTION ── */}
              <div
                style={{
                  background: "var(--surface-2)",
                  border: "1px dashed var(--border)",
                  borderRadius: "12px",
                  padding: "14px",
                  marginBottom: "16px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "8px",
                  }}
                >
                  <label
                    style={{
                      fontSize: "0.82rem",
                      fontWeight: "700",
                      color: "var(--text-primary)",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    📄 Upload Real Certificate (PDF or Image)
                  </label>
                </div>

                <input
                  ref={certFileInputRef}
                  type="file"
                  accept="application/pdf,image/jpeg,image/jpg,image/png,image/webp"
                  style={{ display: "none" }}
                  onChange={handleCertificateFileUpload}
                />

                {certFormData.certificateUrl ? (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      background: "rgba(16, 185, 129, 0.12)",
                      border: "1px solid var(--success-border)",
                      borderRadius: "8px",
                      padding: "8px 12px",
                      marginTop: "6px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        fontSize: "0.82rem",
                        color: "var(--success)",
                        fontWeight: "600",
                        minWidth: 0,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <span>✅ Attached:</span>
                      <span style={{ textDecoration: "underline" }}>
                        {certFileName || "Certificate Document"}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setCertFormData((prev) => ({ ...prev, certificateUrl: "" }));
                        setCertFileName("");
                      }}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--error)",
                        cursor: "pointer",
                        fontSize: "0.8rem",
                        padding: "2px 6px",
                      }}
                      title="Remove certificate attachment"
                    >
                      ✕ Remove
                    </button>
                  </div>
                ) : (
                  <div>
                    <button
                      type="button"
                      disabled={uploadingCert}
                      onClick={() => certFileInputRef.current?.click()}
                      style={{
                        width: "100%",
                        background: "rgba(99, 102, 241, 0.12)",
                        border: "1px solid var(--primary-border)",
                        borderRadius: "8px",
                        padding: "10px 14px",
                        color: "var(--primary)",
                        fontSize: "0.85rem",
                        fontWeight: "700",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(99, 102, 241, 0.2)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(99, 102, 241, 0.12)")}
                    >
                      {uploadingCert ? "⏳ Uploading Certificate..." : "📁 Click to Choose Certificate File (PDF/Image)"}
                    </button>
                    <p style={{ margin: "6px 0 0", fontSize: "0.72rem", color: "var(--text-muted)", textAlign: "center" }}>
                      Supports PDF, PNG, JPG, WEBP (Max 10MB)
                    </p>
                  </div>
                )}

                {certUploadError && (
                  <p style={{ color: "var(--error)", fontSize: "0.75rem", margin: "6px 0 0" }}>
                    ⚠️ {certUploadError}
                  </p>
                )}

                {/* OR Direct External Credential Link */}
                <div style={{ marginTop: "12px", borderTop: "1px solid var(--border)", paddingTop: "10px" }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.75rem",
                      fontWeight: "600",
                      color: "var(--text-muted)",
                      marginBottom: "4px",
                    }}
                  >
                    OR External Credential / Verification URL
                  </label>
                  <input
                    type="text"
                    placeholder="https://credly.com/badges/... or coursera.org/verify/..."
                    value={certFormData.certificateUrl}
                    onChange={(e) => setCertFormData({ ...certFormData, certificateUrl: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "8px 10px",
                      borderRadius: "6px",
                      border: "1px solid var(--border)",
                      background: "var(--surface)",
                      color: "var(--text-primary)",
                      outline: "none",
                      fontSize: "0.8rem",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => setShowAddCertModal(false)}
                  style={{
                    background: "var(--surface-2)",
                    border: "1px solid var(--border)",
                    color: "var(--text-secondary)",
                    borderRadius: "8px",
                    padding: "8px 16px",
                    fontSize: "0.82rem",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!certFormData.name.trim() || uploadingCert}
                  style={{
                    background: "var(--primary)",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "8px",
                    padding: "8px 18px",
                    fontSize: "0.82rem",
                    fontWeight: "700",
                    cursor: "pointer",
                    opacity: !certFormData.name.trim() || uploadingCert ? 0.6 : 1,
                  }}
                >
                  {uploadingCert ? "Please wait..." : "Save Certification"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL 3: DELETE PROJECT CONFIRMATION
         ═══════════════════════════════════════════════════════════════════════ */}
      {deleteProjectId && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 999,
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "var(--surface)",
              borderRadius: "20px",
              border: "1px solid var(--border)",
              width: "100%",
              maxWidth: "380px",
              padding: "24px",
              boxShadow: "0 24px 60px rgba(0, 0, 0, 0.8)",
              textAlign: "center",
              color: "var(--text-primary)",
            }}
          >
            <div style={{ fontSize: "2.2rem", marginBottom: "10px" }}>🗑️</div>
            <h3 style={{ margin: "0 0 8px", fontSize: "1.15rem", fontWeight: "800" }}>
              Delete this project?
            </h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: "0 0 20px" }}>
              This action cannot be undone. All project details and data will be removed.
            </p>
            <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
              <button
                type="button"
                onClick={() => setDeleteProjectId(null)}
                style={{
                  background: "var(--surface-2)",
                  border: "1px solid var(--border)",
                  color: "var(--text-secondary)",
                  borderRadius: "8px",
                  padding: "8px 16px",
                  fontSize: "0.85rem",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deletingProject}
                onClick={handleDeleteProject}
                style={{
                  background: "var(--error)",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "8px",
                  padding: "8px 18px",
                  fontSize: "0.85rem",
                  fontWeight: "700",
                  cursor: "pointer",
                }}
              >
                {deletingProject ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;