const mongoose = require('mongoose');
const Shop = require('../models/Shop');
const Product = require('../models/Product');
const User = require('../models/User');

// GET /api/shops : Explorer les boutiques vendeuses (public)
exports.getShops = async (req, res) => {
  try {
    const shops = await Shop.find({ statut: 'approuvee' })
      .populate('proprietaire', 'nom prenom email telephone')
      .lean();

    // Pour chaque boutique, compter les produits actifs
    const shopsWithProducts = await Promise.all(
      shops.map(async (s) => {
        const productCount = await Product.countDocuments({
          $or: [
            { boutique: s._id },
            { boutique: s.proprietaire?._id }
          ],
          statut: 'actif'
        });
        return {
          ...s,
          nbProduits: productCount
        };
      })
    );

    res.json({
      success: true,
      count: shopsWithProducts.length,
      data: shopsWithProducts
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/shops/:id : Détail d'une boutique avec son catalogue (public)
exports.getShopById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ success: false, message: 'Boutique non trouvée' });
    }

    let shop = await Shop.findById(req.params.id)
      .populate('proprietaire', 'nom prenom email telephone avatar')
      .lean();

    // Si non trouvé par ID de boutique, chercher si c'est l'ID du vendeur
    if (!shop) {
      shop = await Shop.findOne({ proprietaire: req.params.id })
        .populate('proprietaire', 'nom prenom email telephone avatar')
        .lean();
    }

    if (!shop) {
      // Si le vendeur existe mais n'a pas encore configuré sa boutique, créer un profil virtuel
      const vendor = await User.findById(req.params.id);
      if (vendor && vendor.role === 'vendeur') {
        shop = {
          _id: vendor._id,
          nom: `Boutique de ${vendor.prenom} ${vendor.nom}`,
          description: 'Vendeur indépendant certifié sur Shoply',
          proprietaire: vendor,
          statut: 'approuvee'
        };
      }
    }

    if (!shop) {
      return res.status(404).json({ success: false, message: 'Boutique introuvable' });
    }

    // Récupérer tous les produits de cette boutique
    const ownerId = shop.proprietaire?._id || shop.proprietaire;
    const products = await Product.find({
      $or: [
        { boutique: shop._id },
        { boutique: ownerId }
      ],
      statut: 'actif'
    });

    res.json({
      success: true,
      data: {
        ...shop,
        produits: products,
        nbProduits: products.length
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
