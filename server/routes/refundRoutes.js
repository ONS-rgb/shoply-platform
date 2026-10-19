const express = require('express');
const router = express.Router();
const {
  createRefund,
  getMyRefunds,
  getRefundById
} = require('../controllers/refundController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.post('/', authorize('client'), createRefund);
router.get('/my', getMyRefunds);
router.get('/:id', getRefundById);

module.exports = router;
