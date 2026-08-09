// routes/paymentRoutes.js
const express = require('express');
const router = express.Router();
const PaymentController = require('../controllers/paymentController');

/**
 * Routes de paiement
 * Base URL: /api/payments
 */

// ✅ Initier un paiement
// POST /api/payments/initiate
router.post('/initiate', PaymentController.initiatePayment);

// ✅ Confirmer la modalité de paiement
// POST /api/payments/confirm
router.post('/confirm', PaymentController.confirmPayment);

// ✅ Uploader une quittance
// POST /api/payments/upload-quittance
router.post('/upload-quittance', PaymentController.uploadQuittance);

// ✅ Récupérer un paiement par son ID
// GET /api/payments/:paymentId
router.get('/:paymentId', PaymentController.getPaymentById);

// ✅ Récupérer les paiements d'un adhérent
// GET /api/payments/user/:userId
router.get('/user/:userId', PaymentController.getUserPayments);

// ✅ Récupérer les paiements d'une formation
// GET /api/payments/formation/:formationId
router.get('/formation/:formationId', PaymentController.getFormationPayments);

// ✅ Obtenir les statistiques des paiements
// GET /api/payments/stats
router.get('/stats', PaymentController.getStats);

// ✅ Mettre à jour le statut d'un paiement (admin)
// PUT /api/payments/status/:paymentId
router.put('/status/:paymentId', PaymentController.updateStatus);

module.exports = router;