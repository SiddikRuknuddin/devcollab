require("dotenv").config();

const http = require("http");
const { Server } = require("socket.io");
const app = require("./app");
const connectDB = require("./config/db");
const Message = require("./models/Message");

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

// Socket.io real-time handlers
io.on("connection", (socket) => {
  // Join project chat room
  socket.on("join_project", (projectId) => {
    if (projectId) {
      socket.join(`project_${projectId}`);
    }
  });

  socket.on("leave_project", (projectId) => {
    if (projectId) {
      socket.leave(`project_${projectId}`);
    }
  });

  // Handle project chat message
  socket.on("send_project_message", async (data) => {
    try {
      const { projectId, senderId, text, codeSnippet } = data;
      if (!projectId || !senderId || !text?.trim()) return;

      const message = await Message.create({
        project: projectId,
        sender: senderId,
        text: text.trim(),
        codeSnippet: codeSnippet || undefined,
      });

      const populated = await Message.findById(message._id).populate(
        "sender",
        "name email profileImage"
      );

      io.to(`project_${projectId}`).emit("new_project_message", populated);
    } catch (err) {
      console.error("Socket send_project_message error:", err.message);
    }
  });

  // Join personal user room for 1-on-1 direct messages
  socket.on("join_user", (userId) => {
    if (userId) {
      socket.join(`user_${userId}`);
    }
  });

  // Handle direct message
  socket.on("send_direct_message", async (data) => {
    try {
      const { senderId, recipientId, text, codeSnippet } = data;
      if (!senderId || !recipientId || !text?.trim()) return;

      const message = await Message.create({
        sender: senderId,
        recipient: recipientId,
        text: text.trim(),
        codeSnippet: codeSnippet || undefined,
      });

      const populated = await Message.findById(message._id)
        .populate("sender", "name email profileImage")
        .populate("recipient", "name email profileImage");

      // Emit to both recipient and sender
      io.to(`user_${recipientId}`).emit("new_direct_message", populated);
      io.to(`user_${senderId}`).emit("new_direct_message", populated);
    } catch (err) {
      console.error("Socket send_direct_message error:", err.message);
    }
  });

  // Typing indicator
  socket.on("typing", (data) => {
    if (data.projectId) {
      socket.to(`project_${data.projectId}`).emit("user_typing", data);
    } else if (data.recipientId) {
      socket.to(`user_${data.recipientId}`).emit("user_typing", data);
    }
  });

  socket.on("stop_typing", (data) => {
    if (data.projectId) {
      socket.to(`project_${data.projectId}`).emit("user_stop_typing", data);
    } else if (data.recipientId) {
      socket.to(`user_${data.recipientId}`).emit("user_stop_typing", data);
    }
  });

  // Feature 7: Multiplayer Real-Time Code Pairing
  socket.on("code_sync", (data) => {
    if (data.projectId) {
      socket.to(`project_${data.projectId}`).emit("code_updated", {
        file: data.file,
        code: data.code,
        sender: data.sender,
        cursorLine: data.cursorLine,
      });
    }
  });

  // Feature 8: Persistent Voice Huddle Presence
  socket.on("huddle_join", (data) => {
    if (data.projectId && data.user) {
      socket.join(`huddle_${data.projectId}`);
      io.to(`huddle_${data.projectId}`).emit("huddle_peer_joined", {
        user: data.user,
        socketId: socket.id,
      });
    }
  });

  socket.on("huddle_leave", (data) => {
    if (data.projectId && data.user) {
      socket.leave(`huddle_${data.projectId}`);
      io.to(`huddle_${data.projectId}`).emit("huddle_peer_left", {
        userId: data.user._id,
        socketId: socket.id,
      });
    }
  });

  socket.on("huddle_speaking", (data) => {
    if (data.projectId) {
      socket.to(`huddle_${data.projectId}`).emit("peer_speaking", {
        userId: data.userId,
        isSpeaking: data.isSpeaking,
      });
    }
  });

  socket.on("disconnect", () => {});
});


const startServer = async () => {
  try {
    await connectDB();
    server.listen(PORT, () => {
      console.log(`🚀 Server + WebSockets running on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();