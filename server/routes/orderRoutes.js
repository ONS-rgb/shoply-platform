const express = require('express');
const router = express.Router();
const {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder
} = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/auth');

// Toutes les routes de commande : client connecté
router.use(protect);

router.route('/')
  .post(authorize('client'), createOrder)
  .get(getMyOrders);

router.route('/:id')
  .get(getOrderById);

router.route('/:id/cancel')
  .put(cancelOrder);

module.exports = router;
