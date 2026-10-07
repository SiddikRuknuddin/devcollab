import axios from "axios";

export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to automatically attach authorization token and ensure /api prefix
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Automatically prefix with /api if omitted for relative paths
    if (
      config.url &&
      !config.url.startsWith("http://") &&
      !config.url.startsWith("https://") &&
      !config.url.startsWith("/api/") &&
      config.url !== "/api"
    ) {
      config.url = `/api${config.url.startsWith("/") ? "" : "/"}${config.url}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle common errors gracefully
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      console.warn("Session expired or unauthorized request");
    }
    return Promise.reject(error);
  }
);

export default api;
