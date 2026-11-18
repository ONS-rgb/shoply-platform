const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  produit: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  note: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  titre: {
    type: String,
    trim: true,
    default: ''
  },
  commentaire: {
    type: String,
    required: true,
    trim: true
  },
  achatVerifie: {
    type: Boolean,
    default: false
  },
  reponseVendeur: {
    texte: { type: String, trim: true, default: '' },
    dateReponse: { type: Date },
    vendeur: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }
}, { timestamps: true });

// Un seul avis par client par produit
reviewSchema.index({ produit: 1, client: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
