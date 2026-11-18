const express = require('express');
const router = express.Router();
const {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  getSellerOrders,
  updateSellerOrderStatus,
  cancelSellerOrder
} = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/auth');

// Toutes les routes de commande : utilisateur connecté
router.use(protect);

// Routes Vendeur (placées avant /:id)
router.get('/seller', authorize('vendeur', 'admin'), getSellerOrders);
router.put('/seller/:id/status', authorize('vendeur', 'admin'), updateSellerOrderStatus);
router.put('/seller/:id/cancel', authorize('vendeur', 'admin'), cancelSellerOrder);

router.route('/')
  .post(authorize('client'), createOrder)
  .get(getMyOrders);

router.route('/:id')
  .get(getOrderById);

router.route('/:id/cancel')
  .put(cancelOrder);

module.exports = router;
