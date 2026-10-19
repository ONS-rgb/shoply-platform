const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Vérifie que l'utilisateur est connecté
exports.protect = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Connexion requise' });
    }
    const decoded = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user || !user.actif) {
      return res.status(401).json({ success: false, message: 'Compte introuvable ou désactivé' });
    }
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Token invalide ou expiré' });
  }
};

// Vérifie le rôle : authorize('vendeur', 'admin')
exports.authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Accès refusé pour votre rôle' });
  }
  next();
};