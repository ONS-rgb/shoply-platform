const mongoose = require('mongoose');

const commissionSchema = new mongoose.Schema({
  commande: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  paiement: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment'
  },
  vendeur: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  boutique: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop'
  },
  article: {
    produit: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    nom: { type: String, default: '' },
    quantite: { type: Number, default: 1 },
    prixUnitaire: { type: Number, default: 0 }
  },
  montantVente: {
    type: Number,
    required: true,
    min: 0
  },
  pourcentage: {
    type: Number,
    required: true,
    default: 10, // 10% de commission par défaut
    min: 0,
    max: 100
  },
  montantCommission: {
    type: Number,
    required: true,
    min: 0
  },
  montantNetVendeur: {
    type: Number,
    required: true,
    min: 0
  },
  statut: {
    type: String,
    enum: ['en_attente', 'validee', 'payee', 'annulee'],
    default: 'validee'
  },
  dateCalcul: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('Commission', commissionSchema);
