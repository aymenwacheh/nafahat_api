// nafahat_api/routes/bullRoutes.js
const express = require('express');
const router = express.Router();
const bullController = require('../controllers/bullController');

console.log('✅ bullRoutes chargé');

// ============================================================
// ROUTES BULLS - L'ORDRE EST TRÈS IMPORTANT !
// ============================================================

// 1️⃣ ROUTES SPÉCIFIQUES (sans paramètres)
router.get('/available-targets', bullController.getAvailableTargets);
router.get('/default', bullController.getDefaultBulls);
router.post('/reorder', bullController.reorderBulls);

// 2️⃣ ROUTES PRINCIPALES
router.get('/', bullController.getBulls);
router.post('/', bullController.createBull);

// 3️⃣ ROUTES AVEC PARAMÈTRES (:id)
router.get('/:id', bullController.getBullById);
router.put('/:id', bullController.updateBull);
router.delete('/:id', bullController.deleteBull);

module.exports = router;