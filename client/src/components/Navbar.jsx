import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Navbar() {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav>
      <div>
        <Link to="/">
          <strong>DevCollab</strong>
        </Link>
      </div>

      <div>
        <Link to="/">Home</Link>

        {isAuthenticated && (
          <Link to="/dashboard">Dashboard</Link>
        )}

        {isAuthenticated ? (
          <button onClick={handleLogout}>
            Logout
          </button>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;