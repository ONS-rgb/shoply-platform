const mongoose = require('mongoose');

const paymentHistorySchema = new mongoose.Schema({
  statut: {
    type: String,
    enum: ['en_attente', 'valide', 'refuse'],
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  commentaire: {
    type: String,
    default: ''
  },
  traitePar: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { _id: false });

const paymentSchema = new mongoose.Schema({
  reference: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
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
  methodePaiement: {
    type: String,
    enum: ['livraison', 'carte', 'virement'],
    default: 'livraison'
  },
  statut: {
    type: String,
    enum: ['en_attente', 'valide', 'refuse'],
    default: 'en_attente'
  },
  datePaiement: {
    type: Date,
    default: Date.now
  },
  transactionId: {
    type: String,
    default: ''
  },
  notes: {
    type: String,
    default: ''
  },
  validePar: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  dateValidation: {
    type: Date
  },
  historique: [paymentHistorySchema]
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
