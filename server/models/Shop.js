const mongoose = require('mongoose');

const shopSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  logo: {
    type: String,
    default: ''
  },
  banniere: {
    type: String,
    default: ''
  },
  proprietaire: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  telephone: {
    type: String,
    default: ''
  },
  email: {
    type: String,
    default: ''
  },
  adresse: {
    rue: { type: String, default: '' },
    ville: { type: String, default: '' },
    codePostal: { type: String, default: '' },
    pays: { type: String, default: 'Tunisie' }
  },
  statut: {
    type: String,
    enum: ['active', 'inactive', 'fermee_temporairement', 'en_attente', 'approuvee', 'acceptee', 'refusee', 'suspendue'],
    default: 'active'
  },
  motifFermeture: {
    type: String,
    default: ''
  }
}, { timestamps: true });

module.exports = mongoose.model('Shop', shopSchema);
