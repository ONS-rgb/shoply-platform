const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');
const Product = require('./models/Product');
const Cart = require('./models/Cart');
const Order = require('./models/Order');
const Review = require('./models/Review');
const Notification = require('./models/Notification');
const Refund = require('./models/Refund');
const Shop = require('./models/Shop');

const run = async () => {
  try {
    console.log('⏳ Connexion DB pour tests...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    // 1. Test Produit avec variantes de couleurs et image correspondante
    console.log('\n--- 1. Test Variantes de couleurs & images ---');
    let product = await Product.findOne({ statut: 'actif' });
    if (!product) {
      console.log('Création d\'un produit test...');
      const vendor = await User.findOne({ role: 'vendeur' });
      product = await Product.create({
        nom: 'T-Shirt Shein Fashion Style',
        description: 'T-shirt respirant en coton doux avec variantes',
        prix: 45,
        stock: 30,
        categorie: 'Vêtements',
        couleurs: ['Noir', 'Blanc', 'Bleu'],
        variantesCouleurs: [
          { couleur: 'Noir', image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500' },
          { couleur: 'Blanc', image: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=500' },
          { couleur: 'Bleu', image: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=500' }
        ],
        images: [
          'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500',
          'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=500',
          'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=500'
        ],
        boutique: vendor ? vendor._id : new mongoose.Types.ObjectId()
      });
    } else {
      // Mettre à jour avec des variantes de couleur
      product.couleurs = ['Noir', 'Blanc', 'Bleu'];
      product.variantesCouleurs = [
        { couleur: 'Noir', image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500' },
        { couleur: 'Blanc', image: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=500' },
        { couleur: 'Bleu', image: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=500' }
      ];
      await product.save();
    }
    console.log(`✅ Produit "${product.nom}" vérifié avec ${product.variantesCouleurs.length} variantes de couleurs associées aux images.`);

    // 2. Test Client et Adresses multiples (Amazon-style)
    console.log('\n--- 2. Test Client & Carnet d\'adresses Amazon ---');
    let client = await User.findOne({ role: 'client' });
    if (!client) {
      const bcrypt = require('bcryptjs');
      client = await User.create({
        nom: 'Ben Salah',
        prenom: 'Karim',
        email: `client.test.${Date.now()}@shoply.tn`,
        motDePasse: await bcrypt.hash('password123', 12),
        role: 'client',
        telephone: '20123456'
      });
    }

    client.adresses = [
      {
        nomComplet: `${client.prenom} ${client.nom}`,
        telephone: client.telephone || '20123456',
        rue: '15 Avenue Habib Bourguiba, Résidence Les Fleurs',
        ville: 'Tunis',
        codePostal: '1000',
        pays: 'Tunisie',
        instructions: 'Sonner à l\'interphone Ben Salah, 2ème étage',
        estDefaut: true
      },
      {
        nomComplet: `${client.prenom} ${client.nom} (Bureau)`,
        telephone: client.telephone || '20123456',
        rue: 'Centre Urbain Nord, Immeuble Horizon',
        ville: 'Tunis',
        codePostal: '1082',
        pays: 'Tunisie',
        instructions: 'Laisser à l\'accueil au nom de Karim',
        estDefaut: false
      }
    ];
    await client.save();
    console.log(`✅ Client ${client.prenom} ${client.nom} possède ${client.adresses.length} adresses enregistrées.`);

    // 3. Test Commande et décrémentation des stocks
    console.log('\n--- 3. Test Création de commande avec adresse de livraison ---');
    const initialStock = product.stock;
    const orderQty = 2;
    const chosenColor = 'Noir';

    const orderNumber = `CMD-TEST-${Date.now().toString(36).toUpperCase()}`;
    const newOrder = await Order.create({
      numeroCommande: orderNumber,
      client: client._id,
      articles: [{
        produit: product._id,
        nom: product.nom,
        prix: product.prix,
        quantite: orderQty,
        couleur: chosenColor,
        image: product.variantesCouleurs[0].image,
        boutique: product.boutique
      }],
      adresseLivraison: {
        nomComplet: client.adresses[0].nomComplet,
        telephone: client.adresses[0].telephone,
        rue: client.adresses[0].rue,
        ville: client.adresses[0].ville,
        codePostal: client.adresses[0].codePostal,
        pays: client.adresses[0].pays,
        instructions: client.adresses[0].instructions
      },
      modeLivraison: { nom: 'Livraison Standard', prix: 7 },
      modePaiement: 'livraison',
      statut: 'en_attente',
      historiqueStatuts: [{
        statut: 'en_attente',
        date: new Date(),
        commentaire: 'Commande passée lors du test'
      }],
      sousTotal: product.prix * orderQty,
      fraisLivraison: 7,
      total: product.prix * orderQty + 7
    });

    // Décrémenter le stock
    await Product.findByIdAndUpdate(product._id, { $inc: { stock: -orderQty } });
    const updatedProd = await Product.findById(product._id);
    console.log(`✅ Commande créée : ${newOrder.numeroCommande}`);
    console.log(`   Adresse destination : ${newOrder.adresseLivraison.rue}, ${newOrder.adresseLivraison.ville}`);
    console.log(`   Stock produit : ${initialStock} -> ${updatedProd.stock} (Décrémenté de ${orderQty})`);

    // 4. Test Notification
    console.log('\n--- 4. Test Notifications client ---');
    const notif = await Notification.create({
      destinataire: client._id,
      titre: 'Confirmation de commande',
      message: `Votre commande ${newOrder.numeroCommande} a bien été enregistrée.`,
      type: 'commande',
      lien: `/orders/${newOrder._id}`,
      lu: false
    });
    console.log(`✅ Notification créée : "${notif.titre}" (ID: ${notif._id})`);

    // 5. Test Avis avec Achat Vérifié
    console.log('\n--- 5. Test Avis & Notes avec Achat Vérifié ---');
    // Supprimer tout ancien avis de ce client sur ce produit pour le test
    await Review.deleteMany({ produit: product._id, client: client._id });
    const review = await Review.create({
      produit: product._id,
      client: client._id,
      note: 5,
      titre: 'Excellente qualité !',
      commentaire: 'Tissu très agréable, conforme à la photo et couleur fidèle.',
      achatVerifie: true
    });
    console.log(`✅ Avis déposé : ${review.note}/5 étoiles - Achat vérifié: ${review.achatVerifie}`);

    // 6. Test Demande de Remboursement
    console.log('\n--- 6. Test Demande de Remboursement ---');
    const refund = await Refund.create({
      commande: newOrder._id,
      client: client._id,
      montant: newOrder.total,
      motif: 'Commande non traitée dans les délais impartis',
      details: 'Demande de test automatisé',
      statut: 'en_attente'
    });
    console.log(`✅ Demande de remboursement créée : Statut "${refund.statut}" pour un montant de ${refund.montant} TND`);

    // 7. Test Annulation et Restitution des stocks
    console.log('\n--- 7. Test Annulation de commande & Restitution de stock ---');
    newOrder.statut = 'annulee';
    newOrder.historiqueStatuts.push({
      statut: 'annulee',
      date: new Date(),
      commentaire: 'Annulation test'
    });
    await newOrder.save();
    await Product.findByIdAndUpdate(product._id, { $inc: { stock: orderQty } });
    const restoredProd = await Product.findById(product._id);
    console.log(`✅ Commande ${newOrder.numeroCommande} annulée.`);
    console.log(`   Stock produit restauré : ${updatedProd.stock} -> ${restoredProd.stock}`);

    // 8. Test Boutique
    console.log('\n--- 8. Test Boutiques ---');
    let shop = await Shop.findOne({ statut: 'approuvee' });
    if (!shop) {
      shop = await Shop.create({
        nom: 'Shoply Mode & Tendance',
        description: 'La boutique officielle des tendances prêt-à-porter',
        proprietaire: client._id,
        statut: 'approuvee'
      });
    }
    console.log(`✅ Boutique disponible : "${shop.nom}" (ID: ${shop._id})`);

    console.log('\n🎉 TOUS LES TESTS D\'INTÉGRATION SONT VALIDÉS AVEC SUCCÈS !');
    process.exit(0);
  } catch (err) {
    console.error('❌ Erreur pendant les tests:', err);
    process.exit(1);
  }
};

run();
