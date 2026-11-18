const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const Shop = require('../models/Shop');

async function createAccounts() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connecté à MongoDB');

  // 1. COMPTE CLIENT
  const clientEmail = 'client@shoply.tn';
  const clientPass = 'Client123456!';
  const hashedClientPass = await bcrypt.hash(clientPass, 12);

  let client = await User.findOne({ email: clientEmail });
  if (client) {
    client.motDePasse = hashedClientPass;
    client.role = 'client';
    client.actif = true;
    client.nom = 'Ben Salah';
    client.prenom = 'Yassine';
    client.telephone = '+216 21 123 456';
    await client.save();
    console.log(`✅ Compte CLIENT mis à jour : ${clientEmail} / ${clientPass}`);
  } else {
    client = await User.create({
      nom: 'Ben Salah',
      prenom: 'Yassine',
      email: clientEmail,
      motDePasse: hashedClientPass,
      role: 'client',
      telephone: '+216 21 123 456',
      actif: true,
      adresse: {
        rue: '15 Rue de Carthage',
        ville: 'Tunis',
        codePostal: '1000',
        pays: 'Tunisie'
      }
    });
    console.log(`✅ Compte CLIENT créé : ${clientEmail} / ${clientPass}`);
  }

  // 2. COMPTE VENDEUR
  const vendorEmail = 'vendeur@shoply.tn';
  const vendorPass = 'Vendeur123456!';
  const hashedVendorPass = await bcrypt.hash(vendorPass, 12);

  let vendor = await User.findOne({ email: vendorEmail });
  if (vendor) {
    vendor.motDePasse = hashedVendorPass;
    vendor.role = 'vendeur';
    vendor.actif = true;
    vendor.nom = 'Trabelsi';
    vendor.prenom = 'Karim';
    vendor.telephone = '+216 25 987 654';
    await vendor.save();
    console.log(`✅ Compte VENDEUR mis à jour : ${vendorEmail} / ${vendorPass}`);
  } else {
    vendor = await User.create({
      nom: 'Trabelsi',
      prenom: 'Karim',
      email: vendorEmail,
      motDePasse: hashedVendorPass,
      role: 'vendeur',
      telephone: '+216 25 987 654',
      actif: true,
      adresse: {
        rue: 'Avenue Habib Bourguiba',
        ville: 'Sousse',
        codePostal: '4000',
        pays: 'Tunisie'
      }
    });
    console.log(`✅ Compte VENDEUR créé : ${vendorEmail} / ${vendorPass}`);
  }

  // S'assurer que le vendeur a une boutique active
  let shop = await Shop.findOne({ proprietaire: vendor._id });
  if (!shop) {
    shop = await Shop.create({
      nom: 'Tech & Mode Express',
      description: 'Boutique officielle de Karim Trabelsi - Électronique, high-tech et mode',
      proprietaire: vendor._id,
      telephone: vendor.telephone,
      email: vendorEmail,
      statut: 'active',
      adresse: {
        rue: 'Avenue Habib Bourguiba',
        ville: 'Sousse',
        codePostal: '4000',
        pays: 'Tunisie'
      }
    });
    console.log(`🏪 Boutique du vendeur créée : "${shop.nom}"`);
  }

  // 3. COMPTE ADMIN
  const adminEmail = 'admin@shoply.tn';
  const adminPass = 'Admin123456!';
  const hashedAdminPass = await bcrypt.hash(adminPass, 12);

  let admin = await User.findOne({ email: adminEmail });
  if (admin) {
    admin.motDePasse = hashedAdminPass;
    admin.role = 'admin';
    admin.actif = true;
    admin.nom = 'Admin';
    admin.prenom = 'Shoply';
    admin.telephone = '+216 71 000 000';
    await admin.save();
    console.log(`✅ Compte ADMIN mis à jour : ${adminEmail} / ${adminPass}`);
  } else {
    admin = await User.create({
      nom: 'Admin',
      prenom: 'Shoply',
      email: adminEmail,
      motDePasse: hashedAdminPass,
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
    console.log(`✅ Compte ADMIN créé : ${adminEmail} / ${adminPass}`);
  }

  console.log('\n🎉 Les 3 comptes sont prêts à l\'emploi !');
  process.exit(0);
}

createAccounts().catch(err => {
  console.error('Erreur:', err);
  process.exit(1);
});
