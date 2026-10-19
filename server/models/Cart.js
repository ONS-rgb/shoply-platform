const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  items: [{
    produit: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantite: { type: Number, required: true, min: 1, default: 1 },
    couleur: { type: String, default: '' }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Cart', cartSchema);