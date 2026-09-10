const { Notification } = require("../models/Notification");

/**
 * Reusable helper to safely create in-app notifications
 * @param {Object} data
 * @param {String} data.recipient - Target user ObjectId
 * @param {String} data.sender - Triggering user ObjectId
 * @param {String} data.type - Notification type enum
 * @param {String} data.title - Notification title
 * @param {String} data.message - Notification message body
 * @param {String} [data.relatedProject] - Optional Project ObjectId
 * @param {String} [data.relatedDiscussion] - Optional Discussion ObjectId
 * @param {String} [data.relatedComment] - Optional Comment ObjectId
 */
const createNotification = async ({
  recipient,
  sender,
  type,
  title,
  message,
  relatedProject = null,
  relatedDiscussion = null,
  relatedComment = null,
}) => {
  try {
    if (!recipient || !sender || !type || !title || !message) {
      console.warn("Missing required parameters for notification creation");
      return null;
    }

    // Do not notify a user about their own actions
    if (recipient.toString() === sender.toString()) {
      return null;
    }

    const notification = await Notification.create({
      recipient,
      sender,
      type,
      title,
      message,
      relatedProject,
      relatedDiscussion,
      relatedComment,
      isRead: false,
    });

    return notification;
  } catch (error) {
    // Log error but do not break the parent operation
    console.error("Notification Helper Error:", error.message);
    return null;
  }
};

module.exports = { createNotification };
