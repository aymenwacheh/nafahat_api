// nafahat_api/routes/duree.js
const express = require('express');
const router = express.Router();
const dureeController = require('../controllers/dureeController');

router.get('/', dureeController.getAllDuree);
router.get('/:id', dureeController.getDureeById);
router.post('/', dureeController.createDuree);
router.put('/:id', dureeController.updateDuree);
router.delete('/:id', dureeController.deleteDuree);

module.exports = router;