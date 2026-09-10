import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
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
  const [showAddSkillModal, setShowAddSkillModal] = useState(false);
  const [showAddCertModal, setShowAddCertModal] = useState(false);
  const [showDeleteProjectModal, setShowDeleteProjectModal] = useState(null); // holds project id
  const [deletingProjectId, setDeletingProjectId] = useState(null);

  // Add / Edit Skill state
  const [skillInputName, setSkillInputName] = useState("");
  const [skillInputPercent, setSkillInputPercent] = useState(85);
  const [editingSkillIndex, setEditingSkillIndex] = useState(null);

  // Add / Edit Certification state
  const [certFormData, setCertFormData] = useState({
    name: "",
    completed: "",
    issuer: "",
  });
  const [editingCertIndex, setEditingCertIndex] = useState(null);

  // Image upload state
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState("");
  const fileInputRef = useRef(null);

  // Main Form Data
  const [formData, setFormData] = useState({
    name: "",
    title: "",
    bio: "",
    skills: [],
    github: "",
    linkedin: "",
    portfolio: "",
    location: "",
    experience: "",
    education: "",
    educationYears: "",
    certifications: [],
  });

  // ── Fetch Profile & Projects ───────────────────────────────────────────────
  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const [profileRes, projectsRes] = await Promise.allSettled([
        api.get("/api/users/profile"),
        api.get("/api/projects/my"),
      ]);

      if (profileRes.status === "fulfilled") {
        const userData = profileRes.value.data.user;
        setUser(userData);

        const eduParts = (userData.education || "").split(" - ");

        setFormData({
          name: userData.name || "",
          title: userData.title || "",
          bio: userData.bio || "",
          skills: userData.skills || [],
          github: userData.github || "",
          linkedin: userData.linkedin || "",
          portfolio: userData.portfolio || "",
          location: userData.location || "",
          experience: userData.experience || "",
          education: eduParts[0] || "",
          educationYears: eduParts[1] || "",
          certifications: userData.certifications || [],
        });
      }

      if (projectsRes.status === "fulfilled") {
        setProjects(projectsRes.value.data.projects || []);
      }
    } catch (err) {
      setError("Unable to load profile data");
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

  // ── Image Handlers (Upload & Delete) ───────────────────────────────────────
  const handleImageChange = (e) => {
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

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleImageUpload = async () => {
    if (!imageFile) return;

    setUploadingImage(true);
    setImageError("");
    const form = new FormData();
    form.append("profileImage", imageFile);

    try {
      const response = await api.post("/api/users/profile/image", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const newImageUrl = response.data.profileImage;
      setUser((prev) => ({ ...prev, profileImage: newImageUrl }));
      setImagePreview("");
      setImageFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setSuccessMessage("Profile photo uploaded successfully!");
      await refreshProfile();
    } catch (err) {
      setImageError(err.response?.data?.message || "Image upload failed.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = async () => {
    if (!window.confirm("Are you sure you want to remove your profile photo?")) return;
    try {
      setUploadingImage(true);
      const res = await api.put("/api/users/profile", { profileImage: "" });
      setUser(res.data.user);
      setImagePreview("");
      setImageFile(null);
      setSuccessMessage("Profile photo removed.");
      await refreshProfile();
    } catch (err) {
      setError("Failed to remove profile photo.");
    } finally {
      setUploadingImage(false);
    }
  };

  // ── Save Full Profile ──────────────────────────────────────────────────────
  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccessMessage("");

    try {
      const fullEducation = formData.educationYears
        ? `${formData.education.trim()} - ${formData.educationYears.trim()}`
        : formData.education.trim();

      const response = await api.put("/api/users/profile", {
        name: formData.name,
        title: formData.title,
        bio: formData.bio,
        skills: formData.skills,
        github: formData.github,
        linkedin: formData.linkedin,
        portfolio: formData.portfolio,
        location: formData.location,
        experience: formData.experience,
        education: fullEducation,
        certifications: formData.certifications,
      });

      const updatedUser = response.data.user;
      setUser(updatedUser);
      setShowEditModal(false);
      setSuccessMessage("Profile updated successfully!");
      await refreshProfile();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  // ── SKILLS CRUD ────────────────────────────────────────────────────────────
  const openAddSkillModal = (index = null) => {
    if (index !== null) {
      // Edit existing skill
      const current = user?.skills?.[index] || "";
      const match = current.match(/^(.+?)\s*(?:\(([0-9]{1,3})%\))?$/);
      setSkillInputName(match ? match[1].trim() : current);
      setSkillInputPercent(match && match[2] ? Number(match[2]) : 85);
      setEditingSkillIndex(index);
    } else {
      setSkillInputName("");
      setSkillInputPercent(85);
      setEditingSkillIndex(null);
    }
    setShowAddSkillModal(true);
  };

  const handleSaveSkill = async () => {
    if (!skillInputName.trim()) return;

    const skillStr = `${skillInputName.trim()} (${skillInputPercent}%)`;
    let updatedSkills = [...(user?.skills || [])];

    if (editingSkillIndex !== null) {
      updatedSkills[editingSkillIndex] = skillStr;
    } else {
      updatedSkills.push(skillStr);
    }

    try {
      const res = await api.put("/api/users/profile", { skills: updatedSkills });
      setUser(res.data.user);
      setFormData((prev) => ({ ...prev, skills: res.data.user.skills }));
      setShowAddSkillModal(false);
      setSuccessMessage(
        editingSkillIndex !== null ? "Skill updated!" : `Skill "${skillStr}" added!`
      );
    } catch (err) {
      setError("Failed to save skill.");
    }
  };

  const handleDeleteSkill = async (indexToDelete) => {
    const skillToDelete = user?.skills?.[indexToDelete];
    if (!window.confirm(`Delete skill "${skillToDelete}"?`)) return;

    const updatedSkills = user.skills.filter((_, idx) => idx !== indexToDelete);

    try {
      const res = await api.put("/api/users/profile", { skills: updatedSkills });
      setUser(res.data.user);
      setFormData((prev) => ({ ...prev, skills: res.data.user.skills }));
      setSuccessMessage("Skill deleted successfully.");
    } catch (err) {
      setError("Failed to delete skill.");
    }
  };

  // ── CERTIFICATIONS CRUD ────────────────────────────────────────────────────
  const openAddCertModal = (index = null) => {
    if (index !== null) {
      const cert = user?.certifications?.[index] || {};
      setCertFormData({
        name: cert.name || "",
        completed: cert.completed || "",
        issuer: cert.issuer || "",
      });
      setEditingCertIndex(index);
    } else {
      setCertFormData({ name: "", completed: "", issuer: "" });
      setEditingCertIndex(null);
    }
    setShowAddCertModal(true);
  };

  const handleSaveCertification = async () => {
    if (!certFormData.name.trim()) return;

    let updatedCerts = [...(user?.certifications || [])];

    if (editingCertIndex !== null) {
      updatedCerts[editingCertIndex] = certFormData;
    } else {
      updatedCerts.push(certFormData);
    }

    try {
      const res = await api.put("/api/users/profile", { certifications: updatedCerts });
      setUser(res.data.user);
      setFormData((prev) => ({ ...prev, certifications: res.data.user.certifications }));
      setShowAddCertModal(false);
      setSuccessMessage(
        editingCertIndex !== null ? "Certification updated!" : "Certification added!"
      );
    } catch (err) {
      setError("Failed to save certification.");
    }
  };

  const handleDeleteCertification = async (indexToDelete) => {
    const cert = user?.certifications?.[indexToDelete];
    if (!window.confirm(`Delete certification "${cert?.name}"?`)) return;

    const updatedCerts = user.certifications.filter((_, idx) => idx !== indexToDelete);

    try {
      const res = await api.put("/api/users/profile", { certifications: updatedCerts });
      setUser(res.data.user);
      setFormData((prev) => ({ ...prev, certifications: res.data.user.certifications }));
      setSuccessMessage("Certification deleted.");
    } catch (err) {
      setError("Failed to delete certification.");
    }
  };

  // ── PROJECT DELETE ─────────────────────────────────────────────────────────
  const handleDeleteProject = async (projectId) => {
    try {
      setDeletingProjectId(projectId);
      await api.delete(`/api/projects/${projectId}`);
      setProjects((prev) => prev.filter((p) => p._id !== projectId));
      setShowDeleteProjectModal(null);
      setSuccessMessage("Project deleted successfully.");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete project.");
    } finally {
      setDeletingProjectId(null);
    }
  };

  // ── Social Link Disconnect ─────────────────────────────────────────────────
  const handleClearSocialLink = async (field) => {
    if (!window.confirm(`Disconnect ${field}?`)) return;
    try {
      const res = await api.put("/api/users/profile", { [field]: "" });
      setUser(res.data.user);
      setFormData((prev) => ({ ...prev, [field]: "" }));
      setSuccessMessage(`${field} disconnected.`);
    } catch (err) {
      setError(`Failed to disconnect ${field}`);
    }
  };

  // ── Helper parsing ─────────────────────────────────────────────────────────
  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "DC";

  const linkHref = (url) =>
    url && !url.startsWith("http") ? `https://${url}` : url;

  // Extract GitHub username if available
  const extractGithubUsername = (urlOrName) => {
    if (!urlOrName) return "";
    const clean = urlOrName.trim().replace(/\/$/, "");
    if (clean.includes("github.com/")) {
      return clean.split("github.com/").pop().split("/")[0];
    }
    return clean.replace(/^@/, "");
  };

  const githubUsername = extractGithubUsername(user?.github);

  // Parse skills
  const parsedSkills = (user?.skills || []).map((skillStr) => {
    const match = skillStr.match(/^(.+?)\s*(?:\(([0-9]{1,3})%\))?$/);
    if (match) {
      return { name: match[1], percent: match[2] || null, raw: skillStr };
    }
    return { name: skillStr, percent: null, raw: skillStr };
  });

  const currentCerts = user?.certifications || [];

  if (loading) {
    return (
      <div
        className="page-container"
        style={{
          minHeight: "80vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div className="loading-container">Loading your real profile...</div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #f8fafc 0%, #edf2f7 100%)",
        padding: "32px 20px 60px",
      }}
    >
      <div style={{ maxWidth: "1180px", margin: "0 auto" }}>
        {/* Centered Page Title */}
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <h1
            style={{
              fontSize: "2.6rem",
              fontWeight: "800",
              color: "#1e1b4b",
              letterSpacing: "-0.5px",
              margin: 0,
            }}
          >
            My Profile
          </h1>
        </div>

        {/* Global Notifications */}
        {successMessage && (
          <div
            className="alert alert-success"
            style={{
              marginBottom: "20px",
              boxShadow: "0 4px 12px rgba(16, 185, 129, 0.15)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>✅ {successMessage}</span>
            <button
              onClick={() => setSuccessMessage("")}
              style={{ background: "none", border: "none", cursor: "pointer", fontWeight: "bold" }}
            >
              ✕
            </button>
          </div>
        )}

        {error && (
          <div
            className="alert alert-error"
            style={{
              marginBottom: "20px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>⚠️ {error}</span>
            <button
              onClick={() => setError("")}
              style={{ background: "none", border: "none", cursor: "pointer", fontWeight: "bold" }}
            >
              ✕
            </button>
          </div>
        )}

        {/* 2-Column Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
            gap: "24px",
            alignItems: "start",
          }}
        >
          {/* ═══════════════════════════════════════════════════════════════════
              LEFT COLUMN — Main Profile Card (100% Real, Editable, Deletable)
             ═══════════════════════════════════════════════════════════════════ */}
          <div
            style={{
              gridColumn: "span 2",
              background: "#ffffff",
              borderRadius: "24px",
              border: "1.5px solid #e2e8f0",
              padding: "36px 32px",
              boxShadow: "0 10px 30px -5px rgba(0, 0, 0, 0.04)",
              position: "relative",
            }}
          >
            {/* Top User Info Section */}
            <div
              style={{
                display: "flex",
                gap: "28px",
                alignItems: "flex-start",
                flexWrap: "wrap",
                marginBottom: "32px",
              }}
            >
              {/* Avatar + Status + Edit Controls */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  minWidth: "130px",
                }}
              >
                <div style={{ position: "relative" }}>
                  <div
                    style={{
                      width: "110px",
                      height: "110px",
                      borderRadius: "50%",
                      overflow: "hidden",
                      border: "3px solid #e2e8f0",
                      background: "linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#3730a3",
                      fontSize: "36px",
                      fontWeight: "700",
                      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.06)",
                    }}
                  >
                    {imagePreview || user?.profileImage ? (
                      <img
                        src={imagePreview || user.profileImage}
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
                      bottom: "6px",
                      right: "8px",
                      width: "16px",
                      height: "16px",
                      borderRadius: "50%",
                      backgroundColor: "#22c55e",
                      border: "2.5px solid #ffffff",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    }}
                    title="Online"
                  />
                </div>

                {/* Online Indicator */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    marginTop: "6px",
                    marginBottom: "12px",
                    fontSize: "0.85rem",
                    fontWeight: "600",
                    color: "#15803d",
                  }}
                >
                  <span
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      backgroundColor: "#22c55e",
                    }}
                  />
                  Online
                </div>

                {/* Edit Profile Pill Button */}
                <button
                  type="button"
                  onClick={() => setShowEditModal(true)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    background: "linear-gradient(135deg, #3730a3 0%, #4f46e5 100%)",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "9999px",
                    padding: "8px 18px",
                    fontSize: "0.85rem",
                    fontWeight: "600",
                    cursor: "pointer",
                    boxShadow: "0 4px 12px rgba(79, 70, 229, 0.25)",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-1px)")}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
                >
                  ✏️ Edit Profile
                </button>

                {/* Hidden File Input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  style={{ display: "none" }}
                  onChange={handleImageChange}
                />

                <div style={{ display: "flex", gap: "8px", marginTop: "8px", alignItems: "center" }}>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#6366f1",
                      fontSize: "0.76rem",
                      fontWeight: "600",
                      cursor: "pointer",
                      textDecoration: "underline",
                    }}
                  >
                    📷 Upload Photo
                  </button>

                  {user?.profileImage && (
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      disabled={uploadingImage}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#ef4444",
                        fontSize: "0.76rem",
                        fontWeight: "600",
                        cursor: "pointer",
                        textDecoration: "underline",
                      }}
                      title="Delete profile picture"
                    >
                      🗑️ Remove
                    </button>
                  )}
                </div>

                {imageFile && (
                  <div style={{ marginTop: "8px", textAlign: "center" }}>
                    <button
                      type="button"
                      onClick={handleImageUpload}
                      disabled={uploadingImage}
                      style={{
                        background: "#10b981",
                        color: "white",
                        border: "none",
                        borderRadius: "6px",
                        padding: "4px 8px",
                        fontSize: "0.75rem",
                        cursor: "pointer",
                      }}
                    >
                      {uploadingImage ? "Saving..." : "Confirm Upload"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview("");
                      }}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#ef4444",
                        fontSize: "0.72rem",
                        cursor: "pointer",
                        marginLeft: "6px",
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                )}
                {imageError && (
                  <span style={{ color: "#ef4444", fontSize: "0.72rem", marginTop: "4px" }}>
                    {imageError}
                  </span>
                )}
              </div>

              {/* Name, Role & Bio */}
              <div style={{ flex: 1, minWidth: "260px" }}>
                {/* User Name with Edit Icon */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "14px",
                  }}
                >
                  <h2
                    style={{
                      fontSize: "2rem",
                      fontWeight: "800",
                      color: "#0f172a",
                      margin: 0,
                    }}
                  >
                    {user?.name || "Developer"}
                  </h2>
                  <button
                    onClick={() => setShowEditModal(true)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#64748b",
                      fontSize: "1.1rem",
                    }}
                    title="Edit Name"
                  >
                    ✏️
                  </button>
                </div>

                {/* Professional Title/Role */}
                <div style={{ marginBottom: "16px" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "6px",
                    }}
                  >
                    <label
                      style={{
                        fontSize: "0.85rem",
                        fontWeight: "700",
                        color: "#1e293b",
                      }}
                    >
                      Professional Title/Role
                    </label>
                    <button
                      onClick={() => setShowEditModal(true)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "#64748b",
                        fontSize: "0.85rem",
                      }}
                      title="Edit Title/Role"
                    >
                      ✏️ Edit
                    </button>
                  </div>
                  <div
                    style={{
                      background: "#f1f5f9",
                      border: "1px solid #e2e8f0",
                      borderRadius: "10px",
                      padding: "10px 14px",
                      fontSize: "0.92rem",
                      fontWeight: "500",
                      color: user?.title ? "#334155" : "#94a3b8",
                      fontStyle: user?.title ? "normal" : "italic",
                    }}
                  >
                    {user?.title || "No professional title set. Click Edit to add one."}
                  </div>
                </div>

                {/* Personal Bio */}
                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "6px",
                    }}
                  >
                    <label
                      style={{
                        fontSize: "0.85rem",
                        fontWeight: "700",
                        color: "#1e293b",
                      }}
                    >
                      Personal Bio
                    </label>
                    <button
                      onClick={() => setShowEditModal(true)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "#64748b",
                        fontSize: "0.85rem",
                      }}
                      title="Edit Bio"
                    >
                      ✏️ Edit
                    </button>
                  </div>
                  <div
                    style={{
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      borderRadius: "10px",
                      padding: "12px 14px",
                      fontSize: "0.9rem",
                      lineHeight: "1.6",
                      color: user?.bio ? "#475569" : "#94a3b8",
                      fontStyle: user?.bio ? "normal" : "italic",
                    }}
                  >
                    {user?.bio || "No personal bio added yet. Click Edit to tell others about yourself."}
                  </div>
                </div>
              </div>
            </div>

            {/* Divider */}
            <hr style={{ border: "none", borderTop: "1px solid #f1f5f9", margin: "24px 0" }} />

            {/* ── Skills & Expertise Section (Real CRUD) ──────────────────── */}
            <div style={{ marginBottom: "32px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "16px",
                  flexWrap: "wrap",
                  gap: "12px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "1.2rem" }}>🛠️</span>
                  <h3
                    style={{
                      margin: 0,
                      fontSize: "1.15rem",
                      fontWeight: "700",
                      color: "#1e293b",
                    }}
                  >
                    Skills &amp; Expertise ({parsedSkills.length})
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => openAddSkillModal()}
                  style={{
                    background: "linear-gradient(135deg, #fed7aa 0%, #fdba74 100%)",
                    color: "#9a3412",
                    border: "none",
                    borderRadius: "9999px",
                    padding: "8px 20px",
                    fontSize: "0.85rem",
                    fontWeight: "700",
                    cursor: "pointer",
                    boxShadow: "0 2px 8px rgba(251, 146, 60, 0.25)",
                    transition: "transform 0.15s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.03)")}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                >
                  + Add Skill
                </button>
              </div>

              {parsedSkills.length > 0 ? (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
                  {parsedSkills.map((skill, i) => (
                    <div
                      key={i}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "10px",
                        background: "#f1f5f9",
                        borderRadius: "12px",
                        padding: "8px 14px",
                        border: "1px solid #e2e8f0",
                        position: "relative",
                      }}
                    >
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span
                          style={{
                            fontWeight: "700",
                            fontSize: "0.92rem",
                            color: "#1e293b",
                          }}
                        >
                          {skill.name}
                        </span>
                        {skill.percent && (
                          <span
                            style={{
                              fontSize: "0.74rem",
                              fontWeight: "600",
                              color: "#64748b",
                            }}
                          >
                            {skill.percent}%
                          </span>
                        )}
                      </div>

                      {/* Edit & Delete Actions */}
                      <div style={{ display: "flex", gap: "4px" }}>
                        <button
                          type="button"
                          onClick={() => openAddSkillModal(i)}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            fontSize: "0.75rem",
                            color: "#64748b",
                            padding: "2px",
                          }}
                          title="Edit skill"
                        >
                          ✏️
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSkill(i)}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            fontSize: "0.75rem",
                            color: "#ef4444",
                            padding: "2px",
                          }}
                          title="Delete skill"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  style={{
                    background: "#f8fafc",
                    border: "1px dashed #cbd5e1",
                    borderRadius: "12px",
                    padding: "20px",
                    textAlign: "center",
                    color: "#64748b",
                    fontSize: "0.9rem",
                  }}
                >
                  No skills added yet. Click <strong>+ Add Skill</strong> to showcase your tech stack!
                </div>
              )}
            </div>

            {/* ── Certifications Section (Real CRUD) ──────────────────────── */}
            <div style={{ marginBottom: "32px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "12px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "1.2rem" }}>📜</span>
                  <h3
                    style={{
                      margin: 0,
                      fontSize: "1.15rem",
                      fontWeight: "700",
                      color: "#1e293b",
                    }}
                  >
                    Certifications ({currentCerts.length})
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => openAddCertModal()}
                  style={{
                    background: "#f1f5f9",
                    border: "1px solid #cbd5e1",
                    borderRadius: "9999px",
                    padding: "6px 16px",
                    fontSize: "0.82rem",
                    fontWeight: "600",
                    color: "#334155",
                    cursor: "pointer",
                  }}
                >
                  + Add Certification
                </button>
              </div>

              {currentCerts.length > 0 ? (
                <>
                  <div
                    style={{
                      background: "#fed7aa",
                      borderRadius: "12px 12px 0 0",
                      padding: "10px 18px",
                      display: "grid",
                      gridTemplateColumns: "2.5fr 1.5fr 1.5fr 70px",
                      fontWeight: "700",
                      fontSize: "0.85rem",
                      color: "#7c2d12",
                    }}
                  >
                    <span>Certification Name</span>
                    <span>Completed</span>
                    <span>Issuing Body</span>
                    <span style={{ textAlign: "right" }}>Actions</span>
                  </div>

                  <div
                    style={{
                      border: "1px solid #fed7aa",
                      borderTop: "none",
                      borderRadius: "0 0 12px 12px",
                      overflow: "hidden",
                    }}
                  >
                    {currentCerts.map((cert, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "2.5fr 1.5fr 1.5fr 70px",
                          alignItems: "center",
                          padding: "12px 18px",
                          borderBottom:
                            idx === currentCerts.length - 1 ? "none" : "1px solid #f1f5f9",
                          background: idx % 2 === 0 ? "#ffffff" : "#fffbf5",
                          fontSize: "0.9rem",
                        }}
                      >
                        <span style={{ fontWeight: "600", color: "#1e293b" }}>{cert.name}</span>
                        <span style={{ color: "#64748b", fontSize: "0.85rem" }}>
                          {cert.completed || "Verified"}
                        </span>
                        <span>
                          <span
                            style={{
                              background: "#e0e7ff",
                              color: "#3730a3",
                              fontSize: "0.75rem",
                              padding: "3px 8px",
                              borderRadius: "6px",
                              fontWeight: "700",
                            }}
                          >
                            {cert.issuer || "Official"}
                          </span>
                        </span>
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "6px" }}>
                          <button
                            type="button"
                            onClick={() => openAddCertModal(idx)}
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              fontSize: "0.85rem",
                              color: "#64748b",
                            }}
                            title="Edit certification"
                          >
                            ✏️
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCertification(idx)}
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              fontSize: "0.85rem",
                              color: "#ef4444",
                            }}
                            title="Delete certification"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div
                  style={{
                    background: "#f8fafc",
                    border: "1px dashed #cbd5e1",
                    borderRadius: "12px",
                    padding: "20px",
                    textAlign: "center",
                    color: "#64748b",
                    fontSize: "0.9rem",
                  }}
                >
                  No certifications added yet. Click <strong>+ Add Certification</strong> to list your verified credentials.
                </div>
              )}
            </div>

            {/* ── Education Section (Real CRUD) ───────────────────────────── */}
            <div
              style={{
                background: "#f8fafc",
                borderRadius: "16px",
                padding: "20px 24px",
                border: "1px solid #e2e8f0",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "20px",
                marginBottom: "32px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "20px", flex: 1 }}>
                <div
                  style={{
                    width: "56px",
                    height: "56px",
                    borderRadius: "14px",
                    background: "#e0e7ff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.8rem",
                    flexShrink: 0,
                  }}
                >
                  🎓
                </div>
                <div>
                  <div
                    style={{
                      fontSize: "0.8rem",
                      fontWeight: "700",
                      color: "#6366f1",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      marginBottom: "4px",
                    }}
                  >
                    Education
                  </div>
                  <h4
                    style={{
                      margin: 0,
                      fontSize: "1.05rem",
                      fontWeight: "700",
                      color: user?.education ? "#0f172a" : "#94a3b8",
                      fontStyle: user?.education ? "normal" : "italic",
                    }}
                  >
                    {user?.education?.split(" - ")[0] || "No education added yet."}
                  </h4>
                  {user?.education?.split(" - ")[1] && (
                    <p style={{ margin: "3px 0 0", color: "#64748b", fontSize: "0.85rem" }}>
                      {user.education.split(" - ")[1]}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => setShowEditModal(true)}
                  style={{
                    background: "none",
                    border: "1px solid #cbd5e1",
                    borderRadius: "8px",
                    padding: "6px 14px",
                    fontSize: "0.8rem",
                    fontWeight: "600",
                    color: "#334155",
                    cursor: "pointer",
                  }}
                >
                  ✏️ Edit Education
                </button>
              </div>
            </div>

            {/* ── Links & Social Row (Real URLs & Disconnect) ─────────────── */}
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "16px",
                }}
              >
                <span style={{ fontSize: "1.2rem" }}>🌐</span>
                <h3
                  style={{
                    margin: 0,
                    fontSize: "1.1rem",
                    fontWeight: "700",
                    color: "#1e293b",
                  }}
                >
                  Links &amp; Social
                </h3>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                  gap: "16px",
                }}
              >
                {/* GitHub */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    padding: "16px 12px",
                    background: "#f8fafc",
                    border: "1.5px solid #e2e8f0",
                    borderRadius: "16px",
                    position: "relative",
                  }}
                >
                  {user?.github && (
                    <button
                      onClick={() => handleClearSocialLink("github")}
                      style={{
                        position: "absolute",
                        top: "8px",
                        right: "8px",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "#ef4444",
                        fontSize: "0.75rem",
                      }}
                      title="Disconnect GitHub"
                    >
                      ✕
                    </button>
                  )}
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "12px",
                      background: "#0f172a",
                      color: "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "24px",
                      marginBottom: "8px",
                    }}
                  >
                    🐙
                  </div>
                  <span style={{ fontWeight: "700", color: "#0f172a", fontSize: "0.85rem" }}>
                    GitHub
                  </span>
                  {user?.github ? (
                    <a
                      href={linkHref(user.github)}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontSize: "0.74rem",
                        fontWeight: "600",
                        color: "#16a34a",
                        marginTop: "4px",
                        textDecoration: "none",
                      }}
                    >
                      Connected 🔗
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowEditModal(true)}
                      style={{
                        background: "none",
                        border: "none",
                        fontSize: "0.74rem",
                        fontWeight: "600",
                        color: "#6366f1",
                        marginTop: "4px",
                        cursor: "pointer",
                        textDecoration: "underline",
                      }}
                    >
                      Connect Now
                    </button>
                  )}
                </div>

                {/* LinkedIn */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    padding: "16px 12px",
                    background: "#f8fafc",
                    border: "1.5px solid #e2e8f0",
                    borderRadius: "16px",
                    position: "relative",
                  }}
                >
                  {user?.linkedin && (
                    <button
                      onClick={() => handleClearSocialLink("linkedin")}
                      style={{
                        position: "absolute",
                        top: "8px",
                        right: "8px",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "#ef4444",
                        fontSize: "0.75rem",
                      }}
                      title="Disconnect LinkedIn"
                    >
                      ✕
                    </button>
                  )}
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "12px",
                      background: "#0a66c2",
                      color: "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "24px",
                      fontWeight: "bold",
                      marginBottom: "8px",
                    }}
                  >
                    in
                  </div>
                  <span style={{ fontWeight: "700", color: "#0f172a", fontSize: "0.85rem" }}>
                    LinkedIn
                  </span>
                  {user?.linkedin ? (
                    <a
                      href={linkHref(user.linkedin)}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontSize: "0.74rem",
                        fontWeight: "600",
                        color: "#16a34a",
                        marginTop: "4px",
                        textDecoration: "none",
                      }}
                    >
                      Connected 🔗
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowEditModal(true)}
                      style={{
                        background: "none",
                        border: "none",
                        fontSize: "0.74rem",
                        fontWeight: "600",
                        color: "#6366f1",
                        marginTop: "4px",
                        cursor: "pointer",
                        textDecoration: "underline",
                      }}
                    >
                      Connect Now
                    </button>
                  )}
                </div>

                {/* Portfolio */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    padding: "16px 12px",
                    background: "#f8fafc",
                    border: "1.5px solid #e2e8f0",
                    borderRadius: "16px",
                    position: "relative",
                  }}
                >
                  {user?.portfolio && (
                    <button
                      onClick={() => handleClearSocialLink("portfolio")}
                      style={{
                        position: "absolute",
                        top: "8px",
                        right: "8px",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "#ef4444",
                        fontSize: "0.75rem",
                      }}
                      title="Disconnect Portfolio"
                    >
                      ✕
                    </button>
                  )}
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "12px",
                      background: "#10b981",
                      color: "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "24px",
                      marginBottom: "8px",
                    }}
                  >
                    🌐
                  </div>
                  <span style={{ fontWeight: "700", color: "#0f172a", fontSize: "0.85rem" }}>
                    Portfolio
                  </span>
                  {user?.portfolio ? (
                    <a
                      href={linkHref(user.portfolio)}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontSize: "0.74rem",
                        fontWeight: "600",
                        color: "#16a34a",
                        marginTop: "4px",
                        textDecoration: "none",
                      }}
                    >
                      Connected 🔗
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowEditModal(true)}
                      style={{
                        background: "none",
                        border: "none",
                        fontSize: "0.74rem",
                        fontWeight: "600",
                        color: "#6366f1",
                        marginTop: "4px",
                        cursor: "pointer",
                        textDecoration: "underline",
                      }}
                    >
                      Connect Now
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════════
              RIGHT COLUMN — Sidebar Cards (100% Real, Editable, Deletable)
             ═══════════════════════════════════════════════════════════════════ */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "24px",
            }}
          >
            {/* Card 1: Links & Real GitHub Contribution Activity */}
            <div
              style={{
                background: "#ffffff",
                borderRadius: "24px",
                border: "1.5px solid #e2e8f0",
                padding: "24px",
                boxShadow: "0 10px 30px -5px rgba(0, 0, 0, 0.04)",
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
                  <span style={{ fontSize: "1.1rem" }}>🐙</span>
                  <h3
                    style={{
                      margin: 0,
                      fontSize: "1.05rem",
                      fontWeight: "700",
                      color: "#1e293b",
                    }}
                  >
                    GitHub Contributions
                  </h3>
                </div>
                {githubUsername && (
                  <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: "600" }}>
                    @{githubUsername}
                  </span>
                )}
              </div>

              {githubUsername ? (
                <div>
                  <div
                    style={{
                      background: "#ffffff",
                      borderRadius: "12px",
                      padding: "12px",
                      border: "1px solid #e2e8f0",
                      overflowX: "auto",
                      textAlign: "center",
                    }}
                  >
                    {/* Real GitHub Contribution Chart Image via ghchart */}
                    <img
                      src={`https://ghchart.rshah.org/216e39/${githubUsername}`}
                      alt={`${githubUsername}'s real github contributions`}
                      style={{
                        width: "100%",
                        minWidth: "260px",
                        height: "auto",
                        display: "block",
                        margin: "0 auto",
                      }}
                      onError={(e) => {
                        e.target.style.display = "none";
                        e.target.nextSibling.style.display = "block";
                      }}
                    />
                    <div style={{ display: "none", padding: "16px", color: "#64748b", fontSize: "0.85rem" }}>
                      GitHub activity loaded for <strong>@{githubUsername}</strong>.
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginTop: "10px",
                    }}
                  >
                    <a
                      href={`https://github.com/${githubUsername}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontSize: "0.78rem",
                        color: "#6366f1",
                        fontWeight: "600",
                        textDecoration: "none",
                      }}
                    >
                      View GitHub Profile ↗
                    </a>
                    <button
                      type="button"
                      onClick={() => handleClearSocialLink("github")}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#ef4444",
                        fontSize: "0.75rem",
                        cursor: "pointer",
                      }}
                    >
                      Disconnect
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    background: "#f8fafc",
                    border: "1px dashed #cbd5e1",
                    borderRadius: "12px",
                    padding: "20px",
                    textAlign: "center",
                  }}
                >
                  <p style={{ margin: "0 0 10px", fontSize: "0.85rem", color: "#64748b" }}>
                    No GitHub connected yet. Link your GitHub username or URL to view your live contributions graph.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowEditModal(true)}
                    style={{
                      background: "#0f172a",
                      color: "white",
                      border: "none",
                      borderRadius: "9999px",
                      padding: "6px 14px",
                      fontSize: "0.78rem",
                      fontWeight: "600",
                      cursor: "pointer",
                    }}
                  >
                    + Connect GitHub
                  </button>
                </div>
              )}
            </div>

            {/* Card 2: Top Projects (Real Projects with View, Edit & Delete) */}
            <div
              style={{
                background: "#ffffff",
                borderRadius: "24px",
                border: "1.5px solid #e2e8f0",
                padding: "24px",
                boxShadow: "0 10px 30px -5px rgba(0, 0, 0, 0.04)",
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
                  <span style={{ fontSize: "1.1rem" }}>💼</span>
                  <h3
                    style={{
                      margin: 0,
                      fontSize: "1.05rem",
                      fontWeight: "700",
                      color: "#1e293b",
                    }}
                  >
                    My Projects ({projects.length})
                  </h3>
                </div>
              </div>

              {/* Real Projects List */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                  marginBottom: "18px",
                }}
              >
                {projects.length > 0 ? (
                  projects.map((proj) => (
                    <div
                      key={proj._id}
                      style={{
                        background: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        borderRadius: "14px",
                        padding: "14px",
                        position: "relative",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          gap: "8px",
                          marginBottom: "4px",
                        }}
                      >
                        <Link
                          to={`/projects/${proj._id}`}
                          style={{
                            textDecoration: "none",
                            fontSize: "0.95rem",
                            fontWeight: "700",
                            color: "#1e293b",
                          }}
                        >
                          {proj.title}
                        </Link>
                        {/* Status Badge */}
                        <span
                          style={{
                            fontSize: "0.7rem",
                            fontWeight: "700",
                            padding: "2px 8px",
                            borderRadius: "6px",
                            background:
                              proj.status === "Completed"
                                ? "#dcfce7"
                                : proj.status === "In Progress"
                                ? "#dbeafe"
                                : "#fef3c7",
                            color:
                              proj.status === "Completed"
                                ? "#15803d"
                                : proj.status === "In Progress"
                                ? "#1d4ed8"
                                : "#b45309",
                          }}
                        >
                          {proj.status || "In Progress"}
                        </span>
                      </div>

                      <p
                        style={{
                          fontSize: "0.8rem",
                          color: "#64748b",
                          margin: "0 0 8px",
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
                          gap: "6px",
                        }}
                      >
                        {/* Technologies Tags */}
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                          {(proj.technologies || []).slice(0, 3).map((tag, idx) => (
                            <span
                              key={idx}
                              style={{
                                background: "#e0e7ff",
                                color: "#4338ca",
                                fontSize: "0.68rem",
                                fontWeight: "600",
                                padding: "2px 6px",
                                borderRadius: "4px",
                              }}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>

                        {/* Real Edit & Delete Action Buttons */}
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button
                            type="button"
                            onClick={() => navigate(`/projects/${proj._id}/edit`)}
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              fontSize: "0.78rem",
                              color: "#6366f1",
                              fontWeight: "600",
                              padding: 0,
                            }}
                            title="Edit Project"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowDeleteProjectModal(proj._id)}
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              fontSize: "0.78rem",
                              color: "#ef4444",
                              fontWeight: "600",
                              padding: 0,
                            }}
                            title="Delete Project"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div
                    style={{
                      background: "#f8fafc",
                      border: "1px dashed #cbd5e1",
                      borderRadius: "12px",
                      padding: "24px 16px",
                      textAlign: "center",
                      color: "#64748b",
                    }}
                  >
                    <p style={{ margin: "0 0 10px", fontSize: "0.85rem" }}>
                      You haven't created any projects yet.
                    </p>
                  </div>
                )}
              </div>

              {/* Add New Project Button */}
              <Link
                to="/projects/create"
                style={{
                  display: "block",
                  textAlign: "center",
                  background: "#1e1b4b",
                  color: "#ffffff",
                  textDecoration: "none",
                  borderRadius: "9999px",
                  padding: "10px 18px",
                  fontSize: "0.85rem",
                  fontWeight: "700",
                  boxShadow: "0 4px 12px rgba(30, 27, 75, 0.2)",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#312e81")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#1e1b4b")}
              >
                + Add New Project
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL 1: FULL PROFILE EDIT (Name, Title, Bio, Education, Socials)
         ═══════════════════════════════════════════════════════════════════════ */}
      {showEditModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 999,
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "20px",
              width: "100%",
              maxWidth: "640px",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "28px",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.2)",
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
              <h2 style={{ margin: 0, fontSize: "1.4rem", fontWeight: "800", color: "#0f172a" }}>
                Edit Profile Details
              </h2>
              <button
                onClick={() => setShowEditModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "1.3rem",
                  cursor: "pointer",
                  color: "#64748b",
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
                      fontSize: "0.85rem",
                      fontWeight: "700",
                      marginBottom: "4px",
                    }}
                  >
                    Full Name *
                  </label>
                  <input
                    className="form-input"
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.85rem",
                      fontWeight: "700",
                      marginBottom: "4px",
                    }}
                  >
                    Professional Title/Role
                  </label>
                  <input
                    className="form-input"
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="e.g. Full-stack Web Developer"
                  />
                </div>
              </div>

              <div style={{ marginBottom: "14px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.85rem",
                    fontWeight: "700",
                    marginBottom: "4px",
                  }}
                >
                  Personal Bio
                </label>
                <textarea
                  className="form-textarea"
                  name="bio"
                  rows="3"
                  value={formData.bio}
                  onChange={handleChange}
                  placeholder="Tell others about your experience, interests, and what you're working on..."
                />
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1fr",
                  gap: "14px",
                  marginBottom: "14px",
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.85rem",
                      fontWeight: "700",
                      marginBottom: "4px",
                    }}
                  >
                    Education Degree / Field
                  </label>
                  <input
                    className="form-input"
                    type="text"
                    name="education"
                    value={formData.education}
                    onChange={handleChange}
                    placeholder="e.g. Bachelor of Science in Computer Science"
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.85rem",
                      fontWeight: "700",
                      marginBottom: "4px",
                    }}
                  >
                    Years / Duration
                  </label>
                  <input
                    className="form-input"
                    type="text"
                    name="educationYears"
                    value={formData.educationYears}
                    onChange={handleChange}
                    placeholder="e.g. 2019 - 2023"
                  />
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: "12px",
                  marginBottom: "20px",
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.8rem",
                      fontWeight: "700",
                      marginBottom: "4px",
                    }}
                  >
                    GitHub (username or URL)
                  </label>
                  <input
                    className="form-input"
                    type="text"
                    name="github"
                    value={formData.github}
                    onChange={handleChange}
                    placeholder="github.com/username"
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.8rem",
                      fontWeight: "700",
                      marginBottom: "4px",
                    }}
                  >
                    LinkedIn URL
                  </label>
                  <input
                    className="form-input"
                    type="text"
                    name="linkedin"
                    value={formData.linkedin}
                    onChange={handleChange}
                    placeholder="linkedin.com/in/username"
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.8rem",
                      fontWeight: "700",
                      marginBottom: "4px",
                    }}
                  >
                    Portfolio URL
                  </label>
                  <input
                    className="form-input"
                    type="text"
                    name="portfolio"
                    value={formData.portfolio}
                    onChange={handleChange}
                    placeholder="myportfolio.com"
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL 2: ADD / EDIT SKILL (Real CRUD)
         ═══════════════════════════════════════════════════════════════════════ */}
      {showAddSkillModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 999,
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "20px",
              width: "100%",
              maxWidth: "420px",
              padding: "24px",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.2)",
            }}
          >
            <h3 style={{ margin: "0 0 16px", fontSize: "1.2rem", fontWeight: "800" }}>
              {editingSkillIndex !== null ? "Edit Skill" : "Add a New Skill"}
            </h3>
            <div style={{ marginBottom: "14px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "0.85rem",
                  fontWeight: "700",
                  marginBottom: "4px",
                }}
              >
                Skill Name *
              </label>
              <input
                className="form-input"
                type="text"
                placeholder="e.g. React, Node.js, Python, Docker"
                value={skillInputName}
                onChange={(e) => setSkillInputName(e.target.value)}
                autoFocus
              />
            </div>
            <div style={{ marginBottom: "20px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "4px",
                }}
              >
                <label style={{ fontSize: "0.85rem", fontWeight: "700" }}>
                  Proficiency Level
                </label>
                <span style={{ fontWeight: "700", color: "#f97316" }}>
                  {skillInputPercent}%
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                step="5"
                value={skillInputPercent}
                onChange={(e) => setSkillInputPercent(Number(e.target.value))}
                style={{ width: "100%", accentColor: "#f97316" }}
              />
            </div>
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setShowAddSkillModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleSaveSkill}
                disabled={!skillInputName.trim()}
              >
                {editingSkillIndex !== null ? "Update Skill" : "Save Skill"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL 3: ADD / EDIT CERTIFICATION (Real CRUD)
         ═══════════════════════════════════════════════════════════════════════ */}
      {showAddCertModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 999,
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "20px",
              width: "100%",
              maxWidth: "460px",
              padding: "24px",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.2)",
            }}
          >
            <h3 style={{ margin: "0 0 16px", fontSize: "1.2rem", fontWeight: "800" }}>
              {editingCertIndex !== null ? "Edit Certification" : "Add Certification"}
            </h3>

            <div style={{ marginBottom: "14px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "0.85rem",
                  fontWeight: "700",
                  marginBottom: "4px",
                }}
              >
                Certification Name *
              </label>
              <input
                className="form-input"
                type="text"
                placeholder="e.g. AWS Certified Cloud Practitioner"
                value={certFormData.name}
                onChange={(e) =>
                  setCertFormData({ ...certFormData, name: e.target.value })
                }
                autoFocus
                required
              />
            </div>

            <div style={{ marginBottom: "14px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "0.85rem",
                  fontWeight: "700",
                  marginBottom: "4px",
                }}
              >
                Completed Date / Year
              </label>
              <input
                className="form-input"
                type="text"
                placeholder="e.g. 2023-09-15 or Sep 2023"
                value={certFormData.completed}
                onChange={(e) =>
                  setCertFormData({ ...certFormData, completed: e.target.value })
                }
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "0.85rem",
                  fontWeight: "700",
                  marginBottom: "4px",
                }}
              >
                Issuing Organization / Authority
              </label>
              <input
                className="form-input"
                type="text"
                placeholder="e.g. AWS, Google, Meta, Microsoft, Coursera"
                value={certFormData.issuer}
                onChange={(e) =>
                  setCertFormData({ ...certFormData, issuer: e.target.value })
                }
              />
            </div>

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setShowAddCertModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleSaveCertification}
                disabled={!certFormData.name.trim()}
              >
                {editingCertIndex !== null ? "Update" : "Save Certification"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          MODAL 4: CONFIRM DELETE PROJECT
         ═══════════════════════════════════════════════════════════════════════ */}
      {showDeleteProjectModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 999,
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "20px",
              width: "100%",
              maxWidth: "400px",
              padding: "24px",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.2)",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "2.5rem", marginBottom: "10px" }}>🗑️</div>
            <h3 style={{ margin: "0 0 8px", fontSize: "1.2rem", fontWeight: "800" }}>
              Delete this project?
            </h3>
            <p style={{ fontSize: "0.85rem", color: "#64748b", margin: "0 0 20px" }}>
              This action cannot be undone. All project data and comments will be permanently removed.
            </p>
            <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowDeleteProjectModal(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                disabled={deletingProjectId !== null}
                onClick={() => handleDeleteProject(showDeleteProjectModal)}
              >
                {deletingProjectId ? "Deleting..." : "Yes, Delete Project"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;