const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  destinataire: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  titre: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['commande', 'remboursement', 'produit', 'info'],
    default: 'commande'
  },
  lien: {
    type: String,
    default: ''
  },
  lu: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
