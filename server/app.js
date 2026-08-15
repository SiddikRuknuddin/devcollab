const express = require("express");

const cors = require("cors");
const userRoutes = require("./routes/userRoutes");
const testRoutes = require("./routes/testRoutes");
const authRoutes = require("./routes/authRoutes");
const projectRoutes = require("./routes/projectRoutes");
const app = express();
const protectedRoutes = require("./routes/protectedRoutes");
app.use(cors());
app.use(express.json());
app.use("/api/users", userRoutes);
app.use("/api/projects", projectRoutes);
app.get("/", (req, res) => {
  res.send("DevCollab API Running");
});

app.use("/api/test", testRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/protected", protectedRoutes);
module.exports = app;