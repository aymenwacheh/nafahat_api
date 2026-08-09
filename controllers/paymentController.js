// nafahat_api/controllers/paymentController.js

const Paiement = require('../models/Paiement');
const db = require('../config/database'); // ✅ Importer db (qui contient query)
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuration de multer pour l'upload de fichiers
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const uploadDir = `uploads/quittances/${year}/${month}/`;
    
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const numeroQuittance = Paiement.generateQuittanceNumber();
    const extension = path.extname(file.originalname);
    cb(null, numeroQuittance + extension);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'];
    const extension = path.extname(file.originalname).toLowerCase().substring(1);
    if (allowedTypes.includes(extension)) {
      cb(null, true);
    } else {
      cb(new Error('Format de fichier non autorisé. Formats acceptés: PDF, JPG, PNG, DOC'));
    }
  }
}).single('quittance');

class PaymentController {
  /**
   * Initier un paiement
   * POST /api/payments/initiate
   */
  static async initiatePayment(req, res) {
    try {
      // ✅ Support des deux formats de noms de champs
      const formationId = req.body.formationId || req.body.formation_id;
      const userId = req.body.userId || req.body.user_id;
      const currency = req.body.currency;

      console.log('🔵 [PaymentController] Initiation paiement:', { formationId, userId, currency });

      // Vérifier les données requises
      if (!formationId || !userId || !currency) {
        return res.status(400).json({
          success: false,
          message: 'Données manquantes: formationId/formation_id, userId/user_id, currency requis'
        });
      }

      // ✅ Utiliser db.query au lieu de pool.execute
      const [adherentRows] = await db.query(
        'SELECT * FROM adherent WHERE id = ?',
        [userId]
      );
      const adherent = adherentRows[0];

      if (!adherent) {
        return res.status(404).json({
          success: false,
          message: 'Adhérent non trouvé'
        });
      }

      console.log('🟢 [PaymentController] Adhérent trouvé:', adherent.nom_prenom);

      // ✅ Utiliser db.query au lieu de pool.execute
      const [formationRows] = await db.query(
        'SELECT * FROM formation WHERE id = ?',
        [formationId]
      );
      const formation = formationRows[0];

      if (!formation) {
        return res.status(404).json({
          success: false,
          message: 'Formation non trouvée'
        });
      }

      console.log('🟢 [PaymentController] Formation trouvée:', formation.titre_fr);

      // Déterminer le prix selon la devise
      const prix = PaymentController.getPriceByCurrency(formation, currency);

      // Créer une référence de paiement unique
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const random = Math.random().toString(36).substring(2, 8).toUpperCase();
      const reference = 'PAY-' + dateStr + '-' + random;

      // Créer le paiement
      const paymentId = await Paiement.create({
        adherent_id: userId,
        adherent_nom_prenom: adherent.nom_prenom,
        adherent_whatsapp: adherent.whatsapp,
        formation_id: formationId,
        formation_titre_fr: formation.titre_fr,
        formation_titre_ar: formation.titre_ar,
        formation_prix: prix,
        formation_devise: currency,
        modalite_paiement: 'en_attente',
        statut_paiement: 'en_attente',
        montant_paye: prix,
        reference_paiement: reference,
        commentaire: 'Paiement initié depuis l\'application'
      });

      console.log('🟢 [PaymentController] Paiement créé avec ID:', paymentId);

      if (paymentId) {
        return res.status(200).json({
          success: true,
          message: 'Paiement initié avec succès',
          paymentId: paymentId,
          reference: reference,
          montant: prix,
          devise: currency
        });
      } else {
        return res.status(500).json({
          success: false,
          message: 'Erreur lors de la création du paiement'
        });
      }

    } catch (error) {
      console.error('❌ [PaymentController] Erreur:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur: ' + error.message
      });
    }
  }

  /**
   * Confirmer un paiement (après le choix de la modalité)
   * POST /api/payments/confirm
   */
  static async confirmPayment(req, res) {
    try {
      const { paymentId, modalite } = req.body;

      console.log('🔵 [PaymentController] Confirmation paiement:', { paymentId, modalite });

      if (!paymentId || !modalite) {
        return res.status(400).json({
          success: false,
          message: 'Données manquantes: paymentId, modalite requis'
        });
      }

      const validModalites = ['bancaire', 'postal', 'en_ligne'];
      if (!validModalites.includes(modalite)) {
        return res.status(400).json({
          success: false,
          message: 'Modalité invalide. Valeurs acceptées: bancaire, postal, en_ligne'
        });
      }

      const payment = await Paiement.getById(paymentId);
      if (!payment) {
        return res.status(404).json({
          success: false,
          message: 'Paiement non trouvé'
        });
      }

      const updated = await Paiement.updateModalite(paymentId, modalite);

      if (updated) {
        return res.status(200).json({
          success: true,
          message: 'Modalité de paiement enregistrée',
          paymentId: paymentId
        });
      } else {
        return res.status(500).json({
          success: false,
          message: 'Erreur lors de la mise à jour'
        });
      }

    } catch (error) {
      console.error('❌ [PaymentController] Erreur:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur: ' + error.message
      });
    }
  }

  /**
   * Upload de la quittance
   * POST /api/payments/upload-quittance
   */
  static async uploadQuittance(req, res) {
    try {
      upload(req, res, async function (err) {
        if (err instanceof multer.MulterError) {
          console.error('❌ [Upload] Erreur Multer:', err);
          return res.status(400).json({
            success: false,
            message: 'Erreur d\'upload: ' + err.message
          });
        } else if (err) {
          console.error('❌ [Upload] Erreur:', err);
          return res.status(400).json({
            success: false,
            message: err.message
          });
        }

        const paymentId = req.body.paymentId;
        const file = req.file;

        console.log('🔵 [Upload] PaymentId:', paymentId);
        console.log('🔵 [Upload] Fichier:', file ? file.filename : 'Aucun');

        if (!paymentId || !file) {
          return res.status(400).json({
            success: false,
            message: 'Données manquantes: paymentId et fichier requis'
          });
        }

        const payment = await Paiement.getById(paymentId);
        if (!payment) {
          return res.status(404).json({
            success: false,
            message: 'Paiement non trouvé'
          });
        }

        const datePaiement = new Date().toISOString().slice(0, 19).replace('T', ' ');
        const urlQuittance = file.path;
        const numeroQuittance = path.basename(file.filename, path.extname(file.filename));
        const referencePaiement = payment.reference_paiement;

        const updated = await Paiement.updatePaymentInfo(
          paymentId,
          datePaiement,
          urlQuittance,
          numeroQuittance,
          referencePaiement
        );

        if (updated) {
          console.log('🟢 [Upload] Quittance enregistrée avec succès');
          return res.status(200).json({
            success: true,
            message: 'Quittance téléchargée avec succès',
            url: urlQuittance,
            numero_quittance: numeroQuittance
          });
        } else {
          return res.status(500).json({
            success: false,
            message: 'Erreur lors de la mise à jour'
          });
        }
      });
    } catch (error) {
      console.error('❌ [PaymentController] Erreur:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur: ' + error.message
      });
    }
  }

  /**
   * Récupérer les paiements d'un adhérent
   * GET /api/payments/user/:userId
   */
  static async getUserPayments(req, res) {
    try {
      const { userId } = req.params;
      console.log('🔵 [PaymentController] Récupération paiements utilisateur:', userId);
      const payments = await Paiement.getByAdherent(userId);
      return res.status(200).json({
        success: true,
        data: payments
      });
    } catch (error) {
      console.error('❌ [PaymentController] Erreur:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur: ' + error.message
      });
    }
  }

  /**
   * Récupérer les paiements d'une formation
   * GET /api/payments/formation/:formationId
   */
  static async getFormationPayments(req, res) {
    try {
      const { formationId } = req.params;
      console.log('🔵 [PaymentController] Récupération paiements formation:', formationId);
      const payments = await Paiement.getByFormation(formationId);
      return res.status(200).json({
        success: true,
        data: payments
      });
    } catch (error) {
      console.error('❌ [PaymentController] Erreur:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur: ' + error.message
      });
    }
  }

  /**
   * Obtenir les statistiques des paiements
   * GET /api/payments/stats
   */
  static async getStats(req, res) {
    try {
      console.log('🔵 [PaymentController] Récupération statistiques');
      const stats = await Paiement.getStats();
      return res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('❌ [PaymentController] Erreur:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur: ' + error.message
      });
    }
  }

  /**
   * Mettre à jour le statut d'un paiement (admin)
   * PUT /api/payments/status/:paymentId
   */
  static async updateStatus(req, res) {
    try {
      const { paymentId } = req.params;
      const { statut, commentaire } = req.body;

      console.log('🔵 [PaymentController] Mise à jour statut:', { paymentId, statut, commentaire });

      if (!statut) {
        return res.status(400).json({
          success: false,
          message: 'Statut requis'
        });
      }

      const validStatuts = ['en_attente', 'valide', 'refuse', 'annule'];
      if (!validStatuts.includes(statut)) {
        return res.status(400).json({
          success: false,
          message: 'Statut invalide. Valeurs acceptées: en_attente, valide, refuse, annule'
        });
      }

      const result = await Paiement.updateStatut(paymentId, statut, commentaire || null);

      if (result) {
        return res.status(200).json({
          success: true,
          message: 'Statut mis à jour'
        });
      } else {
        return res.status(500).json({
          success: false,
          message: 'Erreur lors de la mise à jour'
        });
      }
    } catch (error) {
      console.error('❌ [PaymentController] Erreur:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur: ' + error.message
      });
    }
  }

  /**
   * Obtenir un paiement par son ID
   * GET /api/payments/:paymentId
   */
  static async getPaymentById(req, res) {
    try {
      const { paymentId } = req.params;
      console.log('🔵 [PaymentController] Récupération paiement:', paymentId);
      const payment = await Paiement.getById(paymentId);
      if (!payment) {
        return res.status(404).json({
          success: false,
          message: 'Paiement non trouvé'
        });
      }
      return res.status(200).json({
        success: true,
        data: payment
      });
    } catch (error) {
      console.error('❌ [PaymentController] Erreur:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur: ' + error.message
      });
    }
  }

  /**
   * Obtenir le prix selon la devise
   */
  static getPriceByCurrency(formation, currency) {
    switch (currency.toUpperCase()) {
      case 'EUR':
        return formation.prix_eur || formation.prix_dt * 0.33;
      case 'USD':
        return formation.prix_usd || formation.prix_dt * 0.36;
      case 'DT':
      case 'TND':
      default:
        return formation.prix_dt;
    }
  }
}

module.exports = PaymentController;