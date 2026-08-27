// routes/paiementValidationRoutes.js

const express = require('express');
const router = express.Router();
const PaiementValidationController = require('../controllers/paiementValidationController');
const { protect, authorize } = require('../middleware/auth');

// ✅ Version simplifiée pour le développement
// Supprime les middlewares d'authentification en local

// Pour le développement, on bypass l'auth
const isDevelopment = process.env.NODE_ENV !== 'production';

const authMiddleware = (req, res, next) => {
    if (isDevelopment) {
        req.user = { id: 9, role_id: 5, role_nom: 'super_admin' };
        return next();
    }
    return protect(req, res, next);
};

const adminCheck = (req, res, next) => {
    if (isDevelopment) return next();
    return authorize('admin', 'super_admin')(req, res, next);
};

// Routes
router.get('/list', authMiddleware, adminCheck, PaiementValidationController.getList);
router.get('/stats', authMiddleware, adminCheck, PaiementValidationController.getStats);
router.get('/paiement/:paiementId', authMiddleware, adminCheck, PaiementValidationController.getByPaiement);
router.get('/paiement/:paiementId/last', authMiddleware, adminCheck, PaiementValidationController.getLastByPaiement);

router.post('/', authMiddleware, adminCheck, PaiementValidationController.create);
router.put('/:id', authMiddleware, adminCheck, PaiementValidationController.updateStatus);
router.delete('/:id', authMiddleware, adminCheck, PaiementValidationController.delete);

module.exports = router;