// controllers/cmplUserController.js
const db = require('../config/database');

// ============================================================
// FONCTION UTILITAIRE : Vérifier si l'utilisateur existe
// ============================================================
async function checkAdherentExists(adherentId) {
    const [rows] = await db.query(
        'SELECT id FROM adherent WHERE id = ?',
        [adherentId]
    );
    return rows.length > 0;
}

// ============================================================
// FONCTION UTILITAIRE : Vérifier si la formation existe
// ============================================================
async function checkFormationExists(formationId) {
    const [rows] = await db.query(
        'SELECT id, id_categorie FROM formation WHERE id = ?',
        [formationId]
    );
    return rows.length > 0 ? rows[0] : null;
}

// ============================================================
// 1. VÉRIFIER SI L'UTILISATEUR A DÉJÀ COMPLÉTÉ SES INFOS (GET)
// ============================================================
exports.checkCmplExists = async (req, res) => {
    const { adherentId, formationId } = req.params;

    console.log(`🔍 [checkCmplExists] Vérification pour adherentId: ${adherentId}, formationId: ${formationId}`);

    if (!adherentId || !formationId) {
        return res.status(400).json({
            success: false,
            error: 'AdherentId et FormationId requis'
        });
    }

    try {
        // Vérifier si l'adhérent existe
        const adherentExists = await checkAdherentExists(adherentId);
        if (!adherentExists) {
            return res.status(404).json({
                success: false,
                error: 'Adhérent non trouvé'
            });
        }

        // Vérifier si la formation existe
        const formation = await checkFormationExists(formationId);
        if (!formation) {
            return res.status(404).json({
                success: false,
                error: 'Formation non trouvée'
            });
        }

        const [rows] = await db.query(
            `SELECT id FROM cmpl_user WHERE adherent_id = ? AND formation_id = ?`,
            [adherentId, formationId]
        );

        console.log(`✅ [checkCmplExists] Existe: ${rows.length > 0}`);

        res.json({
            success: true,
            exists: rows.length > 0,
            cmplId: rows.length > 0 ? rows[0].id : null
        });
    } catch (error) {
        console.error('❌ [checkCmplExists] Erreur:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur serveur: ' + error.message
        });
    }
};

// ============================================================
// 2. RÉCUPÉRER LES INFOS COMPLÉMENTAIRES (GET)
// ============================================================
exports.getCmplInfo = async (req, res) => {
    const { adherentId, formationId } = req.params;

    console.log(`🔍 [getCmplInfo] Récupération pour adherentId: ${adherentId}, formationId: ${formationId}`);

    if (!adherentId || !formationId) {
        return res.status(400).json({
            success: false,
            error: 'AdherentId et FormationId requis'
        });
    }

    try {
        const [rows] = await db.query(
            `SELECT * FROM cmpl_user WHERE adherent_id = ? AND formation_id = ?`,
            [adherentId, formationId]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Informations non trouvées'
            });
        }

        console.log(`✅ [getCmplInfo] Informations récupérées avec succès`);

        res.json({
            success: true,
            data: rows[0]
        });
    } catch (error) {
        console.error('❌ [getCmplInfo] Erreur:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur serveur: ' + error.message
        });
    }
};

// ============================================================
// 3. SAUVEGARDER LES INFOS COMPLÉMENTAIRES (POST)
// ============================================================
exports.saveCmplInfo = async (req, res) => {
    const { adherentId, formationId } = req.params;
    const {
        niveauMemorisation,
        niveauMemorisationAutre,
        souratesOuDjouzMaitrises,
        rythmeMemorisationHebdo,
        rythmeMemorisationHebdoAutre,
        etudeTajwidTheorique,
        riwayaSouhaitee,
        riwayaSouhaiteeAutre,
        lectureMushaf,
        aIjaza,
        detailsIjaza,
        objectifPrincipal,
        creneauHoraire,
        parcoursPrefere
    } = req.body;

    console.log(`📝 [saveCmplInfo] Sauvegarde pour adherentId: ${adherentId}, formationId: ${formationId}`);
    console.log('📝 [saveCmplInfo] Données reçues:', req.body);

    if (!adherentId || !formationId) {
        return res.status(400).json({
            success: false,
            error: 'AdherentId et FormationId requis'
        });
    }

    try {
        // Vérifier si l'adhérent existe
        const adherentExists = await checkAdherentExists(adherentId);
        if (!adherentExists) {
            return res.status(404).json({
                success: false,
                error: 'Adhérent non trouvé'
            });
        }

        // Vérifier si la formation existe
        const formation = await checkFormationExists(formationId);
        if (!formation) {
            return res.status(404).json({
                success: false,
                error: 'Formation non trouvée'
            });
        }

        // Vérifier si la formation est religieuse (catégorie ID = 1)
        if (formation.id_categorie !== 1) {
            return res.status(400).json({
                success: false,
                error: 'Cette formation n\'est pas religieuse, les informations complémentaires ne sont pas requises'
            });
        }

        // Vérifier si les infos existent déjà
        const [existing] = await db.query(
            `SELECT id FROM cmpl_user WHERE adherent_id = ? AND formation_id = ?`,
            [adherentId, formationId]
        );

        let result;

        if (existing.length > 0) {
            // UPDATE
            [result] = await db.query(
                `UPDATE cmpl_user SET
                    niveau_memorisation = ?,
                    niveau_memorisation_autre = ?,
                    sourates_ou_djouz_maitrises = ?,
                    rythme_memorisation_hebdo = ?,
                    rythme_memorisation_hebdo_autre = ?,
                    etude_tajwid_theorique = ?,
                    riwaya_souhaitee = ?,
                    riwaya_souhaitee_autre = ?,
                    lecture_mushaf = ?,
                    a_ijaza = ?,
                    details_ijaza = ?,
                    objectif_principal = ?,
                    creneau_horaire = ?,
                    parcours_prefere = ?,
                    updated_at = NOW()
                WHERE adherent_id = ? AND formation_id = ?`,
                [
                    niveauMemorisation || 'debutant',
                    niveauMemorisationAutre || null,
                    souratesOuDjouzMaitrises || null,
                    rythmeMemorisationHebdo || null,
                    rythmeMemorisationHebdoAutre || null,
                    etudeTajwidTheorique ? 1 : 0,
                    riwayaSouhaitee || 'hafs',
                    riwayaSouhaiteeAutre || null,
                    lectureMushaf || 'madinah',
                    aIjaza ? 1 : 0,
                    detailsIjaza || null,
                    objectifPrincipal || null,
                    creneauHoraire || 'flexible',
                    parcoursPrefere || 'dynamique',
                    adherentId,
                    formationId
                ]
            );

            console.log(`✅ [saveCmplInfo] Informations mises à jour pour l'ID: ${existing[0].id}`);

            return res.json({
                success: true,
                message: 'Informations mises à jour avec succès',
                cmplId: existing[0].id
            });
        } else {
            // INSERT
            [result] = await db.query(
                `INSERT INTO cmpl_user (
                    adherent_id,
                    formation_id,
                    niveau_memorisation,
                    niveau_memorisation_autre,
                    sourates_ou_djouz_maitrises,
                    rythme_memorisation_hebdo,
                    rythme_memorisation_hebdo_autre,
                    etude_tajwid_theorique,
                    riwaya_souhaitee,
                    riwaya_souhaitee_autre,
                    lecture_mushaf,
                    a_ijaza,
                    details_ijaza,
                    objectif_principal,
                    creneau_horaire,
                    parcours_prefere
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    adherentId,
                    formationId,
                    niveauMemorisation || 'debutant',
                    niveauMemorisationAutre || null,
                    souratesOuDjouzMaitrises || null,
                    rythmeMemorisationHebdo || null,
                    rythmeMemorisationHebdoAutre || null,
                    etudeTajwidTheorique ? 1 : 0,
                    riwayaSouhaitee || 'hafs',
                    riwayaSouhaiteeAutre || null,
                    lectureMushaf || 'madinah',
                    aIjaza ? 1 : 0,
                    detailsIjaza || null,
                    objectifPrincipal || null,
                    creneauHoraire || 'flexible',
                    parcoursPrefere || 'dynamique'
                ]
            );

            console.log(`✅ [saveCmplInfo] Nouvelles informations créées avec l'ID: ${result.insertId}`);

            return res.status(201).json({
                success: true,
                message: 'Informations enregistrées avec succès',
                cmplId: result.insertId
            });
        }
    } catch (error) {
        console.error('❌ [saveCmplInfo] Erreur:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur serveur: ' + error.message
        });
    }
};

// ============================================================
// 4. METTRE À JOUR LES INFOS COMPLÉMENTAIRES (PUT)
// ============================================================
exports.updateCmplInfo = async (req, res) => {
    const { adherentId, formationId } = req.params;
    const {
        niveauMemorisation,
        niveauMemorisationAutre,
        souratesOuDjouzMaitrises,
        rythmeMemorisationHebdo,
        rythmeMemorisationHebdoAutre,
        etudeTajwidTheorique,
        riwayaSouhaitee,
        riwayaSouhaiteeAutre,
        lectureMushaf,
        aIjaza,
        detailsIjaza,
        objectifPrincipal,
        creneauHoraire,
        parcoursPrefere
    } = req.body;

    console.log(`📝 [updateCmplInfo] Mise à jour pour adherentId: ${adherentId}, formationId: ${formationId}`);

    if (!adherentId || !formationId) {
        return res.status(400).json({
            success: false,
            error: 'AdherentId et FormationId requis'
        });
    }

    try {
        // Vérifier si les infos existent
        const [existing] = await db.query(
            `SELECT id FROM cmpl_user WHERE adherent_id = ? AND formation_id = ?`,
            [adherentId, formationId]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Informations non trouvées'
            });
        }

        await db.query(
            `UPDATE cmpl_user SET
                niveau_memorisation = ?,
                niveau_memorisation_autre = ?,
                sourates_ou_djouz_maitrises = ?,
                rythme_memorisation_hebdo = ?,
                rythme_memorisation_hebdo_autre = ?,
                etude_tajwid_theorique = ?,
                riwaya_souhaitee = ?,
                riwaya_souhaitee_autre = ?,
                lecture_mushaf = ?,
                a_ijaza = ?,
                details_ijaza = ?,
                objectif_principal = ?,
                creneau_horaire = ?,
                parcours_prefere = ?,
                updated_at = NOW()
            WHERE adherent_id = ? AND formation_id = ?`,
            [
                niveauMemorisation || 'debutant',
                niveauMemorisationAutre || null,
                souratesOuDjouzMaitrises || null,
                rythmeMemorisationHebdo || null,
                rythmeMemorisationHebdoAutre || null,
                etudeTajwidTheorique ? 1 : 0,
                riwayaSouhaitee || 'hafs',
                riwayaSouhaiteeAutre || null,
                lectureMushaf || 'madinah',
                aIjaza ? 1 : 0,
                detailsIjaza || null,
                objectifPrincipal || null,
                creneauHoraire || 'flexible',
                parcoursPrefere || 'dynamique',
                adherentId,
                formationId
            ]
        );

        console.log(`✅ [updateCmplInfo] Informations mises à jour pour l'ID: ${existing[0].id}`);

        res.json({
            success: true,
            message: 'Informations mises à jour avec succès',
            cmplId: existing[0].id
        });
    } catch (error) {
        console.error('❌ [updateCmplInfo] Erreur:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur serveur: ' + error.message
        });
    }
};

// ============================================================
// 5. SUPPRIMER LES INFOS COMPLÉMENTAIRES (DELETE)
// ============================================================
exports.deleteCmplInfo = async (req, res) => {
    const { adherentId, formationId } = req.params;

    console.log(`🗑️ [deleteCmplInfo] Suppression pour adherentId: ${adherentId}, formationId: ${formationId}`);

    if (!adherentId || !formationId) {
        return res.status(400).json({
            success: false,
            error: 'AdherentId et FormationId requis'
        });
    }

    try {
        const [result] = await db.query(
            `DELETE FROM cmpl_user WHERE adherent_id = ? AND formation_id = ?`,
            [adherentId, formationId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                error: 'Informations non trouvées'
            });
        }

        console.log(`✅ [deleteCmplInfo] Informations supprimées avec succès`);

        res.json({
            success: true,
            message: 'Informations supprimées avec succès'
        });
    } catch (error) {
        console.error('❌ [deleteCmplInfo] Erreur:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur serveur: ' + error.message
        });
    }
};

// ============================================================
// 6. VÉRIFIER SI LA FORMATION EST RELIGIEUSE (GET)
// ============================================================
exports.isFormationReligieuse = async (req, res) => {
    const { formationId } = req.params;

    console.log(`🔍 [isFormationReligieuse] Vérification pour formationId: ${formationId}`);

    if (!formationId) {
        return res.status(400).json({
            success: false,
            error: 'FormationId requis'
        });
    }

    try {
        const formation = await checkFormationExists(formationId);
        if (!formation) {
            return res.status(404).json({
                success: false,
                error: 'Formation non trouvée'
            });
        }

        const isReligieuse = formation.id_categorie === 1;

        console.log(`✅ [isFormationReligieuse] Résultat: ${isReligieuse}`);

        res.json({
            success: true,
            isReligieuse: isReligieuse,
            categorieId: formation.id_categorie
        });
    } catch (error) {
        console.error('❌ [isFormationReligieuse] Erreur:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur serveur: ' + error.message
        });
    }
};

module.exports = exports;