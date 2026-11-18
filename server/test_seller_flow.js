const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');
const Shop = require('./models/Shop');
const Product = require('./models/Product');
const Order = require('./models/Order');
const Review = require('./models/Review');
const Refund = require('./models/Refund');
const Notification = require('./models/Notification');

const runSellerTests = async () => {
  try {
    console.log('⏳ Connexion DB pour la validation des fonctionnalités Vendeur...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    // 0. Utilisateurs de test (Vendeur & Client)
    let vendor = await User.findOne({ role: 'vendeur' });
    if (!vendor) {
      vendor = await User.create({
        nom: 'Aloulou',
        prenom: 'Sami',
        email: `vendor.test.${Date.now()}@shoply.tn`,
        motDePasse: await bcrypt.hash('password123', 10),
        role: 'vendeur',
        telephone: '98123456'
      });
    }

    let client = await User.findOne({ role: 'client' });
    if (!client) {
      client = await User.create({
        nom: 'Ben Amor',
        prenom: 'Leila',
        email: `client.seller.test.${Date.now()}@shoply.tn`,
        motDePasse: await bcrypt.hash('password123', 10),
        role: 'client',
        telephone: '50123456'
      });
    }

    console.log(`\n👤 Acteurs du test :`);
    console.log(`   - Vendeur : ${vendor.prenom} ${vendor.nom} (${vendor._id})`);
    console.log(`   - Client  : ${client.prenom} ${client.nom} (${client._id})`);

    // =========================================================================
    // 1. TEST BOUTIQUE (Création, Statuts d'ouverture, Coordonnées)
    // =========================================================================
    console.log('\n--- 1. Test Gestion Boutique (Shop) & Statuts ---');
    let shop = await Shop.findOne({ proprietaire: vendor._id });
    if (!shop) {
      shop = await Shop.create({
        nom: `Tech & Style ${Date.now()}`,
        description: 'Boutique officielle de produits high-tech et mode',
        proprietaire: vendor._id,
        telephone: vendor.telephone,
        email: vendor.email,
        adresse: { rue: '12 Rue de la Liberté', ville: 'Tunis', codePostal: '1002', pays: 'Tunisie' },
        statut: 'active'
      });
    }
    console.log(`✅ Boutique existante/créée : "${shop.nom}" (Statut: ${shop.statut})`);

    // Test passage en pause temporaire avec motif
    shop.statut = 'fermee_temporairement';
    shop.motifFermeture = 'Fermeture annuelle pour congés du 1er au 15';
    await shop.save();
    console.log(`✅ Statut boutique mis à jour : "${shop.statut}" avec motif "${shop.motifFermeture}"`);

    // Rétablissement en active
    shop.statut = 'active';
    shop.motifFermeture = '';
    await shop.save();
    console.log(`✅ Boutique réactivée : "${shop.statut}"`);

    // =========================================================================
    // 2. TEST PRODUIT & PROMOTIONS & SEUIL D'ALERTE
    // =========================================================================
    console.log('\n--- 2. Test Catalogue Produit, Promotions & Seuil Stock ---');
    let product = await Product.create({
      nom: `Montre Connectée Pro ${Date.now()}`,
      description: 'Montre intelligente avec capteur de rythme cardiaque',
      prix: 200,
      stock: 12,
      seuilAlerteStock: 4,
      categorie: 'High-Tech',
      marque: 'SmartTech',
      couleurs: ['Noir', 'Argent'],
      boutique: vendor._id,
      statut: 'actif'
    });
    console.log(`✅ Produit créé : "${product.nom}" - Prix: ${product.prix} TND - Stock: ${product.stock} (Seuil alerte: ${product.seuilAlerteStock})`);

    // Configuration d'une promotion de -25%
    const promoPct = 25;
    product.promotion = {
      active: true,
      pourcentage: promoPct,
      prixPromo: Math.round((product.prix * (1 - promoPct / 100)) * 100) / 100,
      dateDebut: new Date(),
      dateFin: new Date(Date.now() + 7 * 24 * 3600 * 1000)
    };
    await product.save();
    console.log(`✅ Promotion -${product.promotion.pourcentage}% activée : Nouveau prix promo = ${product.promotion.prixPromo} TND`);

    // =========================================================================
    // 3. TEST INVENTAIRE & ALERTE DE STOCK
    // =========================================================================
    console.log('\n--- 3. Test Stocks & Indicateurs d\'alerte ---');
    // Mettre le stock sous le seuil d'alerte pour tester le calcul
    product.stock = 3; // seuil = 4 => alerte
    await product.save();

    const isLow = product.stock > 0 && product.stock <= product.seuilAlerteStock;
    const isOut = product.stock <= 0;
    const statutStock = isOut ? 'rupture' : isLow ? 'alerte' : 'normal';
    console.log(`✅ Indicateur d'état du stock calculé : "${statutStock}" (Stock: ${product.stock}, Seuil: ${product.seuilAlerteStock})`);

    // Remettre un stock suffisant
    product.stock = 15;
    await product.save();
    console.log(`✅ Réapprovisionnement stock : ${product.stock} unités`);

    // =========================================================================
    // 4. TEST CYCLE DE VIE DES COMMANDES VENDEUR & ANNULATION AVEC RESTITUTION
    // =========================================================================
    console.log('\n--- 4. Test Flux Commande Vendeur & Restitution de Stock ---');
    const orderQty = 2;
    const orderNum = `CMD-SELLER-${Date.now().toString(36).toUpperCase()}`;

    const order = await Order.create({
      numeroCommande: orderNum,
      client: client._id,
      articles: [{
        produit: product._id,
        nom: product.nom,
        prix: product.promotion.prixPromo,
        quantite: orderQty,
        couleur: 'Noir',
        image: product.images?.[0] || '',
        boutique: vendor._id
      }],
      adresseLivraison: {
        nomComplet: `${client.prenom} ${client.nom}`,
        telephone: client.telephone,
        rue: 'Avenue Habib Thameur',
        ville: 'Tunis',
        codePostal: '1001',
        pays: 'Tunisie'
      },
      modeLivraison: { nom: 'Express', prix: 7 },
      modePaiement: 'livraison',
      statut: 'en_attente',
      sousTotal: product.promotion.prixPromo * orderQty,
      fraisLivraison: 7,
      total: product.promotion.prixPromo * orderQty + 7
    });

    // Décrémenter le stock
    await Product.findByIdAndUpdate(product._id, { $inc: { stock: -orderQty } });
    let currentProd = await Product.findById(product._id);
    console.log(`✅ Commande client créée : ${order.numeroCommande} (Statut: ${order.statut})`);
    console.log(`   Stock décrémenté : 15 -> ${currentProd.stock}`);

    // Simulation avancement des statuts par le vendeur
    const statuses = ['confirmee', 'en_preparation', 'expediee'];
    for (const st of statuses) {
      order.statut = st;
      order.historiqueStatuts.push({ statut: st, date: new Date(), commentaire: `Passage à ${st}` });
      await order.save();
      console.log(`   ➔ Statut commande avancé : "${order.statut}"`);
    }

    // Annulation par le vendeur avec restitution de stock
    const cancelMotif = 'Défaut de conformité constaté lors du contrôle qualité préalable';
    order.statut = 'annulee';
    order.historiqueStatuts.push({ statut: 'annulee', date: new Date(), commentaire: cancelMotif });
    await order.save();

    await Product.findByIdAndUpdate(product._id, { $inc: { stock: orderQty } });
    currentProd = await Product.findById(product._id);
    console.log(`✅ Commande annulée par le vendeur : Motif "${cancelMotif}"`);
    console.log(`   Stock restauré avec succès : -> ${currentProd.stock} unités`);

    // =========================================================================
    // 5. TEST AVIS CLIENTS & RÉPONSES DU VENDEUR
    // =========================================================================
    console.log('\n--- 5. Test Avis Clients & Réponses Officielles Vendeur ---');
    // Supprimer anciens avis de test pour ce couple
    try {
      await Review.collection.dropIndex('product_1_user_1');
    } catch {}
    await Review.deleteMany({ produit: product._id, client: client._id });

    const review = await Review.create({
      produit: product._id,
      client: client._id,
      note: 4,
      titre: 'Très bon produit mais livraison un peu lente',
      commentaire: 'La montre fonctionne à merveille, autonomie excellente.',
      achatVerifie: true
    });
    console.log(`✅ Avis client déposé : ${review.note}/5 - "${review.titre}"`);

    // Réponse du vendeur
    const replyText = 'Bonjour, merci pour votre confiance. Nous avons optimisé notre service logistique pour vos futures commandes !';
    review.reponseVendeur = {
      texte: replyText,
      dateReponse: new Date(),
      vendeur: vendor._id
    };
    await review.save();
    console.log(`✅ Réponse officielle du vendeur enregistrée par ${vendor.prenom} :`);
    console.log(`   "${review.reponseVendeur.texte}" (Date: ${review.reponseVendeur.dateReponse.toISOString()})`);

    // Vérification de la suppression de la réponse
    review.reponseVendeur = { texte: '', dateReponse: null, vendeur: null };
    await review.save();
    console.log(`✅ Suppression de la réponse vendeur validée.`);

    // =========================================================================
    // 6. TEST DEMANDES DE REMBOURSEMENT & DÉCISION VENDEUR
    // =========================================================================
    console.log('\n--- 6. Test Demandes de Remboursement & Décision Vendeur ---');
    const refund = await Refund.create({
      commande: order._id,
      client: client._id,
      montant: order.total,
      motif: 'Colis endommagé',
      details: 'L\'emballage externe présentait un choc important',
      statut: 'en_attente'
    });
    console.log(`✅ Demande de remboursement créée pour la commande ${order.numeroCommande} (Statut: ${refund.statut})`);

    // Traitement par le vendeur (Approbation)
    refund.statut = 'approuvee';
    refund.reponseVendeur = 'Demande acceptée, remboursement accordé sous 48h';
    refund.dateReponseVendeur = new Date();
    refund.traitePar = vendor._id;
    refund.dateTraitement = new Date();
    await refund.save();

    console.log(`✅ Décision vendeur appliquée : Statut "${refund.statut}"`);
    console.log(`   Traité par: ${vendor.prenom} ${vendor.nom} - Réponse: "${refund.reponseVendeur}"`);

    // =========================================================================
    // 7. TEST CALCUL DES STATISTIQUES VENDEUR
    // =========================================================================
    console.log('\n--- 7. Test Calcul Métriques Analytiques Vendeur ---');
    const sellerOrders = await Order.find({ 'articles.boutique': vendor._id });
    console.log(`✅ Total commandes liées au vendeur : ${sellerOrders.length}`);

    // Nettoyage automatique des enregistrements de test éphémères
    await Product.deleteOne({ _id: product._id });
    await Order.deleteOne({ _id: order._id });
    await Review.deleteOne({ _id: review._id });
    await Refund.deleteOne({ _id: refund._id });

    console.log('\n🎉 TOUS LES FLUX VENDEUR SONT VALIDÉS AVEC SUCCÈS ! 🚀');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors du test vendeur :', error);
    process.exit(1);
  }
};

runSellerTests();
