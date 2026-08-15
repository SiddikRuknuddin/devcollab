import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

function DeveloperProfile() {
  const { id } = useParams();
  const { token } = useAuth();

  const [developer, setDeveloper] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDeveloper = async () => {
      try {
        const response = await axios.get(
          `http://localhost:5000/api/users/developers/${id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setDeveloper(response.data.developer);
      } catch (error) {
        console.error(
          "Developer Profile Error:",
          error.response?.data || error.message
        );

        setError("Unable to load developer profile");
      } finally {
        setLoading(false);
      }
    };

    if (token && id) {
      fetchDeveloper();
    }
  }, [token, id]);

  if (loading) {
    return <p>Loading developer profile...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  if (!developer) {
    return <p>Developer not found.</p>;
  }

  return (
    <div className="profile-page">
      <Link to="/developers">
        ← Back to Developers
      </Link>

      <h1>Developer Profile</h1>

      <div className="profile-card">
        <div className="profile-avatar">
          👤
        </div>

        <div className="profile-info">
          <h2>{developer.name}</h2>

          <p>
            <strong>Email:</strong>{" "}
            {developer.email}
          </p>

          <p>
            <strong>Bio:</strong>{" "}
            {developer.bio || "No bio added yet"}
          </p>

          <p>
            <strong>Skills:</strong>{" "}
            {developer.skills?.length
              ? developer.skills.join(", ")
              : "No skills added yet"}
          </p>
        </div>
      </div>
    </div>
  );
}

export default DeveloperProfile;