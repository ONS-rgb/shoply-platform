const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  nom: { type: String, required: true, trim: true },
  prenom: { type: String, required: true, trim: true },
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true, 
    trim: true 
  },
  motDePasse: { 
    type: String, 
    required: true, 
    minlength: 6,
    select: false 
  },
  role: { 
    type: String, 
    enum: ['client', 'vendeur', 'admin'], 
    default: 'client' 
  },
  telephone: { type: String, trim: true },
  avatar: { type: String, default: '' },
  adresse: {
    rue: String,
    ville: String,
    codePostal: String,
    pays: { type: String, default: 'Tunisie' }
  },
  adresses: [{
    nomComplet: { type: String, trim: true },
    telephone: { type: String, trim: true },
    rue: { type: String, trim: true },
    ville: { type: String, trim: true },
    codePostal: { type: String, trim: true },
    pays: { type: String, default: 'Tunisie', trim: true },
    instructions: { type: String, default: '' },
    estDefaut: { type: Boolean, default: false }
  }],
  actif: { type: Boolean, default: true }   // l'admin pourra désactiver un compte
}, { timestamps: true });

// Méthode pour comparer les mots de passe (toujours nécessaire pour le login)
userSchema.methods.comparePassword = async function(candidatePassword) {
  const bcrypt = require('bcryptjs');
  return await bcrypt.compare(candidatePassword, this.motDePasse);
};

module.exports = mongoose.model('User', userSchema);