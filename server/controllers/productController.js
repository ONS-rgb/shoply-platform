const mongoose = require('mongoose');
const Product = require('../models/Product');

// GET /api/products : Consulter et rechercher (public)
exports.getProducts = async (req, res) => {
  try {
    const { categorie, search, minPrice, maxPrice, sort, inStock, couleur } = req.query;
    const query = { statut: 'actif' };

    if (categorie) query.categorie = categorie;
    if (search) {
      query.$or = [
        { nom: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { marque: { $regex: search, $options: 'i' } }
      ];
    }
    if (minPrice || maxPrice) {
      query.prix = {};
      if (minPrice) query.prix.$gte = Number(minPrice);
      if (maxPrice) query.prix.$lte = Number(maxPrice);
    }
    if (inStock === 'true') {
      query.stock = { $gt: 0 };
    }
    if (couleur) {
      query.couleurs = { $regex: couleur, $options: 'i' };
    }

    let sortOption = { createdAt: -1 };
    if (sort === 'asc') sortOption = { prix: 1 };
    else if (sort === 'desc') sortOption = { prix: -1 };
    else if (sort === 'newest') sortOption = { createdAt: -1 };
    else if (sort === 'rating') sortOption = { noteMoyenne: -1 };

    const products = await Product.find(query)
      .sort(sortOption)
      .populate('boutique', 'nom prenom avatar');

    res.json({ success: true, count: products.length, data: products });
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
    if (!product) return res.status(404).json({ success: false, message: 'Produit non trouvé' });
    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/products/mine : Mes produits (vendeur)
exports.getMyProducts = async (req, res) => {
  try {
    const products = await Product.find({ boutique: req.user._id }).sort('-createdAt');
    res.json({ success: true, count: products.length, data: products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/products : Vendeur uniquement
exports.createProduct = async (req, res) => {
  try {
    const {
      nom, description, prix, stock, images, categorie,
      marque, couleurs, caracteristiques, variantesCouleurs
    } = req.body;

    const product = await Product.create({
      nom, description, prix, stock, images, categorie,
      marque, couleurs, caracteristiques,
      variantesCouleurs: variantesCouleurs || [],
      boutique: req.user._id
    });
    res.status(201).json({ success: true, data: product });
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
  if (!product) {
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

// PUT /api/products/:id
exports.updateProduct = async (req, res) => {
  try {
    const product = await getOwnedProduct(req, res);
    if (!product) return;

    const allowed = [
      'nom', 'description', 'prix', 'stock', 'images', 'categorie',
      'statut', 'marque', 'couleurs', 'caracteristiques', 'variantesCouleurs'
    ];
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) product[field] = req.body[field];
    });
    await product.save();
    res.json({ success: true, data: product });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// DELETE /api/products/:id
exports.deleteProduct = async (req, res) => {
  try {
    const product = await getOwnedProduct(req, res);
    if (!product) return;
    await product.deleteOne();
    res.json({ success: true, message: 'Produit supprimé' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};