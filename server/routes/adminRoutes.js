const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const admin = require('../controllers/adminController');

// 🔒 Toutes les routes de ce routeur sont réservées strictement au rôle 'admin'
router.use(protect);
router.use(authorize('admin'));

// 1. Dashboard & Statistiques
router.get('/stats', admin.getDashboardStats);
router.get('/charts', admin.getDashboardCharts);
router.get('/financial-stats', admin.getFinancialStats);

// 2. Gestion des Clients
router.get('/clients', admin.getClients);
router.get('/clients/:id', admin.getClientById);
router.post('/clients', admin.createClient);
router.put('/clients/:id', admin.updateClient);
router.delete('/clients/:id', admin.deleteClient);

// 3. Gestion des Vendeurs
router.get('/vendors', admin.getVendors);
router.get('/vendors/:id', admin.getVendorById);
router.post('/vendors', admin.createVendor);
router.delete('/vendors/:id', admin.deleteVendor);

// 4. Gestion des Boutiques
router.get('/shops', admin.getShops);
router.get('/shops/:id', admin.getShopById);
router.put('/shops/:id/status', admin.updateShopStatus);
router.delete('/shops/:id', admin.deleteShop);

// 5. Gestion des Produits
router.get('/products', admin.getProducts);
router.get('/products/:id', admin.getProductById);
router.post('/products', admin.createProduct);
router.put('/products/:id', admin.updateProduct);
router.delete('/products/:id', admin.deleteProduct);

// 6. Gestion des Paiements
router.get('/payments', admin.getPayments);
router.get('/payments/:id', admin.getPaymentById);
router.put('/payments/:id/validate', admin.validatePayment);

// 7. Gestion des Commissions
router.get('/commissions', admin.getCommissions);
router.get('/commissions/stats', admin.getCommissionStats);

// 8. Gestion des Réclamations
router.get('/reclamations', admin.getReclamations);
router.get('/reclamations/:id', admin.getReclamationById);
router.put('/reclamations/:id/status', admin.updateReclamationStatus);

// 9. Gestion des Remboursements
router.get('/refunds', admin.getRefunds);
router.get('/refunds/:id', admin.getRefundById);
router.put('/refunds/:id/process', admin.processRefund);

module.exports = router;
