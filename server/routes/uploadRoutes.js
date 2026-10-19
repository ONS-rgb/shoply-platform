const express = require('express');
const router = express.Router();
const { uploadImage } = require('../controllers/uploadController');
const { protect } = require('../middleware/auth');

// Téléversement d'image réservé aux utilisateurs connectés
router.post('/', protect, uploadImage);

module.exports = router;
