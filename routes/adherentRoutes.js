const express = require('express');
const router = express.Router();
const adherentController = require('../controllers/adherentController');

// ---- Routes d'inscription ----
router.post('/inscrire', adherentController.inscrireAdherent);

// ---- Routes d'authentification ----
router.post('/login', adherentController.login);
router.post('/:id/reset-password', adherentController.resetPassword);

// ---- Routes de gestion des adhérents ----
router.get('/', adherentController.getAdherents);
router.get('/:id', adherentController.getAdherentById);
router.get('/:id/credentials', adherentController.getAdherentCredentials);
router.put('/:id', adherentController.updateAdherent);
router.delete('/:id', adherentController.deleteAdherent);

module.exports = router;