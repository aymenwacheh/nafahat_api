// nafahat_api/routes/cibles.js
const express = require('express');
const router = express.Router();
const cibleController = require('../controllers/cibleController');

// Routes CRUD
router.get('/', cibleController.getAllCibles);
router.get('/:id', cibleController.getCibleById);
router.post('/', cibleController.createCible);
router.put('/:id', cibleController.updateCible);
router.delete('/:id', cibleController.deleteCible);

module.exports = router;