const express = require('express');
const router = express.Router();
const { getSellerStats } = require('../controllers/statsController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.use(authorize('vendeur', 'admin'));

router.get('/seller', getSellerStats);

module.exports = router;
