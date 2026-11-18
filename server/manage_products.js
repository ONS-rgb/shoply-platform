const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');
const Shop = require('./models/Shop');
const Product = require('./models/Product');

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    // 1. Trouver les comptes de Doua Brahem
    const douaUsers = await User.find({
      $or: [
        { email: /douabrahem/i },
        { nom: /doua/i, prenom: /brahem/i },
        { nom: /brahem/i, prenom: /doua/i }
      ]
    });

    console.log('Comptes Doua Brahem trouvés :', douaUsers.map(u => ({ id: u._id, nom: u.nom, prenom: u.prenom, email: u.email })));

    // Compte principal Doua Brahem
    let mainDoua = douaUsers.find(u => u.email === 'douabrahem123@gmail.com') || (douaUsers.length > 0 ? douaUsers[0] : null);
    if (!mainDoua) {
      const bcrypt = require('bcryptjs');
      mainDoua = await User.create({
        nom: 'Brahem',
        prenom: 'Doua',
        email: 'douabrahem123@gmail.com',
        motDePasse: await bcrypt.hash('password123', 10),
        role: 'vendeur',
        telephone: '20123456'
      });
      douaUsers.push(mainDoua);
      console.log('✅ Compte Doua Brahem créé automatiquement pour la boutique !');
    }

    // Harmoniser les noms pour un affichage propre "Doua Brahem"
    for (const u of douaUsers) {
      u.prenom = 'Doua';
      u.nom = 'Brahem';
      await u.save();
    }
    console.log(`✅ Profils Doua Brahem harmonisés ("Doua Brahem").`);

    const douaIds = douaUsers.map(u => u._id);

    // 2. Boutique officielle de Doua Brahem
    let shop = await Shop.findOne({ proprietaire: { $in: douaIds } });
    if (!shop) {
      shop = await Shop.create({
        nom: 'Boutique Doua Brahem',
        description: 'La boutique officielle de Doua Brahem - High-Tech, Téléphonie, Informatique et Mode',
        proprietaire: mainDoua._id,
        telephone: mainDoua.telephone || '20123456',
        email: mainDoua.email,
        adresse: {
          rue: 'Avenue Habib Bourguiba',
          ville: 'Tunis',
          codePostal: '1000',
          pays: 'Tunisie'
        },
        statut: 'active'
      });
      console.log(`✅ Boutique créée pour Doua Brahem : "${shop.nom}"`);
    } else {
      shop.nom = 'Boutique Doua Brahem';
      shop.description = 'La boutique officielle de Doua Brahem - High-Tech, Téléphonie, Informatique et Mode';
      shop.statut = 'active';
      await shop.save();
      console.log(`✅ Boutique existante mise à jour : "${shop.nom}"`);
    }

    // 3. Supprimer les produits qui n'appartiennent PAS à Doua Brahem
    // (par exemple ceux appartenant à Ouhaa Barouni ou sans boutique comme les Montres de test)
    const deleteResult = await Product.deleteMany({
      $or: [
        { boutique: { $nin: douaIds } },
        { boutique: { $exists: false } },
        { boutique: null },
        { nom: { $regex: /^Montre Connectée Pro/i } }
      ],
      // Ne pas supprimer si c'est un produit de Doua
      _id: {
        $nin: (await Product.find({ boutique: { $in: douaIds }, nom: { $not: /^Montre Connectée Pro/i } })).map(p => p._id)
      }
    });
    console.log(`🗑️ Produits n'appartenant pas à Doua Brahem supprimés : ${deleteResult.deletedCount}`);

    // Reclassifier tous les produits restants de Doua sous son compte principal
    await Product.updateMany(
      { boutique: { $in: douaIds } },
      { boutique: mainDoua._id, statut: 'actif', archive: false }
    );

    // 4. Ajouter de nouveaux produits avec de belles photos haute définition pour Doua Brahem
    const newProducts = [
      {
        nom: 'iPhone 15 Pro Max 256Go Titane',
        description: 'Écran Super Retina XDR 6.7 pouces avec ProMotion. Puce A17 Pro révolutionnaire. Système photo professionnel 48 Mpx avec téléobjectif 5x et boîtier en titane ultra-résistant et léger.',
        prix: 4350,
        stock: 8,
        categorie: 'Téléphones',
        marque: 'Apple',
        couleurs: ['Titane Naturel', 'Bleu Titane', 'Noir Sidéral'],
        variantesCouleurs: [
          { couleur: 'Titane Naturel', image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600' },
          { couleur: 'Bleu Titane', image: 'https://images.unsplash.com/photo-1695048133021-995166fef464?w=600' },
          { couleur: 'Noir Sidéral', image: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=600' }
        ],
        images: [
          'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600',
          'https://images.unsplash.com/photo-1695048133021-995166fef464?w=600',
          'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=600'
        ],
        caracteristiques: [
          { nom: 'Écran', valeur: '6.7 pouces OLED Super Retina XDR' },
          { nom: 'Processeur', valeur: 'Apple A17 Pro (3 nm)' },
          { nom: 'Stockage', valeur: '256 Go' },
          { nom: 'Batterie', valeur: 'Jusqu\'à 29h d\'autonomie' }
        ],
        promotion: {
          active: true,
          pourcentage: 10,
          prixPromo: 3915,
          dateDebut: new Date(),
          dateFin: new Date(Date.now() + 15 * 24 * 3600 * 1000)
        },
        seuilAlerteStock: 3,
        boutique: mainDoua._id,
        statut: 'actif'
      },
      {
        nom: 'Samsung Galaxy S24 Ultra 5G AI',
        description: 'Le summum de l\'innovation Galaxy avec Galaxy AI intégrée. Châssis en titane résistant, S-Pen intégré, capteur photo 200 Mpx avec zoom optique haute résolution et autonomie longue durée.',
        prix: 3990,
        stock: 12,
        categorie: 'Téléphones',
        marque: 'Samsung',
        couleurs: ['Gris Titane', 'Noir', 'Violet'],
        variantesCouleurs: [
          { couleur: 'Gris Titane', image: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=600' },
          { couleur: 'Noir', image: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600' }
        ],
        images: [
          'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=600',
          'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600'
        ],
        caracteristiques: [
          { nom: 'Écran', valeur: '6.8 pouces Dynamic AMOLED 2X 120Hz' },
          { nom: 'Appareil Photo', valeur: '200 Mpx + 50 Mpx + 12 Mpx + 10 Mpx' },
          { nom: 'Mémoire RAM', valeur: '12 Go' },
          { nom: 'Stockage', valeur: '512 Go' }
        ],
        promotion: {
          active: true,
          pourcentage: 15,
          prixPromo: 3391.50,
          dateDebut: new Date()
        },
        seuilAlerteStock: 4,
        boutique: mainDoua._id,
        statut: 'actif'
      },
      {
        nom: 'MacBook Pro 16" Apple M3 Max 36Go RAM',
        description: 'La station de travail portable ultime pour les créateurs et développeurs exigeants. Puce Apple M3 Max avec CPU 14 cœurs et GPU 30 cœurs, écran Liquid Retina XDR époustouflant et autonomie jusqu\'à 22 heures.',
        prix: 8250,
        stock: 5,
        categorie: 'Ordinateurs',
        marque: 'Apple',
        couleurs: ['Noir Sidéral', 'Argent'],
        variantesCouleurs: [
          { couleur: 'Noir Sidéral', image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600' },
          { couleur: 'Argent', image: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=600' }
        ],
        images: [
          'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600',
          'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=600'
        ],
        caracteristiques: [
          { nom: 'Processeur', valeur: 'Apple M3 Max 14 cœurs' },
          { nom: 'Mémoire Unifiée', valeur: '36 Go RAM' },
          { nom: 'Disque SSD', valeur: '1 To NVMe ultra-rapide' },
          { nom: 'Écran', valeur: '16.2 pouces Liquid Retina XDR 120Hz' }
        ],
        seuilAlerteStock: 2,
        boutique: mainDoua._id,
        statut: 'actif'
      },
      {
        nom: 'Dell XPS 15 InfinityEdge OLED',
        description: 'Design premium en aluminium usiné et fibre de carbone. Écran tactile OLED 3.5K éclatant, processeur Intel Core i7 13ème génération, carte graphique NVIDIA RTX 4060 et son immersif Waves MaxxAudio.',
        prix: 4890,
        stock: 7,
        categorie: 'Ordinateurs',
        marque: 'Dell',
        couleurs: ['Platine', 'Gris'],
        images: [
          'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=600',
          'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600'
        ],
        caracteristiques: [
          { nom: 'Processeur', valeur: 'Intel Core i7-13700H 14 cœurs' },
          { nom: 'Carte Graphique', valeur: 'NVIDIA GeForce RTX 4060 8Go' },
          { nom: 'RAM', valeur: '32 Go DDR5' },
          { nom: 'Écran', valeur: '15.6 pouces OLED 3.5K Tactile' }
        ],
        promotion: {
          active: true,
          pourcentage: 12,
          prixPromo: 4303.20,
          dateDebut: new Date()
        },
        seuilAlerteStock: 3,
        boutique: mainDoua._id,
        statut: 'actif'
      },
      {
        nom: 'Casque Sans Fil Sony WH-1000XM5 Noise Cancelling',
        description: 'La référence absolue de la réduction de bruit active du marché avec deux processeurs et 8 microphones. Qualité audio haute résolution exceptionnelle, appels ultra-clairs et jusqu\'à 30 heures d\'autonomie.',
        prix: 980,
        stock: 14,
        categorie: 'Téléphones',
        marque: 'Sony',
        couleurs: ['Noir', 'Argent'],
        variantesCouleurs: [
          { couleur: 'Noir', image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600' },
          { couleur: 'Argent', image: 'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=600' }
        ],
        images: [
          'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600',
          'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=600'
        ],
        caracteristiques: [
          { nom: 'Réduction de Bruit', valeur: 'Active intelligente HD QN1' },
          { nom: 'Autonomie', valeur: '30 heures avec charge rapide' },
          { nom: 'Connectivité', valeur: 'Bluetooth 5.2 Multipoint' }
        ],
        promotion: {
          active: true,
          pourcentage: 20,
          prixPromo: 784,
          dateDebut: new Date()
        },
        seuilAlerteStock: 5,
        boutique: mainDoua._id,
        statut: 'actif'
      },
      {
        nom: 'Apple Watch Ultra 2 GPS + Cellular 49mm',
        description: 'L\'Apple Watch la plus robuste et la plus performante. Boîtier en titane ultra-résistant de 49 mm, écran Retina le plus lumineux jamais conçu, GPS double fréquence haute précision et jusqu\'à 72h d\'autonomie.',
        prix: 2690,
        stock: 9,
        categorie: 'Sport',
        marque: 'Apple',
        couleurs: ['Titane Naturel', 'Orange', 'Bleu'],
        variantesCouleurs: [
          { couleur: 'Titane Naturel', image: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=600' },
          { couleur: 'Orange', image: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=600' }
        ],
        images: [
          'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=600',
          'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=600'
        ],
        caracteristiques: [
          { nom: 'Boîtier', valeur: '49 mm Titane Aérospatial' },
          { nom: 'Étanchéité', valeur: '100 m (Norme plongée EN13319)' },
          { nom: 'Autonomie', valeur: 'Jusqu\'à 72 heures en mode économie' }
        ],
        promotion: {
          active: true,
          pourcentage: 10,
          prixPromo: 2421,
          dateDebut: new Date()
        },
        seuilAlerteStock: 3,
        boutique: mainDoua._id,
        statut: 'actif'
      },
      {
        nom: 'Sweat à Capuche Nike Sportswear Club Fleece',
        description: 'Confort classique au quotidien en molleton doux brossé à l\'intérieur. Coupe standard décontractée avec capuche à cordon de serrage et poche kangourou pratique.',
        prix: 195,
        stock: 25,
        categorie: 'Vêtements',
        marque: 'Nike',
        couleurs: ['Noir', 'Gris', 'Bleu'],
        variantesCouleurs: [
          { couleur: 'Noir', image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600' },
          { couleur: 'Gris', image: 'https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=600' }
        ],
        images: [
          'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600',
          'https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=600'
        ],
        caracteristiques: [
          { nom: 'Matière', valeur: '80% Coton, 20% Polyester' },
          { nom: 'Entretien', valeur: 'Lavable en machine à 30°' },
          { nom: 'Coupe', valeur: 'Standard fit confortable' }
        ],
        promotion: {
          active: true,
          pourcentage: 20,
          prixPromo: 156,
          dateDebut: new Date()
        },
        seuilAlerteStock: 5,
        boutique: mainDoua._id,
        statut: 'actif'
      },
      {
        nom: 'Machine à Café Espresso Automatique DeLonghi Magnifica S',
        description: 'Savourez un espresso parfait grain par grain chez vous. Broyeur en acier conique avec 13 réglages de mouture, buse vapeur Cappuccino System pour une mousse crémeuse et entretien simple.',
        prix: 1390,
        stock: 6,
        categorie: 'Maison',
        marque: 'DeLonghi',
        couleurs: ['Noir', 'Argent'],
        images: [
          'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=600',
          'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600'
        ],
        caracteristiques: [
          { nom: 'Pression Pompe', valeur: '15 Bars' },
          { nom: 'Capacité Réservoir', valeur: '1.8 Litre' },
          { nom: 'Personnalisation', valeur: 'Arôme, longueur et température réglables' }
        ],
        seuilAlerteStock: 2,
        boutique: mainDoua._id,
        statut: 'actif'
      }
    ];

    for (const pData of newProducts) {
      const p = await Product.create(pData);
      console.log(`✨ Produit créé avec succès : "${p.nom}" (${p.categorie}) - ${p.prix} TND`);
    }

    // 5. Afficher l'inventaire final
    const finalProducts = await Product.find({ archive: { $ne: true } }).populate('boutique', 'nom prenom');
    console.log(`\n📋 INVENTAIRE FINAL DU CATALOGUE (${finalProducts.length} produits) :`);
    finalProducts.forEach(p => {
      console.log(` - [${p.categorie}] ${p.nom} : ${p.prix} TND (Vendu par: ${p.boutique?.prenom} ${p.boutique?.nom}) - Photos: ${p.images?.length}`);
    });

    console.log('\n🎉 MISE À JOUR TERMINÉE AVEC SUCCÈS !');
    process.exit(0);
  } catch (err) {
    console.error('❌ Erreur :', err);
    process.exit(1);
  }
}

run();
