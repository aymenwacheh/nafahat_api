// nafahat_api/routes/formations.js
const express = require('express');
const router = express.Router();
const formationController = require('../controllers/formationController');

// Routes publiques
router.get('/', formationController.getAllFormations);
router.get('/active', formationController.getActiveFormations);
router.get('/promos', formationController.getFormationsWithDiscount);
router.get('/categorie/:id', formationController.getFormationsByCategorie);

// Routes admin (protégées - à sécuriser avec JWT)
router.get('/admin/all', formationController.getAllFormationsAdmin); // ✅ Nouvelle route
router.get('/:id', formationController.getFormationById);
router.post('/', formationController.createFormation);
router.put('/:id', formationController.updateFormation);
router.delete('/:id', formationController.deleteFormation);
router.delete('/hard/:id', formationController.hardDeleteFormation); // ✅ Suppression définitive

module.exports = router;