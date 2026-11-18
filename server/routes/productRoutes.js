const express = require('express');
const router = express.Router();
const {
  getProducts, getProduct, getMyProducts,
  createProduct, updateProduct, deleteProduct,
  updatePromotion
} = require('../controllers/productController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', getProducts);
router.get('/mine', protect, authorize('vendeur', 'admin'), getMyProducts);
router.get('/seller', protect, authorize('vendeur', 'admin'), getMyProducts);
router.post('/', protect, authorize('vendeur'), createProduct);

router.get('/:id', getProduct);
router.put('/:id', protect, authorize('vendeur', 'admin'), updateProduct);
router.put('/:id/promotion', protect, authorize('vendeur', 'admin'), updatePromotion);
router.delete('/:id', protect, authorize('vendeur', 'admin'), deleteProduct);

module.exports = router;