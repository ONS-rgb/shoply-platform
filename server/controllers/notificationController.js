const mongoose = require('mongoose');
const Notification = require('../models/Notification');

// GET /api/notifications : Mes notifications
exports.getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ destinataire: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = await Notification.countDocuments({
      destinataire: req.user._id,
      lu: false
    });

    res.json({
      success: true,
      unreadCount,
      data: notifications
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/notifications/:id/read : Marquer comme lue
exports.markAsRead = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ success: false, message: 'Notification non trouvée' });
    }

    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, destinataire: req.user._id },
      { lu: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification non trouvée' });
    }

    const unreadCount = await Notification.countDocuments({
      destinataire: req.user._id,
      lu: false
    });

    res.json({ success: true, unreadCount, data: notification });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/notifications/read-all : Tout marquer comme lu
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { destinataire: req.user._id, lu: false },
      { lu: true }
    );

    res.json({ success: true, message: 'Toutes les notifications ont été marquées comme lues', unreadCount: 0 });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
