const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    console.log('⏳ Connexion à MongoDB en cours...');
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`✅ MongoDB Connecté: ${conn.connection.host}`);
    console.log(`📦 Base de données: ${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`❌ ERREUR DB: ${error.message}`);
    throw error;
  }
};

module.exports = connectDB;