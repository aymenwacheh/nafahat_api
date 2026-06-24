// nafahat_api/routes/typeFormation.js
const express = require('express');
const router = express.Router();
const typeFormationController = require('../controllers/typeFormationController');

router.get('/', typeFormationController.getAllTypesFormation);
router.get('/:id', typeFormationController.getTypeFormationById);
router.post('/', typeFormationController.createTypeFormation);
router.put('/:id', typeFormationController.updateTypeFormation);
router.delete('/:id', typeFormationController.deleteTypeFormation);

module.exports = router;