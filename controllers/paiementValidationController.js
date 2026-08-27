// controllers/paiementValidationController.js

const db = require('../config/database');

class PaiementValidationController {

    /**
     * Liste des paiements avec validation (dernière validation uniquement)
     * GET /api/admin/paiement-validation/list
     */
    static async getList(req, res) {
        try {
            console.log('📥 [getList] Appelé avec params:', req.query);
            
            let {
                page = 1,
                per_page = 15,
                status,
                search,
                sort_by = 'paiement_created_at',
                sort_desc = 'true'
            } = req.query;

            // ✅ NETTOYER sort_by : remplacer pv.created_at par paiement_created_at
            let cleanSortBy = String(sort_by)
                .replace(/^pv\./, '')
                .replace(/^p\./, '')
                .replace(/[^a-zA-Z_]/g, '');

            // ✅ Colonnes autorisées (sécurité)
            const allowedColumns = [
                'paiement_id', 'adherent_id', 'formation_id',
                'statut_paiement', 'modalite_paiement', 'montant_paye',
                'paiement_created_at', 'paiement_updated_at',
                'validation_created_at', 'date_validation'
            ];
            
            if (!allowedColumns.includes(cleanSortBy)) {
                cleanSortBy = 'paiement_created_at';
            }

            console.log(`   📋 sort_by nettoyé: ${cleanSortBy}`);

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

            // Total
            const [countResult] = await db.query(
                `SELECT COUNT(*) as total FROM v_paiements_validation WHERE 1=1 ${whereClause}`,
                params
            );
            const total = countResult[0].total;

            // Requête avec sort_by nettoyé
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

            // Convertir les types pour le frontend
            const formattedData = rows.map(row => ({
                ...row,
                paiement_id: parseInt(row.paiement_id) || 0,
                adherent_id: parseInt(row.adherent_id) || 0,
                formation_id: parseInt(row.formation_id) || 0,
                id: row.id ? parseInt(row.id) : null,
                valide_par: row.valide_par ? parseInt(row.valide_par) : null,
                formation_prix: parseFloat(row.formation_prix) || 0,
                montant_paye: parseFloat(row.montant_paye) || 0,
            }));

            console.log(`📊 [getList] ${formattedData.length} lignes retournées sur ${total} total`);

            return res.status(200).json({
                success: true,
                data: formattedData,
                pagination: {
                    currentPage: parseInt(page),
                    perPage: parseInt(per_page),
                    total: total,
                    totalPages: Math.ceil(total / limit)
                }
            });

        } catch (error) {
            console.error('❌ [getList] Erreur:', error);
            return res.status(500).json({
                success: false,
                message: 'Erreur: ' + error.message
            });
        }
    }

    /**
     * Statistiques
     * GET /api/admin/paiement-validation/stats
     */
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
                    SUM(montant_paye) as montant_total
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
                        montant_total: 0
                    },
                    par_modalite: modaliteStats
                }
            });

        } catch (error) {
            console.error('❌ [getStats] Erreur:', error);
            return res.status(500).json({
                success: false,
                message: 'Erreur: ' + error.message
            });
        }
    }

    /**
     * Mettre à jour le statut d'un paiement
     * PUT /api/admin/paiement-validation/:id
     */
    static async updateStatus(req, res) {
        try {
            const { id } = req.params;
            const { statut, commentaire } = req.body;
            const validePar = req.user?.id || 9;

            console.log(`📥 [updateStatus] Paiement ${id} -> ${statut}`);

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
                    message: 'Statut invalide'
                });
            }

            // 1. METTRE À JOUR LA TABLE paiement
            const [updateResult] = await db.query(
                `UPDATE paiement 
                 SET statut_paiement = ?, 
                     updated_at = NOW() 
                 WHERE id = ?`,
                [statut, id]
            );
            console.log(`   📊 Lignes mises à jour dans paiement: ${updateResult.affectedRows}`);

            // 2. Insérer l'historique dans paiement_validation
            const [insertResult] = await db.query(
                `INSERT INTO paiement_validation 
                    (paiement_id, valide_par, statut, date_validation, commentaire)
                 VALUES (?, ?, ?, NOW(), ?)`,
                [id, validePar, statut, commentaire || null]
            );
            console.log(`   📊 Validation insérée: ${insertResult.insertId}`);

            return res.status(200).json({
                success: true,
                message: `Statut mis à jour: ${statut}`
            });

        } catch (error) {
            console.error('❌ [updateStatus] Erreur:', error);
            return res.status(500).json({
                success: false,
                message: 'Erreur: ' + error.message
            });
        }
    }

    /**
     * Récupérer les validations d'un paiement
     * GET /api/admin/paiement-validation/paiement/:paiementId
     */
    static async getByPaiement(req, res) {
        try {
            const { paiementId } = req.params;
            const [rows] = await db.query(
                `SELECT * FROM paiement_validation WHERE paiement_id = ? ORDER BY date_validation DESC, id DESC`,
                [paiementId]
            );
            return res.status(200).json({
                success: true,
                data: rows
            });
        } catch (error) {
            console.error('❌ [getByPaiement] Erreur:', error);
            return res.status(500).json({
                success: false,
                message: 'Erreur: ' + error.message
            });
        }
    }

    /**
     * Récupérer la dernière validation d'un paiement
     * GET /api/admin/paiement-validation/paiement/:paiementId/last
     */
    static async getLastByPaiement(req, res) {
        try {
            const { paiementId } = req.params;
            const [rows] = await db.query(
                `SELECT * FROM paiement_validation WHERE paiement_id = ? ORDER BY date_validation DESC, id DESC LIMIT 1`,
                [paiementId]
            );
            return res.status(200).json({
                success: true,
                data: rows[0] || null
            });
        } catch (error) {
            console.error('❌ [getLastByPaiement] Erreur:', error);
            return res.status(500).json({
                success: false,
                message: 'Erreur: ' + error.message
            });
        }
    }

    /**
     * Créer une validation
     * POST /api/admin/paiement-validation
     */
    static async create(req, res) {
        try {
            const { paiement_id, statut = 'en_attente', commentaire } = req.body;
            const validePar = req.user?.id || 9;

            if (!paiement_id) {
                return res.status(400).json({
                    success: false,
                    message: 'paiement_id requis'
                });
            }

            const [result] = await db.query(
                `INSERT INTO paiement_validation 
                    (paiement_id, valide_par, statut, date_validation, commentaire)
                 VALUES (?, ?, ?, NOW(), ?)`,
                [paiement_id, validePar, statut, commentaire]
            );

            // Mettre à jour le statut du paiement
            await db.query(
                `UPDATE paiement SET statut_paiement = ?, updated_at = NOW() WHERE id = ?`,
                [statut, paiement_id]
            );

            return res.status(201).json({
                success: true,
                message: 'Validation créée avec succès',
                data: { id: result.insertId }
            });
        } catch (error) {
            console.error('❌ [create] Erreur:', error);
            return res.status(500).json({
                success: false,
                message: 'Erreur: ' + error.message
            });
        }
    }

    /**
     * Supprimer une validation
     * DELETE /api/admin/paiement-validation/:id
     */
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
                    message: 'Validation supprimée avec succès'
                });
            } else {
                return res.status(404).json({
                    success: false,
                    message: 'Validation non trouvée'
                });
            }
        } catch (error) {
            console.error('❌ [delete] Erreur:', error);
            return res.status(500).json({
                success: false,
                message: 'Erreur: ' + error.message
            });
        }
    }
}

module.exports = PaiementValidationController;