const mongoose = require('mongoose');
const Product = require('../models/Product');
const Shop = require('../models/Shop');

// GET /api/stocks/seller : Inventaire complet avec indicateurs d'alerte
exports.getSellerStocks = async (req, res) => {
  try {
    const shops = await Shop.find({ proprietaire: req.user._id }).select('_id');
    const sellerIds = [req.user._id, ...shops.map((s) => s._id)];

    const products = await Product.find({
      boutique: { $in: sellerIds },
      archive: { $ne: true }
    }).sort({ stock: 1, nom: 1 });

    let totalStockQuantity = 0;
    let nbRupture = 0;
    let nbAlerte = 0;
    let nbNormal = 0;

    const data = products.map((prod) => {
      const p = prod.toObject();
      const seuil = p.seuilAlerteStock !== undefined ? p.seuilAlerteStock : 5;
      const isOutOfStock = p.stock <= 0;
      const isLowStock = p.stock > 0 && p.stock <= seuil;
      const statutStock = isOutOfStock ? 'rupture' : isLowStock ? 'alerte' : 'normal';

      totalStockQuantity += p.stock;
      if (isOutOfStock) nbRupture++;
      else if (isLowStock) nbAlerte++;
      else nbNormal++;

      return {
        ...p,
        seuilAlerteStock: seuil,
        isOutOfStock,
        isLowStock,
        statutStock
      };
    });

    res.json({
      success: true,
      summary: {
        totalProducts: products.length,
        totalStockQuantity,
        nbRupture,
        nbAlerte,
        nbNormal
      },
      data
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/stocks/seller/:productId : Mise à jour de quantité et seuil d'alerte
exports.updateProductStock = async (req, res) => {
  try {
    const { productId } = req.params;
    if (!mongoose.isValidObjectId(productId)) {
      return res.status(404).json({ success: false, message: 'Produit non trouvé' });
    }

    const product = await Product.findById(productId);
    if (!product || product.archive) {
      return res.status(404).json({ success: false, message: 'Produit non trouvé' });
    }

    const shops = await Shop.find({ proprietaire: req.user._id }).select('_id');
    const sellerIds = [req.user._id.toString(), ...shops.map((s) => s._id.toString())];

    if (!sellerIds.includes(product.boutique.toString()) && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Ce produit ne vous appartient pas' });
    }

    const { stock, seuilAlerteStock } = req.body;

    if (stock !== undefined) {
      const parsedStock = parseInt(stock, 10);
      if (isNaN(parsedStock) || parsedStock < 0) {
        return res.status(400).json({ success: false, message: 'La quantité en stock doit être un nombre positif' });
      }
      product.stock = parsedStock;
    }

    if (seuilAlerteStock !== undefined) {
      const parsedSeuil = parseInt(seuilAlerteStock, 10);
      if (isNaN(parsedSeuil) || parsedSeuil < 0) {
        return res.status(400).json({ success: false, message: 'Le seuil d\'alerte doit être un nombre positif' });
      }
      product.seuilAlerteStock = parsedSeuil;
    }

    await product.save();

    const seuil = product.seuilAlerteStock !== undefined ? product.seuilAlerteStock : 5;
    const isOutOfStock = product.stock <= 0;
    const isLowStock = product.stock > 0 && product.stock <= seuil;
    const statutStock = isOutOfStock ? 'rupture' : isLowStock ? 'alerte' : 'normal';

    res.json({
      success: true,
      message: 'Stock et alertes mis à jour avec succès',
      data: {
        ...product.toObject(),
        seuilAlerteStock: seuil,
        isOutOfStock,
        isLowStock,
        statutStock
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
