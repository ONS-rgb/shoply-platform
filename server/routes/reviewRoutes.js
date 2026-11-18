const express = require('express');
const router = express.Router();
const {
  getProductReviews,
  getMyReviews,
  addReview,
  updateReview,
  deleteReview,
  getSellerReviews,
  replyToReview,
  deleteReviewReply
} = require('../controllers/reviewController');
const { protect, authorize } = require('../middleware/auth');

// Avis d'un produit (public)
router.get('/product/:productId', getProductReviews);

// Mes avis (Client connecté - placé avant /:id)
router.get('/my', protect, authorize('client'), getMyReviews);

// Routes Vendeur (placées avant /:id)
router.get('/seller', protect, authorize('vendeur', 'admin'), getSellerReviews);
router.post('/:id/reply', protect, authorize('vendeur', 'admin'), replyToReview);
router.delete('/:id/reply', protect, authorize('vendeur', 'admin'), deleteReviewReply);

// Ajouter un avis (Client connecté)
router.post('/product/:productId', protect, authorize('client'), addReview);

// Modifier ou supprimer son avis
router.route('/:id')
  .put(protect, updateReview)
  .delete(protect, deleteReview);

module.exports = router;
