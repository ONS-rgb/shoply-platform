const mongoose = require('mongoose');
const Product = require('../models/Product');
const Order = require('../models/Order');

// Fonction de calcul de promotion active
const applyPromotionLogic = (product) => {
  const p = product.toObject ? product.toObject() : product;
  if (p.promotion && p.promotion.active && p.promotion.pourcentage > 0) {
    const now = new Date();
    const hasStarted = !p.promotion.dateDebut || new Date(p.promotion.dateDebut) <= now;
    const hasNotEnded = !p.promotion.dateFin || new Date(p.promotion.dateFin) >= now;

    if (hasStarted && hasNotEnded) {
      p.enPromotion = true;
      p.prixFinal = Math.round((p.prix * (1 - p.promotion.pourcentage / 100)) * 100) / 100;
      return p;
    }
  }
  p.enPromotion = false;
  p.prixFinal = p.prix;
  return p;
};

// GET /api/products : Consulter et rechercher (public)
exports.getProducts = async (req, res) => {
  try {
    const { categorie, search, minPrice, maxPrice, sort, inStock, couleur, boutique } = req.query;
    const andConditions = [{ statut: 'actif', archive: { $ne: true } }];

    if (categorie) andConditions.push({ categorie });
    if (search) {
      andConditions.push({
        $or: [
          { nom: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { marque: { $regex: search, $options: 'i' } }
        ]
      });
    }
    if (minPrice || maxPrice) {
      const priceCond = {};
      if (minPrice) priceCond.$gte = Number(minPrice);
      if (maxPrice) priceCond.$lte = Number(maxPrice);
      andConditions.push({ prix: priceCond });
    }
    if (inStock === 'true') {
      andConditions.push({ stock: { $gt: 0 } });
    }
    if (couleur) {
      andConditions.push({ couleurs: { $regex: couleur, $options: 'i' } });
    }
    if (boutique) {
      const Shop = require('../models/Shop');
      let shopDoc = null;
      if (mongoose.isValidObjectId(boutique)) {
        shopDoc = await Shop.findById(boutique).lean();
        if (!shopDoc) {
          shopDoc = await Shop.findOne({ proprietaire: boutique }).lean();
        }
      }
      if (shopDoc) {
        andConditions.push({
          $or: [
            { boutique: shopDoc._id },
            { boutique: shopDoc.proprietaire }
          ]
        });
      } else if (mongoose.isValidObjectId(boutique)) {
        andConditions.push({ boutique });
      }
    }

    const query = andConditions.length > 1 ? { $and: andConditions } : andConditions[0];

    let sortOption = { createdAt: -1 };
    if (sort === 'asc') sortOption = { prix: 1 };
    else if (sort === 'desc') sortOption = { prix: -1 };
    else if (sort === 'newest') sortOption = { createdAt: -1 };
    else if (sort === 'rating') sortOption = { noteMoyenne: -1 };

    const products = await Product.find(query)
      .sort(sortOption)
      .populate('boutique', 'nom prenom avatar');

    const processed = products.map(applyPromotionLogic);

    res.json({ success: true, count: processed.length, data: processed });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/products/:id : Voir détail (public)
exports.getProduct = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ success: false, message: 'Produit non trouvé' });
    }
    const product = await Product.findById(req.params.id).populate('boutique', 'nom prenom avatar email telephone');
    if (!product || product.archive) {
      return res.status(404).json({ success: false, message: 'Produit non trouvé' });
    }
    res.json({ success: true, data: applyPromotionLogic(product) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/products/mine / GET /api/products/seller : Mes produits (Vendeur)
exports.getMyProducts = async (req, res) => {
  try {
    const { search, categorie, stockStatus, hasPromo, sort } = req.query;
    const query = { boutique: req.user._id, archive: { $ne: true } };

    if (categorie) query.categorie = categorie;
    if (search) {
      query.$or = [
        { nom: { $regex: search, $options: 'i' } },
        { marque: { $regex: search, $options: 'i' } }
      ];
    }
    if (hasPromo === 'true') {
      query['promotion.active'] = true;
    }

    let sortOption = { createdAt: -1 };
    if (sort === 'price_asc') sortOption = { prix: 1 };
    else if (sort === 'price_desc') sortOption = { prix: -1 };
    else if (sort === 'stock_asc') sortOption = { stock: 1 };
    else if (sort === 'stock_desc') sortOption = { stock: -1 };

    let products = await Product.find(query).sort(sortOption);

    // Filtrer par état de stock si demandé
    if (stockStatus === 'out_of_stock') {
      products = products.filter((p) => p.stock <= 0);
    } else if (stockStatus === 'low_stock') {
      products = products.filter((p) => p.stock > 0 && p.stock <= (p.seuilAlerteStock || 5));
    } else if (stockStatus === 'in_stock') {
      products = products.filter((p) => p.stock > (p.seuilAlerteStock || 5));
    }

    const processed = products.map(applyPromotionLogic);
    const total = processed.length;

    const pageNum = req.query.page ? parseInt(req.query.page) : null;
    const limitNum = req.query.limit ? parseInt(req.query.limit) : 20;
    let resultData = processed;
    if (pageNum) {
      const startIndex = (pageNum - 1) * limitNum;
      resultData = processed.slice(startIndex, startIndex + limitNum);
    }

    res.json({
      success: true,
      count: resultData.length,
      total,
      totalPages: pageNum ? Math.ceil(total / limitNum) : 1,
      currentPage: pageNum || 1,
      data: resultData
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/products : Vendeur uniquement
exports.createProduct = async (req, res) => {
  try {
    const {
      nom, description, prix, stock, images, categorie,
      marque, couleurs, caracteristiques, variantesCouleurs,
      seuilAlerteStock, promotion
    } = req.body;

    if (!nom || !description || prix === undefined || stock === undefined || !categorie) {
      return res.status(400).json({ success: false, message: 'Veuillez remplir tous les champs obligatoires' });
    }

    let promoData = { active: false, pourcentage: 0, prixPromo: 0 };
    if (promotion && promotion.active && promotion.pourcentage > 0) {
      const pct = Math.min(90, Math.max(1, Number(promotion.pourcentage)));
      promoData = {
        active: true,
        pourcentage: pct,
        prixPromo: Math.round((Number(prix) * (1 - pct / 100)) * 100) / 100,
        dateDebut: promotion.dateDebut || null,
        dateFin: promotion.dateFin || null
      };
    }

    const product = await Product.create({
      nom,
      description,
      prix: Number(prix),
      stock: Math.max(0, parseInt(stock) || 0),
      images: images || [],
      categorie,
      marque: marque || '',
      couleurs: couleurs || [],
      caracteristiques: caracteristiques || [],
      variantesCouleurs: variantesCouleurs || [],
      seuilAlerteStock: seuilAlerteStock !== undefined ? Number(seuilAlerteStock) : 5,
      promotion: promoData,
      boutique: req.user._id,
      statut: 'actif'
    });

    res.status(201).json({ success: true, message: 'Produit créé avec succès', data: product });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Vérifie que le produit appartient au vendeur connecté (ou admin)
const getOwnedProduct = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(404).json({ success: false, message: 'Produit non trouvé' });
    return null;
  }
  const product = await Product.findById(req.params.id);
  if (!product || product.archive) {
    res.status(404).json({ success: false, message: 'Produit non trouvé' });
    return null;
  }
  const isOwner = product.boutique.equals(req.user._id);
  if (!isOwner && req.user.role !== 'admin') {
    res.status(403).json({ success: false, message: 'Ce produit ne vous appartient pas' });
    return null;
  }
  return product;
};

// PUT /api/products/:id : Modifier son produit (Vendeur)
exports.updateProduct = async (req, res) => {
  try {
    const product = await getOwnedProduct(req, res);
    if (!product) return;

    const allowed = [
      'nom', 'description', 'prix', 'stock', 'images', 'categorie',
      'statut', 'marque', 'couleurs', 'caracteristiques', 'variantesCouleurs',
      'seuilAlerteStock', 'promotion'
    ];
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) product[field] = req.body[field];
    });

    // Mettre à jour prixPromo si promotion est active
    if (product.promotion && product.promotion.active && product.promotion.pourcentage > 0) {
      product.promotion.prixPromo = Math.round((product.prix * (1 - product.promotion.pourcentage / 100)) * 100) / 100;
    }

    await product.save();
    res.json({ success: true, message: 'Produit mis à jour avec succès', data: product });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// PUT /api/products/:id/promotion : Définir ou modifier une promotion (Vendeur)
exports.updatePromotion = async (req, res) => {
  try {
    const product = await getOwnedProduct(req, res);
    if (!product) return;

    const { active, pourcentage, dateDebut, dateFin } = req.body;

    if (active) {
      const pct = Number(pourcentage);
      if (!pct || pct < 1 || pct > 90) {
        return res.status(400).json({ success: false, message: 'Le pourcentage de remise doit être compris entre 1% et 90%' });
      }

      product.promotion = {
        active: true,
        pourcentage: pct,
        prixPromo: Math.round((product.prix * (1 - pct / 100)) * 100) / 100,
        dateDebut: dateDebut ? new Date(dateDebut) : null,
        dateFin: dateFin ? new Date(dateFin) : null
      };
    } else {
      product.promotion = {
        active: false,
        pourcentage: 0,
        prixPromo: 0,
        dateDebut: null,
        dateFin: null
      };
    }

    await product.save();
    res.json({
      success: true,
      message: active ? `Promotion de -${product.promotion.pourcentage}% activée` : 'Promotion désactivée',
      data: product
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// DELETE /api/products/:id : Supprimer ou archiver son produit
exports.deleteProduct = async (req, res) => {
  try {
    const product = await getOwnedProduct(req, res);
    if (!product) return;

    // Vérifier si ce produit est référencé dans des commandes existantes
    const hasOrders = await Order.exists({ 'articles.produit': product._id });

    if (hasOrders) {
      // Soft-delete / Archivage pour préserver l'intégrité de l'historique des commandes
      product.archive = true;
      product.statut = 'inactif';
      await product.save();
      return res.json({
        success: true,
        message: 'Produit archivé (conservé dans l\'historique des commandes antérieures)'
      });
    }

    await product.deleteOne();
    res.json({ success: true, message: 'Produit supprimé définitivement' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};