// nafahat_api/routes/categories.js
const express = require('express');
const router = express.Router();
const categorieController = require('../controllers/categorieController');

// =============================================
//             SOUS-CATÉGORIES (routes spécifiques)
// =============================================
// Elles doivent être placées avant les routes avec paramètres
router.get('/sous-categories', categorieController.getAllSousCategories);
router.post('/sous-categories', categorieController.createSousCategorie);
router.get('/sous-categories/:id', categorieController.getSousCategorieById);
router.put('/sous-categories/:id', categorieController.updateSousCategorie);
router.delete('/sous-categories/:id', categorieController.deleteSousCategorie);

// Récupérer les sous-catégories d'une catégorie spécifique
router.get('/:idCategorie/sous-categories', categorieController.getSousCategoriesByCategorie);

// =============================================
//               CATÉGORIES
// =============================================
router.get('/', categorieController.getAllCategories);
router.get('/:id', categorieController.getCategorieById);
router.post('/', categorieController.createCategorie);
router.put('/:id', categorieController.updateCategorie);
router.delete('/:id', categorieController.deleteCategorie);

module.exports = router;