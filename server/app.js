const express = require("express");
const cors = require("cors");

const testRoutes = require("./routes/testRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("DevCollab API Running");
});

// API Routes
app.use("/api/test", testRoutes);

module.exports = app;