const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is not defined in environment variables");
    }

    mongoose.connection.on("connected", () => {
      console.log("✅ MongoDB Connected Successfully");
    });

    mongoose.connection.on("error", (err) => {
      console.error("❌ MongoDB Connection Error:", err.message);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("⚠️ MongoDB Disconnected. Attempting to reconnect...");
    });

    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of hanging
    });
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error.message);
    console.error("👉 Tip: Check your internet connection and verify that your IP is whitelisted in MongoDB Atlas (Network Access -> 0.0.0.0/0).");
    process.exit(1);
  }
};

module.exports = connectDB;