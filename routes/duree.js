// nafahat_api/routes/formations.js
const express = require('express');
const router = express.Router();
const formationController = require('../controllers/formationController');

router.get('/', formationController.getAllFormations);
router.get('/active', formationController.getActiveFormations);
router.get('/promos', formationController.getFormationsWithDiscount);
router.get('/categorie/:id', formationController.getFormationsByCategorie);
router.get('/admin/all', formationController.getAllFormationsAdmin);
router.get('/:id', formationController.getFormationById);
router.post('/', formationController.createFormation);
router.put('/:id', formationController.updateFormation);
router.delete('/:id', formationController.deleteFormation);
router.delete('/hard/:id', formationController.hardDeleteFormation);

module.exports = router;