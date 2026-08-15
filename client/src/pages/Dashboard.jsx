// function Dashboard() {
//   return (
//     <div>
//       <h1>Dashboard</h1>
//       <p>Welcome to your DevCollab Dashboard</p>
//     </div>
//   );
// }

// export default Dashboard;


// import { useAuth } from "../context/AuthContext";
// import { useNavigate } from "react-router-dom";

// function Dashboard() {
//   const { logout } = useAuth();
//   const navigate = useNavigate();

//   const handleLogout = () => {
//     logout();
//     navigate("/login");
//   };

//   return (
//     <div>
//       <h1>Dashboard</h1>

//       <p>Welcome to your DevCollab Dashboard</p>

//       <button onClick={handleLogout}>
//         Logout
//       </button>
//     </div>
//   );
// }

// export default Dashboard;

import { Link } from "react-router-dom";

function Dashboard() {
  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Welcome to DevCollab 👋</h1>
          <p>
            Collaborate, build, and connect with developers.
          </p>
        </div>
      </div>

      <div className="dashboard-cards">
        <div className="dashboard-card">
          <h2>👤 Profile</h2>
          <p>
            View and manage your developer profile.
          </p>

          <Link to="/profile">
            View Profile
          </Link>
        </div>

        <div className="dashboard-card">
          <h2>💻 Projects</h2>
          <p>
            Create and manage your development projects.
          </p>

          <button>
            View Projects
          </button>
        </div>

        <div className="dashboard-card">
          <h2>👥 Collaborators</h2>
          <p>
            Find developers and collaborate on projects.
          </p>

          <Link to="/developers">
  Find Developers
</Link>
        </div>

        <div className="dashboard-card">
          <h2>💬 Discussions</h2>
          <p>
            Share ideas and discuss development topics.
          </p>

          <button>
            View Discussions
          </button>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;