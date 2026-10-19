const express = require('express');
const router = express.Router();
const {
  getProductReviews,
  addReview,
  updateReview,
  deleteReview
} = require('../controllers/reviewController');
const { protect, authorize } = require('../middleware/auth');

// Avis d'un produit (public)
router.get('/product/:productId', getProductReviews);

// Ajouter un avis (Client connecté)
router.post('/product/:productId', protect, authorize('client'), addReview);

// Modifier ou supprimer son avis
router.route('/:id')
  .put(protect, updateReview)
  .delete(protect, deleteReview);

module.exports = router;
