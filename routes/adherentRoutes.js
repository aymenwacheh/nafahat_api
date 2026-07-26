// routes/adherentRoutes.js
const express = require('express');
const router = express.Router();
const adherentController = require('../controllers/adherentController');

// ============================================================
// ROUTES AVEC PRÉFIXE /api/adherents
// ============================================================

// ---- Routes d'authentification ----
router.post('/login', adherentController.login);

// ---- Routes d'inscription ----
router.post('/inscrire', adherentController.inscrireAdherent);

// ---- Routes de vérification ----
router.get('/check-whatsapp', adherentController.checkWhatsapp);
router.get('/check-email', adherentController.checkEmail);

// ---- Routes de gestion des rôles ----
router.get('/roles', adherentController.getRoles); // ✅ Maintenant accessible via /api/adherents/roles

// ---- Routes de gestion des utilisateurs (Super Admin) ----
router.post('/users', adherentController.creerUtilisateur);

// ---- Routes avec paramètres ID ----
router.get('/', adherentController.getAdherents);
router.get('/:id', adherentController.getAdherentById);
router.get('/:id/credentials', adherentController.getAdherentCredentials);
router.put('/:id', adherentController.updateAdherent);
router.delete('/:id', adherentController.deleteAdherent);
router.post('/:id/reset-password', adherentController.resetPassword);

module.exports = router;