// routes/cmplUserRoutes.js
const express = require('express');
const router = express.Router();
const cmplUserController = require('../controllers/cmplUserController');

// ============================================================
// ROUTES AVEC PRÉFIXE /api/adherents/:adherentId/formations/:formationId
// ============================================================

// ============================================================
// 1. VÉRIFIER SI L'UTILISATEUR A DÉJÀ COMPLÉTÉ SES INFOS
// ============================================================
// GET /api/adherents/:adherentId/formations/:formationId/check-cmpl
router.get(
    '/:adherentId/formations/:formationId/check-cmpl',
    cmplUserController.checkCmplExists
);

// ============================================================
// 2. RÉCUPÉRER LES INFOS COMPLÉMENTAIRES
// ============================================================
// GET /api/adherents/:adherentId/formations/:formationId/cmpl
router.get(
    '/:adherentId/formations/:formationId/cmpl',
    cmplUserController.getCmplInfo
);

// ============================================================
// 3. SAUVEGARDER LES INFOS COMPLÉMENTAIRES
// ============================================================
// POST /api/adherents/:adherentId/formations/:formationId/cmpl
router.post(
    '/:adherentId/formations/:formationId/cmpl',
    cmplUserController.saveCmplInfo
);

// ============================================================
// 4. METTRE À JOUR LES INFOS COMPLÉMENTAIRES
// ============================================================
// PUT /api/adherents/:adherentId/formations/:formationId/cmpl
router.put(
    '/:adherentId/formations/:formationId/cmpl',
    cmplUserController.updateCmplInfo
);

// ============================================================
// 5. SUPPRIMER LES INFOS COMPLÉMENTAIRES
// ============================================================
// DELETE /api/adherents/:adherentId/formations/:formationId/cmpl
router.delete(
    '/:adherentId/formations/:formationId/cmpl',
    cmplUserController.deleteCmplInfo
);

// ============================================================
// 6. VÉRIFIER SI LA FORMATION EST RELIGIEUSE
// ============================================================
// GET /api/adherents/formations/:formationId/is-religieuse
router.get(
    '/formations/:formationId/is-religieuse',
    cmplUserController.isFormationReligieuse
);

// ============================================================
// EXPORTATION DU ROUTEUR
// ============================================================
module.exports = router;