const Category = require('../models/Category');
const Product = require('../models/Product');

// GET /api/categories : Liste de toutes les catégories avec le nombre réel de produits
exports.getCategories = async (req, res) => {
  try {
    const { search, actif } = req.query;
    const query = {};

    if (search && search.trim()) {
      query.$or = [
        { nom: { $regex: search.trim(), $options: 'i' } },
        { description: { $regex: search.trim(), $options: 'i' } }
      ];
    }

    if (actif !== undefined) {
      query.actif = actif === 'true';
    }

    const categories = await Category.find(query).sort({ nom: 1 }).lean();

    // Pour chaque catégorie, compter le nombre réel de produits associés dans la base
    const categoriesWithCount = await Promise.all(
      categories.map(async (cat) => {
        const nbProduits = await Product.countDocuments({
          categorie: cat.nom,
          archive: { $ne: true }
        });
        return {
          ...cat,
          nbProduits
        };
      })
    );

    res.json({
      success: true,
      count: categoriesWithCount.length,
      data: categoriesWithCount
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/categories/:id : Consulter les détails d'une catégorie et ses produits
exports.getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Catégorie non trouvée' });
    }

    const products = await Product.find({
      categorie: category.nom,
      archive: { $ne: true }
    }).select('nom prix stock images statut marque');

    res.json({
      success: true,
      data: {
        ...category.toObject(),
        nbProduits: products.length,
        produits: products
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/categories : Ajouter une nouvelle catégorie
exports.createCategory = async (req, res) => {
  try {
    const { nom, description, icone, image, actif } = req.body;

    if (!nom || !nom.trim()) {
      return res.status(400).json({ success: false, message: 'Le nom de la catégorie est obligatoire' });
    }

    const existing = await Category.findOne({
      nom: { $regex: new RegExp(`^${nom.trim()}$`, 'i') }
    });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Cette catégorie existe déjà' });
    }

    const category = await Category.create({
      nom: nom.trim(),
      description: description ? description.trim() : '',
      icone: icone ? icone.trim() : '📦',
      image: image || '',
      actif: actif !== undefined ? Boolean(actif) : true
    });

    res.status(201).json({
      success: true,
      message: 'Catégorie créée avec succès',
      data: category
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/categories/:id : Modifier une catégorie
exports.updateCategory = async (req, res) => {
  try {
    const { nom, description, icone, image, actif } = req.body;
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ success: false, message: 'Catégorie non trouvée' });
    }

    const oldName = category.nom;

    if (nom && nom.trim().toLowerCase() !== category.nom.toLowerCase()) {
      const existing = await Category.findOne({
        _id: { $ne: category._id },
        nom: { $regex: new RegExp(`^${nom.trim()}$`, 'i') }
      });
      if (existing) {
        return res.status(400).json({ success: false, message: 'Une autre catégorie porte déjà ce nom' });
      }
      category.nom = nom.trim();
    }

    if (description !== undefined) category.description = description.trim();
    if (icone !== undefined) category.icone = icone.trim();
    if (image !== undefined) category.image = image;
    if (actif !== undefined) category.actif = Boolean(actif);

    await category.save();

    // Si le nom a changé, mettre à jour les produits associés pour garder la cohérence
    if (nom && nom.trim() !== oldName) {
      await Product.updateMany(
        { categorie: oldName },
        { $set: { categorie: nom.trim() } }
      );
    }

    res.json({
      success: true,
      message: 'Catégorie modifiée avec succès',
      data: category
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/categories/:id : Supprimer une catégorie avec vérification d'intégrité
exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Catégorie non trouvée' });
    }

    // Vérifier les relations entre les catégories et les produits
    const linkedProductsCount = await Product.countDocuments({
      categorie: category.nom,
      archive: { $ne: true }
    });

    if (linkedProductsCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Impossible de supprimer cette catégorie car ${linkedProductsCount} produit(s) y sont rattaché(s). Veuillez d'abord réassigner ou supprimer ces produits.`
      });
    }

    await Category.findByIdAndDelete(category._id);

    res.json({
      success: true,
      message: `La catégorie "${category.nom}" a été supprimée avec succès.`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
