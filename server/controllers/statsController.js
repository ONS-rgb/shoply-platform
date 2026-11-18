const Order = require('../models/Order');
const Product = require('../models/Product');
const Shop = require('../models/Shop');

// GET /api/stats/seller : Chiffre d'affaires, commandes, articles vendus, panier moyen, ventes par période, meilleurs produits
exports.getSellerStats = async (req, res) => {
  try {
    const shops = await Shop.find({ proprietaire: req.user._id }).select('_id');
    const sellerIds = [req.user._id.toString(), ...shops.map((s) => s._id.toString())];

    // 1. Récupérer toutes les commandes contenant des articles du vendeur
    const orders = await Order.find({
      'articles.boutique': { $in: [req.user._id, ...shops.map((s) => s._id)] }
    }).sort({ createdAt: -1 });

    let chiffreAffaires = 0;
    let articlesVendus = 0;
    let commandesValidesCount = 0;
    let commandesEnAttente = 0;

    const commandesParStatut = {
      en_attente: 0,
      confirmee: 0,
      en_preparation: 0,
      expediee: 0,
      livree: 0,
      annulee: 0
    };

    // Suivi par produit pour le classement "Meilleurs Produits"
    const productStatsMap = {};

    // Suivi des ventes par jour (derniers 7 jours par défaut)
    const salesByDay = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
      salesByDay[key] = { date: key, label, total: 0, count: 0 };
    }

    orders.forEach((order) => {
      // Comptage des statuts
      if (commandesParStatut[order.statut] !== undefined) {
        commandesParStatut[order.statut]++;
      }
      if (order.statut === 'en_attente') {
        commandesEnAttente++;
      }

      // Isoler les articles de ce vendeur
      const sellerArticles = order.articles.filter((item) => {
        const bId = (item.boutique?._id || item.boutique)?.toString();
        return sellerIds.includes(bId);
      });

      if (sellerArticles.length === 0) return;

      const orderSellerTotal = sellerArticles.reduce((sum, item) => sum + (item.prix * item.quantite), 0);

      // Si la commande n'est pas annulée, on comptabilise les ventes
      if (order.statut !== 'annulee') {
        commandesValidesCount++;
        chiffreAffaires += orderSellerTotal;

        sellerArticles.forEach((item) => {
          articlesVendus += item.quantite;

          const pId = (item.produit?._id || item.produit)?.toString();
          if (!productStatsMap[pId]) {
            productStatsMap[pId] = {
              _id: pId,
              nom: item.nom,
              image: item.image,
              prix: item.prix,
              quantiteVendue: 0,
              totalVentes: 0
            };
          }
          productStatsMap[pId].quantiteVendue += item.quantite;
          productStatsMap[pId].totalVentes += item.prix * item.quantite;
        });

        // Ventes par jour
        const orderDateKey = new Date(order.createdAt).toISOString().split('T')[0];
        if (salesByDay[orderDateKey]) {
          salesByDay[orderDateKey].total += orderSellerTotal;
          salesByDay[orderDateKey].count += 1;
        }
      }
    });

    // 2. Alertes de stock
    const products = await Product.find({
      boutique: { $in: [req.user._id, ...shops.map((s) => s._id)] },
      archive: { $ne: true }
    });

    let alertesStock = 0;
    let rupturesStock = 0;
    products.forEach((p) => {
      const seuil = p.seuilAlerteStock !== undefined ? p.seuilAlerteStock : 5;
      if (p.stock <= 0) rupturesStock++;
      else if (p.stock <= seuil) alertesStock++;
    });

    const panierMoyen = commandesValidesCount > 0
      ? Math.round((chiffreAffaires / commandesValidesCount) * 100) / 100
      : 0;

    const meilleursProduits = Object.values(productStatsMap)
      .sort((a, b) => b.quantiteVendue - a.quantiteVendue)
      .slice(0, 5);

    const ventesParPeriode = Object.values(salesByDay);

    res.json({
      success: true,
      data: {
        chiffreAffaires: Math.round(chiffreAffaires * 100) / 100,
        totalCommandes: commandesValidesCount,
        articlesVendus,
        panierMoyen,
        commandesEnAttente,
        alertesStock: alertesStock + rupturesStock,
        rupturesStock,
        totalProduitsActifs: products.length,
        commandesParStatut,
        ventesParPeriode,
        meilleursProduits
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
