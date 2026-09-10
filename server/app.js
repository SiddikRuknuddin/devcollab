const express = require("express");
const cors = require("cors");

const userRoutes = require("./routes/userRoutes");
const testRoutes = require("./routes/testRoutes");
const authRoutes = require("./routes/authRoutes");
const projectRoutes = require("./routes/projectRoutes");
const projectMemberRoutes = require("./routes/projectMemberRoutes");
const discussionRoutes = require("./routes/discussionRoutes");
const commentRoutes = require("./routes/commentRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const protectedRoutes = require("./routes/protectedRoutes");
const rateLimiter = require("./middleware/rateLimiter");

const app = express();

// CORS configuration (supports production FRONTEND_URL, Vercel deployments, and localhost)
const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(",").map((url) => url.trim().replace(/\/$/, ""))
  : ["http://localhost:5173", "http://localhost:3000"];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, curl)
      if (!origin) return callback(null, true);

      const isAllowed =
        allowedOrigins.includes(origin) ||
        origin.endsWith(".vercel.app") ||
        process.env.NODE_ENV !== "production";

      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error(`CORS blocked for origin: ${origin}`));
      }
    },
    credentials: true,
  })
);

// Basic security headers
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  next();
});

app.use(express.json({ limit: "1mb" }));

// Rate limiter on sensitive auth routes
const authLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: "Too many login/registration attempts, please try again after 15 minutes",
});

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/projects", projectMemberRoutes);
app.use("/api/discussions", discussionRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "DevCollab API Running",
    version: "1.0.0",
  });
});

app.use("/api/test", testRoutes);
app.use("/api/protected", protectedRoutes);

// 404 Handler for undefined API routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Global Centralized Error Handler (Never leak stack traces)
app.use((err, req, res, next) => {
  console.error("Global Error Handler caught:", err.message);

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message:
      statusCode === 500
        ? "Internal server error occurred"
        : err.message || "An error occurred",
  });
});

module.exports = app;