const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const path = require('path');
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const refundRoutes = require('./routes/refundRoutes');
const shopRoutes = require('./routes/shopRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const stockRoutes = require('./routes/stockRoutes');
const statsRoutes = require('./routes/statsRoutes');
const adminRoutes = require('./routes/adminRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const reclamationRoutes = require('./routes/reclamationRoutes');

dotenv.config();
connectDB().catch((err) => {
  console.error('⚠️ Impossible d\'établir la connexion initiale avec MongoDB :', err.message);
  console.error('💡 Conseil : Vérifiez que l\'accès réseau 0.0.0.0/0 est bien activé dans MongoDB Atlas (Security > Network Access).');
});

const app = express();

app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: true }));

// Servir les images téléversées localement
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes API
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/refunds', refundRoutes);
app.use('/api/shops', shopRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/stocks', stockRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/reclamations', reclamationRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'API E-commerce active', status: 'OK' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Serveur lancé sur http://localhost:${PORT}`);
});