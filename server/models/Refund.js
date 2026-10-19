const mongoose = require('mongoose');

const refundSchema = new mongoose.Schema({
  commande: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  montant: {
    type: Number,
    required: true,
    min: 0
  },
  motif: {
    type: String,
    required: true,
    trim: true
  },
  details: {
    type: String,
    trim: true,
    default: ''
  },
  statut: {
    type: String,
    enum: ['en_attente', 'approuvee', 'rejetee', 'remboursee'],
    default: 'en_attente'
  },
  reponse: {
    type: String,
    default: ''
  }
}, { timestamps: true });

module.exports = mongoose.model('Refund', refundSchema);
