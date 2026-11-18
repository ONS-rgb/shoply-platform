const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const Shop = require('../models/Shop');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Category = require('../models/Category');
const Payment = require('../models/Payment');
const Commission = require('../models/Commission');
const Reclamation = require('../models/Reclamation');
const Refund = require('../models/Refund');
const Notification = require('../models/Notification');

// ==========================================
// 1. DASHBOARD & STATISTIQUES GLOBALES
// ==========================================

exports.getDashboardStats = async (req, res) => {
  try {
    const [
      nbClients,
      nbVendeurs,
      nbBoutiques,
      nbProduits,
      nbCategories,
      nbPaiements,
      nbReclamations,
      nbRemboursements,
      totalCaResult,
      totalCommissionsResult
    ] = await Promise.all([
      User.countDocuments({ role: 'client' }),
      User.countDocuments({ role: 'vendeur' }),
      Shop.countDocuments(),
      Product.countDocuments({ archive: { $ne: true } }),
      Category.countDocuments(),
      Payment.countDocuments(),
      Reclamation.countDocuments(),
      Refund.countDocuments(),
      Order.aggregate([
        { $match: { statut: { $ne: 'annulee' } } },
        { $group: { _id: null, total: { $sum: '$total' } } }
      ]),
      Commission.aggregate([
        { $match: { statut: { $ne: 'annulee' } } },
        { $group: { _id: null, total: { $sum: '$montantCommission' } } }
      ])
    ]);

    const chiffreAffairesGlobal = totalCaResult.length > 0 ? totalCaResult[0].total : 0;
    const totalCommissions = totalCommissionsResult.length > 0 ? totalCommissionsResult[0].total : 0;

    res.json({
      success: true,
      data: {
        nbClients,
        nbVendeurs,
        nbBoutiques,
        nbProduits,
        nbCategories,
        nbPaiements,
        nbReclamations,
        nbRemboursements,
        chiffreAffairesGlobal,
        totalCommissions
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getDashboardCharts = async (req, res) => {
  try {
    // 1. Évolution des ventes et Chiffre d'affaires par mois (sur les 6 derniers mois)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const monthlySales = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo },
          statut: { $ne: 'annulee' }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          chiffreAffaires: { $sum: '$total' },
          nbCommandes: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    const monthsNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
    const evolutionVentes = monthlySales.map((item) => ({
      periode: `${monthsNames[item._id.month - 1]} ${item._id.year}`,
      chiffreAffaires: item.chiffreAffaires,
      nbCommandes: item.nbCommandes
    }));

    // 2. Répartition des paiements par statut et méthode
    const [paymentsByStatus, paymentsByMethod] = await Promise.all([
      Payment.aggregate([
        { $group: { _id: '$statut', count: { $sum: 1 }, total: { $sum: '$montant' } } }
      ]),
      Payment.aggregate([
        { $group: { _id: '$methodePaiement', count: { $sum: 1 }, total: { $sum: '$montant' } } }
      ])
    ]);

    // 3. Performances des boutiques (Chiffre d'affaires généré par boutique)
    const shopPerformanceRaw = await Order.aggregate([
      { $unwind: '$articles' },
      { $match: { statut: { $ne: 'annulee' } } },
      {
        $group: {
          _id: '$articles.boutique',
          totalVentes: { $sum: { $multiply: ['$articles.prix', '$articles.quantite'] } },
          totalArticlesVendus: { $sum: '$articles.quantite' }
        }
      },
      { $sort: { totalVentes: -1 } },
      { $limit: 5 }
    ]);

    const shopPerformances = await Promise.all(
      shopPerformanceRaw.map(async (item) => {
        let name = 'Boutique';
        if (item._id) {
          const shop = await Shop.findOne({
            $or: [{ _id: item._id }, { proprietaire: item._id }]
          });
          if (shop) name = shop.nom;
          else {
            const user = await User.findById(item._id);
            if (user) name = `${user.prenom} ${user.nom}`;
          }
        }
        return {
          boutiqueId: item._id,
          nom: name,
          totalVentes: item.totalVentes,
          totalArticlesVendus: item.totalArticlesVendus
        };
      })
    );

    // 4. Évolution des commissions par mois
    const commissionEvolutionRaw = await Commission.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo },
          statut: { $ne: 'annulee' }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          totalCommissions: { $sum: '$montantCommission' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    const evolutionCommissions = commissionEvolutionRaw.map((item) => ({
      periode: `${monthsNames[item._id.month - 1]} ${item._id.year}`,
      totalCommissions: item.totalCommissions
    }));

    res.json({
      success: true,
      data: {
        evolutionVentes,
        repartitionPaiements: {
          parStatut: paymentsByStatus,
          parMethode: paymentsByMethod
        },
        performancesBoutiques: shopPerformances,
        evolutionCommissions
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Statistiques détaillées avec filtres de période
exports.getFinancialStats = async (req, res) => {
  try {
    const { periode, debut, fin } = req.query;
    let startDate = new Date();
    startDate.setHours(0, 0, 0, 0);

    const now = new Date();

    if (periode === 'today') {
      // startDate déjà aujourd'hui 00:00:00
    } else if (periode === 'week') {
      const day = startDate.getDay();
      const diff = startDate.getDate() - day + (day === 0 ? -6 : 1); // lundi
      startDate.setDate(diff);
    } else if (periode === 'month') {
      startDate.setDate(1);
    } else if (periode === 'year') {
      startDate.setMonth(0, 1);
    } else if (periode === 'custom' && debut) {
      startDate = new Date(debut);
      if (fin) {
        now.setTime(new Date(fin).getTime());
        now.setHours(23, 59, 59, 999);
      }
    } else {
      // Par défaut : l'année en cours
      startDate.setMonth(0, 1);
    }

    const matchFilter = {
      createdAt: { $gte: startDate, $lte: now }
    };

    const [
      ordersStats,
      paymentsCount,
      commissionsStats,
      refundsStats
    ] = await Promise.all([
      Order.aggregate([
        { $match: { ...matchFilter, statut: { $ne: 'annulee' } } },
        {
          $group: {
            _id: null,
            totalCa: { $sum: '$total' },
            nbCommandes: { $sum: 1 },
            panierMoyen: { $avg: '$total' }
          }
        }
      ]),
      Payment.countDocuments({ ...matchFilter, statut: 'valide' }),
      Commission.aggregate([
        { $match: { ...matchFilter, statut: { $ne: 'annulee' } } },
        {
          $group: {
            _id: null,
            totalCommissions: { $sum: '$montantCommission' }
          }
        }
      ]),
      Refund.aggregate([
        { $match: { ...matchFilter, statut: { $in: ['approuve', 'rembourse', 'approuvee', 'remboursee'] } } },
        {
          $group: {
            _id: null,
            nbRemboursements: { $sum: 1 },
            montantRembourse: { $sum: '$montant' }
          }
        }
      ])
    ]);

    const totalCa = ordersStats.length > 0 ? ordersStats[0].totalCa : 0;
    const nbCommandes = ordersStats.length > 0 ? ordersStats[0].nbCommandes : 0;
    const panierMoyen = ordersStats.length > 0 ? Math.round(ordersStats[0].panierMoyen * 100) / 100 : 0;
    const totalCommissions = commissionsStats.length > 0 ? commissionsStats[0].totalCommissions : 0;
    const nbRemboursements = refundsStats.length > 0 ? refundsStats[0].nbRemboursements : 0;
    const montantRembourse = refundsStats.length > 0 ? refundsStats[0].montantRembourse : 0;

    // Revenus nets selon règle métier : Commissions encaissées moins les remboursements de commission
    const revenusNets = Math.max(0, totalCommissions - (montantRembourse * 0.10));

    // Top vendeurs & boutiques sur la période
    const topSellersRaw = await Order.aggregate([
      { $match: { ...matchFilter, statut: { $ne: 'annulee' } } },
      { $unwind: '$articles' },
      {
        $group: {
          _id: '$articles.boutique',
          chiffreAffaires: { $sum: { $multiply: ['$articles.prix', '$articles.quantite'] } },
          nbVentes: { $sum: '$articles.quantite' }
        }
      },
      { $sort: { chiffreAffaires: -1 } },
      { $limit: 10 }
    ]);

    const topSellers = await Promise.all(
      topSellersRaw.map(async (row) => {
        let name = 'Vendeur';
        let shopName = 'Boutique';
        if (row._id) {
          const user = await User.findById(row._id);
          if (user) name = `${user.prenom} ${user.nom}`;
          const shop = await Shop.findOne({ proprietaire: row._id });
          if (shop) shopName = shop.nom;
        }
        return {
          vendeurId: row._id,
          nomVendeur: name,
          nomBoutique: shopName,
          chiffreAffaires: row.chiffreAffaires,
          nbVentes: row.nbVentes
        };
      })
    );

    res.json({
      success: true,
      data: {
        periode: periode || 'year',
        debut: startDate,
        fin: now,
        chiffreAffairesTotal: totalCa,
        nbCommandes,
        nbTransactions: paymentsCount,
        panierMoyen,
        totalCommissions,
        nbRemboursements,
        montantRembourse,
        revenusNets: Math.round(revenusNets * 100) / 100,
        performancesVendeurs: topSellers
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 2. GESTION DES CLIENTS
// ==========================================

exports.getClients = async (req, res) => {
  try {
    const { search, statut } = req.query;
    const query = { role: 'client' };

    if (search && search.trim()) {
      const s = search.trim();
      query.$or = [
        { nom: { $regex: s, $options: 'i' } },
        { prenom: { $regex: s, $options: 'i' } },
        { email: { $regex: s, $options: 'i' } },
        { telephone: { $regex: s, $options: 'i' } }
      ];
    }

    if (statut !== undefined && statut !== '') {
      query.actif = statut === 'actif' || statut === 'true';
    }

    const clients = await User.find(query).sort({ createdAt: -1 }).lean();

    // Enrichir chaque client avec ses statistiques réelles de commande
    const clientsWithStats = await Promise.all(
      clients.map(async (c) => {
        const [ordersCount, totalSpentResult] = await Promise.all([
          Order.countDocuments({ client: c._id }),
          Order.aggregate([
            { $match: { client: c._id, statut: { $ne: 'annulee' } } },
            { $group: { _id: null, total: { $sum: '$total' } } }
          ])
        ]);
        return {
          ...c,
          nbCommandes: ordersCount,
          totalDepense: totalSpentResult.length > 0 ? totalSpentResult[0].total : 0
        };
      })
    );

    res.json({
      success: true,
      count: clientsWithStats.length,
      data: clientsWithStats
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getClientById = async (req, res) => {
  try {
    const client = await User.findOne({ _id: req.params.id, role: 'client' }).lean();
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client non trouvé' });
    }

    const orders = await Order.find({ client: client._id }).sort({ createdAt: -1 }).limit(10);
    const reclamations = await Reclamation.find({ client: client._id }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        ...client,
        commandes: orders,
        reclamations
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createClient = async (req, res) => {
  try {
    const { nom, prenom, email, motDePasse, telephone, adresse } = req.body;

    if (!nom || !prenom || !email || !motDePasse) {
      return res.status(400).json({ success: false, message: 'Nom, prénom, email et mot de passe sont obligatoires' });
    }

    const exists = await User.findOne({ email: email.trim().toLowerCase() });
    if (exists) {
      return res.status(400).json({ success: false, message: 'Un utilisateur avec cet email existe déjà' });
    }

    const hashedPassword = await bcrypt.hash(motDePasse, 12);
    const client = await User.create({
      nom: nom.trim(),
      prenom: prenom.trim(),
      email: email.trim().toLowerCase(),
      motDePasse: hashedPassword,
      role: 'client',
      telephone: telephone || '',
      adresse: adresse || { pays: 'Tunisie' },
      actif: true
    });

    res.status(201).json({
      success: true,
      message: 'Client créé avec succès',
      data: client
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateClient = async (req, res) => {
  try {
    const { nom, prenom, email, telephone, actif, adresse } = req.body;
    const client = await User.findOne({ _id: req.params.id, role: 'client' });

    if (!client) {
      return res.status(404).json({ success: false, message: 'Client non trouvé' });
    }

    if (email && email.trim().toLowerCase() !== client.email) {
      const exists = await User.findOne({ email: email.trim().toLowerCase(), _id: { $ne: client._id } });
      if (exists) {
        return res.status(400).json({ success: false, message: 'Cet email est déjà utilisé' });
      }
      client.email = email.trim().toLowerCase();
    }

    if (nom !== undefined) client.nom = nom.trim();
    if (prenom !== undefined) client.prenom = prenom.trim();
    if (telephone !== undefined) client.telephone = telephone.trim();
    if (actif !== undefined) client.actif = Boolean(actif);
    if (adresse !== undefined) client.adresse = adresse;

    await client.save();

    res.json({
      success: true,
      message: 'Client mis à jour avec succès',
      data: client
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteClient = async (req, res) => {
  try {
    const client = await User.findOne({ _id: req.params.id, role: 'client' });
    if (!client) {
      return res.status(404).json({ success: false, message: 'Client non trouvé' });
    }

    // Vérifier les commandes en cours
    const activeOrders = await Order.countDocuments({
      client: client._id,
      statut: { $in: ['en_attente', 'confirmee', 'en_preparation', 'expediee'] }
    });

    if (activeOrders > 0) {
      return res.status(400).json({
        success: false,
        message: `Impossible de supprimer ce client car il a ${activeOrders} commande(s) en cours. Vous pouvez désactiver son compte.`
      });
    }

    await User.findByIdAndDelete(client._id);

    res.json({
      success: true,
      message: `Client ${client.prenom} ${client.nom} supprimé avec succès`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 3. GESTION DES VENDEURS
// ==========================================

exports.getVendors = async (req, res) => {
  try {
    const { search, statut } = req.query;
    const query = { role: 'vendeur' };

    if (search && search.trim()) {
      const s = search.trim();
      query.$or = [
        { nom: { $regex: s, $options: 'i' } },
        { prenom: { $regex: s, $options: 'i' } },
        { email: { $regex: s, $options: 'i' } },
        { telephone: { $regex: s, $options: 'i' } }
      ];
    }

    if (statut !== undefined && statut !== '') {
      query.actif = statut === 'actif' || statut === 'true';
    }

    const vendors = await User.find(query).sort({ createdAt: -1 }).lean();

    const vendorsWithInfo = await Promise.all(
      vendors.map(async (v) => {
        const [shop, nbProduits, totalVentesResult] = await Promise.all([
          Shop.findOne({ proprietaire: v._id }).lean(),
          Product.countDocuments({ boutique: v._id, archive: { $ne: true } }),
          Order.aggregate([
            { $unwind: '$articles' },
            { $match: { 'articles.boutique': v._id, statut: { $ne: 'annulee' } } },
            { $group: { _id: null, total: { $sum: { $multiply: ['$articles.prix', '$articles.quantite'] } } } }
          ])
        ]);

        return {
          ...v,
          boutique: shop || null,
          nbProduits,
          chiffreAffaires: totalVentesResult.length > 0 ? totalVentesResult[0].total : 0
        };
      })
    );

    res.json({
      success: true,
      count: vendorsWithInfo.length,
      data: vendorsWithInfo
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getVendorById = async (req, res) => {
  try {
    const vendor = await User.findOne({ _id: req.params.id, role: 'vendeur' }).lean();
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendeur non trouvé' });
    }

    const shop = await Shop.findOne({ proprietaire: vendor._id }).lean();
    const products = await Product.find({ boutique: vendor._id, archive: { $ne: true } }).limit(20);
    const commissions = await Commission.find({ vendeur: vendor._id }).sort({ createdAt: -1 }).limit(10);

    res.json({
      success: true,
      data: {
        ...vendor,
        boutique: shop,
        produits: products,
        commissions
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createVendor = async (req, res) => {
  try {
    const { nom, prenom, email, motDePasse, telephone, nomBoutique, descriptionBoutique } = req.body;

    if (!nom || !prenom || !email || !motDePasse) {
      return res.status(400).json({ success: false, message: 'Nom, prénom, email et mot de passe sont obligatoires' });
    }

    const exists = await User.findOne({ email: email.trim().toLowerCase() });
    if (exists) {
      return res.status(400).json({ success: false, message: 'Un utilisateur avec cet email existe déjà' });
    }

    const hashedPassword = await bcrypt.hash(motDePasse, 12);
    const vendor = await User.create({
      nom: nom.trim(),
      prenom: prenom.trim(),
      email: email.trim().toLowerCase(),
      motDePasse: hashedPassword,
      role: 'vendeur',
      telephone: telephone || '',
      actif: true
    });

    let shop = null;
    if (nomBoutique && nomBoutique.trim()) {
      shop = await Shop.create({
        nom: nomBoutique.trim(),
        description: descriptionBoutique || '',
        proprietaire: vendor._id,
        telephone: telephone || '',
        email: email.trim().toLowerCase(),
        statut: 'active'
      });
    }

    res.status(201).json({
      success: true,
      message: 'Vendeur créé avec succès',
      data: { ...vendor.toObject(), boutique: shop }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteVendor = async (req, res) => {
  try {
    const vendor = await User.findOne({ _id: req.params.id, role: 'vendeur' });
    if (!vendor) {
      return res.status(404).json({ success: false, message: 'Vendeur non trouvé' });
    }

    await Shop.deleteMany({ proprietaire: vendor._id });
    await Product.updateMany({ boutique: vendor._id }, { $set: { archive: true, statut: 'inactif' } });
    await User.findByIdAndDelete(vendor._id);

    res.json({
      success: true,
      message: `Vendeur ${vendor.prenom} ${vendor.nom} supprimé avec succès`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 4. GESTION DES BOUTIQUES
// ==========================================

exports.getShops = async (req, res) => {
  try {
    const { statut, search } = req.query;
    const query = {};

    if (statut && statut !== 'tous') {
      if (statut === 'en_attente') {
        query.statut = 'en_attente';
      } else if (statut === 'acceptee') {
        query.statut = { $in: ['active', 'approuvee', 'acceptee'] };
      } else if (statut === 'refusee') {
        query.statut = 'refusee';
      } else {
        query.statut = statut;
      }
    }

    if (search && search.trim()) {
      query.$or = [
        { nom: { $regex: search.trim(), $options: 'i' } },
        { email: { $regex: search.trim(), $options: 'i' } },
        { telephone: { $regex: search.trim(), $options: 'i' } }
      ];
    }

    const shops = await Shop.find(query)
      .populate('proprietaire', 'nom prenom email telephone')
      .sort({ createdAt: -1 })
      .lean();

    const shopsWithMetrics = await Promise.all(
      shops.map(async (s) => {
        const [nbProduits, salesRaw] = await Promise.all([
          Product.countDocuments({
            $or: [{ boutique: s._id }, { boutique: s.proprietaire?._id }],
            archive: { $ne: true }
          }),
          Order.aggregate([
            { $unwind: '$articles' },
            {
              $match: {
                'articles.boutique': s.proprietaire?._id,
                statut: { $ne: 'annulee' }
              }
            },
            { $group: { _id: null, total: { $sum: { $multiply: ['$articles.prix', '$articles.quantite'] } } } }
          ])
        ]);

        return {
          ...s,
          nbProduits,
          chiffreAffaires: salesRaw.length > 0 ? salesRaw[0].total : 0
        };
      })
    );

    res.json({
      success: true,
      count: shopsWithMetrics.length,
      data: shopsWithMetrics
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getShopById = async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id)
      .populate('proprietaire', 'nom prenom email telephone avatar createdAt')
      .lean();

    if (!shop) {
      return res.status(404).json({ success: false, message: 'Boutique non trouvée' });
    }

    const products = await Product.find({
      $or: [{ boutique: shop._id }, { boutique: shop.proprietaire?._id }],
      archive: { $ne: true }
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        ...shop,
        nbProduits: products.length,
        produits: products
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Accepter / Refuser / Changer le statut d'une boutique avec notification vendeur
exports.updateShopStatus = async (req, res) => {
  try {
    const { action, motif } = req.body; // action: 'accepter' | 'refuser' | 'suspendre' | 'activer'
    const shop = await Shop.findById(req.params.id).populate('proprietaire');

    if (!shop) {
      return res.status(404).json({ success: false, message: 'Boutique non trouvée' });
    }

    let nouveauStatut = shop.statut;
    let notifTitre = '';
    let notifMessage = '';

    if (action === 'accepter') {
      nouveauStatut = 'acceptee';
      shop.motifFermeture = '';
      notifTitre = 'Demande de boutique acceptée 🎉';
      notifMessage = `Félicitations ! Votre boutique "${shop.nom}" a été validée par l'administrateur. Vous pouvez dès maintenant publier vos produits.`;
    } else if (action === 'refuser') {
      nouveauStatut = 'refusee';
      shop.motifFermeture = motif || 'Demande non conforme aux critères de la plateforme.';
      notifTitre = 'Demande de boutique refusée ⚠️';
      notifMessage = `Votre demande pour la boutique "${shop.nom}" a été refusée. Motif : ${shop.motifFermeture}`;
    } else if (action === 'suspendre') {
      nouveauStatut = 'suspendue';
      shop.motifFermeture = motif || 'Boutique temporairement suspendue par l\'administrateur.';
      notifTitre = 'Boutique suspendue 🛑';
      notifMessage = `Votre boutique "${shop.nom}" a été suspendue par la modération. Motif : ${shop.motifFermeture}`;
    } else if (action === 'activer') {
      nouveauStatut = 'active';
      shop.motifFermeture = '';
      notifTitre = 'Boutique réactivée ✅';
      notifMessage = `Votre boutique "${shop.nom}" est à nouveau active sur la plateforme.`;
    } else {
      return res.status(400).json({ success: false, message: 'Action invalide' });
    }

    shop.statut = nouveauStatut;
    await shop.save();

    // Notification au vendeur propriétaire de la boutique
    if (shop.proprietaire) {
      await Notification.create({
        destinataire: shop.proprietaire._id,
        titre: notifTitre,
        message: notifMessage,
        type: 'info',
        lien: '/seller'
      });
    }

    res.json({
      success: true,
      message: `Statut de la boutique mis à jour : ${nouveauStatut}`,
      data: shop
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteShop = async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id);
    if (!shop) {
      return res.status(404).json({ success: false, message: 'Boutique non trouvée' });
    }

    // Notifier le vendeur
    await Notification.create({
      destinataire: shop.proprietaire,
      titre: 'Boutique supprimée',
      message: `Votre boutique "${shop.nom}" a été supprimée par l'administrateur.`,
      type: 'info'
    });

    await Shop.findByIdAndDelete(shop._id);

    res.json({
      success: true,
      message: `La boutique "${shop.nom}" a été supprimée avec succès.`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 5. GESTION DES PRODUITS
// ==========================================

exports.getProducts = async (req, res) => {
  try {
    const { categorie, vendeur, disponibilite, search } = req.query;
    const query = { archive: { $ne: true } };

    if (categorie && categorie !== 'tous') {
      query.categorie = categorie;
    }

    if (vendeur && vendeur !== 'tous') {
      query.boutique = vendeur;
    }

    if (disponibilite) {
      if (disponibilite === 'in_stock') {
        query.stock = { $gt: 5 };
      } else if (disponibilite === 'low_stock') {
        query.stock = { $gt: 0, $lte: 5 };
      } else if (disponibilite === 'out_of_stock') {
        query.stock = { $lte: 0 };
      }
    }

    if (search && search.trim()) {
      const s = search.trim();
      query.$or = [
        { nom: { $regex: s, $options: 'i' } },
        { description: { $regex: s, $options: 'i' } },
        { marque: { $regex: s, $options: 'i' } }
      ];
    }

    const products = await Product.find(query)
      .populate('boutique', 'nom prenom email telephone')
      .sort({ createdAt: -1 })
      .lean();

    // Associer la boutique physique / virtuelle pour chaque produit
    const enrichedProducts = await Promise.all(
      products.map(async (p) => {
        let shopName = 'Boutique Shoply';
        if (p.boutique?._id) {
          const s = await Shop.findOne({ proprietaire: p.boutique._id });
          if (s) shopName = s.nom;
        }
        return {
          ...p,
          nomBoutique: shopName
        };
      })
    );

    res.json({
      success: true,
      count: enrichedProducts.length,
      data: enrichedProducts
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('boutique', 'nom prenom email telephone')
      .lean();

    if (!product) {
      return res.status(404).json({ success: false, message: 'Produit non trouvé' });
    }

    let shop = null;
    if (product.boutique?._id) {
      shop = await Shop.findOne({ proprietaire: product.boutique._id });
    }

    res.json({
      success: true,
      data: {
        ...product,
        boutiqueDetails: shop
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const { nom, description, prix, stock, images, categorie, marque, boutiqueId } = req.body;

    if (!nom || !description || prix === undefined || stock === undefined || !categorie) {
      return res.status(400).json({ success: false, message: 'Veuillez renseigner les champs obligatoires' });
    }

    // Si aucun vendeur n'est sélectionné, assigner au compte admin ou au premier vendeur
    let targetSeller = boutiqueId;
    if (!targetSeller) {
      const firstVendor = await User.findOne({ role: 'vendeur' });
      targetSeller = firstVendor ? firstVendor._id : req.user._id;
    }

    const product = await Product.create({
      nom: nom.trim(),
      description: description.trim(),
      prix: Number(prix),
      stock: Number(stock),
      images: images || [],
      categorie: categorie.trim(),
      marque: marque || '',
      boutique: targetSeller,
      statut: 'actif'
    });

    res.status(201).json({
      success: true,
      message: 'Produit créé avec succès',
      data: product
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({ success: false, message: 'Produit non trouvé' });
    }

    res.json({
      success: true,
      message: 'Produit modifié avec succès',
      data: product
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Produit non trouvé' });
    }

    // Supprimer ou archiver pour maintenir l'intégrité des commandes
    product.archive = true;
    product.statut = 'inactif';
    await product.save();

    res.json({
      success: true,
      message: `Le produit "${product.nom}" a été supprimé du catalogue.`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 6. GESTION DES PAIEMENTS
// ==========================================

exports.getPayments = async (req, res) => {
  try {
    const { statut, methode, search, dateDebut, dateFin } = req.query;
    const query = {};

    if (statut && statut !== 'tous') {
      query.statut = statut;
    }

    if (methode && methode !== 'tous') {
      query.methodePaiement = methode;
    }

    if (dateDebut || dateFin) {
      query.datePaiement = {};
      if (dateDebut) query.datePaiement.$gte = new Date(dateDebut);
      if (dateFin) query.datePaiement.$lte = new Date(dateFin);
    }

    if (search && search.trim()) {
      const s = search.trim();
      const matchingClients = await User.find({
        $or: [
          { nom: { $regex: s, $options: 'i' } },
          { prenom: { $regex: s, $options: 'i' } },
          { email: { $regex: s, $options: 'i' } }
        ]
      }).select('_id');

      query.$or = [
        { reference: { $regex: s, $options: 'i' } },
        { client: { $in: matchingClients.map(c => c._id) } }
      ];
    }

    const payments = await Payment.find(query)
      .populate('client', 'nom prenom email telephone')
      .populate('commande', 'numeroCommande total modePaiement statut')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      count: payments.length,
      data: payments
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('client', 'nom prenom email telephone adresse')
      .populate({
        path: 'commande',
        populate: { path: 'articles.produit', select: 'nom prix images' }
      })
      .populate('validePar', 'nom prenom email')
      .lean();

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Paiement non trouvé' });
    }

    res.json({
      success: true,
      data: payment
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Valider ou Refuser un paiement (enregistré dans la DB et synchronise la commande)
exports.validatePayment = async (req, res) => {
  try {
    const { action, commentaire } = req.body; // action: 'valide' | 'refuse'
    if (!['valide', 'refuse'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Action invalide (valide ou refuse)' });
    }

    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Paiement non trouvé' });
    }

    payment.statut = action;
    payment.validePar = req.user._id;
    payment.dateValidation = new Date();
    payment.notes = commentaire || payment.notes;

    payment.historique.push({
      statut: action,
      date: new Date(),
      commentaire: commentaire || (action === 'valide' ? 'Paiement validé par l\'administrateur' : 'Paiement refusé par l\'administrateur'),
      traitePar: req.user._id
    });

    await payment.save();

    // Synchronisation de la commande associée
    const order = await Order.findById(payment.commande);
    if (order) {
      order.statutPaiement = action === 'valide' ? 'paye' : 'en_attente';
      await order.save();
    }

    // Synchronisation du statut de commission
    await Commission.updateMany(
      { paiement: payment._id },
      { $set: { statut: action === 'valide' ? 'payee' : 'en_attente' } }
    );

    // Notification client
    await Notification.create({
      destinataire: payment.client,
      titre: action === 'valide' ? 'Paiement validé ✅' : 'Paiement non validé ❌',
      message: action === 'valide'
        ? `Votre paiement de ${payment.montant.toFixed(2)} TND (Réf: ${payment.reference}) a été validé avec succès.`
        : `Votre paiement de ${payment.montant.toFixed(2)} TND (Réf: ${payment.reference}) a été refusé.`,
      type: 'commande',
      lien: order ? `/orders/${order._id}` : '/orders'
    });

    res.json({
      success: true,
      message: `Paiement ${action === 'valide' ? 'validé' : 'refusé'} avec succès`,
      data: payment
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 7. GESTION DES COMMISSIONS
// ==========================================

exports.getCommissions = async (req, res) => {
  try {
    const { vendeurId, boutiqueId, statut } = req.query;
    const query = {};

    if (vendeurId && vendeurId !== 'tous') {
      query.vendeur = vendeurId;
    }

    if (boutiqueId && boutiqueId !== 'tous') {
      query.boutique = boutiqueId;
    }

    if (statut && statut !== 'tous') {
      query.statut = statut;
    }

    const commissions = await Commission.find(query)
      .populate('vendeur', 'nom prenom email')
      .populate('boutique', 'nom')
      .populate('commande', 'numeroCommande createdAt')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      count: commissions.length,
      data: commissions
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getCommissionStats = async (req, res) => {
  try {
    const [
      totalCommissionsAgg,
      commissionsByVendor,
      commissionsByShop
    ] = await Promise.all([
      Commission.aggregate([
        { $match: { statut: { $ne: 'annulee' } } },
        {
          $group: {
            _id: null,
            totalCommissions: { $sum: '$montantCommission' },
            totalVentes: { $sum: '$montantVente' },
            nbLignes: { $sum: 1 },
            tauxMoyen: { $avg: '$pourcentage' }
          }
        }
      ]),
      Commission.aggregate([
        { $match: { statut: { $ne: 'annulee' } } },
        {
          $group: {
            _id: '$vendeur',
            totalCommission: { $sum: '$montantCommission' },
            totalVente: { $sum: '$montantVente' },
            nbOperations: { $sum: 1 }
          }
        },
        { $sort: { totalCommission: -1 } }
      ]),
      Commission.aggregate([
        { $match: { statut: { $ne: 'annulee' }, boutique: { $ne: null } } },
        {
          $group: {
            _id: '$boutique',
            totalCommission: { $sum: '$montantCommission' },
            totalVente: { $sum: '$montantVente' },
            nbOperations: { $sum: 1 }
          }
        },
        { $sort: { totalCommission: -1 } }
      ])
    ]);

    const totalCommissions = totalCommissionsAgg.length > 0 ? totalCommissionsAgg[0].totalCommissions : 0;
    const totalVentes = totalCommissionsAgg.length > 0 ? totalCommissionsAgg[0].totalVentes : 0;
    const tauxMoyen = totalCommissionsAgg.length > 0 ? Math.round(totalCommissionsAgg[0].tauxMoyen * 10) / 10 : 10;

    // Populer les noms de vendeurs
    const populatedVendors = await Promise.all(
      commissionsByVendor.map(async (v) => {
        const user = await User.findById(v._id);
        return {
          vendeurId: v._id,
          nom: user ? `${user.prenom} ${user.nom}` : 'Vendeur inconnu',
          email: user?.email || '',
          totalCommission: v.totalCommission,
          totalVente: v.totalVente,
          nbOperations: v.nbOperations
        };
      })
    );

    // Populer les noms de boutiques
    const populatedShops = await Promise.all(
      commissionsByShop.map(async (s) => {
        const shop = await Shop.findById(s._id);
        return {
          boutiqueId: s._id,
          nom: shop ? shop.nom : 'Boutique',
          totalCommission: s.totalCommission,
          totalVente: s.totalVente,
          nbOperations: s.nbOperations
        };
      })
    );

    res.json({
      success: true,
      data: {
        totalCommissions,
        totalVentes,
        tauxMoyen,
        commissionsParVendeur: populatedVendors,
        commissionsParBoutique: populatedShops
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 8. GESTION DES RÉCLAMATIONS
// ==========================================

exports.getReclamations = async (req, res) => {
  try {
    const { statut, search } = req.query;
    const query = {};

    if (statut && statut !== 'tous') {
      query.statut = statut;
    }

    if (search && search.trim()) {
      const s = search.trim();
      const matchingUsers = await User.find({
        $or: [
          { nom: { $regex: s, $options: 'i' } },
          { prenom: { $regex: s, $options: 'i' } },
          { email: { $regex: s, $options: 'i' } }
        ]
      }).select('_id');

      query.$or = [
        { numeroReclamation: { $regex: s, $options: 'i' } },
        { sujet: { $regex: s, $options: 'i' } },
        { client: { $in: matchingUsers.map(u => u._id) } }
      ];
    }

    const reclamations = await Reclamation.find(query)
      .populate('client', 'nom prenom email telephone')
      .populate('commande', 'numeroCommande total createdAt statut')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      count: reclamations.length,
      data: reclamations
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getReclamationById = async (req, res) => {
  try {
    const reclamation = await Reclamation.findById(req.params.id)
      .populate('client', 'nom prenom email telephone adresse')
      .populate({
        path: 'commande',
        populate: { path: 'articles.produit', select: 'nom prix images' }
      })
      .populate('historiqueStatuts.modifiePar', 'nom prenom')
      .lean();

    if (!reclamation) {
      return res.status(404).json({ success: false, message: 'Réclamation non trouvée' });
    }

    // Vérifier s'il y a un remboursement lié
    const refund = await Refund.findOne({
      $or: [{ reclamation: reclamation._id }, { commande: reclamation.commande?._id }]
    }).populate('paiement');

    res.json({
      success: true,
      data: {
        ...reclamation,
        remboursementAssocie: refund
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateReclamationStatus = async (req, res) => {
  try {
    const { statut, reponseAdmin, commentaire } = req.body;
    const allowed = ['en_attente', 'en_cours', 'resolue', 'refusee'];

    if (!allowed.includes(statut)) {
      return res.status(400).json({ success: false, message: 'Statut de réclamation invalide' });
    }

    const reclamation = await Reclamation.findById(req.params.id);
    if (!reclamation) {
      return res.status(404).json({ success: false, message: 'Réclamation non trouvée' });
    }

    reclamation.statut = statut;
    if (reponseAdmin) reclamation.reponseAdmin = reponseAdmin.trim();
    if (statut === 'resolue') reclamation.dateResolution = new Date();

    reclamation.historiqueStatuts.push({
      statut,
      date: new Date(),
      commentaire: commentaire || reponseAdmin || `Statut passé à : ${statut}`,
      modifiePar: req.user._id
    });

    await reclamation.save();

    // Notifier le client
    await Notification.create({
      destinataire: reclamation.client,
      titre: `Mise à jour de votre réclamation ${reclamation.numeroReclamation}`,
      message: `Votre réclamation est désormais ${statut.replace('_', ' ')}. ${reponseAdmin ? 'Réponse : ' + reponseAdmin : ''}`,
      type: 'info'
    });

    res.json({
      success: true,
      message: 'Réclamation mise à jour avec succès',
      data: reclamation
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 9. GESTION DES REMBOURSEMENTS
// ==========================================

exports.getRefunds = async (req, res) => {
  try {
    const { statut, search } = req.query;
    const query = {};

    if (statut && statut !== 'tous') {
      if (statut === 'approuve') query.statut = { $in: ['approuve', 'approuvee'] };
      else if (statut === 'refuse') query.statut = { $in: ['refuse', 'rejetee'] };
      else if (statut === 'rembourse') query.statut = { $in: ['rembourse', 'remboursee'] };
      else query.statut = statut;
    }

    const refunds = await Refund.find(query)
      .populate('client', 'nom prenom email telephone')
      .populate('commande', 'numeroCommande total modePaiement statutPaiement')
      .populate('paiement', 'reference montant methodePaiement statut')
      .populate('reclamation', 'numeroReclamation sujet statut')
      .populate('traitePar', 'nom prenom')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      count: refunds.length,
      data: refunds
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getRefundById = async (req, res) => {
  try {
    const refund = await Refund.findById(req.params.id)
      .populate('client', 'nom prenom email telephone adresse')
      .populate({
        path: 'commande',
        populate: { path: 'articles.produit', select: 'nom prix images' }
      })
      .populate('paiement')
      .populate('reclamation')
      .populate('traitePar', 'nom prenom email')
      .lean();

    if (!refund) {
      return res.status(404).json({ success: false, message: 'Demande de remboursement non trouvée' });
    }

    // Vérifier l'état du paiement initial
    let paiementInitialValide = false;
    let paiementInitialInfo = null;

    if (refund.paiement) {
      paiementInitialInfo = refund.paiement;
      paiementInitialValide = refund.paiement.statut === 'valide';
    } else if (refund.commande) {
      const p = await Payment.findOne({ commande: refund.commande._id });
      if (p) {
        paiementInitialInfo = p;
        paiementInitialValide = p.statut === 'valide';
      }
    }

    res.json({
      success: true,
      data: {
        ...refund,
        verificationPaiementInitial: {
          valide: paiementInitialValide,
          info: paiementInitialInfo
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Traitement strict du remboursement
// Règle métier : Ne jamais déclarer un remboursement effectué si l'opération financière réelle n'a pas été confirmée
exports.processRefund = async (req, res) => {
  try {
    const { action, reponse, transactionRef, modeRemboursement, confirmeParSystemePaiement } = req.body;
    // action: 'approuve' | 'refuse' | 'rembourse'

    const refund = await Refund.findById(req.params.id)
      .populate('commande')
      .populate('paiement');

    if (!refund) {
      return res.status(404).json({ success: false, message: 'Demande de remboursement non trouvée' });
    }

    // Vérifier le paiement initial
    let payment = refund.paiement;
    if (!payment && refund.commande) {
      payment = await Payment.findOne({ commande: refund.commande._id });
    }

    if (action === 'rembourse') {
      // ⚠️ Règle de conformité financière stricte :
      if (!confirmeParSystemePaiement || !transactionRef || !transactionRef.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Conformité financière requise : Vous devez fournir la référence de transaction confirmée par le système bancaire / passerelle de paiement pour marquer ce remboursement comme Remboursé.'
        });
      }

      refund.statut = 'rembourse';
      refund.confirmationPaiement = {
        referenceTransaction: transactionRef.trim(),
        mode: modeRemboursement || 'Passerelle de paiement / Virement bancaire',
        dateExecution: new Date(),
        confirme: true,
        commentaire: 'Opération financière confirmée par le système bancaire/paiement'
      };

      // Mettre à jour la commande associée
      if (refund.commande) {
        await Order.findByIdAndUpdate(refund.commande._id, {
          $set: { statutPaiement: 'rembourse', statut: 'annulee' }
        });
      }

      // Mettre à jour la commission
      await Commission.updateMany(
        { commande: refund.commande?._id },
        { $set: { statut: 'annulee' } }
      );
    } else if (action === 'approuve') {
      refund.statut = 'approuve';
    } else if (action === 'refuse') {
      refund.statut = 'refuse';
    } else {
      return res.status(400).json({ success: false, message: 'Action invalide' });
    }

    refund.reponse = reponse || refund.reponse;
    refund.traitePar = req.user._id;
    refund.dateTraitement = new Date();

    refund.historiqueStatuts.push({
      statut: refund.statut,
      date: new Date(),
      commentaire: reponse || `Dossier ${refund.statut}`,
      traitePar: req.user._id
    });

    await refund.save();

    // Mettre à jour la réclamation rattachée si existante
    if (refund.reclamation) {
      await Reclamation.findByIdAndUpdate(refund.reclamation, {
        $set: {
          statut: action === 'refuse' ? 'refusee' : 'resolue',
          reponseAdmin: reponse || `Remboursement ${refund.statut}. Réf : ${transactionRef || ''}`
        }
      });
    }

    // Notification client
    await Notification.create({
      destinataire: refund.client,
      titre: `Mise à jour Remboursement : ${refund.statut.toUpperCase()}`,
      message: `Votre demande de remboursement de ${refund.montant.toFixed(2)} TND a été traitée : statut "${refund.statut}". ${reponse ? 'Message : ' + reponse : ''}`,
      type: 'remboursement'
    });

    res.json({
      success: true,
      message: `Remboursement mis à jour : ${refund.statut}`,
      data: refund
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
