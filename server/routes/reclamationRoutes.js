const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Reclamation = require('../models/Reclamation');
const Order = require('../models/Order');

// Créer une réclamation (Client)
router.post('/', protect, async (req, res) => {
  try {
    const { commandeId, sujet, description, piecesJointes } = req.body;

    if (!commandeId || !sujet || !description) {
      return res.status(400).json({ success: false, message: 'Commande, sujet et description sont obligatoires' });
    }

    const order = await Order.findById(commandeId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Commande non trouvée' });
    }

    if (!order.client.equals(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Accès non autorisé à cette commande' });
    }

    const reclamation = await Reclamation.create({
      numeroReclamation: `REC-${Date.now().toString().slice(-6)}`,
      client: req.user._id,
      commande: commandeId,
      sujet: sujet.trim(),
      description: description.trim(),
      piecesJointes: piecesJointes || [],
      statut: 'en_attente',
      historiqueStatuts: [{
        statut: 'en_attente',
        date: new Date(),
        commentaire: 'Réclamation déposée par le client'
      }]
    });

    res.status(201).json({
      success: true,
      message: 'Votre réclamation a été transmise à l\'équipe support',
      data: reclamation
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Voir mes réclamations (Client)
router.get('/my', protect, async (req, res) => {
  try {
    const list = await Reclamation.find({ client: req.user._id })
      .populate('commande', 'numeroCommande total createdAt statut')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: list.length,
      data: list
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
