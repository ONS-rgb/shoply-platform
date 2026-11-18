const express = require('express');
const router = express.Router();
const {
  getShops,
  getShopById,
  getMyShop,
  createShop,
  updateMyShop,
  updateShopStatus
} = require('../controllers/shopController');
const { protect, authorize } = require('../middleware/auth');

// Routes publiques
router.get('/', getShops);

// Routes privées Vendeur
router.get('/mine', protect, authorize('vendeur', 'admin'), getMyShop);
router.post('/', protect, authorize('vendeur', 'admin'), createShop);
router.put('/mine', protect, authorize('vendeur', 'admin'), updateMyShop);
router.put('/mine/status', protect, authorize('vendeur', 'admin'), updateShopStatus);

// Détail public
router.get('/:id', getShopById);

module.exports = router;
