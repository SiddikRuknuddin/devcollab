import { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "../services/api";

const AuthContext = createContext();

// Decode JWT payload safely
const decodeToken = (token) => {
  if (!token) return null;
  try {
    const payloadBase64 = token.split(".")[1];
    if (!payloadBase64) return null;
    const decodedJson = atob(
      payloadBase64.replace(/-/g, "+").replace(/_/g, "/")
    );
    const parsed = JSON.parse(decodedJson);
    return {
      id: parsed.id,
      _id: parsed.id,
      email: parsed.email,
      name: parsed.name,
      exp: parsed.exp,
    };
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [user, setUser] = useState(() =>
    decodeToken(localStorage.getItem("token"))
  );
  // Full user profile (includes profileImage, skills, etc.)
  const [userProfile, setUserProfile] = useState(null);

  // Fetch full user profile from the API
  const fetchUserProfile = useCallback(async (authToken) => {
    if (!authToken) return;
    try {
      const response = await api.get("/api/users/profile", {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      setUserProfile(response.data.user || null);
    } catch {
      // Silently fail — userProfile stays null
      setUserProfile(null);
    }
  }, []);

  useEffect(() => {
    if (token) {
      const decoded = decodeToken(token);
      if (decoded?.exp && decoded.exp * 1000 < Date.now()) {
        logout();
      } else {
        setUser(decoded);
        fetchUserProfile(token);
      }
    } else {
      setUser(null);
      setUserProfile(null);
    }
  }, [token, fetchUserProfile]);

  const login = (newToken) => {
    if (!newToken) return;
    localStorage.setItem("token", newToken);
    setToken(newToken);
    setUser(decodeToken(newToken));
    fetchUserProfile(newToken);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    setUserProfile(null);
  };

  // Refresh profile after image upload or profile edit
  const refreshProfile = useCallback(async () => {
    if (token) {
      await fetchUserProfile(token);
    }
  }, [token, fetchUserProfile]);

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        userProfile,
        login,
        logout,
        refreshProfile,
        isAuthenticated: !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);