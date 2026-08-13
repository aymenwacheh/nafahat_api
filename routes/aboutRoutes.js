// nafahat_api/routes/aboutRoutes.js
const express = require('express');
const router = express.Router();
const aboutController = require('../controllers/aboutController');
// const { protect, authorize } = require('../middleware/auth'); // Si vous n'avez pas ce middleware, commentez

// Routes publiques
router.get('/', aboutController.getAbout);
router.get('/exists', aboutController.exists);

// Routes protégées (admin uniquement) - si vous n'avez pas le middleware, utilisez ces routes sans protection
router.post('/', aboutController.saveAbout);
router.put('/:id', aboutController.saveAbout);
router.delete('/:id', aboutController.deleteAbout);

module.exports = router;