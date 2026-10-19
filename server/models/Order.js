const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  produit: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  nom: { type: String, required: true },
  prix: { type: Number, required: true },
  quantite: { type: Number, required: true, min: 1 },
  couleur: { type: String, default: '' },
  image: { type: String, default: '' },
  boutique: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { _id: true });

const orderSchema = new mongoose.Schema({
  numeroCommande: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  articles: [orderItemSchema],
  adresseLivraison: {
    nomComplet: { type: String, required: true, trim: true },
    telephone: { type: String, required: true, trim: true },
    rue: { type: String, required: true, trim: true },
    ville: { type: String, required: true, trim: true },
    codePostal: { type: String, required: true, trim: true },
    pays: { type: String, default: 'Tunisie', trim: true },
    instructions: { type: String, default: '' }
  },
  modeLivraison: {
    nom: { type: String, default: 'Livraison Standard' },
    delai: { type: String, default: '2-4 jours ouvrables' },
    prix: { type: Number, default: 7 }
  },
  modePaiement: {
    type: String,
    enum: ['livraison', 'carte'],
    default: 'livraison'
  },
  statutPaiement: {
    type: String,
    enum: ['en_attente', 'paye', 'rembourse'],
    default: 'en_attente'
  },
  statut: {
    type: String,
    enum: ['en_attente', 'confirmee', 'en_preparation', 'expediee', 'livree', 'annulee'],
    default: 'en_attente'
  },
  historiqueStatuts: [{
    statut: { type: String, required: true },
    date: { type: Date, default: Date.now },
    commentaire: { type: String, default: '' }
  }],
  sousTotal: { type: Number, required: true, min: 0 },
  fraisLivraison: { type: Number, required: true, min: 0 },
  total: { type: Number, required: true, min: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
