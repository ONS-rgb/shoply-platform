const mongoose = require('mongoose');
require('dotenv').config();

async function testConnection() {
  console.log('⏳ Test de connexion à MongoDB Atlas en cours...');
  console.log(`🔗 URI : ${process.env.MONGODB_URI}`);

  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000
    });
    console.log(`\n✅ SUCCÈS ! Connecté à MongoDB Atlas avec succès.`);
    console.log(`🖥️  Hôte : ${conn.connection.host}`);
    console.log(`📦 Base : ${conn.connection.name}`);

    // Vérifier les collections
    const collections = await conn.connection.db.listCollections().toArray();
    console.log(`\n📂 Collections trouvées (${collections.length}) :`);
    for (const col of collections) {
      const count = await conn.connection.db.collection(col.name).countDocuments();
      console.log(`   - ${col.name} : ${count} document(s)`);
    }

    process.exit(0);
  } catch (error) {
    console.error(`\n❌ ÉCHEC DE CONNEXION :`);
    if (error.message.includes('whitelist') || error.message.includes('SSL') || error.message.includes('tlsv1')) {
      console.error('👉 Cause : L\'adresse IP n\'est pas encore active dans MongoDB Atlas (Network Access).');
      console.error('👉 Solution : Allez sur cloud.mongodb.com -> Network Access -> Add IP Address -> Allow Access From Anywhere (0.0.0.0/0).');
    } else if (error.message.includes('Authentication failed') || error.message.includes('bad auth')) {
      console.error('👉 Cause : Le nom d\'utilisateur ou le mot de passe dans le .env est incorrect.');
      console.error('👉 Solution : Allez sur cloud.mongodb.com -> Database Access -> Database Users pour vérifier votre utilisateur ou modifier son mot de passe.');
    } else {
      console.error(error.message);
    }
    process.exit(1);
  }
}

testConnection();
