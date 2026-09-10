import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

function Profile() {
  const { token, refreshProfile } = useAuth();

  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Modals
  const [showEditModal, setShowEditModal] = useState(false);
  const [activeTab, setActiveTab] = useState("general"); // "general", "skills", "certs", "social"
  const [showAddSkillModal, setShowAddSkillModal] = useState(false);

  // Add Skill mini-state
  const [newSkillName, setNewSkillName] = useState("");
  const [newSkillPercent, setNewSkillPercent] = useState(85);

  // Add Certification mini-state (inside edit modal)
  const [newCert, setNewCert] = useState({ name: "", completed: "", issuer: "" });

  // Photo upload
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState("");
  const fileInputRef = useRef(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    title: "",
    bio: "",
    skills: [],
    github: "",
    linkedin: "",
    portfolio: "",
    location: "",
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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ── Photo Upload ───────────────────────────────────────────────────────────
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

  // ── Save Full Profile ──────────────────────────────────────────────────────
  const handleUpdate = async (e) => {
    if (e) e.preventDefault();
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

  // ── Quick Add Skill from Main Page button ──────────────────────────────────
  const handleQuickAddSkill = async () => {
    if (!newSkillName.trim()) return;
    const skillFormatted = `${newSkillName.trim()} (${newSkillPercent}%)`;
    const updatedSkills = [...(user?.skills || []), skillFormatted];

    try {
      const res = await api.put("/api/users/profile", { skills: updatedSkills });
      setUser(res.data.user);
      setFormData((prev) => ({ ...prev, skills: res.data.user.skills }));
      setNewSkillName("");
      setShowAddSkillModal(false);
      setSuccessMessage(`Skill "${skillFormatted}" added!`);
    } catch (err) {
      setError("Failed to add skill.");
    }
  };

  // ── Inside Modal: Skills & Certifications Helpers ──────────────────────────
  const handleRemoveSkillInModal = (indexToRemove) => {
    const updated = formData.skills.filter((_, idx) => idx !== indexToRemove);
    setFormData({ ...formData, skills: updated });
  };

  const handleAddSkillInModal = () => {
    if (!newSkillName.trim()) return;
    const formatted = `${newSkillName.trim()} (${newSkillPercent}%)`;
    setFormData({ ...formData, skills: [...formData.skills, formatted] });
    setNewSkillName("");
  };

  const handleAddCertInModal = () => {
    if (!newCert.name.trim()) return;
    setFormData({
      ...formData,
      certifications: [...formData.certifications, newCert],
    });
    setNewCert({ name: "", completed: "", issuer: "" });
  };

  const handleRemoveCertInModal = (indexToRemove) => {
    const updated = formData.certifications.filter((_, idx) => idx !== indexToRemove);
    setFormData({ ...formData, certifications: updated });
  };

  // ── Parsers & Helpers ──────────────────────────────────────────────────────
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

  const extractGithubUsername = (urlOrName) => {
    if (!urlOrName) return "";
    const clean = urlOrName.trim().replace(/\/$/, "");
    if (clean.includes("github.com/")) {
      return clean.split("github.com/").pop().split("/")[0];
    }
    return clean.replace(/^@/, "");
  };

  const githubUsername = extractGithubUsername(user?.github);

  const parsedSkills = (user?.skills || []).map((skillStr) => {
    const match = skillStr.match(/^(.+?)\s*(?:\(([0-9]{1,3})%\))?$/);
    if (match) {
      return { name: match[1], percent: match[2] || null };
    }
    return { name: skillStr, percent: null };
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
        <div className="loading-container">Loading your profile...</div>
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

        {/* 2-Column Grid Matching Mockup */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
            gap: "24px",
            alignItems: "start",
          }}
        >
          {/* ═══════════════════════════════════════════════════════════════════
              LEFT COLUMN — Main Clean Card (Only Main Edit Place)
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
            {/* Top User Header Section */}
            <div
              style={{
                display: "flex",
                gap: "28px",
                alignItems: "flex-start",
                flexWrap: "wrap",
                marginBottom: "32px",
              }}
            >
              {/* Avatar + Status + Main Edit Profile Button */}
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

                {/* MAIN EDIT PROFILE BUTTON */}
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
                    padding: "8px 20px",
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

                {/* Hidden File Input for photo */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  style={{ display: "none" }}
                  onChange={handleImageChange}
                />
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
                    marginTop: "8px",
                    textDecoration: "underline",
                  }}
                >
                  📷 Change Photo
                </button>

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
                {/* User Name with pencil icon */}
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
                    onClick={() => {
                      setActiveTab("general");
                      setShowEditModal(true);
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#64748b",
                      fontSize: "1rem",
                    }}
                    title="Edit in Main Form"
                  >
                    ✏️
                  </button>
                </div>

                {/* Professional Title/Role */}
                <div style={{ marginBottom: "16px" }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.85rem",
                      fontWeight: "700",
                      color: "#1e293b",
                      marginBottom: "6px",
                    }}
                  >
                    Professional Title/Role
                  </label>
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
                    {user?.title || "No professional title set. Click Edit Profile to add."}
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
                      onClick={() => {
                        setActiveTab("general");
                        setShowEditModal(true);
                      }}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "#64748b",
                        fontSize: "0.85rem",
                      }}
                      title="Edit Bio"
                    >
                      ✏️
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
                    {user?.bio || "Passionate about building scalable web applications and collaborating on open-source projects."}
                  </div>
                </div>
              </div>
            </div>

            {/* Divider */}
            <hr style={{ border: "none", borderTop: "1px solid #f1f5f9", margin: "24px 0" }} />

            {/* ── Skills & Expertise Section (Clean UI) ───────────────────── */}
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
                    Skills &amp; Expertise
                  </h3>
                </div>

                {/* Clean + Add Skill Pill Button */}
                <button
                  type="button"
                  onClick={() => setShowAddSkillModal(true)}
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
                  {parsedSkills.length === 0 ? "Add Your First Skill" : "+ Add Skill"}
                </button>
              </div>

              {/* Clean Skill Pills (No action buttons cluttering the view) */}
              {parsedSkills.length > 0 ? (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
                  {parsedSkills.map((skill, i) => (
                    <div
                      key={i}
                      style={{
                        display: "inline-flex",
                        flexDirection: "column",
                        alignItems: "center",
                        background: "#f1f5f9",
                        borderRadius: "12px",
                        padding: "8px 16px",
                        border: "1px solid #e2e8f0",
                      }}
                    >
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
                  No skills added yet. Click <strong>Add Your First Skill</strong> or <strong>Edit Profile</strong>.
                </div>
              )}
            </div>

            {/* ── Certifications Table (Clean UI, No Action Icons) ────────── */}
            <div style={{ marginBottom: "32px" }}>
              <div
                style={{
                  background: "#fed7aa",
                  borderRadius: "12px 12px 0 0",
                  padding: "10px 18px",
                  display: "grid",
                  gridTemplateColumns: "2fr 1fr 1fr",
                  fontWeight: "700",
                  fontSize: "0.85rem",
                  color: "#7c2d12",
                }}
              >
                <span>Certifications</span>
                <span>Completed</span>
                <span style={{ textAlign: "right" }}>Issuing</span>
              </div>

              <div
                style={{
                  border: "1px solid #fed7aa",
                  borderTop: "none",
                  borderRadius: "0 0 12px 12px",
                  overflow: "hidden",
                }}
              >
                {currentCerts.length > 0 ? (
                  currentCerts.map((cert, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "2fr 1fr 1fr",
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
                      <span style={{ textAlign: "right" }}>
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
                    </div>
                  ))
                ) : (
                  <div
                    style={{
                      padding: "20px",
                      textAlign: "center",
                      color: "#64748b",
                      fontSize: "0.88rem",
                      background: "#ffffff",
                    }}
                  >
                    No certifications added yet. (Add via Edit Profile)
                  </div>
                )}
              </div>
            </div>

            {/* ── Education Card (Clean UI) ───────────────────────────────── */}
            <div
              style={{
                background: "#f8fafc",
                borderRadius: "16px",
                padding: "20px 24px",
                border: "1px solid #e2e8f0",
                display: "flex",
                alignItems: "center",
                gap: "20px",
                marginBottom: "32px",
              }}
            >
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
              <div style={{ flex: 1 }}>
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
                  }}
                >
                  {user?.education?.split(" - ")[0] || "Bachelor of Science in Computer Science"}
                </h4>
                <p style={{ margin: "3px 0 0", color: "#64748b", fontSize: "0.85rem" }}>
                  {user?.education?.split(" - ")[1] || "2019 - 2023"}
                </p>
              </div>
            </div>

            {/* ── Links & Social Row (Clean UI) ───────────────────────────── */}
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
                <a
                  href={user?.github ? linkHref(user.github) : "#"}
                  target={user?.github ? "_blank" : "_self"}
                  rel="noopener noreferrer"
                  onClick={(e) => {
                    if (!user?.github) {
                      e.preventDefault();
                      setActiveTab("social");
                      setShowEditModal(true);
                    }
                  }}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    padding: "16px 12px",
                    background: "#f8fafc",
                    border: "1.5px solid #e2e8f0",
                    borderRadius: "16px",
                    textDecoration: "none",
                  }}
                >
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
                  <span
                    style={{
                      fontSize: "0.74rem",
                      fontWeight: "600",
                      color: user?.github ? "#16a34a" : "#6366f1",
                      marginTop: "4px",
                    }}
                  >
                    {user?.github ? "Connected ✅" : "Connect Now"}
                  </span>
                </a>

                {/* LinkedIn */}
                <a
                  href={user?.linkedin ? linkHref(user.linkedin) : "#"}
                  target={user?.linkedin ? "_blank" : "_self"}
                  rel="noopener noreferrer"
                  onClick={(e) => {
                    if (!user?.linkedin) {
                      e.preventDefault();
                      setActiveTab("social");
                      setShowEditModal(true);
                    }
                  }}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    padding: "16px 12px",
                    background: "#f8fafc",
                    border: "1.5px solid #e2e8f0",
                    borderRadius: "16px",
                    textDecoration: "none",
                  }}
                >
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
                  <span
                    style={{
                      fontSize: "0.74rem",
                      fontWeight: "600",
                      color: user?.linkedin ? "#16a34a" : "#6366f1",
                      marginTop: "4px",
                    }}
                  >
                    {user?.linkedin ? "Connected ✅" : "Connect Now"}
                  </span>
                </a>

                {/* Portfolio */}
                <a
                  href={user?.portfolio ? linkHref(user.portfolio) : "#"}
                  target={user?.portfolio ? "_blank" : "_self"}
                  rel="noopener noreferrer"
                  onClick={(e) => {
                    if (!user?.portfolio) {
                      e.preventDefault();
                      setActiveTab("social");
                      setShowEditModal(true);
                    }
                  }}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    padding: "16px 12px",
                    background: "#f8fafc",
                    border: "1.5px solid #e2e8f0",
                    borderRadius: "16px",
                    textDecoration: "none",
                  }}
                >
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
                  <span
                    style={{
                      fontSize: "0.74rem",
                      fontWeight: "600",
                      color: user?.portfolio ? "#16a34a" : "#6366f1",
                      marginTop: "4px",
                    }}
                  >
                    {user?.portfolio ? "Connected ✅" : "Connect Now"}
                  </span>
                </a>
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════════
              RIGHT COLUMN — Sidebar Cards (Matches Screenshot Exactly)
             ═══════════════════════════════════════════════════════════════════ */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "24px",
            }}
          >
            {/* Card 1: Links & Social + GitHub Contribution Activity */}
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
                  gap: "8px",
                  marginBottom: "16px",
                }}
              >
                <span style={{ fontSize: "1.1rem" }}>🌐</span>
                <h3
                  style={{
                    margin: 0,
                    fontSize: "1.05rem",
                    fontWeight: "700",
                    color: "#1e293b",
                  }}
                >
                  Links &amp; Social
                </h3>
              </div>

              {/* Connected Icons row */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: "10px",
                  marginBottom: "20px",
                }}
              >
                <div style={{ textAlign: "center" }}>
                  <div
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "12px",
                      background: "#0f172a",
                      color: "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 6px",
                      fontSize: "20px",
                    }}
                  >
                    🐙
                  </div>
                  <div style={{ fontSize: "0.75rem", fontWeight: "700" }}>GitHub</div>
                  <div
                    style={{
                      fontSize: "0.68rem",
                      color: user?.github ? "#16a34a" : "#94a3b8",
                      fontWeight: "600",
                    }}
                  >
                    {user?.github ? "Connected ●" : "Connect"}
                  </div>
                </div>

                <div style={{ textAlign: "center" }}>
                  <div
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "12px",
                      background: "#0a66c2",
                      color: "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 6px",
                      fontSize: "20px",
                      fontWeight: "bold",
                    }}
                  >
                    in
                  </div>
                  <div style={{ fontSize: "0.75rem", fontWeight: "700" }}>LinkedIn</div>
                  <div
                    style={{
                      fontSize: "0.68rem",
                      color: user?.linkedin ? "#16a34a" : "#94a3b8",
                      fontWeight: "600",
                    }}
                  >
                    {user?.linkedin ? "Connected ●" : "Connect"}
                  </div>
                </div>

                <div style={{ textAlign: "center" }}>
                  <div
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "12px",
                      background: "#10b981",
                      color: "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 6px",
                      fontSize: "20px",
                    }}
                  >
                    📄
                  </div>
                  <div style={{ fontSize: "0.75rem", fontWeight: "700" }}>Portfolio</div>
                  <div
                    style={{
                      fontSize: "0.68rem",
                      color: user?.portfolio ? "#16a34a" : "#94a3b8",
                      fontWeight: "600",
                    }}
                  >
                    {user?.portfolio ? "Connected ●" : "Connect"}
                  </div>
                </div>
              </div>

              {/* GitHub Contribution Graph Heading */}
              <div
                style={{
                  borderTop: "1px solid #f1f5f9",
                  paddingTop: "16px",
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
                  <h4
                    style={{
                      margin: 0,
                      fontSize: "0.85rem",
                      fontWeight: "700",
                      color: "#334155",
                    }}
                  >
                    GitHub Contribution Graph
                  </h4>
                  {githubUsername && (
                    <span style={{ fontSize: "0.7rem", color: "#64748b" }}>
                      @{githubUsername}
                    </span>
                  )}
                </div>

                {githubUsername ? (
                  <div
                    style={{
                      background: "#ffffff",
                      borderRadius: "8px",
                      padding: "8px",
                      border: "1px solid #e2e8f0",
                      overflowX: "auto",
                      textAlign: "center",
                    }}
                  >
                    <img
                      src={`https://ghchart.rshah.org/216e39/${githubUsername}`}
                      alt={`${githubUsername}'s github contributions`}
                      style={{
                        width: "100%",
                        minWidth: "220px",
                        height: "auto",
                        display: "block",
                        margin: "0 auto",
                      }}
                    />
                  </div>
                ) : (
                  <div
                    style={{
                      background: "#f8fafc",
                      border: "1px dashed #cbd5e1",
                      borderRadius: "8px",
                      padding: "16px",
                      textAlign: "center",
                      fontSize: "0.8rem",
                      color: "#64748b",
                    }}
                  >
                    Connect your GitHub in Edit Profile to view your live contributions.
                  </div>
                )}
              </div>
            </div>

            {/* Card 2: Top Projects (Clean UI + Add New Project Button) */}
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
                  gap: "8px",
                  marginBottom: "16px",
                }}
              >
                <span style={{ fontSize: "1.1rem" }}>💼</span>
                <h3
                  style={{
                    margin: 0,
                    fontSize: "1.05rem",
                    fontWeight: "700",
                    color: "#1e293b",
                  }}
                >
                  Top Projects
                </h3>
              </div>

              {/* Projects List */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                  marginBottom: "18px",
                }}
              >
                {projects.length > 0 ? (
                  projects.slice(0, 2).map((proj) => (
                    <div
                      key={proj._id}
                      style={{
                        background: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        borderRadius: "14px",
                        padding: "14px",
                      }}
                    >
                      <Link
                        to={`/projects/${proj._id}`}
                        style={{
                          textDecoration: "none",
                          fontSize: "0.95rem",
                          fontWeight: "700",
                          color: "#1e293b",
                          display: "block",
                          marginBottom: "4px",
                        }}
                      >
                        {proj.title}
                      </Link>
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
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                        {(proj.technologies || []).slice(0, 3).map((tag, idx) => (
                          <span
                            key={idx}
                            style={{
                              background: "#e0e7ff",
                              color: "#4338ca",
                              fontSize: "0.7rem",
                              fontWeight: "600",
                              padding: "2px 8px",
                              borderRadius: "6px",
                            }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div
                    style={{
                      background: "#f8fafc",
                      border: "1px dashed #cbd5e1",
                      borderRadius: "12px",
                      padding: "20px",
                      textAlign: "center",
                      color: "#64748b",
                      fontSize: "0.85rem",
                    }}
                  >
                    No projects yet. Click below to add your first project!
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
          THE ONE MAIN EDIT MODAL (All editing happens here)
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
              borderRadius: "24px",
              width: "100%",
              maxWidth: "680px",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "28px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
              }}
            >
              <h2 style={{ margin: 0, fontSize: "1.4rem", fontWeight: "800", color: "#0f172a" }}>
                Edit Profile
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

            {/* Modal Navigation Tabs */}
            <div
              style={{
                display: "flex",
                gap: "8px",
                borderBottom: "1px solid #e2e8f0",
                paddingBottom: "12px",
                marginBottom: "20px",
                overflowX: "auto",
              }}
            >
              {[
                { id: "general", label: "Basic Info" },
                { id: "skills", label: `Skills (${formData.skills.length})` },
                { id: "certs", label: `Certifications (${formData.certifications.length})` },
                { id: "social", label: "Social Links" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "9999px",
                    border: "none",
                    background: activeTab === tab.id ? "#3730a3" : "#f1f5f9",
                    color: activeTab === tab.id ? "#ffffff" : "#475569",
                    fontSize: "0.85rem",
                    fontWeight: "700",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleUpdate}>
              {/* TAB 1: BASIC INFO */}
              {activeTab === "general" && (
                <div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "14px",
                      marginBottom: "14px",
                    }}
                  >
                    <div>
                      <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "700", marginBottom: "4px" }}>
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
                      <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "700", marginBottom: "4px" }}>
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
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "700", marginBottom: "4px" }}>
                      Personal Bio
                    </label>
                    <textarea
                      className="form-textarea"
                      name="bio"
                      rows="3"
                      value={formData.bio}
                      onChange={handleChange}
                      placeholder="Tell others about your experience and projects..."
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
                      <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "700", marginBottom: "4px" }}>
                        Education Degree
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
                      <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "700", marginBottom: "4px" }}>
                        Years
                      </label>
                      <input
                        className="form-input"
                        type="text"
                        name="educationYears"
                        value={formData.educationYears}
                        onChange={handleChange}
                        placeholder="2019 - 2023"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: SKILLS (Add & Delete) */}
              {activeTab === "skills" && (
                <div>
                  <div
                    style={{
                      display: "flex",
                      gap: "10px",
                      alignItems: "center",
                      marginBottom: "16px",
                    }}
                  >
                    <input
                      className="form-input"
                      type="text"
                      placeholder="Skill name (e.g. Docker, TypeScript)"
                      value={newSkillName}
                      onChange={(e) => setNewSkillName(e.target.value)}
                      style={{ flex: 2 }}
                    />
                    <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "6px" }}>
                      <input
                        type="range"
                        min="20"
                        max="100"
                        step="5"
                        value={newSkillPercent}
                        onChange={(e) => setNewSkillPercent(Number(e.target.value))}
                        style={{ width: "100%", accentColor: "#f97316" }}
                      />
                      <span style={{ fontSize: "0.8rem", fontWeight: "700", width: "40px" }}>
                        {newSkillPercent}%
                      </span>
                    </div>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={handleAddSkillInModal}
                      disabled={!newSkillName.trim()}
                    >
                      + Add
                    </button>
                  </div>

                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "700", marginBottom: "8px" }}>
                    Current Skills (Click ✕ to remove):
                  </label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", minHeight: "60px" }}>
                    {formData.skills.map((skill, idx) => (
                      <span
                        key={idx}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "8px",
                          background: "#f1f5f9",
                          padding: "6px 12px",
                          borderRadius: "9999px",
                          fontSize: "0.85rem",
                          fontWeight: "600",
                          border: "1px solid #e2e8f0",
                        }}
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() => handleRemoveSkillInModal(idx)}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: "#ef4444",
                            fontWeight: "bold",
                            padding: 0,
                          }}
                          title="Remove"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: CERTIFICATIONS (Add & Delete) */}
              {activeTab === "certs" && (
                <div>
                  <div style={{ background: "#f8fafc", padding: "14px", borderRadius: "12px", marginBottom: "16px" }}>
                    <div style={{ fontSize: "0.85rem", fontWeight: "700", marginBottom: "8px" }}>
                      Add New Certification
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr auto", gap: "8px" }}>
                      <input
                        className="form-input"
                        placeholder="Cert name (e.g. AWS Practitioner)"
                        value={newCert.name}
                        onChange={(e) => setNewCert({ ...newCert, name: e.target.value })}
                      />
                      <input
                        className="form-input"
                        placeholder="Date (e.g. 2023-09)"
                        value={newCert.completed}
                        onChange={(e) => setNewCert({ ...newCert, completed: e.target.value })}
                      />
                      <input
                        className="form-input"
                        placeholder="Issuer (e.g. AWS)"
                        value={newCert.issuer}
                        onChange={(e) => setNewCert({ ...newCert, issuer: e.target.value })}
                      />
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={handleAddCertInModal}
                        disabled={!newCert.name.trim()}
                      >
                        + Add
                      </button>
                    </div>
                  </div>

                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "700", marginBottom: "8px" }}>
                    Added Certifications:
                  </label>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {formData.certifications.map((c, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "8px 12px",
                          background: "#f1f5f9",
                          borderRadius: "8px",
                          fontSize: "0.85rem",
                        }}
                      >
                        <span>
                          <strong>{c.name}</strong> · {c.completed || "Verified"} ({c.issuer || "Official"})
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveCertInModal(idx)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#ef4444",
                            cursor: "pointer",
                            fontWeight: "bold",
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 4: SOCIAL LINKS */}
              {activeTab === "social" && (
                <div>
                  <div style={{ marginBottom: "12px" }}>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "700", marginBottom: "4px" }}>
                      GitHub (username or URL)
                    </label>
                    <input
                      className="form-input"
                      name="github"
                      value={formData.github}
                      onChange={handleChange}
                      placeholder="github.com/username"
                    />
                  </div>

                  <div style={{ marginBottom: "12px" }}>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "700", marginBottom: "4px" }}>
                      LinkedIn URL
                    </label>
                    <input
                      className="form-input"
                      name="linkedin"
                      value={formData.linkedin}
                      onChange={handleChange}
                      placeholder="linkedin.com/in/username"
                    />
                  </div>

                  <div style={{ marginBottom: "14px" }}>
                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "700", marginBottom: "4px" }}>
                      Portfolio Website URL
                    </label>
                    <input
                      className="form-input"
                      name="portfolio"
                      value={formData.portfolio}
                      onChange={handleChange}
                      placeholder="https://yourportfolio.com"
                    />
                  </div>
                </div>
              )}

              {/* Modal Footer Actions */}
              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  justifyContent: "flex-end",
                  marginTop: "24px",
                  borderTop: "1px solid #e2e8f0",
                  paddingTop: "16px",
                }}
              >
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
          MINI MODAL: QUICK ADD SKILL
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
              maxWidth: "400px",
              padding: "24px",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.2)",
            }}
          >
            <h3 style={{ margin: "0 0 16px", fontSize: "1.2rem", fontWeight: "800" }}>
              Add a Skill
            </h3>
            <div style={{ marginBottom: "14px" }}>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "700", marginBottom: "4px" }}>
                Skill Name *
              </label>
              <input
                className="form-input"
                type="text"
                placeholder="e.g. React, Node.js, Python"
                value={newSkillName}
                onChange={(e) => setNewSkillName(e.target.value)}
                autoFocus
              />
            </div>
            <div style={{ marginBottom: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: "700" }}>Proficiency</label>
                <span style={{ fontWeight: "700", color: "#f97316" }}>{newSkillPercent}%</span>
              </div>
              <input
                type="range"
                min="20"
                max="100"
                step="5"
                value={newSkillPercent}
                onChange={(e) => setNewSkillPercent(Number(e.target.value))}
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
                onClick={handleQuickAddSkill}
                disabled={!newSkillName.trim()}
              >
                Add Skill
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;