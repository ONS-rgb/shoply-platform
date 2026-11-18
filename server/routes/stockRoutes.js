const express = require('express');
const router = express.Router();
const {
  getSellerStocks,
  updateProductStock
} = require('../controllers/stockController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.use(authorize('vendeur', 'admin'));

router.get('/seller', getSellerStocks);
router.put('/seller/:productId', updateProductStock);

module.exports = router;
