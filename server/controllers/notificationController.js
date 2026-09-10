const { Notification } = require("../models/Notification");

// ==========================================
// GET MY NOTIFICATIONS
// ==========================================
const getMyNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit, 10) || 50;

    const notifications = await Notification.find({ recipient: userId })
      .populate("sender", "name profileImage email")
      .populate("relatedProject", "title")
      .populate("relatedDiscussion", "title")
      .sort({ createdAt: -1 })
      .limit(limit);

    const unreadCount = await Notification.countDocuments({
      recipient: userId,
      isRead: false,
    });

    res.status(200).json({
      success: true,
      count: notifications.length,
      unreadCount,
      notifications,
    });
  } catch (error) {
    console.error("Get Notifications Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error retrieving notifications",
    });
  }
};

// ==========================================
// MARK NOTIFICATION AS READ
// ==========================================
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findOne({
      _id: id,
      recipient: userId,
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    notification.isRead = true;
    await notification.save();

    res.status(200).json({
      success: true,
      message: "Notification marked as read",
      notification,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }
    console.error("Mark Notification Read Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error updating notification",
    });
  }
};

// ==========================================
// MARK ALL AS READ
// ==========================================
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    await Notification.updateMany(
      { recipient: userId, isRead: false },
      { $set: { isRead: true } }
    );

    res.status(200).json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    console.error("Mark All Read Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error marking notifications read",
    });
  }
};

// ==========================================
// DELETE NOTIFICATION
// ==========================================
const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findOneAndDelete({
      _id: id,
      recipient: userId,
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Notification deleted successfully",
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }
    console.error("Delete Notification Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error deleting notification",
    });
  }
};

module.exports = {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};
