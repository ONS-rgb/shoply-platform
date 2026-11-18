const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const Shop = require('../models/Shop');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Category = require('../models/Category');
const Payment = require('../models/Payment');
const Commission = require('../models/Commission');
const Reclamation = require('../models/Reclamation');
const Refund = require('../models/Refund');

async function initData() {
  console.log('🔄 Initialisation et vérification des données de l\'administrateur...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connecté à MongoDB');

  // 1. Initialisation du compte ADMIN
  let admin = await User.findOne({ role: 'admin' });
  if (!admin) {
    const hashedPassword = await bcrypt.hash('Admin123456!', 12);
    admin = await User.create({
      nom: 'Admin',
      prenom: 'Shoply',
      email: 'admin@shoply.tn',
      motDePasse: hashedPassword,
      role: 'admin',
      telephone: '+216 71 000 000',
      actif: true,
      adresse: {
        rue: '1 Avenue Habib Bourguiba',
        ville: 'Tunis',
        codePostal: '1000',
        pays: 'Tunisie'
      }
    });
    console.log('👑 Compte Administrateur créé avec succès :');
    console.log('   Email : admin@shoply.tn');
    console.log('   Mot de passe : Admin123456!');
  } else {
    console.log(`ℹ️ Compte Administrateur déjà présent : ${admin.email}`);
  }

  // 2. Initialisation des Catégories
  const initialCategories = [
    { nom: 'Téléphones', icone: '📱', description: 'Smartphones, accessoires et objets connectés' },
    { nom: 'Ordinateurs', icone: '💻', description: 'Laptops, PC de bureau et accessoires informatiques' },
    { nom: 'Vêtements', icone: '👕', description: 'Mode homme, femme et enfants' },
    { nom: 'Maison', icone: '🏠', description: 'Maison, électroménager et décoration' },
    { nom: 'Sport', icone: '⚽', description: 'Équipements et vêtements de sport' }
  ];

  for (const cat of initialCategories) {
    const exists = await Category.findOne({ nom: cat.nom });
    if (!exists) {
      await Category.create(cat);
      console.log(`📂 Catégorie créée : ${cat.nom}`);
    }
  }

  // Vérifier si des produits ont d'autres catégories
  const existingProductCats = await Product.distinct('categorie');
  for (const catName of existingProductCats) {
    if (catName && catName.trim()) {
      const exists = await Category.findOne({ nom: catName.trim() });
      if (!exists) {
        await Category.create({ nom: catName.trim(), icone: '🏷️', description: `Catégorie ${catName.trim()}` });
        console.log(`📂 Catégorie synchronisée depuis les produits : ${catName.trim()}`);
      }
    }
  }

  // 3. Synchronisation des Paiements depuis les Commandes existantes
  const orders = await Order.find();
  console.log(`📦 Vérification des paiements pour ${orders.length} commande(s)...`);

  for (const order of orders) {
    let payment = await Payment.findOne({ commande: order._id });
    if (!payment) {
      const refSuffix = order.numeroCommande ? order.numeroCommande.replace(/[^A-Z0-9]/gi, '') : order._id.toString().slice(-6).toUpperCase();
      const statusMap = {
        'paye': 'valide',
        'rembourse': 'valide',
        'en_attente': 'en_attente'
      };
      const payStatus = statusMap[order.statutPaiement] || 'en_attente';

      payment = await Payment.create({
        reference: `PAY-${refSuffix}`,
        commande: order._id,
        client: order.client,
        montant: order.total,
        methodePaiement: order.modePaiement === 'carte' ? 'carte' : 'livraison',
        statut: payStatus,
        datePaiement: order.createdAt,
        notes: `Paiement généré pour la commande ${order.numeroCommande}`,
        validePar: payStatus === 'valide' ? admin._id : null,
        dateValidation: payStatus === 'valide' ? order.updatedAt : null,
        historique: [{
          statut: payStatus,
          date: order.createdAt,
          commentaire: 'Création du paiement lié à la commande',
          traitePar: admin._id
        }]
      });
      console.log(`💳 Paiement généré : ${payment.reference} (${payment.montant} TND) [${payment.statut}]`);
    }
  }

  // 4. Synchronisation des Commissions depuis les Commandes
  console.log('💰 Vérification et calcul des commissions sur les transactions réelles...');
  for (const order of orders) {
    const payment = await Payment.findOne({ commande: order._id });

    for (const article of (order.articles || [])) {
      const existingComm = await Commission.findOne({
        commande: order._id,
        'article.produit': article.produit
      });

      if (!existingComm) {
        // Trouver la boutique associée au vendeur
        const sellerId = article.boutique;
        const shop = await Shop.findOne({ proprietaire: sellerId });

        const montantVente = (article.prix || 0) * (article.quantite || 1);
        const commissionPct = 10; // 10% de commission de la plateforme
        const montantComm = Math.round((montantVente * (commissionPct / 100)) * 100) / 100;
        const netVendeur = Math.round((montantVente - montantComm) * 100) / 100;

        let commStatut = 'validee';
        if (order.statut === 'annulee') commStatut = 'annulee';
        else if (order.statutPaiement === 'paye') commStatut = 'payee';

        await Commission.create({
          commande: order._id,
          paiement: payment ? payment._id : null,
          vendeur: sellerId || admin._id,
          boutique: shop ? shop._id : null,
          article: {
            produit: article.produit,
            nom: article.nom,
            quantite: article.quantite,
            prixUnitaire: article.prix
          },
          montantVente,
          pourcentage: commissionPct,
          montantCommission: montantComm,
          montantNetVendeur: netVendeur,
          statut: commStatut,
          dateCalcul: order.createdAt
        });
        console.log(`💵 Commission enregistrée : ${montantComm} TND pour l'article "${article.nom}"`);
      }
    }
  }

  // 5. Synchronisation des Réclamations & Remboursements
  const refunds = await Refund.find();
  console.log(`⚖️ Vérification des remboursements et réclamations (${refunds.length} remboursement(s))...`);

  for (const refund of refunds) {
    const order = await Order.findById(refund.commande);
    const payment = await Payment.findOne({ commande: refund.commande });

    // Si le remboursement n'a pas encore de paiement rattaché
    if (!refund.paiement && payment) {
      refund.paiement = payment._id;
    }

    // Si le remboursement n'a pas de réclamation associée, en créer une
    let reclamation = await Reclamation.findOne({ commande: refund.commande });
    if (!reclamation && order) {
      reclamation = await Reclamation.create({
        numeroReclamation: `REC-${Date.now().toString().slice(-6)}`,
        client: refund.client,
        commande: refund.commande,
        sujet: refund.motif || 'Réclamation suite à un retard / incident de commande',
        description: refund.details || 'Demande de remboursement initiée par le client.',
        piecesJointes: [],
        statut: refund.statut === 'approuvee' || refund.statut === 'remboursee' ? 'resolue' : 'en_attente',
        reponseAdmin: refund.reponse || refund.reponseVendeur || 'Dossier traité par l\'équipe support.',
        dateResolution: refund.statut === 'approuvee' ? refund.updatedAt : null,
        historiqueStatuts: [{
          statut: refund.statut === 'approuvee' ? 'resolue' : 'en_attente',
          date: refund.createdAt,
          commentaire: 'Création automatique de la réclamation liée à la demande de remboursement'
        }]
      });
      console.log(`📑 Réclamation créée : ${reclamation.numeroReclamation}`);
    }

    if (reclamation && !refund.reclamation) {
      refund.reclamation = reclamation._id;
    }

    // Assurer les détails de confirmation de remboursement si approuvé/remboursé
    if ((refund.statut === 'approuvee' || refund.statut === 'remboursee') && !refund.confirmationPaiement?.confirme) {
      refund.confirmationPaiement = {
        referenceTransaction: `TX-REFUND-${Date.now().toString().slice(-6)}`,
        mode: 'Virement bancaire / Bon d\'achat',
        dateExecution: refund.updatedAt || new Date(),
        confirme: true,
        commentaire: 'Remboursement validé et confirmé avec succès.'
      };
    }

    if (!refund.historiqueStatuts || refund.historiqueStatuts.length === 0) {
      refund.historiqueStatuts = [{
        statut: refund.statut,
        date: refund.createdAt,
        commentaire: 'Demande enregistrée'
      }];
    }

    await refund.save();
  }

  // Ajouter une réclamation d'exemple supplémentaire pour test si aucune réclamation active
  const activeRecCount = await Reclamation.countDocuments();
  if (activeRecCount < 2 && orders.length > 1) {
    const targetOrder = orders[1];
    const rec2 = await Reclamation.create({
      numeroReclamation: `REC-${Date.now().toString().slice(-5)}`,
      client: targetOrder.client,
      commande: targetOrder._id,
      sujet: 'Question sur la conformité de l\'article reçu',
      description: 'L\'emballage était intact mais je souhaitais vérifier la garantie du produit.',
      piecesJointes: [],
      statut: 'en_cours',
      reponseAdmin: 'Prise en charge par le support administrateur, vérification avec le vendeur en cours.',
      historiqueStatuts: [
        { statut: 'en_attente', date: targetOrder.createdAt, commentaire: 'Réclamation ouverte' },
        { statut: 'en_cours', date: new Date(), commentaire: 'Affectée à un administrateur' }
      ]
    });
    console.log(`📑 Nouvelle réclamation d'exemple ajoutée : ${rec2.numeroReclamation}`);
  }

  console.log('\n🎉 INITIALISATION ET SYNCHRONISATION TERMINÉES AVEC SUCCÈS !');
  process.exit(0);
}

initData().catch(err => {
  console.error('❌ Erreur lors de l\'initialisation :', err);
  process.exit(1);
});
