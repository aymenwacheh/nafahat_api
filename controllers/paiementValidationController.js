// controllers/paiementValidationController.js

const db = require('../config/database');
const Paiement = require('../models/Paiement');  // ✅ AJOUTÉ

class PaiementValidationController {

  // ============================================================
  // LISTE DES PAIEMENTS AVEC VALIDATION
  // GET /api/admin/paiement-validation/list
  // ============================================================
  
  static async getList(req, res) {
    try {
      console.log('📥 [getList] Appelé avec params:', req.query);

      let {
        page = 1,
        per_page = 15,
        status,
        search,
        sort_by = 'paiement_created_at',
        sort_desc = 'true',
      } = req.query;

      let cleanSortBy = String(sort_by)
        .replace(/^pv\./, '')
        .replace(/^p\./, '')
        .replace(/[^a-zA-Z_]/g, '');

      const allowedColumns = [
        'paiement_id', 'adherent_id', 'formation_id',
        'statut_paiement', 'modalite_paiement', 'montant_paye',
        'paiement_created_at', 'paiement_updated_at',
        'validation_created_at', 'date_validation',
        'type_paiement', 'montant_a_payer', 'nombre_mois',
      ];

      if (!allowedColumns.includes(cleanSortBy)) {
        cleanSortBy = 'paiement_created_at';
      }

      const offset = (parseInt(page) - 1) * parseInt(per_page);
      const limit = parseInt(per_page);
      const order = sort_desc === 'true' ? 'DESC' : 'ASC';

      let whereClause = '';
      const params = [];

      if (status && status !== 'tous') {
        whereClause += ' AND statut_paiement = ?';
        params.push(status);
      }

      if (search) {
        whereClause += ' AND (adherent_nom_prenom LIKE ? OR adherent_whatsapp LIKE ? OR formation_titre_fr LIKE ?)';
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }

      const [countResult] = await db.query(
        `SELECT COUNT(*) as total FROM v_paiements_validation WHERE 1=1 ${whereClause}`,
        params
      );
      const total = countResult[0].total;

      // ✅ Inclut TOUTES les nouvelles colonnes
      const [rows] = await db.query(
        `SELECT 
            paiement_id,
            adherent_id,
            adherent_nom_prenom,
            adherent_whatsapp,
            formation_id,
            formation_titre_fr,
            formation_titre_ar,
            formation_prix,
            formation_devise,
            modalite_paiement,
            montant_paye,
            reference_paiement,
            url_quittance,
            numero_quittance,
            statut_paiement,
            paiement_commentaire AS commentaire,
            paiement_created_at AS created_at,
            paiement_updated_at AS updated_at,
            -- ✅ Type de paiement
            type_paiement,
            montant_a_payer,
            nombre_mois,
            montant_mensuel,
            montant_restant,
            paiements_effectues,
            prochain_paiement_date,
            -- ✅ Tranche en attente
            tranche_en_attente,
            tranche_quittance_url,
            tranche_numero,
            -- ✅ Validation
            validation_id AS id,
            validateur_id AS valide_par,
            validation_statut AS statut,
            date_validation,
            validation_commentaire AS validation_commentaire,
            validation_created_at AS validation_created_at,
            validateur_nom,
            validateur_whatsapp
          FROM v_paiements_validation
          WHERE 1=1 ${whereClause}
          ORDER BY ${cleanSortBy} ${order}
          LIMIT ? OFFSET ?`,
        [...params, limit, offset]
      );

      const formattedData = rows.map((row) => ({
        ...row,
        paiement_id: parseInt(row.paiement_id) || 0,
        adherent_id: parseInt(row.adherent_id) || 0,
        formation_id: parseInt(row.formation_id) || 0,
        id: row.id ? parseInt(row.id) : null,
        valide_par: row.valide_par ? parseInt(row.valide_par) : null,
        formation_prix: parseFloat(row.formation_prix) || 0,
        montant_paye: parseFloat(row.montant_paye) || 0,
        montant_a_payer: parseFloat(row.montant_a_payer) || 0,
        montant_mensuel: row.montant_mensuel ? parseFloat(row.montant_mensuel) : null,
        montant_restant: parseFloat(row.montant_restant) || 0,
        tranche_en_attente: row.tranche_en_attente ? parseFloat(row.tranche_en_attente) : null,
        nombre_mois: parseInt(row.nombre_mois) || 1,
        paiements_effectues: parseInt(row.paiements_effectues) || 0,
        tranche_numero: parseInt(row.tranche_numero) || 0,
        type_paiement: row.type_paiement || 'formation',
      }));

      console.log(`📊 [getList] ${formattedData.length} lignes retournées sur ${total} total`);

      return res.status(200).json({
        success: true,
        data: formattedData,
        pagination: {
          currentPage: parseInt(page),
          perPage: parseInt(per_page),
          total: total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error('❌ [getList] Erreur:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur: ' + error.message,
      });
    }
  }

  // ============================================================
  // STATISTIQUES
  // GET /api/admin/paiement-validation/stats
  // ============================================================
  
  static async getStats(req, res) {
    try {
      console.log('📥 [getStats] Appelé');

      const [stats] = await db.query(`
        SELECT 
          COUNT(*) as total_validations,
          SUM(CASE WHEN statut_paiement = 'en_attente' THEN 1 ELSE 0 END) as en_attente,
          SUM(CASE WHEN statut_paiement = 'valide' THEN 1 ELSE 0 END) as valides,
          SUM(CASE WHEN statut_paiement = 'refuse' THEN 1 ELSE 0 END) as refuses,
          SUM(CASE WHEN statut_paiement = 'annule' THEN 1 ELSE 0 END) as annules,
          COUNT(DISTINCT adherent_id) as paiements_traites,
          SUM(montant_paye) as montant_total,
          SUM(CASE WHEN type_paiement = 'mois' THEN 1 ELSE 0 END) as paiements_mensuels,
          SUM(CASE WHEN type_paiement = 'formation' THEN 1 ELSE 0 END) as paiements_complets,
          SUM(montant_restant) as total_restant,
          SUM(CASE WHEN tranche_en_attente IS NOT NULL THEN 1 ELSE 0 END) as tranches_en_attente
        FROM paiement
      `);

      const [modaliteStats] = await db.query(`
        SELECT 
          modalite_paiement,
          COUNT(*) as total,
          SUM(montant_paye) as montant_total,
          SUM(CASE WHEN statut_paiement = 'valide' THEN 1 ELSE 0 END) as valides
        FROM paiement
        GROUP BY modalite_paiement
      `);

      const [typeStats] = await db.query(`
        SELECT 
          type_paiement,
          COUNT(*) as total,
          SUM(montant_a_payer) as montant_total
        FROM paiement
        GROUP BY type_paiement
      `);

      console.log('📊 [getStats] Stats retournées');

      return res.status(200).json({
        success: true,
        data: {
          global: stats[0] || {
            total_validations: 0,
            en_attente: 0,
            valides: 0,
            refuses: 0,
            annules: 0,
            paiements_traites: 0,
            montant_total: 0,
            paiements_mensuels: 0,
            paiements_complets: 0,
            total_restant: 0,
            tranches_en_attente: 0,
          },
          par_modalite: modaliteStats,
          par_type: typeStats,
        },
      });
    } catch (error) {
      console.error('❌ [getStats] Erreur:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur: ' + error.message,
      });
    }
  }

  // ============================================================
  // ✅ METTRE À JOUR LE STATUT (avec validation automatique de tranche)
  // PUT /api/admin/paiement-validation/:id
  // ============================================================
  
  static async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { statut, commentaire } = req.body;
      const validePar = req.user?.id || 9;

      console.log(`📥 [updateStatus] Paiement ${id} -> ${statut}`);

      if (!statut) {
        return res.status(400).json({ success: false, message: 'Statut requis' });
      }

      const validStatuts = ['en_attente', 'valide', 'refuse', 'annule'];
      if (!validStatuts.includes(statut)) {
        return res.status(400).json({ success: false, message: 'Statut invalide' });
      }

      // ============================================================
      // ✅ LOGIQUE SPÉCIALE POUR LES TRANCHES
      // ============================================================
      
      const paiement = await Paiement.getById(id);
      if (!paiement) {
        return res.status(404).json({ success: false, message: 'Paiement non trouvé' });
      }

      const aTrancheEnAttente = (parseFloat(paiement.tranche_en_attente) || 0) > 0;

      // ✅ CAS 1 : Validation d'une tranche en attente
      if (statut === 'valide' && aTrancheEnAttente) {
        console.log(`   ✅ Tranche en attente détectée: ${paiement.tranche_en_attente}`);
        
        const result = await Paiement.validerTranche(id);
        if (result.success) {
          console.log('   🟢 Tranche validée:', result.data);
        } else {
          console.log('   ⚠️ Erreur validation tranche:', result.message);
        }
      }

      // ✅ CAS 2 : Refus d'une tranche en attente
      if (statut === 'refuse' && aTrancheEnAttente) {
        console.log(`   ❌ Refus de la tranche en attente`);
        await Paiement.refuserTranche(id, commentaire);
      }

      // ============================================================
      // MISE À JOUR STANDARD DU STATUT
      // ============================================================
      
      const [updateResult] = await db.query(
        `UPDATE paiement SET statut_paiement = ?, updated_at = NOW() WHERE id = ?`,
        [statut, id]
      );
      console.log(`   📊 Lignes mises à jour dans paiement: ${updateResult.affectedRows}`);

      // ============================================================
      // HISTORIQUE (paiement_validation)
      // ============================================================
      
      const [insertResult] = await db.query(
        `INSERT INTO paiement_validation 
            (paiement_id, valide_par, statut, date_validation, commentaire)
         VALUES (?, ?, ?, NOW(), ?)`,
        [id, validePar, statut, commentaire || null]
      );
      console.log(`   📊 Validation insérée: ${insertResult.insertId}`);

      return res.status(200).json({
        success: true,
        message: `Statut mis à jour: ${statut}`,
      });
    } catch (error) {
      console.error('❌ [updateStatus] Erreur:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur: ' + error.message,
      });
    }
  }

  // ============================================================
  // RÉCUPÉRER LES VALIDATIONS D'UN PAIEMENT
  // ============================================================
  
  static async getByPaiement(req, res) {
    try {
      const { paiementId } = req.params;
      const [rows] = await db.query(
        `SELECT * FROM paiement_validation WHERE paiement_id = ? ORDER BY date_validation DESC, id DESC`,
        [paiementId]
      );
      return res.status(200).json({ success: true, data: rows });
    } catch (error) {
      console.error('❌ [getByPaiement] Erreur:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur: ' + error.message,
      });
    }
  }

  // ============================================================
  // RÉCUPÉRER LA DERNIÈRE VALIDATION D'UN PAIEMENT
  // ============================================================
  
  static async getLastByPaiement(req, res) {
    try {
      const { paiementId } = req.params;
      const [rows] = await db.query(
        `SELECT * FROM paiement_validation WHERE paiement_id = ? ORDER BY date_validation DESC, id DESC LIMIT 1`,
        [paiementId]
      );
      return res.status(200).json({ success: true, data: rows[0] || null });
    } catch (error) {
      console.error('❌ [getLastByPaiement] Erreur:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur: ' + error.message,
      });
    }
  }

  // ============================================================
  // CRÉER UNE VALIDATION
  // ============================================================
  
  static async create(req, res) {
    try {
      const { paiement_id, statut = 'en_attente', commentaire } = req.body;
      const validePar = req.user?.id || 9;

      if (!paiement_id) {
        return res.status(400).json({ success: false, message: 'paiement_id requis' });
      }

      const [result] = await db.query(
        `INSERT INTO paiement_validation 
            (paiement_id, valide_par, statut, date_validation, commentaire)
         VALUES (?, ?, ?, NOW(), ?)`,
        [paiement_id, validePar, statut, commentaire]
      );

      await db.query(
        `UPDATE paiement SET statut_paiement = ?, updated_at = NOW() WHERE id = ?`,
        [statut, paiement_id]
      );

      return res.status(201).json({
        success: true,
        message: 'Validation créée avec succès',
        data: { id: result.insertId },
      });
    } catch (error) {
      console.error('❌ [create] Erreur:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur: ' + error.message,
      });
    }
  }

  // ============================================================
  // SUPPRIMER UNE VALIDATION
  // ============================================================
  
  static async delete(req, res) {
    try {
      const { id } = req.params;
      const [result] = await db.query(
        'DELETE FROM paiement_validation WHERE id = ?',
        [id]
      );
      if (result.affectedRows > 0) {
        return res.status(200).json({
          success: true,
          message: 'Validation supprimée avec succès',
        });
      } else {
        return res.status(404).json({
          success: false,
          message: 'Validation non trouvée',
        });
      }
    } catch (error) {
      console.error('❌ [delete] Erreur:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur: ' + error.message,
      });
    }
  }
}

module.exports = PaiementValidationController;