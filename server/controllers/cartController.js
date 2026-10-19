const mongoose = require('mongoose');
const Cart = require('../models/Cart');
const Product = require('../models/Product');

const getOrCreateCart = async (clientId) => {
  let cart = await Cart.findOne({ client: clientId });
  if (!cart) cart = await Cart.create({ client: clientId, items: [] });
  return cart;
};

const formatCart = async (cart) => {
  await cart.populate({ path: 'items.produit', select: 'nom prix stock images categorie statut couleurs' });

  const items = cart.items
    .filter((i) => i.produit && i.produit.statut === 'actif')
    .map((i) => ({
      _id: i._id,
      produit: i.produit,
      couleur: i.couleur,
      quantite: i.quantite,
      sousTotal: i.produit.prix * i.quantite
    }));

  return {
    items,
    total: items.reduce((s, i) => s + i.sousTotal, 0),
    nbArticles: items.reduce((s, i) => s + i.quantite, 0)
  };
};

const findActiveProduct = async (id, res) => {
  if (!mongoose.isValidObjectId(id)) {
    res.status(404).json({ success: false, message: 'Produit non trouvé' });
    return null;
  }
  const product = await Product.findById(id);
  if (!product || product.statut !== 'actif') {
    res.status(404).json({ success: false, message: 'Produit non disponible' });
    return null;
  }
  return product;
};

// Quantité du même produit déjà au panier (toutes couleurs), hors l'article en cours
const qtyOthers = (cart, produitId, currentItem) =>
  cart.items
    .filter((i) => i.produit.equals(produitId) && (!currentItem || !i._id.equals(currentItem._id)))
    .reduce((s, i) => s + i.quantite, 0);

const stockError = (res, stock) =>
  res.status(400).json({ success: false, message: `Stock insuffisant (disponible : ${stock})` });

// GET /api/cart
exports.getCart = async (req, res) => {
  try {
    const cart = await getOrCreateCart(req.user._id);
    res.json({ success: true, data: await formatCart(cart) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/cart  { produitId, quantite, couleur }
exports.addToCart = async (req, res) => {
  try {
    const quantite = Math.max(1, parseInt(req.body.quantite) || 1);
    const product = await findActiveProduct(req.body.produitId, res);
    if (!product) return;

    // Couleur obligatoire si le produit en propose
    let couleur = '';
    if (product.couleurs.length > 0) {
      couleur = (req.body.couleur || '').trim();
      if (!couleur) {
        return res.status(400).json({ success: false, message: 'Veuillez choisir une couleur' });
      }
      if (!product.couleurs.includes(couleur)) {
        return res.status(400).json({ success: false, message: 'Couleur non disponible' });
      }
    }

    const cart = await getOrCreateCart(req.user._id);
    const item = cart.items.find((i) => i.produit.equals(product._id) && i.couleur === couleur);
    const nouvelleQuantite = (item ? item.quantite : 0) + quantite;

    if (nouvelleQuantite + qtyOthers(cart, product._id, item) > product.stock) {
      return stockError(res, product.stock);
    }

    if (item) item.quantite = nouvelleQuantite;
    else cart.items.push({ produit: product._id, quantite, couleur });

    await cart.save();
    res.json({ success: true, data: await formatCart(cart) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/cart/:itemId  { quantite }
exports.updateQuantity = async (req, res) => {
  try {
    const quantite = parseInt(req.body.quantite);
    if (!quantite || quantite < 1) {
      return res.status(400).json({ success: false, message: 'Quantité invalide' });
    }

    const cart = await getOrCreateCart(req.user._id);
    const item = mongoose.isValidObjectId(req.params.itemId) ? cart.items.id(req.params.itemId) : null;
    if (!item) return res.status(404).json({ success: false, message: 'Article absent du panier' });

    const product = await findActiveProduct(item.produit, res);
    if (!product) return;

    if (quantite + qtyOthers(cart, product._id, item) > product.stock) {
      return stockError(res, product.stock);
    }

    item.quantite = quantite;
    await cart.save();
    res.json({ success: true, data: await formatCart(cart) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/cart/:itemId
exports.removeItem = async (req, res) => {
  try {
    const cart = await getOrCreateCart(req.user._id);
    cart.items = cart.items.filter((i) => String(i._id) !== req.params.itemId);
    await cart.save();
    res.json({ success: true, data: await formatCart(cart) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/cart
exports.clearCart = async (req, res) => {
  try {
    const cart = await getOrCreateCart(req.user._id);
    cart.items = [];
    await cart.save();
    res.json({ success: true, data: await formatCart(cart) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};