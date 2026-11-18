const mongoose = require('mongoose');
const Shop = require('../models/Shop');
const Product = require('../models/Product');
const User = require('../models/User');

// GET /api/shops : Explorer les boutiques vendeuses (public)
exports.getShops = async (req, res) => {
  try {
    const shops = await Shop.find({ statut: { $in: ['active', 'approuvee', 'fermee_temporairement'] } })
      .populate('proprietaire', 'nom prenom email telephone')
      .lean();

    // Pour chaque boutique, compter les produits actifs et lister les catégories associées
    const shopsWithProducts = await Promise.all(
      shops.map(async (s) => {
        const queryShop = {
          $or: [
            { boutique: s._id },
            { boutique: s.proprietaire?._id }
          ],
          statut: 'actif',
          archive: { $ne: true }
        };
        const productCount = await Product.countDocuments(queryShop);
        const categories = await Product.distinct('categorie', queryShop);
        return {
          ...s,
          nbProduits: productCount,
          categories: categories || []
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

// GET /api/shops/mine : Obtenir sa propre boutique (Vendeur connecté)
exports.getMyShop = async (req, res) => {
  try {
    let shop = await Shop.findOne({ proprietaire: req.user._id });
    if (!shop) {
      return res.json({ success: true, data: null });
    }
    const productCount = await Product.countDocuments({
      $or: [{ boutique: shop._id }, { boutique: req.user._id }],
      archive: { $ne: true }
    });
    res.json({ success: true, data: { ...shop.toObject(), nbProduits: productCount } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/shops : Créer sa boutique (Vendeur)
exports.createShop = async (req, res) => {
  try {
    const existing = await Shop.findOne({ proprietaire: req.user._id });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Vous possédez déjà une boutique enregistrée' });
    }

    const { nom, description, logo, banniere, telephone, email, adresse } = req.body;
    if (!nom || !nom.trim()) {
      return res.status(400).json({ success: false, message: 'Le nom de la boutique est obligatoire' });
    }

    const nameExists = await Shop.findOne({ nom: nom.trim() });
    if (nameExists) {
      return res.status(400).json({ success: false, message: 'Ce nom de boutique est déjà utilisé' });
    }

    const shop = await Shop.create({
      nom: nom.trim(),
      description: description || '',
      logo: logo || '',
      banniere: banniere || '',
      telephone: telephone || req.user.telephone || '',
      email: email || req.user.email || '',
      adresse: adresse || {},
      proprietaire: req.user._id,
      statut: 'active'
    });

    res.status(201).json({
      success: true,
      message: 'Boutique créée avec succès !',
      data: shop
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/shops/mine : Modifier les infos de sa boutique (Vendeur)
exports.updateMyShop = async (req, res) => {
  try {
    let shop = await Shop.findOne({ proprietaire: req.user._id });
    if (!shop) {
      return res.status(404).json({ success: false, message: 'Boutique introuvable' });
    }

    const { nom, description, logo, banniere, telephone, email, adresse } = req.body;
    if (nom !== undefined && nom.trim()) {
      // Vérifier unicité du nom si modifié
      if (nom.trim() !== shop.nom) {
        const nameTaken = await Shop.findOne({ nom: nom.trim(), _id: { $ne: shop._id } });
        if (nameTaken) {
          return res.status(400).json({ success: false, message: 'Ce nom de boutique est déjà utilisé' });
        }
      }
      shop.nom = nom.trim();
    }
    if (description !== undefined) shop.description = description;
    if (logo !== undefined) shop.logo = logo;
    if (banniere !== undefined) shop.banniere = banniere;
    if (telephone !== undefined) shop.telephone = telephone;
    if (email !== undefined) shop.email = email;
    if (adresse !== undefined) shop.adresse = adresse;

    await shop.save();
    res.json({ success: true, message: 'Informations de la boutique mises à jour', data: shop });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// PUT /api/shops/mine/status : Activer, désactiver ou fermer temporairement la boutique (Vendeur)
exports.updateShopStatus = async (req, res) => {
  try {
    let shop = await Shop.findOne({ proprietaire: req.user._id });
    if (!shop) {
      return res.status(404).json({ success: false, message: 'Boutique introuvable' });
    }

    const { statut, motifFermeture } = req.body;
    const allowedStatuses = ['active', 'inactive', 'fermee_temporairement'];
    if (!allowedStatuses.includes(statut)) {
      return res.status(400).json({ success: false, message: 'Statut de boutique invalide' });
    }

    shop.statut = statut;
    if (statut === 'fermee_temporairement') {
      shop.motifFermeture = motifFermeture || 'Fermeture temporaire';
    } else {
      shop.motifFermeture = '';
    }

    await shop.save();
    res.json({
      success: true,
      message: `Statut de la boutique mis à jour : ${statut.replace('_', ' ')}`,
      data: shop
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
          statut: 'active'
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
      statut: 'actif',
      archive: { $ne: true }
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
