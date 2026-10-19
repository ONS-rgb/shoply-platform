const express = require('express');
const router = express.Router();
const {
  register, login, getMe, updateProfile, changePassword,
  addAddress, updateAddress, deleteAddress
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/me', protect, updateProfile);
router.put('/password', protect, changePassword);

// Gestion des adresses de livraison (Amazon-style)
router.post('/addresses', protect, addAddress);
router.put('/addresses/:id', protect, updateAddress);
router.delete('/addresses/:id', protect, deleteAddress);

module.exports = router;