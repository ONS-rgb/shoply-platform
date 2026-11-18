const mongoose = require('mongoose');

const reclamationHistorySchema = new mongoose.Schema({
  statut: {
    type: String,
    enum: ['en_attente', 'en_cours', 'resolue', 'refusee'],
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
  modifiePar: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { _id: false });

const reclamationSchema = new mongoose.Schema({
  numeroReclamation: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  commande: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  sujet: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  piecesJointes: [{
    type: String,
    trim: true
  }],
  statut: {
    type: String,
    enum: ['en_attente', 'en_cours', 'resolue', 'refusee'],
    default: 'en_attente'
  },
  reponseAdmin: {
    type: String,
    default: ''
  },
  dateResolution: {
    type: Date
  },
  historiqueStatuts: [reclamationHistorySchema]
}, { timestamps: true });

module.exports = mongoose.model('Reclamation', reclamationSchema);
