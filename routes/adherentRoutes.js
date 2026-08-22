// routes/adherentRoutes.js
const express = require('express');
const router = express.Router();
const adherentController = require('../controllers/adherentController');

// ============================================================
// ROUTES AVEC PRÉFIXE /api/adherents
// ============================================================

// ============================================================
// 1. ROUTES D'AUTHENTIFICATION
// ============================================================
router.post('/login', adherentController.login);

// ============================================================
// 2. ROUTES D'INSCRIPTION
// ============================================================
router.post('/inscrire', adherentController.inscrireAdherent);

// ============================================================
// 3. ROUTES DE VÉRIFICATION (DOUBLONS)
// ============================================================
router.get('/check-whatsapp', adherentController.checkWhatsapp);
router.get('/check-email', adherentController.checkEmail);

// ============================================================
// 4. ✅ NOUVELLES ROUTES - VÉRIFICATION PAR EMAIL
// ============================================================
// Envoyer le code de vérification par email
router.post('/send-verification-code', adherentController.sendVerificationCode);

// Vérifier le code et créer l'utilisateur
router.post('/verify-code-and-create', adherentController.verifyCodeAndCreateUser);

// ============================================================
// 5. ROUTES DE GESTION DES RÔLES
// ============================================================
router.get('/roles', adherentController.getRoles);

// ============================================================
// 6. ROUTES DE GESTION DES UTILISATEURS (SUPER ADMIN)
// ============================================================
router.post('/users', adherentController.creerUtilisateur);
router.get('/users', adherentController.getUsers);
router.get('/users/:id', adherentController.getUserById);
router.put('/users/:id', adherentController.updateUser);
router.delete('/users/:id', adherentController.deleteUser);

// ============================================================
// 7. ROUTES AVEC PARAMÈTRES ID (ADHÉRENTS)
// ============================================================
router.get('/', adherentController.getAdherents);
router.get('/:id', adherentController.getAdherentById);
router.get('/:id/credentials', adherentController.getAdherentCredentials);
router.put('/:id', adherentController.updateAdherent);
router.delete('/:id', adherentController.deleteAdherent);
router.post('/:id/reset-password', adherentController.resetPassword);

// ============================================================
// verif nouveau mp
// ============================================================

router.post('/:id/change-password', adherentController.changePassword);

// controllers/adherentController.js
exports.changePassword = async (req, res) => {
  const { id } = req.params;
  const { currentPassword, newPassword } = req.body;
  
  try {
    // Vérifier que l'utilisateur existe
    const [user] = await db.query(
      'SELECT id FROM acces_adherent WHERE adherent_id = ? AND mot_de_passe = ?',
      [id, currentPassword]
    );
    
    if (user.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Mot de passe actuel incorrect'
      });
    }
    
    // Mettre à jour le mot de passe
    await db.query(
      'UPDATE acces_adherent SET mot_de_passe = ? WHERE adherent_id = ?',
      [newPassword, id]
    );
    
    res.status(200).json({
      success: true,
      message: 'Mot de passe mis à jour avec succès'
    });
  } catch (error) {
    console.error('❌ changePassword:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
};
// ============================================================
// EXPORTATION DU ROUTEUR
// ============================================================
module.exports = router;