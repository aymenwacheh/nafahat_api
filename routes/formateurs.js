// nafahat_api/routes/formateurs.js
const express = require('express');
const router = express.Router();
const formateurController = require('../controllers/formateurController');

// Routes publiques
router.get('/', formateurController.getAllFormateurs);
router.get('/:id', formateurController.getFormateurById);

// Routes admin
router.post('/', formateurController.createFormateur);
router.put('/:id', formateurController.updateFormateur);
router.delete('/:id', formateurController.deleteFormateur);

module.exports = router;