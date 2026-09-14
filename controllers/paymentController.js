// nafahat_api/controllers/paymentController.js

const Paiement = require('../models/Paiement');
const db = require('../config/database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ============================================================
// CONFIGURATION MULTER POUR L'UPLOAD DE FICHIERS
// ============================================================

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
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: function (req, file, cb) {
    const allowedTypes = ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'];
    const extension = path.extname(file.originalname).toLowerCase().substring(1);
    if (allowedTypes.includes(extension)) {
      cb(null, true);
    } else {
      cb(new Error('Format de fichier non autorisé. Formats acceptés: PDF, JPG, PNG, DOC'));
    }
  },
}).single('quittance');

class PaymentController {

  // ============================================================
  // INITIER UN PAIEMENT
  // POST /api/payments/initiate
  // ============================================================
  
  static async initiatePayment(req, res) {
    try {
      const formationId = req.body.formationId || req.body.formation_id;
      const userId = req.body.userId || req.body.user_id;
      const currency = req.body.currency;

      console.log('🔵 [initiatePayment] Initiation:', { formationId, userId, currency });

      if (!formationId || !userId || !currency) {
        return res.status(400).json({
          success: false,
          message: 'Données manquantes: formationId, userId, currency requis',
        });
      }

      const [adherentRows] = await db.query('SELECT * FROM adherent WHERE id = ?', [userId]);
      const adherent = adherentRows[0];
      if (!adherent) {
        return res.status(404).json({ success: false, message: 'Adhérent non trouvé' });
      }

      const [formationRows] = await db.query('SELECT * FROM formation WHERE id = ?', [formationId]);
      const formation = formationRows[0];
      if (!formation) {
        return res.status(404).json({ success: false, message: 'Formation non trouvée' });
      }

      const prix = PaymentController.getPriceByCurrency(formation, currency);

      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const random = Math.random().toString(36).substring(2, 8).toUpperCase();
      const reference = 'PAY-' + dateStr + '-' + random;

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
        commentaire: 'Paiement initié depuis l\'application',
        type_paiement: 'formation',
        montant_a_payer: prix,
        nombre_mois: 1,
        montant_mensuel: null,
        paiements_effectues: 0,
      });

      console.log('🟢 [initiatePayment] Paiement créé avec ID:', paymentId);

      return res.status(200).json({
        success: true,
        message: 'Paiement initié avec succès',
        paymentId: paymentId,
        reference: reference,
        montant: prix,
        devise: currency,
      });
    } catch (error) {
      console.error('❌ [initiatePayment] Erreur:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur: ' + error.message,
      });
    }
  }

  // ============================================================
  // CONFIRMER UN PAIEMENT (avec type de paiement)
  // POST /api/payments/confirm
  // ============================================================
  
  static async confirmPayment(req, res) {
    try {
      const {
        paymentId,
        modalite,
        type_paiement,
        montant_a_payer,
        nombre_mois,
        montant_mensuel,
      } = req.body;

      console.log('🔵 [confirmPayment] Confirmation:', {
        paymentId, modalite, type_paiement, montant_a_payer, nombre_mois, montant_mensuel,
      });

      if (!paymentId || !modalite) {
        return res.status(400).json({
          success: false,
          message: 'Données manquantes: paymentId, modalite requis',
        });
      }

      const validModalites = ['bancaire', 'postal', 'en_ligne'];
      if (!validModalites.includes(modalite)) {
        return res.status(400).json({
          success: false,
          message: 'Modalité invalide. Valeurs acceptées: bancaire, postal, en_ligne',
        });
      }

      const validTypes = ['mois', 'formation'];
      if (type_paiement && !validTypes.includes(type_paiement)) {
        return res.status(400).json({
          success: false,
          message: 'Type de paiement invalide. Valeurs acceptées: mois, formation',
        });
      }

      const payment = await Paiement.getById(paymentId);
      if (!payment) {
        return res.status(404).json({ success: false, message: 'Paiement non trouvé' });
      }

      const updated = await Paiement.updateModaliteWithType(
        paymentId,
        modalite,
        type_paiement || 'formation',
        montant_a_payer,
        nombre_mois || 1,
        montant_mensuel
      );

      if (updated) {
        const updatedPayment = await Paiement.getById(paymentId);

        console.log('🟢 [confirmPayment] Paiement mis à jour');

        return res.status(200).json({
          success: true,
          message: 'Modalité de paiement enregistrée',
          paymentId: paymentId,
          data: {
            type_paiement: updatedPayment.type_paiement,
            modalite: updatedPayment.modalite_paiement,
            montant_a_payer: parseFloat(updatedPayment.montant_a_payer),
            nombre_mois: updatedPayment.nombre_mois,
            montant_mensuel: updatedPayment.montant_mensuel
              ? parseFloat(updatedPayment.montant_mensuel)
              : null,
            montant_restant: parseFloat(updatedPayment.montant_restant) || 0,
          },
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour',
      });
    } catch (error) {
      console.error('❌ [confirmPayment] Erreur:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur: ' + error.message,
      });
    }
  }

  // ============================================================
  // ✅ NOUVELLE ROUTE : Soumettre une tranche mensuelle
  // POST /api/payments/:paymentId/tranche
  // ============================================================
  
  static async soumettreTranche(req, res) {
    try {
      const { paymentId } = req.params;
      const { montant_tranche, quittance_url } = req.body;

      console.log('🔵 [soumettreTranche] Soumission:', { paymentId, montant_tranche });

      if (!montant_tranche || montant_tranche <= 0) {
        return res.status(400).json({
          success: false,
          message: 'montant_tranche requis et doit être > 0',
        });
      }

      const result = await Paiement.soumettreTranche(
        paymentId,
        parseFloat(montant_tranche),
        quittance_url || null
      );

      if (result.success) {
        return res.status(200).json({
          success: true,
          message: 'Tranche soumise, en attente de validation',
          data: result.data,
        });
      }

      return res.status(400).json({
        success: false,
        message: result.message || 'Erreur',
      });
    } catch (error) {
      console.error('❌ [soumettreTranche] Erreur:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur: ' + error.message,
      });
    }
  }

  // ============================================================
  // ✅ NOUVELLE ROUTE : Upload quittance de tranche
  // POST /api/payments/:paymentId/upload-tranche
  // ============================================================
  
  static async uploadTrancheQuittance(req, res) {
    upload(req, res, async function (err) {
      if (err) {
        console.error('❌ [uploadTrancheQuittance] Erreur:', err);
        return res.status(400).json({
          success: false,
          message: 'Erreur upload: ' + (err.message || err),
        });
      }

      const paymentId = req.body.paymentId || req.params.paymentId;
      const file = req.file;

      if (!paymentId || !file) {
        return res.status(400).json({
          success: false,
          message: 'paymentId et fichier requis',
        });
      }

      try {
        const urlQuittance = file.path;
        const numeroQuittance = path.basename(file.filename, path.extname(file.filename));

        await db.query(
          `UPDATE paiement 
           SET tranche_quittance_url = ?, numero_quittance = ?, updated_at = NOW() 
           WHERE id = ?`,
          [urlQuittance, numeroQuittance, paymentId]
        );

        console.log('🟢 [uploadTrancheQuittance] Quittance uploadée:', urlQuittance);

        return res.status(200).json({
          success: true,
          message: 'Quittance uploadée',
          url: urlQuittance,
          numero_quittance: numeroQuittance,
        });
      } catch (error) {
        console.error('❌ [uploadTrancheQuittance] Erreur:', error);
        return res.status(500).json({
          success: false,
          message: 'Erreur: ' + error.message,
        });
      }
    });
  }

  // ============================================================
  // ✅ NOUVELLE ROUTE : Valider une tranche manuellement (admin)
  // POST /api/payments/:paymentId/valider-tranche
  // ============================================================
  
  static async validerTrancheManuellement(req, res) {
    try {
      const { paymentId } = req.params;

      console.log('🔵 [validerTrancheManuellement] Validation admin:', paymentId);

      const result = await Paiement.validerTranche(paymentId);

      if (result.success) {
        return res.status(200).json({
          success: true,
          message: 'Tranche validée',
          data: result.data,
        });
      }

      return res.status(400).json({
        success: false,
        message: result.message || 'Erreur',
      });
    } catch (error) {
      console.error('❌ [validerTrancheManuellement] Erreur:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur: ' + error.message,
      });
    }
  }

  // ============================================================
  // UPLOAD DE LA QUITTANCE (initiale)
  // POST /api/payments/upload-quittance
  // ============================================================
  
  static async uploadQuittance(req, res) {
    try {
      upload(req, res, async function (err) {
        if (err instanceof multer.MulterError) {
          return res.status(400).json({
            success: false,
            message: 'Erreur d\'upload: ' + err.message,
          });
        } else if (err) {
          return res.status(400).json({
            success: false,
            message: err.message,
          });
        }

        const paymentId = req.body.paymentId;
        const file = req.file;

        if (!paymentId || !file) {
          return res.status(400).json({
            success: false,
            message: 'Données manquantes: paymentId et fichier requis',
          });
        }

        const payment = await Paiement.getById(paymentId);
        if (!payment) {
          return res.status(404).json({
            success: false,
            message: 'Paiement non trouvé',
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
          return res.status(200).json({
            success: true,
            message: 'Quittance téléchargée avec succès',
            url: urlQuittance,
            numero_quittance: numeroQuittance,
          });
        }

        return res.status(500).json({
          success: false,
          message: 'Erreur lors de la mise à jour',
        });
      });
    } catch (error) {
      console.error('❌ [uploadQuittance] Erreur:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur: ' + error.message,
      });
    }
  }

  // ============================================================
  // RÉCUPÉRER LES PAIEMENTS D'UN ADHÉRENT
  // ============================================================
  
  static async getUserPayments(req, res) {
    try {
      const { userId } = req.params;
      const payments = await Paiement.getByAdherent(userId);
      return res.status(200).json({ success: true, data: payments });
    } catch (error) {
      console.error('❌ [getUserPayments] Erreur:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur: ' + error.message,
      });
    }
  }

  // ============================================================
  // RÉCUPÉRER LES PAIEMENTS D'UNE FORMATION
  // ============================================================
  
  static async getFormationPayments(req, res) {
    try {
      const { formationId } = req.params;
      const payments = await Paiement.getByFormation(formationId);
      return res.status(200).json({ success: true, data: payments });
    } catch (error) {
      console.error('❌ [getFormationPayments] Erreur:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur: ' + error.message,
      });
    }
  }

  // ============================================================
  // STATISTIQUES
  // ============================================================
  
  static async getStats(req, res) {
    try {
      const stats = await Paiement.getStats();
      return res.status(200).json({ success: true, data: stats });
    } catch (error) {
      console.error('❌ [getStats] Erreur:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur: ' + error.message,
      });
    }
  }

  // ============================================================
  // METTRE À JOUR LE STATUT (admin)
  // ============================================================
  
  static async updateStatus(req, res) {
    try {
      const { paymentId } = req.params;
      const { statut, commentaire } = req.body;

      console.log('🔵 [updateStatus] Mise à jour:', { paymentId, statut });

      if (!statut) {
        return res.status(400).json({ success: false, message: 'Statut requis' });
      }

      const validStatuts = ['en_attente', 'valide', 'refuse', 'annule'];
      if (!validStatuts.includes(statut)) {
        return res.status(400).json({
          success: false,
          message: 'Statut invalide. Valeurs acceptées: en_attente, valide, refuse, annule',
        });
      }

      // ✅ Si valide → valider automatiquement la tranche en attente
      if (statut === 'valide') {
        const paiement = await Paiement.getById(paymentId);
        if (paiement && paiement.tranche_en_attente > 0) {
          const result = await Paiement.validerTranche(paymentId);
          if (result.success) {
            console.log('✅ [updateStatus] Tranche validée automatiquement');
          }
        }
      }

      // ✅ Si refusé → vider la tranche en attente
      if (statut === 'refuse') {
        const paiement = await Paiement.getById(paymentId);
        if (paiement && paiement.tranche_en_attente > 0) {
          await Paiement.refuserTranche(paymentId, commentaire);
          console.log('✅ [updateStatus] Tranche refusée');
        }
      }

      const result = await Paiement.updateStatut(paymentId, statut, commentaire || null);

      if (result) {
        return res.status(200).json({ success: true, message: 'Statut mis à jour' });
      } else {
        return res.status(500).json({
          success: false,
          message: 'Erreur lors de la mise à jour',
        });
      }
    } catch (error) {
      console.error('❌ [updateStatus] Erreur:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur: ' + error.message,
      });
    }
  }

  // ============================================================
  // RÉCUPÉRER UN PAIEMENT PAR ID
  // ============================================================
  
  static async getPaymentById(req, res) {
    try {
      const { paymentId } = req.params;
      const payment = await Paiement.getById(paymentId);
      if (!payment) {
        return res.status(404).json({ success: false, message: 'Paiement non trouvé' });
      }
      return res.status(200).json({ success: true, data: payment });
    } catch (error) {
      console.error('❌ [getPaymentById] Erreur:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur: ' + error.message,
      });
    }
  }

  // ============================================================
  // UTILITAIRE
  // ============================================================
  
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