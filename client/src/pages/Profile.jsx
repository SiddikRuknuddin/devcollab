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
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddSkillModal, setShowAddSkillModal] = useState(false);
  const [newSkillName, setNewSkillName] = useState("");
  const [newSkillPercent, setNewSkillPercent] = useState(85);

  // Image upload state
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState("");
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: "",
    title: "",
    bio: "",
    skills: "",
    github: "",
    linkedin: "",
    portfolio: "",
    location: "",
    experience: "",
    education: "",
    educationYears: "",
    certifications: [],
  });

  // Fetch profile and projects
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

        // Parse education years if combined
        const eduParts = (userData.education || "").split(" - ");

        setFormData({
          name: userData.name || "",
          title: userData.title || "Full-stack Web Developer",
          bio:
            userData.bio ||
            "Passionate about building scalable web applications and collaborating on open-source projects.",
          skills: userData.skills?.join(", ") || "Python (90%), React (85%), Git (85%)",
          github: userData.github || "",
          linkedin: userData.linkedin || "",
          portfolio: userData.portfolio || "",
          location: userData.location || "",
          experience: userData.experience || "",
          education: eduParts[0] || "Bachelor of Science in Computer Science",
          educationYears: eduParts[1] || "2019-2023",
          certifications: userData.certifications?.length
            ? userData.certifications
            : [
                {
                  name: "AWS Certified Cloud Practitioner",
                  completed: "2019-09-23",
                  issuer: "AWS",
                },
                {
                  name: "Google Data Analytics Certificate",
                  completed: "2019-07-23",
                  issuer: "Google",
                },
              ],
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

  // ── Image Handlers ─────────────────────────────────────────────────────────
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
      setSuccessMessage("Profile image updated successfully!");
      await refreshProfile();
    } catch (err) {
      setImageError(err.response?.data?.message || "Image upload failed.");
    } finally {
      setUploadingImage(false);
    }
  };

  const cancelImagePreview = () => {
    setImageFile(null);
    setImagePreview("");
    setImageError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ── Save Profile Handler ───────────────────────────────────────────────────
  const handleUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccessMessage("");

    try {
      const skillsArray = formData.skills
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s !== "");

      const fullEducation = formData.educationYears
        ? `${formData.education.trim()} - ${formData.educationYears.trim()}`
        : formData.education.trim();

      const response = await api.put("/api/users/profile", {
        name: formData.name,
        title: formData.title,
        bio: formData.bio,
        skills: skillsArray,
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

  // ── Add Skill Inline ───────────────────────────────────────────────────────
  const handleAddSkill = () => {
    if (!newSkillName.trim()) return;
    const skillFormatted = `${newSkillName.trim()} (${newSkillPercent}%)`;
    const currentList = formData.skills
      ? formData.skills.split(",").map((s) => s.trim())
      : [];
    const updatedSkills = [...currentList, skillFormatted].join(", ");

    setFormData({ ...formData, skills: updatedSkills });
    setNewSkillName("");
    setShowAddSkillModal(false);

    // Save directly
    api
      .put("/api/users/profile", {
        skills: [...currentList, skillFormatted],
      })
      .then((res) => {
        setUser(res.data.user);
        setSuccessMessage(`Skill "${skillFormatted}" added!`);
      })
      .catch(() => {});
  };

  // ── Helpers ────────────────────────────────────────────────────────────────
  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "AB";

  const linkHref = (url) =>
    url && !url.startsWith("http") ? `https://${url}` : url;

  // Format skills for badges
  const parsedSkills = (user?.skills?.length ? user.skills : formData.skills.split(","))
    .map((s) => s.trim())
    .filter(Boolean)
    .map((skillStr) => {
      const match = skillStr.match(/^(.+?)\s*\(([0-9]{1,3})%\)$/);
      if (match) {
        return { name: match[1], percent: match[2] };
      }
      return { name: skillStr, percent: null };
    });

  // Certifications list
  const currentCerts =
    user?.certifications?.length > 0
      ? user.certifications
      : formData.certifications;

  // Render dummy GitHub contribution squares (7 rows x 26 columns)
  const contributionGrid = Array.from({ length: 130 }).map((_, idx) => {
    // Generate realistic activity distribution
    const seed = (idx * 17 + 5) % 10;
    let level = 0;
    if (idx > 50 && seed > 7) level = 4;
    else if (idx > 40 && seed > 5) level = 3;
    else if (idx > 30 && seed > 3) level = 2;
    else if (idx > 20 && seed > 2) level = 1;
    return level;
  });

  const getHeatmapColor = (level) => {
    switch (level) {
      case 4:
        return "#216e39";
      case 3:
        return "#30a14e";
      case 2:
        return "#40c463";
      case 1:
        return "#9be9a8";
      default:
        return "#ebedf0";
    }
  };

  if (loading) {
    return (
      <div className="page-container" style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
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
      <div style={{ maxWidth: "1160px", margin: "0 auto" }}>
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

        {/* Notifications */}
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
          <div className="alert alert-error" style={{ marginBottom: "20px" }}>
            ⚠️ {error}
          </div>
        )}

        {/* Main 2-Column Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
            gap: "24px",
            alignItems: "start",
          }}
        >
          {/* ═══════════════════════════════════════════════════════════════════
              LEFT COLUMN — Main Profile Card (Matches Screenshot exactly)
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
              {/* Avatar + Status + Edit Profile Button */}
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

                  {/* Online Green Indicator Dot */}
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

                {/* Online text label */}
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

                {/* Edit Profile / Change Photo Pill Button */}
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

                {/* Hidden File Input for quick photo upload */}
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
                      onClick={cancelImagePreview}
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

              {/* Name, Role & Bio Fields */}
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
                      color: "#334155",
                    }}
                  >
                    {user?.title || formData.title || "Full-stack Web Developer"}
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
                        fontSize: "0.9rem",
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
                      color: "#475569",
                    }}
                  >
                    {user?.bio || formData.bio}
                  </div>
                </div>
              </div>
            </div>

            {/* Divider */}
            <hr style={{ border: "none", borderTop: "1px solid #f1f5f9", margin: "24px 0" }} />

            {/* ── Skills & Expertise Section ──────────────────────────────── */}
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

                {/* Add Skill Button (Warm Peach/Coral Gradient Pill) */}
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
                  + Add Skill
                </button>
              </div>

              {/* Skills Badges with percentage */}
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
                        fontSize: "0.95rem",
                        color: "#1e293b",
                      }}
                    >
                      {skill.name}
                    </span>
                    {skill.percent && (
                      <span
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: "600",
                          color: "#64748b",
                          marginTop: "2px",
                        }}
                      >
                        {skill.percent}%
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* ── Certifications Section ─────────────────────────────────── */}
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
                {currentCerts.map((cert, idx) => (
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
                      {cert.issuer === "AWS" ? (
                        <span
                          style={{
                            display: "inline-block",
                            background: "#232f3e",
                            color: "#ff9900",
                            fontWeight: "800",
                            fontSize: "0.75rem",
                            padding: "3px 8px",
                            borderRadius: "6px",
                          }}
                        >
                          AWS
                        </span>
                      ) : cert.issuer === "Google" ? (
                        <span
                          style={{
                            display: "inline-block",
                            background: "#ffffff",
                            color: "#4285f4",
                            border: "1px solid #e2e8f0",
                            fontWeight: "800",
                            fontSize: "0.75rem",
                            padding: "2px 8px",
                            borderRadius: "6px",
                          }}
                        >
                          <span style={{ color: "#4285f4" }}>G</span>
                          <span style={{ color: "#ea4335" }}>o</span>
                          <span style={{ color: "#fbbc05" }}>o</span>
                          <span style={{ color: "#34a853" }}>g</span>
                        </span>
                      ) : (
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
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Education Section ──────────────────────────────────────── */}
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
                    color: "#0f172a",
                  }}
                >
                  {user?.education?.split(" - ")[0] || formData.education}
                </h4>
                <p style={{ margin: "3px 0 0", color: "#64748b", fontSize: "0.85rem" }}>
                  {user?.education?.split(" - ")[1] || formData.educationYears || "2019 - 2023"}
                </p>
              </div>
            </div>

            {/* ── Links & Social Row ─────────────────────────────────────── */}
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
                  gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
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
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-3px)";
                    e.currentTarget.style.borderColor = "#0f172a";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.borderColor = "#e2e8f0";
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
                      fontSize: "0.72rem",
                      fontWeight: "600",
                      color: user?.github ? "#16a34a" : "#94a3b8",
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
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-3px)";
                    e.currentTarget.style.borderColor = "#0a66c2";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.borderColor = "#e2e8f0";
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
                      fontSize: "0.72rem",
                      fontWeight: "600",
                      color: user?.linkedin ? "#16a34a" : "#94a3b8",
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
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-3px)";
                    e.currentTarget.style.borderColor = "#10b981";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.borderColor = "#e2e8f0";
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
                      fontSize: "0.72rem",
                      fontWeight: "600",
                      color: user?.portfolio ? "#16a34a" : "#94a3b8",
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
              RIGHT COLUMN — Sidebar Cards (Matches Screenshot layout)
             ═══════════════════════════════════════════════════════════════════ */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "24px",
            }}
          >
            {/* Card 1: Links & Social with GitHub Contribution Heatmap */}
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
                </div>

                {/* Heatmap Months Header */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "0.68rem",
                    color: "#94a3b8",
                    marginBottom: "4px",
                    padding: "0 2px",
                  }}
                >
                  <span>Mar</span>
                  <span>Jun</span>
                  <span>Jul</span>
                  <span>Aug</span>
                  <span>Oct</span>
                  <span>Nov</span>
                  <span>Dec</span>
                </div>

                {/* Heatmap Grid */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(20, 1fr)",
                    gap: "3px",
                    padding: "8px",
                    background: "#f8fafc",
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  {contributionGrid.slice(0, 100).map((level, i) => (
                    <div
                      key={i}
                      style={{
                        width: "100%",
                        paddingBottom: "100%",
                        backgroundColor: getHeatmapColor(level),
                        borderRadius: "2px",
                      }}
                      title={`Activity level: ${level}`}
                    />
                  ))}
                </div>

                {/* Less -> More Legend */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    gap: "4px",
                    marginTop: "6px",
                    fontSize: "0.65rem",
                    color: "#94a3b8",
                  }}
                >
                  <span>Less</span>
                  {[0, 1, 2, 3, 4].map((lvl) => (
                    <span
                      key={lvl}
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "2px",
                        backgroundColor: getHeatmapColor(lvl),
                        display: "inline-block",
                      }}
                    />
                  ))}
                  <span>More</span>
                </div>
              </div>
            </div>

            {/* Card 2: Top Projects (Matches Screenshot) */}
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

              {/* Projects List / Mini Cards */}
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "18px" }}>
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
                        {(proj.tags || []).slice(0, 3).map((tag, idx) => (
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
                  // Default sample project cards like in mockup
                  <>
                    <div
                      style={{
                        background: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        borderRadius: "14px",
                        padding: "14px",
                      }}
                    >
                      <h4
                        style={{
                          margin: "0 0 4px",
                          fontSize: "0.95rem",
                          fontWeight: "700",
                          color: "#1e293b",
                        }}
                      >
                        Project Alpha <span style={{ fontSize: "0.75rem", color: "#64748b" }}>(Python/Flask)</span>
                      </h4>
                      <p style={{ fontSize: "0.8rem", color: "#64748b", margin: "0 0 8px" }}>
                        Microservices architecture for real-time analytics.
                      </p>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <span style={{ background: "#e2e8f0", fontSize: "0.7rem", padding: "2px 8px", borderRadius: "6px" }}>Python</span>
                        <span style={{ background: "#e2e8f0", fontSize: "0.7rem", padding: "2px 8px", borderRadius: "6px" }}>Docker</span>
                      </div>
                    </div>

                    <div
                      style={{
                        background: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        borderRadius: "14px",
                        padding: "14px",
                      }}
                    >
                      <h4
                        style={{
                          margin: "0 0 4px",
                          fontSize: "0.95rem",
                          fontWeight: "700",
                          color: "#1e293b",
                        }}
                      >
                        Beta Web App <span style={{ fontSize: "0.75rem", color: "#64748b" }}>(React/Node)</span>
                      </h4>
                      <p style={{ fontSize: "0.8rem", color: "#64748b", margin: "0 0 8px" }}>
                        Collaborative workspace for developer teams.
                      </p>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <span style={{ background: "#e0e7ff", color: "#4338ca", fontSize: "0.7rem", padding: "2px 8px", borderRadius: "6px" }}>React</span>
                        <span style={{ background: "#e0e7ff", color: "#4338ca", fontSize: "0.7rem", padding: "2px 8px", borderRadius: "6px" }}>MongoDB</span>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Add New Project Button (Dark Navy Pill Button) */}
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
          MODAL: EDIT PROFILE
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
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "14px" }}>
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
                  placeholder="Passionate developer building scalable web apps..."
                />
              </div>

              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "700", marginBottom: "4px" }}>
                  Skills (comma-separated with optional % e.g. Python (90%), React (85%))
                </label>
                <input
                  className="form-input"
                  type="text"
                  name="skills"
                  value={formData.skills}
                  onChange={handleChange}
                  placeholder="Python (90%), React (85%), Git (85%)"
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "14px", marginBottom: "14px" }}>
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
                    placeholder="2019-2023"
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "20px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "700", marginBottom: "4px" }}>
                    GitHub URL
                  </label>
                  <input
                    className="form-input"
                    type="text"
                    name="github"
                    value={formData.github}
                    onChange={handleChange}
                    placeholder="https://github.com/username"
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "700", marginBottom: "4px" }}>
                    LinkedIn URL
                  </label>
                  <input
                    className="form-input"
                    type="text"
                    name="linkedin"
                    value={formData.linkedin}
                    onChange={handleChange}
                    placeholder="https://linkedin.com/in/username"
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "700", marginBottom: "4px" }}>
                    Portfolio URL
                  </label>
                  <input
                    className="form-input"
                    type="text"
                    name="portfolio"
                    value={formData.portfolio}
                    onChange={handleChange}
                    placeholder="https://myportfolio.com"
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
          MODAL: ADD SKILL INLINE
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
              Add a Skill
            </h3>
            <div style={{ marginBottom: "14px" }}>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "700", marginBottom: "4px" }}>
                Skill Name
              </label>
              <input
                className="form-input"
                type="text"
                placeholder="e.g. Next.js, TypeScript, Docker"
                value={newSkillName}
                onChange={(e) => setNewSkillName(e.target.value)}
                autoFocus
              />
            </div>
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "700", marginBottom: "4px" }}>
                Proficiency Level ({newSkillPercent}%)
              </label>
              <input
                type="range"
                min="40"
                max="100"
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
                onClick={handleAddSkill}
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