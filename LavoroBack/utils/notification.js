const Notification = require('../models/notif'); 

exports.createNotification = async (userId, text, type) => {
  try {
    const notification = new Notification({
      user_id: userId,
      notification_text: text,
      type: type,
    });
    
    await notification.save();
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};