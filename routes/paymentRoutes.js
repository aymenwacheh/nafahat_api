// routes/paymentRoutes.js
const express = require('express');
const router = express.Router();
const PaymentController = require('../controllers/paymentController');

// Initier un paiement
router.post('/initiate', PaymentController.initiatePayment);

// Confirmer la modalité
router.post('/confirm', PaymentController.confirmPayment);

// Upload quittance initiale
router.post('/upload-quittance', PaymentController.uploadQuittance);

// Récupérer paiements
router.get('/user/:userId', PaymentController.getUserPayments);
router.get('/formation/:formationId', PaymentController.getFormationPayments);
router.get('/stats', PaymentController.getStats);

// Mettre à jour statut
router.put('/status/:paymentId', PaymentController.updateStatus);

// ✅ ROUTES DE TRANCHE (AVANT /:paymentId)
router.post('/:paymentId/tranche', PaymentController.soumettreTranche);
router.post('/:paymentId/upload-tranche', PaymentController.uploadTrancheQuittance);
router.post('/:paymentId/valider-tranche', PaymentController.validerTrancheManuellement);

// ✅ Récupérer par ID (DOIT ÊTRE EN DERNIER)
router.get('/:paymentId', PaymentController.getPaymentById);

module.exports = router;