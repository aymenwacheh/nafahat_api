// models/PaiementValidation.js

const db = require('../config/database');

class PaiementValidation {
    
    static async getPaginated({
        page = 1,
        perPage = 15,
        status = null,
        modalite = null,
        search = null,
        sortBy = 'p.created_at',
        sortDesc = true
    }) {
        const offset = (page - 1) * perPage;
        let params = [];
        let where = [];

        if (status && status !== 'tous') {
            where.push('p.statut_paiement = ?');
            params.push(status);
        }

        if (modalite && modalite !== 'toutes') {
            where.push('p.modalite_paiement = ?');
            params.push(modalite);
        }

        if (search) {
            where.push(`(
                p.adherent_nom_prenom LIKE ? OR
                p.adherent_whatsapp LIKE ? OR
                p.formation_titre_fr LIKE ? OR
                p.reference_paiement LIKE ?
            )`);
            const searchPattern = `%${search}%`;
            params.push(searchPattern, searchPattern, searchPattern, searchPattern);
        }

        const whereClause = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';
        const orderClause = `ORDER BY ${sortBy} ${sortDesc ? 'DESC' : 'ASC'}`;

        // Total
        const [countResult] = await db.query(
            `SELECT COUNT(*) as total FROM paiement p ${whereClause}`,
            params
        );
        const total = countResult[0].total;

        // ✅ FORCER LA CONVERSION DES PRIX DANS LA REQUÊTE SQL
        const [rows] = await db.query(
            `SELECT 
                p.id AS paiement_id,
                p.adherent_id,
                p.adherent_nom_prenom,
                p.adherent_whatsapp,
                p.formation_id,
                p.formation_titre_fr,
                p.formation_titre_ar,
                CAST(p.formation_prix AS DECIMAL(10,2)) AS formation_prix,
                p.formation_devise,
                p.modalite_paiement,
                CAST(p.montant_paye AS DECIMAL(10,2)) AS montant_paye,
                p.reference_paiement,
                p.url_quittance,
                p.numero_quittance,
                p.statut_paiement,
                p.commentaire,
                p.created_at AS paiement_created_at,
                p.updated_at AS paiement_updated_at,
                pv.id AS validation_id,
                pv.valide_par AS validateur_id,
                pv.statut AS validation_statut,
                pv.date_validation,
                pv.commentaire AS validation_commentaire,
                pv.created_at AS validation_created_at,
                a.nom_prenom AS validateur_nom,
                a.whatsapp AS validateur_whatsapp
            FROM paiement p
            LEFT JOIN paiement_validation pv ON p.id = pv.paiement_id
            LEFT JOIN adherent a ON pv.valide_par = a.id
            ${whereClause}
            ${orderClause}
            LIMIT ? OFFSET ?`,
            [...params, perPage, offset]
        );

        // ✅ Vérifier et convertir les prix en nombre
        const formattedData = rows.map(row => ({
            ...row,
            // ✅ Convertir les prix en nombre (sécurité supplémentaire)
            formation_prix: typeof row.formation_prix === 'string' 
                ? parseFloat(row.formation_prix) 
                : row.formation_prix !== null ? parseFloat(row.formation_prix) : 0,
            montant_paye: typeof row.montant_paye === 'string'
                ? parseFloat(row.montant_paye)
                : row.montant_paye !== null ? parseFloat(row.montant_paye) : 0,
            // ✅ Convertir les IDs en nombre
            paiement_id: parseInt(row.paiement_id),
            adherent_id: parseInt(row.adherent_id),
            formation_id: parseInt(row.formation_id),
            validation_id: row.validation_id ? parseInt(row.validation_id) : null,
            validateur_id: row.validateur_id ? parseInt(row.validateur_id) : null,
            // ✅ Convertir les dates
            paiement_created_at: row.paiement_created_at || null,
            paiement_updated_at: row.paiement_updated_at || null,
            date_validation: row.date_validation || null,
            validation_created_at: row.validation_created_at || null,
        }));

        return {
            data: formattedData,
            pagination: {
                currentPage: page,
                perPage: perPage,
                total: total,
                totalPages: Math.ceil(total / perPage)
            }
        };
    }

    static async getStats() {
        // ✅ Forcer la conversion des montants en DECIMAL
        const [result] = await db.query(`
            SELECT 
                COUNT(*) as total_validations,
                SUM(CASE WHEN statut_paiement = 'en_attente' THEN 1 ELSE 0 END) as en_attente,
                SUM(CASE WHEN statut_paiement = 'valide' THEN 1 ELSE 0 END) as valides,
                SUM(CASE WHEN statut_paiement = 'refuse' THEN 1 ELSE 0 END) as refuses,
                SUM(CASE WHEN statut_paiement = 'annule' THEN 1 ELSE 0 END) as annules,
                COUNT(DISTINCT adherent_id) as paiements_traites,
                SUM(CAST(montant_paye AS DECIMAL(10,2))) as montant_total
            FROM paiement
        `);
        
        const stats = result[0] || {};
        return {
            total_validations: parseInt(stats.total_validations) || 0,
            en_attente: parseInt(stats.en_attente) || 0,
            valides: parseInt(stats.valides) || 0,
            refuses: parseInt(stats.refuses) || 0,
            annules: parseInt(stats.annules) || 0,
            paiements_traites: parseInt(stats.paiements_traites) || 0,
            montant_total: parseFloat(stats.montant_total) || 0
        };
    }

    static async updateStatus(paiementId, statut, validePar = null, commentaire = null) {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            await connection.query(
                `UPDATE paiement SET statut_paiement = ?, updated_at = NOW() WHERE id = ?`,
                [statut, paiementId]
            );

            const [result] = await connection.query(
                `INSERT INTO paiement_validation 
                    (paiement_id, valide_par, statut, date_validation, commentaire)
                 VALUES (?, ?, ?, NOW(), ?)`,
                [paiementId, validePar, statut, commentaire]
            );

            await connection.commit();
            return result.insertId;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    static async getByPaiementId(paiementId) {
        const [rows] = await db.query(
            `SELECT * FROM paiement_validation WHERE paiement_id = ? ORDER BY created_at DESC`,
            [paiementId]
        );
        return rows.map(row => ({
            ...row,
            id: parseInt(row.id),
            paiement_id: parseInt(row.paiement_id),
            valide_par: row.valide_par ? parseInt(row.valide_par) : null,
        }));
    }

    static async delete(validationId) {
        const [result] = await db.query(
            'DELETE FROM paiement_validation WHERE id = ?',
            [validationId]
        );
        return result.affectedRows > 0;
    }
}

module.exports = PaiementValidation;