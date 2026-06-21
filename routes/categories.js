// nafahat_api/routes/categories.js
const express = require('express');
const router = express.Router();
const categorieController = require('../controllers/categorieController');

// =============================================
//               CATÉGORIES
// =============================================
router.get('/', categorieController.getAllCategories);
router.get('/:id', categorieController.getCategorieById);
router.post('/', categorieController.createCategorie);
router.put('/:id', categorieController.updateCategorie);
router.delete('/:id', categorieController.deleteCategorie);

// =============================================
//             SOUS-CATÉGORIES
// =============================================
router.get('/sous-categories', categorieController.getAllSousCategories);
router.get('/sous-categories/:id', categorieController.getSousCategorieById);
router.get('/:idCategorie/sous-categories', categorieController.getSousCategoriesByCategorie);
router.post('/sous-categories', categorieController.createSousCategorie);
router.put('/sous-categories/:id', categorieController.updateSousCategorie);
router.delete('/sous-categories/:id', categorieController.deleteSousCategorie);

module.exports = router;