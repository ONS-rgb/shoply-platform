const mongoose = require('mongoose');
const Refund = require('../models/Refund');
const Order = require('../models/Order');
const Notification = require('../models/Notification');
const Shop = require('../models/Shop');

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

// GET /api/refunds/seller : Demandes de remboursement concernant le vendeur
exports.getSellerRefunds = async (req, res) => {
  try {
    const shops = await Shop.find({ proprietaire: req.user._id }).select('_id');
    const sellerIds = [req.user._id, ...shops.map((s) => s._id)];

    const orders = await Order.find({ 'articles.boutique': { $in: sellerIds } }).select('_id');
    const orderIds = orders.map((o) => o._id);

    const refunds = await Refund.find({ commande: { $in: orderIds } })
      .populate('client', 'nom prenom email telephone')
      .populate('commande', 'numeroCommande total createdAt statut articles adresseLivraison')
      .populate('traitePar', 'nom prenom')
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

// PUT /api/refunds/seller/:id/process : Approuver ou rejeter la demande avec motif
exports.processSellerRefund = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ success: false, message: 'Demande non trouvée' });
    }

    const refund = await Refund.findById(req.params.id).populate('commande');
    if (!refund) {
      return res.status(404).json({ success: false, message: 'Demande non trouvée' });
    }

    const shops = await Shop.find({ proprietaire: req.user._id }).select('_id');
    const sellerIds = [req.user._id.toString(), ...shops.map((s) => s._id.toString())];

    const hasSellerArticles = refund.commande?.articles?.some((item) =>
      sellerIds.includes((item.boutique?._id || item.boutique)?.toString())
    );

    if (!hasSellerArticles && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Accès refusé' });
    }

    const { decision, reponseVendeur } = req.body;
    if (!['approuvee', 'rejetee'].includes(decision)) {
      return res.status(400).json({
        success: false,
        message: 'Décision invalide. Choix possibles : "approuvee" ou "rejetee"'
      });
    }

    refund.statut = decision;
    refund.reponseVendeur = reponseVendeur ? reponseVendeur.trim() : '';
    refund.dateReponseVendeur = new Date();
    refund.traitePar = req.user._id;
    refund.dateTraitement = new Date();

    if (decision === 'approuvee') {
      await Order.findByIdAndUpdate(refund.commande._id, { statutPaiement: 'rembourse' });
    }

    await refund.save();
    await refund.populate('client', 'nom prenom email telephone');
    await refund.populate('traitePar', 'nom prenom');

    // Notifier le client
    await Notification.create({
      destinataire: refund.client._id || refund.client,
      titre: `Demande de remboursement ${decision === 'approuvee' ? 'approuvée' : 'rejetée'}`,
      message: `Votre demande de remboursement pour la commande ${refund.commande.numeroCommande} a été ${decision === 'approuvee' ? 'approuvée' : 'rejetée'} par le vendeur.${refund.reponseVendeur ? ' Motif : ' + refund.reponseVendeur : ''}`,
      type: 'remboursement',
      lien: `/orders/${refund.commande._id}`
    });

    res.json({
      success: true,
      message: `Demande de remboursement ${decision === 'approuvee' ? 'approuvée' : 'rejetée'} avec succès`,
      data: refund
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
