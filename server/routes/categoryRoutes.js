const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const categoryController = require('../controllers/categoryController');

// Routes publiques
router.get('/', categoryController.getCategories);
router.get('/:id', categoryController.getCategoryById);

// Routes réservées à l'administrateur
router.post('/', protect, authorize('admin'), categoryController.createCategory);
router.put('/:id', protect, authorize('admin'), categoryController.updateCategory);
router.delete('/:id', protect, authorize('admin'), categoryController.deleteCategory);

module.exports = router;
