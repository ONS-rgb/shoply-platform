const mongoose = require('mongoose');
const Review = require('../models/Review');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Notification = require('../models/Notification');
const Shop = require('../models/Shop');

// Fonction utilitaire pour recalculer la moyenne des notes d'un produit
const updateProductRating = async (productId) => {
  const stats = await Review.aggregate([
    { $match: { produit: new mongoose.Types.ObjectId(productId) } },
    {
      $group: {
        _id: '$produit',
        avgRating: { $avg: '$note' },
        numReviews: { $sum: 1 }
      }
    }
  ]);

  if (stats.length > 0) {
    await Product.findByIdAndUpdate(productId, {
      noteMoyenne: Math.round(stats[0].avgRating * 10) / 10,
      nbAvis: stats[0].numReviews
    });
  } else {
    await Product.findByIdAndUpdate(productId, {
      noteMoyenne: 0,
      nbAvis: 0
    });
  }
};

// GET /api/reviews/my : Obtenir tous les avis rédigés par le client connecté
exports.getMyReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ client: req.user._id })
      .populate('produit', 'nom images prix categorie noteMoyenne nbAvis')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: reviews.length,
      data: reviews
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/reviews/product/:productId : Obtenir les avis d'un produit (public)
exports.getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    if (!mongoose.isValidObjectId(productId)) {
      return res.status(404).json({ success: false, message: 'Produit non trouvé' });
    }

    const reviews = await Review.find({ produit: productId })
      .populate('client', 'nom prenom avatar')
      .sort({ createdAt: -1 });

    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let sum = 0;

    reviews.forEach((r) => {
      if (distribution[r.note] !== undefined) {
        distribution[r.note]++;
      }
      sum += r.note;
    });

    const total = reviews.length;
    const average = total > 0 ? (sum / total).toFixed(1) : 0;

    res.json({
      success: true,
      data: {
        reviews,
        total,
        average: Number(average),
        distribution
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/reviews/product/:productId : Ajouter un avis (Client connecté)
exports.addReview = async (req, res) => {
  try {
    const { productId } = req.params;
    const { note, titre, commentaire } = req.body;

    if (!mongoose.isValidObjectId(productId)) {
      return res.status(404).json({ success: false, message: 'Produit non trouvé' });
    }

    const numNote = Number(note);
    if (!numNote || numNote < 1 || numNote > 5) {
      return res.status(400).json({ success: false, message: 'La note doit être comprise entre 1 et 5' });
    }

    if (!commentaire || !commentaire.trim()) {
      return res.status(400).json({ success: false, message: 'Veuillez saisir un commentaire' });
    }

    // Vérifier si le client a déjà déposé un avis
    const existing = await Review.findOne({ produit: productId, client: req.user._id });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Vous avez déjà évalué ce produit. Vous pouvez modifier votre avis existant.'
      });
    }

    // Vérifier si c'est un achat vérifié (si le client a commandé ce produit)
    const hasOrdered = await Order.exists({
      client: req.user._id,
      'articles.produit': productId,
      statut: { $in: ['expediee', 'livree', 'confirmee', 'en_preparation'] }
    });

    const review = await Review.create({
      produit: productId,
      client: req.user._id,
      note: numNote,
      titre: titre ? titre.trim() : '',
      commentaire: commentaire.trim(),
      achatVerifie: Boolean(hasOrdered)
    });

    // Mettre à jour la note moyenne du produit
    await updateProductRating(productId);

    await review.populate('client', 'nom prenom avatar');

    res.status(201).json({
      success: true,
      message: 'Avis publié avec succès',
      data: review
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Vous avez déjà évalué ce produit' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/reviews/:id : Modifier son avis
exports.updateReview = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ success: false, message: 'Avis introuvable' });
    }

    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Avis introuvable' });
    }

    if (!review.client.equals(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Vous ne pouvez pas modifier cet avis' });
    }

    const { note, titre, commentaire } = req.body;
    if (note !== undefined) {
      const numNote = Number(note);
      if (numNote >= 1 && numNote <= 5) review.note = numNote;
    }
    if (titre !== undefined) review.titre = titre.trim();
    if (commentaire !== undefined && commentaire.trim()) review.commentaire = commentaire.trim();

    await review.save();
    await updateProductRating(review.produit);
    await review.populate('client', 'nom prenom avatar');

    res.json({ success: true, message: 'Avis mis à jour', data: review });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/reviews/:id : Supprimer son avis
exports.deleteReview = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ success: false, message: 'Avis introuvable' });
    }

    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Avis introuvable' });
    }

    if (!review.client.equals(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Vous ne pouvez pas supprimer cet avis' });
    }

    const productId = review.produit;
    await review.deleteOne();
    await updateProductRating(productId);

    res.json({ success: true, message: 'Avis supprimé' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/reviews/seller : Avis sur les produits du vendeur
exports.getSellerReviews = async (req, res) => {
  try {
    const shops = await Shop.find({ proprietaire: req.user._id }).select('_id');
    const sellerIds = [req.user._id, ...shops.map((s) => s._id)];

    const products = await Product.find({ boutique: { $in: sellerIds } }).select('_id nom');
    const productIds = products.map((p) => p._id);

    const reviews = await Review.find({ produit: { $in: productIds } })
      .populate('client', 'nom prenom avatar email')
      .populate('produit', 'nom images prix categorie')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: reviews.length,
      data: reviews
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/reviews/:id/reply : Répondre à un avis client
exports.replyToReview = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ success: false, message: 'Avis introuvable' });
    }

    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Avis introuvable' });
    }

    const product = await Product.findById(review.produit);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Produit associé non trouvé' });
    }

    const shops = await Shop.find({ proprietaire: req.user._id }).select('_id');
    const sellerIds = [req.user._id.toString(), ...shops.map((s) => s._id.toString())];

    if (!sellerIds.includes(product.boutique.toString()) && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Ce produit ne vous appartient pas' });
    }

    const { texte } = req.body;
    if (!texte || !texte.trim()) {
      return res.status(400).json({ success: false, message: 'Veuillez saisir votre réponse' });
    }

    review.reponseVendeur = {
      texte: texte.trim(),
      dateReponse: new Date(),
      vendeur: req.user._id
    };

    await review.save();
    await review.populate('client', 'nom prenom avatar');
    await review.populate('produit', 'nom images prix');

    // Notifier le client
    await Notification.create({
      destinataire: review.client._id || review.client,
      titre: 'Réponse à votre avis',
      message: `Le vendeur a répondu à votre avis sur le produit "${product.nom}".`,
      type: 'avis',
      lien: `/product/${product._id}#reviews`
    });

    res.json({
      success: true,
      message: 'Réponse publiée avec succès',
      data: review
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/reviews/:id/reply : Supprimer sa réponse
exports.deleteReviewReply = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ success: false, message: 'Avis introuvable' });
    }

    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Avis introuvable' });
    }

    const product = await Product.findById(review.produit);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Produit associé non trouvé' });
    }

    const shops = await Shop.find({ proprietaire: req.user._id }).select('_id');
    const sellerIds = [req.user._id.toString(), ...shops.map((s) => s._id.toString())];

    if (!sellerIds.includes(product.boutique.toString()) && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Ce produit ne vous appartient pas' });
    }

    review.reponseVendeur = {
      texte: '',
      dateReponse: null,
      vendeur: null
    };

    await review.save();
    await review.populate('client', 'nom prenom avatar');
    await review.populate('produit', 'nom images prix');

    res.json({
      success: true,
      message: 'Réponse du vendeur supprimée',
      data: review
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
