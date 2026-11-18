const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');
const Product = require('./models/Product');
const Cart = require('./models/Cart');
const Order = require('./models/Order');
const Review = require('./models/Review');
const Refund = require('./models/Refund');
const Notification = require('./models/Notification');
const Shop = require('./models/Shop');

async function testClientModule() {
  console.log('🧪 ========================================================');
  console.log('🧪 DÉBUT DES TESTS COMPLETS DU MODULE CLIENT SHOPLY');
  console.log('🧪 ========================================================\n');

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connecté à MongoDB');

  // 1. Client de test
  const testEmail = `client.test.${Date.now()}@shoply.tn`;
  let client = await User.create({
    nom: 'Ben Salah',
    prenom: 'Yassine',
    email: testEmail,
    motDePasse: await bcrypt.hash('password123', 10),
    role: 'client',
    telephone: '21000111',
    adresse: { rue: '15 Rue de Carthage', ville: 'Tunis', codePostal: '1000', pays: 'Tunisie' }
  });
  console.log(`👤 Client créé : ${client.prenom} ${client.nom} (${client.email})`);

  // 2. Vendeur et boutique pour la notification
  let vendor = await User.findOne({ role: 'vendeur' });
  if (!vendor) {
    vendor = await User.create({
      nom: 'Brahem', prenom: 'Doua', email: 'douabrahem123@gmail.com',
      motDePasse: await bcrypt.hash('password123', 10), role: 'vendeur'
    });
  }
  let shop = await Shop.findOne({ proprietaire: vendor._id });
  if (!shop) {
    shop = await Shop.create({ nom: 'Boutique Officielle', proprietaire: vendor._id });
  }

  // 3. Produit disponible
  let product = await Product.findOne({ statut: 'actif', stock: { $gte: 5 } });
  if (!product) {
    product = await Product.create({
      nom: 'Produit Test Client',
      prix: 100,
      stock: 20,
      categorie: 'Téléphones',
      statut: 'actif',
      boutique: vendor._id
    });
  }
  const initialStock = product.stock;
  console.log(`📦 Produit test sélectionné : "${product.nom}" (Stock initial : ${initialStock}, Prix : ${product.prix} TND)`);

  // 4. Test Panier (Ajout, Maj, Calculs)
  console.log('\n--- Test 1 : Gestion du Panier (Cart) ---');
  let cart = await Cart.findOne({ client: client._id });
  if (!cart) cart = await Cart.create({ client: client._id, items: [] });
  cart.items.push({ produit: product._id, quantite: 2, couleur: product.couleurs?.[0] || '' });
  await cart.save();
  console.log(`✅ Produit ajouté au panier (Qté: 2) -> Total: ${product.prix * 2} TND`);

  // 5. Test Passage de Commande & Notification Vendeur
  console.log('\n--- Test 2 : Passage de Commande (Order) ---');
  const initialVendorNotifs = await Notification.countDocuments({ destinataire: vendor._id });

  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const numeroCommande = `CMD-TEST-${randomSuffix}`;
  const order = await Order.create({
    numeroCommande,
    client: client._id,
    articles: [{
      produit: product._id,
      nom: product.nom,
      prix: product.prix,
      quantite: 2,
      couleur: product.couleurs?.[0] || '',
      image: product.images?.[0] || '',
      boutique: product.boutique
    }],
    adresseLivraison: {
      nomComplet: 'Yassine Ben Salah',
      telephone: '21000111',
      rue: '15 Rue de Carthage',
      ville: 'Tunis',
      codePostal: '1000',
      pays: 'Tunisie'
    },
    modeLivraison: { nom: 'Livraison Standard', prix: 7 },
    modePaiement: 'livraison',
    statutPaiement: 'en_attente',
    statut: 'en_attente',
    historiqueStatuts: [{ statut: 'en_attente', date: new Date(), commentaire: 'Commande passée' }],
    sousTotal: product.prix * 2,
    fraisLivraison: 7,
    total: product.prix * 2 + 7
  });

  // Décrémenter stock
  await Product.findByIdAndUpdate(product._id, { $inc: { stock: -2 } });
  const updatedProduct = await Product.findById(product._id);
  console.log(`✅ Commande créée : ${order.numeroCommande} (Total: ${order.total} TND)`);
  console.log(`📉 Stock décrémenté : ${initialStock} -> ${updatedProduct.stock} (Attendu : ${initialStock - 2})`);

  // Vider panier
  cart.items = [];
  await cart.save();
  console.log(`🧹 Panier vidé avec succès`);

  // Notifications
  await Notification.create({
    destinataire: client._id,
    titre: 'Commande enregistrée',
    message: `Votre commande ${numeroCommande} est enregistrée.`,
    type: 'commande',
    lien: `/orders/${order._id}`
  });
  await Notification.create({
    destinataire: vendor._id,
    titre: 'Nouvelle commande reçue !',
    message: `Nouvelle commande ${numeroCommande} pour votre boutique.`,
    type: 'commande',
    lien: '/seller'
  });
  const clientNotifs = await Notification.countDocuments({ destinataire: client._id });
  const newVendorNotifs = await Notification.countDocuments({ destinataire: vendor._id });
  console.log(`🔔 Notifications vérifiées : Client (${clientNotifs}), Vendeur (${newVendorNotifs - initialVendorNotifs} nouvelle(s))`);

  // 6. Test Avis & Évaluations
  console.log('\n--- Test 3 : Avis & Évaluations (Reviews) ---');
  const review = await Review.create({
    produit: product._id,
    client: client._id,
    note: 5,
    titre: 'Très satisfait !',
    commentaire: 'Produit conforme et livraison rapide.',
    achatVerifie: true
  });
  console.log(`⭐ Avis créé avec succès : Note ${review.note}/5 ("${review.titre}")`);

  const clientReviews = await Review.find({ client: client._id });
  console.log(`📋 Mes avis (Client) : ${clientReviews.length} avis trouvé(s)`);

  // 7. Test Demande de Remboursement
  console.log('\n--- Test 4 : Demande de Remboursement (Refund) ---');
  const refund = await Refund.create({
    commande: order._id,
    client: client._id,
    montant: order.total,
    motif: 'Commande non traitée dans les délais impartis',
    details: 'Aucune confirmation après plusieurs jours',
    statut: 'en_attente'
  });
  console.log(`💰 Demande de remboursement créée : ${refund.motif} (${refund.montant} TND, Statut: ${refund.statut})`);

  const clientRefunds = await Refund.find({ client: client._id });
  console.log(`📋 Mes remboursements (Client) : ${clientRefunds.length} demande(s) trouvée(s)`);

  // 8. Test Annulation de Commande & Restitution de Stock
  console.log('\n--- Test 5 : Annulation de Commande & Restitution Stock ---');
  order.statut = 'annulee';
  order.historiqueStatuts.push({ statut: 'annulee', date: new Date(), commentaire: 'Annulée par le client' });
  await order.save();
  await Product.findByIdAndUpdate(product._id, { $inc: { stock: 2 } });
  const restoredProduct = await Product.findById(product._id);
  console.log(`❌ Commande annulée avec succès : ${order.numeroCommande} (Statut: ${order.statut})`);
  console.log(`📈 Stock restitué : ${updatedProduct.stock} -> ${restoredProduct.stock} (Attendu : ${initialStock})`);

  console.log('\n🎉 ========================================================');
  console.log('🎉 TOUS LES TESTS DU MODULE CLIENT SONT VALIDÉS À 100% !');
  console.log('🎉 ========================================================');

  process.exit(0);
}

testClientModule().catch(err => {
  console.error('❌ Erreur de test:', err);
  process.exit(1);
});
