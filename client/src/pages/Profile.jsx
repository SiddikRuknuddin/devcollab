import { useEffect, useRef, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

function Profile() {
  const { token, refreshProfile } = useAuth();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  // Image upload state
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState("");
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    skills: "",
    github: "",
    linkedin: "",
    portfolio: "",
    location: "",
    experience: "",
    education: "",
  });

  const fetchProfile = async () => {
    try {
      const response = await api.get("/api/users/profile");
      const userData = response.data.user;
      setUser(userData);
      setFormData({
        name: userData.name || "",
        bio: userData.bio || "",
        skills: userData.skills?.join(", ") || "",
        github: userData.github || "",
        linkedin: userData.linkedin || "",
        portfolio: userData.portfolio || "",
        location: userData.location || "",
        experience: userData.experience || "",
        education: userData.education || "",
      });
    } catch (err) {
      setError("Unable to load profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchProfile();
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
    const url = URL.createObjectURL(file);
    setImagePreview(url);
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
      await refreshProfile(); // Update navbar avatar
    } catch (err) {
      setImageError(err.response?.data?.message || "Image upload failed. Please try again.");
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

  // ── Profile Update Handler ─────────────────────────────────────────────────
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

      const response = await api.put("/api/users/profile", {
        name: formData.name,
        bio: formData.bio,
        skills: skillsArray,
        github: formData.github,
        linkedin: formData.linkedin,
        portfolio: formData.portfolio,
        location: formData.location,
        experience: formData.experience,
        education: formData.education,
      });

      const updatedUser = response.data.user;
      setUser(updatedUser);
      setFormData({
        name: updatedUser.name || "",
        bio: updatedUser.bio || "",
        skills: updatedUser.skills?.join(", ") || "",
        github: updatedUser.github || "",
        linkedin: updatedUser.linkedin || "",
        portfolio: updatedUser.portfolio || "",
        location: updatedUser.location || "",
        experience: updatedUser.experience || "",
        education: updatedUser.education || "",
      });

      setIsEditing(false);
      setSuccessMessage("Profile updated successfully!");
      await refreshProfile();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  // ── Helpers ────────────────────────────────────────────────────────────────
  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  const linkHref = (url) =>
    url && !url.startsWith("http") ? `https://${url}` : url;

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-container">Loading profile...</div>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="page-container">
        <div className="alert alert-error">{error}</div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>My Profile</h1>
        <p>Manage your personal information, skills, and links.</p>
      </div>

      {successMessage && (
        <div className="alert alert-success" style={{ marginBottom: "20px" }}>
          {successMessage}
        </div>
      )}
      {error && (
        <div className="alert alert-error" style={{ marginBottom: "20px" }}>
          {error}
        </div>
      )}

      {/* ── Profile Photo Card ──────────────────────────────────────────────── */}
      <div className="card" style={{ marginBottom: "20px", display: "flex", alignItems: "center", gap: "24px", flexWrap: "wrap" }}>
        {/* Avatar */}
        <div style={{
          width: "96px", height: "96px",
          borderRadius: "50%",
          overflow: "hidden",
          background: "#eff6ff",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "32px", fontWeight: "700", color: "#2563eb",
          flexShrink: 0,
          border: "3px solid #e2e8f0",
        }}>
          {(imagePreview || user?.profileImage) ? (
            <img
              src={imagePreview || user.profileImage}
              alt={user?.name}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              onError={(e) => { e.target.style.display = "none"; }}
            />
          ) : initials}
        </div>

        <div style={{ flex: 1 }}>
          <h3 style={{ marginBottom: "4px" }}>{user?.name}</h3>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginBottom: "12px" }}>
            {user?.email}
          </p>

          {/* Image upload controls */}
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
            <input
              ref={fileInputRef}
              type="file"
              id="profile-image-input"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              style={{ display: "none" }}
              onChange={handleImageChange}
            />
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => fileInputRef.current?.click()}
            >
              📷 Choose Photo
            </button>

            {imageFile && (
              <>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={handleImageUpload}
                  disabled={uploadingImage}
                >
                  {uploadingImage ? "Uploading..." : "Upload Photo"}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={cancelImagePreview}
                >
                  Cancel
                </button>
              </>
            )}
          </div>

          {imageFile && (
            <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "6px" }}>
              Selected: <strong>{imageFile.name}</strong> ({(imageFile.size / 1024).toFixed(0)} KB)
            </p>
          )}

          {imageError && (
            <p style={{ fontSize: "0.8rem", color: "var(--error)", marginTop: "6px" }}>
              {imageError}
            </p>
          )}

          <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "4px" }}>
            JPEG, PNG or WEBP · Max 5MB
          </p>
        </div>
      </div>

      {/* ── View / Edit Card ────────────────────────────────────────────────── */}
      {!isEditing ? (
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px", gap: "12px", flexWrap: "wrap" }}>
            <div>
              <h2 style={{ marginBottom: "8px" }}>Profile Details</h2>
              {user?.location && (
                <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
                  📍 {user.location}
                </p>
              )}
            </div>
            <button
              className="btn btn-secondary"
              onClick={() => { setIsEditing(true); setSuccessMessage(""); setError(""); }}
            >
              ✏️ Edit Profile
            </button>
          </div>

          <hr className="divider" />

          {/* Bio */}
          {user?.bio && (
            <div style={{ marginBottom: "20px" }}>
              <h4 style={{ marginBottom: "8px", color: "var(--text-secondary)", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>About</h4>
              <p style={{ lineHeight: 1.7 }}>{user.bio}</p>
            </div>
          )}

          {/* Skills */}
          <div style={{ marginBottom: "20px" }}>
            <h4 style={{ marginBottom: "10px", color: "var(--text-secondary)", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Skills &amp; Expertise
            </h4>
            {user?.skills?.length > 0 ? (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {user.skills.map((skill, i) => (
                  <span key={i} style={{
                    background: "var(--primary-light)",
                    color: "var(--primary)",
                    padding: "4px 12px",
                    borderRadius: "9999px",
                    fontSize: "0.82rem",
                    fontWeight: "500",
                    border: "1px solid var(--primary-border)",
                  }}>
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>No skills added yet.</p>
            )}
          </div>

          {/* Experience & Education */}
          <div className="grid-2" style={{ marginBottom: "20px" }}>
            <div style={{ background: "var(--surface-2)", padding: "16px", borderRadius: "var(--radius)" }}>
              <h4 style={{ marginBottom: "8px" }}>💼 Experience</h4>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", whiteSpace: "pre-line" }}>
                {user?.experience || "Not specified"}
              </p>
            </div>
            <div style={{ background: "var(--surface-2)", padding: "16px", borderRadius: "var(--radius)" }}>
              <h4 style={{ marginBottom: "8px" }}>🎓 Education</h4>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", whiteSpace: "pre-line" }}>
                {user?.education || "Not specified"}
              </p>
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 style={{ marginBottom: "10px", color: "var(--text-secondary)", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Links &amp; Social
            </h4>
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
              {user?.github ? (
                <a href={linkHref(user.github)} target="_blank" rel="noopener noreferrer"
                  style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "0.875rem", color: "#0f172a", fontWeight: "500" }}>
                  🐙 GitHub
                </a>
              ) : <span style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>GitHub not linked</span>}

              {user?.linkedin ? (
                <a href={linkHref(user.linkedin)} target="_blank" rel="noopener noreferrer"
                  style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "0.875rem", color: "#0a66c2", fontWeight: "500" }}>
                  💼 LinkedIn
                </a>
              ) : <span style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>LinkedIn not linked</span>}

              {user?.portfolio ? (
                <a href={linkHref(user.portfolio)} target="_blank" rel="noopener noreferrer"
                  style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "0.875rem", color: "#7c3aed", fontWeight: "500" }}>
                  🚀 Portfolio
                </a>
              ) : <span style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>Portfolio not linked</span>}
            </div>
          </div>
        </div>
      ) : (
        /* ── Edit Form ─────────────────────────────────────────────────────── */
        <div className="card">
          <h2 style={{ marginBottom: "20px" }}>Edit Profile</h2>
          <form onSubmit={handleUpdate}>
            <div className="grid-2" style={{ marginBottom: "16px" }}>
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input className="form-input" type="text" name="name" value={formData.name} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label className="form-label">Email (read-only)</label>
                <input className="form-input" type="email" value={user?.email || ""} disabled style={{ background: "var(--surface-2)", color: "var(--text-secondary)" }} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Bio</label>
              <textarea className="form-textarea" name="bio" value={formData.bio} onChange={handleChange} rows="3"
                placeholder="Brief summary about yourself and your passions..." />
            </div>

            <div className="form-group">
              <label className="form-label">Skills (comma-separated)</label>
              <input className="form-input" type="text" name="skills" value={formData.skills} onChange={handleChange}
                placeholder="React, Node.js, MongoDB, Python..." />
            </div>

            <div className="grid-2" style={{ marginBottom: "16px" }}>
              <div className="form-group">
                <label className="form-label">Location</label>
                <input className="form-input" type="text" name="location" value={formData.location} onChange={handleChange}
                  placeholder="e.g. San Francisco, CA" />
              </div>
              <div className="form-group">
                <label className="form-label">Education</label>
                <input className="form-input" type="text" name="education" value={formData.education} onChange={handleChange}
                  placeholder="e.g. B.S. Computer Science" />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Experience</label>
              <textarea className="form-textarea" name="experience" value={formData.experience} onChange={handleChange} rows="2"
                placeholder="e.g. 3+ years full-stack development..." />
            </div>

            <div className="grid-3" style={{ marginBottom: "20px" }}>
              <div className="form-group">
                <label className="form-label">GitHub URL</label>
                <input className="form-input" type="url" name="github" value={formData.github} onChange={handleChange}
                  placeholder="https://github.com/username" />
              </div>
              <div className="form-group">
                <label className="form-label">LinkedIn URL</label>
                <input className="form-input" type="url" name="linkedin" value={formData.linkedin} onChange={handleChange}
                  placeholder="https://linkedin.com/in/username" />
              </div>
              <div className="form-group">
                <label className="form-label">Portfolio URL</label>
                <input className="form-input" type="url" name="portfolio" value={formData.portfolio} onChange={handleChange}
                  placeholder="https://myportfolio.com" />
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </button>
              <button type="button" className="btn btn-secondary"
                onClick={() => { setIsEditing(false); setError(""); }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default Profile;