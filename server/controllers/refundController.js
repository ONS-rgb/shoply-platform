const mongoose = require('mongoose');
const Refund = require('../models/Refund');
const Order = require('../models/Order');
const Notification = require('../models/Notification');

// POST /api/refunds : Créer une demande de remboursement (Client)
exports.createRefund = async (req, res) => {
  try {
    const { commandeId, motif, details } = req.body;

    if (!mongoose.isValidObjectId(commandeId)) {
      return res.status(404).json({ success: false, message: 'Commande non trouvée' });
    }

    if (!motif || !motif.trim()) {
      return res.status(400).json({ success: false, message: 'Veuillez préciser le motif du remboursement' });
    }

    const order = await Order.findById(commandeId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Commande non trouvée' });
    }

    if (!order.client.equals(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Accès refusé' });
    }

    // Vérifier s'il existe déjà une demande de remboursement en cours pour cette commande
    const existing = await Refund.findOne({
      commande: commandeId,
      statut: { $in: ['en_attente', 'approuvee', 'remboursee'] }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Une demande de remboursement est déjà ${existing.statut.replace('_', ' ')} pour cette commande.`
      });
    }

    // Créer la demande
    const refund = await Refund.create({
      commande: commandeId,
      client: req.user._id,
      montant: order.total,
      motif: motif.trim(),
      details: details ? details.trim() : '',
      statut: 'en_attente'
    });

    // Notification client
    await Notification.create({
      destinataire: req.user._id,
      titre: 'Demande de remboursement reçue',
      message: `Votre demande de remboursement pour la commande ${order.numeroCommande} (${order.total.toFixed(2)} TND) est en cours de traitement.`,
      type: 'remboursement',
      lien: `/orders/${order._id}`
    });

    res.status(201).json({
      success: true,
      message: 'Demande de remboursement transmise avec succès',
      data: refund
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/refunds/my : Liste de mes demandes de remboursement (Client)
exports.getMyRefunds = async (req, res) => {
  try {
    const refunds = await Refund.find({ client: req.user._id })
      .populate('commande', 'numeroCommande total createdAt statut')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: refunds.length,
      data: refunds
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/refunds/:id : Détail d'une demande
exports.getRefundById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ success: false, message: 'Demande non trouvée' });
    }

    const refund = await Refund.findById(req.params.id)
      .populate('commande', 'numeroCommande total createdAt statut articles');

    if (!refund) {
      return res.status(404).json({ success: false, message: 'Demande non trouvée' });
    }

    if (!refund.client.equals(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Accès refusé' });
    }

    res.json({ success: true, data: refund });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
