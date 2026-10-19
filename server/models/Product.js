const mongoose = require('mongoose');

const caracteristiqueSchema = new mongoose.Schema({
  nom: { type: String, required: true, trim: true },
  valeur: { type: String, required: true, trim: true }
}, { _id: false });

const productSchema = new mongoose.Schema({
  nom: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  prix: { type: Number, required: true, min: 0 },
  stock: { type: Number, required: true, default: 0, min: 0 },
  images: [String],
  categorie: { type: String, required: true },
  marque: { type: String, trim: true, default: '' },
  couleurs: [{ type: String, trim: true }],            // ex: ['Noir', 'Blanc']
  variantesCouleurs: [{
    couleur: { type: String, trim: true },
    image: { type: String, trim: true }
  }],
  caracteristiques: [caracteristiqueSchema],            // ex: [{ nom: 'Écran', valeur: '6.1"' }]
  noteMoyenne: { type: Number, default: 0, min: 0, max: 5 },
  nbAvis: { type: Number, default: 0, min: 0 },
  boutique: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  statut: {
    type: String,
    enum: ['actif', 'inactif'],
    default: 'actif'
  }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);