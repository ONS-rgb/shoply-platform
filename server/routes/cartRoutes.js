const express = require('express');
const router = express.Router();
const { getCart, addToCart, updateQuantity, removeItem, clearCart } = require('../controllers/cartController');
const { protect, authorize } = require('../middleware/auth');

// Toutes les routes du panier : client connecté uniquement
router.use(protect, authorize('client'));

router.route('/')
  .get(getCart)
  .post(addToCart)
  .delete(clearCart);

router.route('/:itemId')
  .put(updateQuantity)
  .delete(removeItem);
module.exports = router;