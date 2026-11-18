const express = require('express');
const router = express.Router();
const {
  createRefund,
  getMyRefunds,
  getRefundById,
  getSellerRefunds,
  processSellerRefund
} = require('../controllers/refundController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

// Routes Vendeur (placées avant /:id)
router.get('/seller', authorize('vendeur', 'admin'), getSellerRefunds);
router.put('/seller/:id/process', authorize('vendeur', 'admin'), processSellerRefund);

router.post('/', authorize('client'), createRefund);
router.get('/my', getMyRefunds);
router.get('/:id', getRefundById);

module.exports = router;
