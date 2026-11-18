const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const Notification = require('../models/Notification');
const User = require('../models/User');
const Shop = require('../models/Shop');

// POST /api/orders : Créer une commande (Client uniquement)
exports.createOrder = async (req, res) => {
  try {
    const {
      adresseLivraison,
      modeLivraison,
      modePaiement,
      enregistrerAdresse
    } = req.body;

    // Validation des champs d'adresse obligatoire
    if (!adresseLivraison || !adresseLivraison.nomComplet || !adresseLivraison.telephone || !adresseLivraison.rue || !adresseLivraison.ville) {
      return res.status(400).json({ success: false, message: 'Veuillez renseigner une adresse de livraison complète' });
    }

    // Récupérer le panier du client
    const cart = await Cart.findOne({ client: req.user._id }).populate('items.produit');
    if (!cart || !cart.items || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Votre panier est vide' });
    }

    // Filtrer les articles actifs
    const validItems = cart.items.filter((item) => item.produit && item.produit.statut === 'actif');
    if (validItems.length === 0) {
      return res.status(400).json({ success: false, message: 'Aucun produit disponible dans le panier' });
    }

    // Vérification de la disponibilité des produits
    const orderItems = [];
    let sousTotal = 0;

    for (const item of validItems) {
      const prod = await Product.findById(item.produit._id);
      if (!prod || prod.statut !== 'actif') {
        return res.status(400).json({
          success: false,
          message: `Le produit "${item.produit.nom}" n'est plus disponible`
        });
      }

      // Chercher l'image correspondante à la couleur sélectionnée si présente
      let itemImage = prod.images?.[0] || '';
      if (item.couleur && prod.variantesCouleurs && prod.variantesCouleurs.length > 0) {
        const foundVariant = prod.variantesCouleurs.find(
          (v) => v.couleur.trim().toLowerCase() === item.couleur.trim().toLowerCase()
        );
        if (foundVariant && foundVariant.image) {
          itemImage = foundVariant.image;
        }
      }

      orderItems.push({
        produit: prod._id,
        nom: prod.nom,
        prix: prod.prix,
        quantite: item.quantite,
        couleur: item.couleur || '',
        image: itemImage,
        boutique: prod.boutique
      });

      sousTotal += prod.prix * item.quantite;
    }

    // Calcul des frais de livraison
    const fLivraison = sousTotal >= 150 ? 0 : (modeLivraison?.prix !== undefined ? Number(modeLivraison.prix) : 7);
    const total = sousTotal + fLivraison;

    // Le stock a déjà été réservé et décrémenté lors de l'ajout au panier.
    // La validation de commande confirme définitivement la réservation.

    // Générer un numéro de commande unique lisible (ex: CMD-M7A9X-4821)
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const datePrefix = Date.now().toString(36).toUpperCase();
    const numeroCommande = `CMD-${datePrefix}-${randomSuffix}`;

    // Créer la commande
    const order = await Order.create({
      numeroCommande,
      client: req.user._id,
      articles: orderItems,
      adresseLivraison: {
        nomComplet: adresseLivraison.nomComplet,
        telephone: adresseLivraison.telephone,
        rue: adresseLivraison.rue,
        ville: adresseLivraison.ville,
        codePostal: adresseLivraison.codePostal || '',
        pays: adresseLivraison.pays || 'Tunisie',
        instructions: adresseLivraison.instructions || ''
      },
      modeLivraison: {
        nom: modeLivraison?.nom || (sousTotal >= 150 ? 'Livraison Gratuite' : 'Livraison Standard'),
        delai: modeLivraison?.delai || '2-4 jours ouvrables',
        prix: fLivraison
      },
      modePaiement: modePaiement || 'livraison',
      statutPaiement: modePaiement === 'carte' ? 'paye' : 'en_attente',
      statut: 'en_attente',
      historiqueStatuts: [{
        statut: 'en_attente',
        date: new Date(),
        commentaire: 'Commande passée avec succès'
      }],
      sousTotal,
      fraisLivraison: fLivraison,
      total
    });

    // Vider le panier du client
    cart.items = [];
    await cart.save();

    // Optionnel : Enregistrer l'adresse dans le profil du client si demandé
    if (enregistrerAdresse) {
      const user = await User.findById(req.user._id);
      if (user) {
        if (!user.adresses) user.adresses = [];
        const exists = user.adresses.some(
          (a) => a.rue === adresseLivraison.rue && a.ville === adresseLivraison.ville
        );
        if (!exists) {
          const isFirst = user.adresses.length === 0;
          user.adresses.push({
            nomComplet: adresseLivraison.nomComplet,
            telephone: adresseLivraison.telephone,
            rue: adresseLivraison.rue,
            ville: adresseLivraison.ville,
            codePostal: adresseLivraison.codePostal || '',
            pays: adresseLivraison.pays || 'Tunisie',
            instructions: adresseLivraison.instructions || '',
            estDefaut: isFirst
          });
          if (isFirst) {
            user.adresse = {
              rue: adresseLivraison.rue,
              ville: adresseLivraison.ville,
              codePostal: adresseLivraison.codePostal || '',
              pays: adresseLivraison.pays || 'Tunisie'
            };
          }
          await user.save();
        }
      }
    }

    // Créer une notification pour le client
    await Notification.create({
      destinataire: req.user._id,
      titre: 'Commande enregistrée',
      message: `Votre commande ${numeroCommande} d'un montant de ${total.toFixed(2)} TND a été enregistrée avec succès.`,
      type: 'commande',
      lien: `/orders/${order._id}`
    });

    // Notifier chaque vendeur concerné par la commande (UML: Passer commande -> Envoyer notification -> Vendeur)
    const notifiedVendors = new Set();
    for (const item of orderItems) {
      if (!item.boutique) continue;
      let vendorId = item.boutique;
      const shopObj = await Shop.findById(item.boutique);
      if (shopObj && shopObj.proprietaire) {
        vendorId = shopObj.proprietaire;
      }
      const vendorKey = vendorId.toString();
      if (!notifiedVendors.has(vendorKey) && vendorKey !== req.user._id.toString()) {
        notifiedVendors.add(vendorKey);
        await Notification.create({
          destinataire: vendorId,
          titre: 'Nouvelle commande reçue !',
          message: `Vous avez reçu une nouvelle commande (${numeroCommande}) contenant des articles de votre boutique.`,
          type: 'commande',
          lien: '/seller'
        });
      }
    }

    res.status(201).json({
      success: true,
      message: 'Commande validée avec succès',
      data: order
    });
  } catch (error) {
    console.error('Erreur création commande:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/orders : Liste de mes commandes (Client)
exports.getMyOrders = async (req, res) => {
  try {
    const query = { client: req.user._id };
    if (req.query.statut) {
      query.statut = req.query.statut;
    }

    const orders = await Order.find(query).sort({ createdAt: -1 });
    res.json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/orders/:id : Détail d'une commande (Client)
exports.getOrderById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ success: false, message: 'Commande non trouvée' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Commande non trouvée' });
    }

    // Vérifier les droits : seul le client propriétaire ou admin peut la consulter
    if (!order.client.equals(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Accès refusé à cette commande' });
    }

    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/orders/:id/cancel : Annuler une commande
exports.cancelOrder = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ success: false, message: 'Commande non trouvée' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Commande non trouvée' });
    }

    if (!order.client.equals(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Accès refusé' });
    }

    // Vérifier l'éligibilité à l'annulation
    if (!['en_attente', 'confirmee'].includes(order.statut)) {
      return res.status(400).json({
        success: false,
        message: `Impossible d'annuler une commande au statut "${order.statut}". Contactez le service client.`
      });
    }

    // Restituer les stocks
    for (const item of order.articles) {
      await Product.findByIdAndUpdate(item.produit, {
        $inc: { stock: item.quantite }
      });
    }

    order.statut = 'annulee';
    order.historiqueStatuts.push({
      statut: 'annulee',
      date: new Date(),
      commentaire: req.body.motif ? `Annulation demandée : ${req.body.motif}` : 'Commande annulée par le client'
    });

    await order.save();

    // Notification client
    await Notification.create({
      destinataire: order.client,
      titre: 'Commande annulée',
      message: `Votre commande ${order.numeroCommande} a bien été annulée et le stock a été restitué.`,
      type: 'commande',
      lien: `/orders/${order._id}`
    });

    res.json({
      success: true,
      message: 'Commande annulée avec succès',
      data: order
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/orders/seller : Commandes contenant les produits du vendeur
exports.getSellerOrders = async (req, res) => {
  try {
    const shops = await Shop.find({ proprietaire: req.user._id }).select('_id');
    const sellerIds = [req.user._id.toString(), ...shops.map((s) => s._id.toString())];

    const query = {
      'articles.boutique': { $in: [req.user._id, ...shops.map((s) => s._id)] }
    };

    if (req.query.statut && req.query.statut !== 'all') {
      query.statut = req.query.statut;
    }
    if (req.query.search) {
      query.numeroCommande = { $regex: req.query.search.trim(), $options: 'i' };
    }

    const orders = await Order.find(query)
      .populate('client', 'nom prenom email telephone')
      .sort({ createdAt: -1 });

    const enrichedOrders = orders.map((order) => {
      const orderObj = order.toObject();
      const articlesVendeur = orderObj.articles.filter((item) => {
        const bId = (item.boutique?._id || item.boutique)?.toString();
        return sellerIds.includes(bId);
      });
      const totalVendeur = articlesVendeur.reduce((sum, item) => sum + (item.prix * item.quantite), 0);

      return {
        ...orderObj,
        articlesVendeur,
        totalVendeur
      };
    });

    res.json({
      success: true,
      count: enrichedOrders.length,
      data: enrichedOrders
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/orders/seller/:id/status : Mettre à jour l'état (Confirmer, En préparation, Expédier, Livrer)
exports.updateSellerOrderStatus = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ success: false, message: 'Commande non trouvée' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Commande non trouvée' });
    }

    const shops = await Shop.find({ proprietaire: req.user._id }).select('_id');
    const sellerIds = [req.user._id.toString(), ...shops.map((s) => s._id.toString())];

    const hasSellerArticles = order.articles.some((item) =>
      sellerIds.includes((item.boutique?._id || item.boutique)?.toString())
    );

    if (!hasSellerArticles && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Accès refusé à cette commande' });
    }

    const { statut, commentaire } = req.body;
    const allowed = ['confirmee', 'en_preparation', 'expediee', 'livree'];
    if (!allowed.includes(statut)) {
      return res.status(400).json({
        success: false,
        message: `Statut invalide. Statuts autorisés : ${allowed.join(', ')}`
      });
    }

    order.statut = statut;
    if (statut === 'livree' && order.modePaiement === 'livraison') {
      order.statutPaiement = 'paye';
    }

    const statutLabels = {
      confirmee: 'Confirmée par le vendeur',
      en_preparation: 'En cours de préparation',
      expediee: 'Expédiée',
      livree: 'Livrée'
    };

    order.historiqueStatuts.push({
      statut,
      date: new Date(),
      commentaire: commentaire || statutLabels[statut] || 'Statut mis à jour'
    });

    await order.save();

    // Notifier le client
    await Notification.create({
      destinataire: order.client,
      titre: `Mise à jour de commande : ${order.numeroCommande}`,
      message: `Le statut de votre commande est désormais : ${statutLabels[statut] || statut}.`,
      type: 'commande',
      lien: `/orders/${order._id}`
    });

    res.json({
      success: true,
      message: `Statut mis à jour : ${statutLabels[statut] || statut}`,
      data: order
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/orders/seller/:id/cancel : Annulation vendeur avec motif et restitution de stock
exports.cancelSellerOrder = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ success: false, message: 'Commande non trouvée' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Commande non trouvée' });
    }

    const shops = await Shop.find({ proprietaire: req.user._id }).select('_id');
    const sellerIds = [req.user._id.toString(), ...shops.map((s) => s._id.toString())];

    const hasSellerArticles = order.articles.some((item) =>
      sellerIds.includes((item.boutique?._id || item.boutique)?.toString())
    );

    if (!hasSellerArticles && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Accès refusé' });
    }

    if (['livree', 'annulee'].includes(order.statut)) {
      return res.status(400).json({
        success: false,
        message: `Impossible d'annuler une commande déjà au statut "${order.statut}"`
      });
    }

    const { motif } = req.body;
    if (!motif || !motif.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Veuillez préciser un motif pour l\'annulation'
      });
    }

    // Restitution des stocks pour les articles du vendeur
    for (const item of order.articles) {
      const bId = (item.boutique?._id || item.boutique)?.toString();
      if (sellerIds.includes(bId) || req.user.role === 'admin') {
        await Product.findByIdAndUpdate(item.produit, {
          $inc: { stock: item.quantite }
        });
      }
    }

    order.statut = 'annulee';
    order.historiqueStatuts.push({
      statut: 'annulee',
      date: new Date(),
      commentaire: `Annulation vendeur : ${motif.trim()}`
    });

    await order.save();

    // Notifier le client
    await Notification.create({
      destinataire: order.client,
      titre: 'Commande annulée par le vendeur',
      message: `Votre commande ${order.numeroCommande} a été annulée par le vendeur. Motif : ${motif.trim()}. Le stock a été restitué.`,
      type: 'commande',
      lien: `/orders/${order._id}`
    });

    res.json({
      success: true,
      message: 'Commande annulée et stock restitué avec succès',
      data: order
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
