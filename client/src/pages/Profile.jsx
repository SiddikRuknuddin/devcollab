import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

function Profile() {
  const { token } = useAuth();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [isEditing, setIsEditing] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    skills: "",
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get(
          "http://localhost:5000/api/users/profile",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const userData = response.data.user;

        setUser(userData);

        setFormData({
          name: userData.name || "",
          bio: userData.bio || "",
          skills: userData.skills?.join(", ") || "",
        });
      } catch (error) {
        console.error(
          "Profile Error:",
          error.response?.data || error.message
        );

        setError("Unable to load profile");
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchProfile();
    }
  }, [token]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    try {
      const skillsArray = formData.skills
        .split(",")
        .map((skill) => skill.trim())
        .filter((skill) => skill !== "");

      const response = await axios.put(
        "http://localhost:5000/api/users/profile",
        {
          name: formData.name,
          bio: formData.bio,
          skills: skillsArray,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setUser(response.data.user);
      setIsEditing(false);

      alert("Profile updated successfully!");
    } catch (error) {
      console.error(
        "Update Profile Error:",
        error.response?.data || error.message
      );

      alert("Failed to update profile");
    }
  };

  if (loading) {
    return <p>Loading profile...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  return (
    <div className="profile-page">
      <h1>My Profile</h1>

      {!isEditing ? (
        <div className="profile-card">
          <div className="profile-avatar">
            👤
          </div>

          <div className="profile-info">
            <h2>{user?.name}</h2>

            <p>
              <strong>Email:</strong> {user?.email}
            </p>

            <p>
              <strong>Bio:</strong>{" "}
              {user?.bio || "No bio added yet"}
            </p>

            <p>
              <strong>Skills:</strong>{" "}
              {user?.skills?.length
                ? user.skills.join(", ")
                : "No skills added yet"}
            </p>
          </div>

          <button onClick={() => setIsEditing(true)}>
            Edit Profile
          </button>
        </div>
      ) : (
        <form className="profile-form" onSubmit={handleUpdate}>
          <h2>Edit Profile</h2>

          <label>Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />

          <label>Email</label>
          <input
            type="email"
            value={user?.email || ""}
            disabled
          />

          <label>Bio</label>
          <textarea
            name="bio"
            value={formData.bio}
            onChange={handleChange}
            placeholder="Tell us about yourself"
          />

          <label>Skills</label>
          <input
            type="text"
            name="skills"
            value={formData.skills}
            onChange={handleChange}
            placeholder="React, Node.js, MongoDB"
          />

          <div className="profile-form-buttons">
            <button type="submit">
              Save Changes
            </button>

            <button
              type="button"
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default Profile;