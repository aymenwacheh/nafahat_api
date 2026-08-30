// nafahat_api/routes/formateurs.js
const express = require('express');
const router = express.Router();
const formateurController = require('../controllers/formateurController');

// ============================================================
// ROUTES PUBLIQUES
// ============================================================
router.get('/', formateurController.getAllFormateurs);
router.get('/:id', formateurController.getFormateurById);

// ============================================================
// ROUTES ADMIN
// ============================================================
router.post('/', formateurController.createFormateur);
router.put('/:id', formateurController.updateFormateur);
router.delete('/:id', formateurController.deleteFormateur);

// ============================================================
// ROUTE D'UPLOAD DE PHOTO
// ============================================================
router.post('/upload', formateurController.uploadFormateurPhoto);

module.exports = router;