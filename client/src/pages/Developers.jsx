import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
function Developers() {
  const { token } = useAuth();

  const [developers, setDevelopers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  useEffect(() => {
    const fetchDevelopers = async () => {
      try {
        const response = await axios.get(
          "http://localhost:5000/api/users/developers",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setDevelopers(response.data.developers);
      } catch (error) {
        console.error(
          "Developers Error:",
          error.response?.data || error.message
        );

        setError("Unable to load developers");
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchDevelopers();
    }
  }, [token]);

  if (loading) {
    return <p>Loading developers...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  return (
    <div className="developers-page">
      <h1>Find Developers</h1>

<p>
  Discover developers and find people to collaborate with.
</p>

<input
  type="text"
  placeholder="Search by name, bio, or skill..."
  value={search}
  onChange={(e) => setSearch(e.target.value)}
  className="developer-search"
/>
      <div className="developers-grid">
       {developers
  .filter((developer) => {
    const searchText = search.toLowerCase();

    const name = developer.name?.toLowerCase() || "";
    const bio = developer.bio?.toLowerCase() || "";
    const skills =
      developer.skills?.join(" ").toLowerCase() || "";

    return (
      name.includes(searchText) ||
      bio.includes(searchText) ||
      skills.includes(searchText)
    );
  })
  .map((developer) => (
          <div
            className="developer-card"
            key={developer._id}
          >
            <div className="developer-avatar">
              👤
            </div>

            <h2>{developer.name}</h2>

            <p>
              {developer.bio || "No bio added yet"}
            </p>

            <p>
              <strong>Skills:</strong>{" "}
              {developer.skills?.length
                ? developer.skills.join(", ")
                : "No skills added yet"}
            </p>

           <Link to={`/developers/${developer._id}`}>
  View Profile
</Link>
          </div>
        ))}
      </div>
    </div>
  );
}


 
export default Developers;