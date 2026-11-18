const mongoose = require('mongoose');

const refundHistorySchema = new mongoose.Schema({
  statut: {
    type: String,
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
  reclamation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Reclamation'
  },
  paiement: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment'
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
    enum: ['en_attente', 'approuve', 'refuse', 'rembourse', 'approuvee', 'rejetee', 'remboursee'],
    default: 'en_attente'
  },
  confirmationPaiement: {
    referenceTransaction: { type: String, default: '' },
    mode: { type: String, default: '' },
    dateExecution: { type: Date },
    confirme: { type: Boolean, default: false },
    commentaire: { type: String, default: '' }
  },
  reponse: {
    type: String,
    default: ''
  },
  reponseVendeur: {
    type: String,
    default: ''
  },
  dateReponseVendeur: {
    type: Date
  },
  traitePar: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  dateTraitement: {
    type: Date
  },
  historiqueStatuts: [refundHistorySchema]
}, { timestamps: true });

module.exports = mongoose.model('Refund', refundSchema);
