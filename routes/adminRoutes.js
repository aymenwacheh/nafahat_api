// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const adherentController = require('../controllers/adherentController');

// ============================================================
// ROUTES ADMIN - GESTION DES UTILISATEURS
// Préfixe: /api/admin
// ============================================================

// 📋 Liste des utilisateurs (avec pagination, recherche, tri, filtres)
router.get('/users', adherentController.getUsersPaginated);

// 👤 Détail d'un utilisateur
router.get('/users/:id', adherentController.getUserById);

// 🔄 Changer le statut d'un utilisateur (activer/désactiver)
router.put('/users/:id/status', adherentController.toggleUserStatus);

// 🗑️ Supprimer un utilisateur
router.delete('/users/:id', adherentController.deleteUser);

// 📝 Créer un utilisateur
router.post('/users', adherentController.creerUtilisateur);

module.exports = router;