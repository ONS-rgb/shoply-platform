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
  statut: {
    type: String,
    enum: ['en_attente', 'approuvee', 'suspendue'],
    default: 'approuvee'
  }
}, { timestamps: true });

module.exports = mongoose.model('Shop', shopSchema);
