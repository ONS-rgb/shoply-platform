const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  nom: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    default: '',
    trim: true
  },
  slug: {
    type: String,
    lowercase: true,
    trim: true
  },
  icone: {
    type: String,
    default: '📦',
    trim: true
  },
  image: {
    type: String,
    default: ''
  },
  actif: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

categorySchema.pre('save', function () {
  if (this.isModified('nom') && !this.slug) {
    this.slug = this.nom
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
});

module.exports = mongoose.model('Category', categorySchema);
