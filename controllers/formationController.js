// nafahat_api/controllers/formationController.js
const db = require('../config/database');

const getAllFormations = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT f.*, 
                   tf.type_formation,
                   d.type_duree,
                   c.categorie_fr, c.categorie_ar,
                   form.nom_prenom_fr as formateur_nom_fr,
                   form.nom_prenom_ar as formateur_nom_ar,
                   CASE 
                       WHEN f.discount = 'oui' AND f.valeur_disc IS NOT NULL THEN f.prix - f.valeur_disc
                       ELSE f.prix
                   END as prix_final
            FROM formation f
            LEFT JOIN type_formation tf ON f.id_type_formation = tf.id
            LEFT JOIN duree d ON f.id_duree = d.id
            LEFT JOIN categorie c ON f.id_categorie = c.id
            LEFT JOIN formateur form ON f.id_formateur = form.id
            ORDER BY f.created_at DESC
        `);
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};

const getFormationById = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await db.query(`
            SELECT f.*, 
                   tf.type_formation,
                   d.type_duree,
                   c.categorie_fr, c.categorie_ar,
                   form.nom_prenom_fr as formateur_nom_fr,
                   form.nom_prenom_ar as formateur_nom_ar,
                   CASE 
                       WHEN f.discount = 'oui' AND f.valeur_disc IS NOT NULL THEN f.prix - f.valeur_disc
                       ELSE f.prix
                   END as prix_final
            FROM formation f
            LEFT JOIN type_formation tf ON f.id_type_formation = tf.id
            LEFT JOIN duree d ON f.id_duree = d.id
            LEFT JOIN categorie c ON f.id_categorie = c.id
            LEFT JOIN formateur form ON f.id_formateur = form.id
            WHERE f.id = ?
        `, [id]);
        if (rows.length === 0) return res.status(404).json({ success: false, message: 'Formation non trouvée' });
        res.json({ success: true, data: rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};

const createFormation = async (req, res) => {
    try {
        const {
            titre_fr,
            titre_ar,
            id_type_formation,
            cible_fr,
            cible_ar,
            id_duree,
            date_debut,
            date_fin,
            prix,
            discount,
            valeur_disc,
            descri_fr,
            descri_ar,
            id_categorie,
            id_formateur,
            photo,
            nbr_heur,
            nbr_seance,
            nbr_jour,
            repetitive,
            jour_semaine
        } = req.body;

        console.log('📝 [createFormation] Données reçues:', {
            titre_fr,
            titre_ar,
            id_type_formation,
            id_duree,
            nbr_heur,
            nbr_seance,
            nbr_jour,
            repetitive,
            jour_semaine
        });

        if (!titre_fr || !titre_ar || !id_type_formation || !cible_fr || !id_duree || !prix || !descri_fr || !descri_ar) {
            return res.status(400).json({
                success: false,
                message: 'Champs obligatoires manquants'
            });
        }

        let periode = null;
        if (date_debut && date_fin) {
            periode = `${date_debut} - ${date_fin}`;
        }

        const [result] = await db.query(
            `INSERT INTO formation (
                titre_fr, titre_ar, id_type_formation, cible_fr, cible_ar, id_duree, periode, date_debut, date_fin,
                prix, discount, valeur_disc, descri_fr, descri_ar, id_categorie, id_formateur, photo, actif,
                nbr_heur, nbr_seance, nbr_jour, repetitive, jour_semaine
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'oui', ?, ?, ?, ?, ?)`,
            [
                titre_fr,
                titre_ar,
                id_type_formation,
                cible_fr || titre_fr,
                cible_ar || titre_ar,
                id_duree,
                periode,
                date_debut || null,
                date_fin || null,
                prix,
                discount || 'non',
                valeur_disc || null,
                descri_fr,
                descri_ar,
                id_categorie || null,
                id_formateur || null,
                photo || null,
                nbr_heur ?? 0,
                nbr_seance ?? 0,
                nbr_jour ?? 0,
                repetitive ?? 'non',
                jour_semaine ?? null
            ]
        );

        console.log(`✅ [createFormation] Formation créée avec l'ID: ${result.insertId}`);
        res.json({ success: true, message: 'Formation créée avec succès', id: result.insertId });
    } catch (error) {
        console.error('❌ Erreur createFormation:', error);
        res.status(500).json({ success: false, message: 'Erreur serveur', error: error.sqlMessage || error.message });
    }
};

const updateFormation = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            titre_fr,
            titre_ar,
            id_type_formation,
            cible_fr,
            cible_ar,
            id_duree,
            date_debut,
            date_fin,
            prix,
            discount,
            valeur_disc,
            descri_fr,
            descri_ar,
            id_categorie,
            id_formateur,
            photo,
            actif,
            nbr_heur,
            nbr_seance,
            nbr_jour,
            repetitive,
            jour_semaine
        } = req.body;

        console.log(`📝 [updateFormation] Mise à jour formation ID: ${id}`);

        const [existing] = await db.query('SELECT id FROM formation WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ success: false, message: 'Formation non trouvée' });
        }

        let periode = null;
        if (date_debut && date_fin) {
            periode = `${date_debut} - ${date_fin}`;
        }

        const [result] = await db.query(
            `UPDATE formation SET 
                titre_fr = ?, titre_ar = ?, id_type_formation = ?, 
                cible_fr = ?, cible_ar = ?, id_duree = ?, periode = ?,
                date_debut = ?, date_fin = ?, prix = ?, 
                discount = ?, valeur_disc = ?, descri_fr = ?, descri_ar = ?, 
                id_categorie = ?, id_formateur = ?, photo = ?, actif = ?,
                nbr_heur = ?, nbr_seance = ?, nbr_jour = ?, repetitive = ?, jour_semaine = ?
            WHERE id = ?`,
            [
                titre_fr,
                titre_ar,
                id_type_formation,
                cible_fr || titre_fr,
                cible_ar || titre_ar,
                id_duree,
                periode,
                date_debut || null,
                date_fin || null,
                prix,
                discount || 'non',
                valeur_disc || null,
                descri_fr,
                descri_ar,
                id_categorie || null,
                id_formateur || null,
                photo || null,
                actif || 'oui',
                nbr_heur ?? 0,
                nbr_seance ?? 0,
                nbr_jour ?? 0,
                repetitive ?? 'non',
                jour_semaine ?? null,
                id
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Formation non trouvée' });
        }

        console.log(`✅ [updateFormation] Formation ID ${id} mise à jour avec succès`);
        res.json({ success: true, message: 'Formation mise à jour avec succès', id });
    } catch (error) {
        console.error('❌ Erreur updateFormation:', error);
        res.status(500).json({ success: false, message: 'Erreur serveur', error: error.sqlMessage || error.message });
    }
};

const deleteFormation = async (req, res) => {
    try {
        const { id } = req.params;
        const [existing] = await db.query('SELECT id FROM formation WHERE id = ?', [id]);
        if (existing.length === 0) return res.status(404).json({ success: false, message: 'Formation non trouvée' });
        await db.query('UPDATE formation SET actif = "non" WHERE id = ?', [id]);
        res.json({ success: true, message: 'Formation désactivée avec succès' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};

const hardDeleteFormation = async (req, res) => {
    try {
        const { id } = req.params;
        const [existing] = await db.query('SELECT id FROM formation WHERE id = ?', [id]);
        if (existing.length === 0) return res.status(404).json({ success: false, message: 'Formation non trouvée' });
        await db.query('DELETE FROM formation WHERE id = ?', [id]);
        res.json({ success: true, message: 'Formation supprimée définitivement' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};

const getActiveFormations = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT f.*, 
                   tf.type_formation,
                   d.type_duree,
                   c.categorie_fr, c.categorie_ar,
                   form.nom_prenom_fr as formateur_nom_fr,
                   form.nom_prenom_ar as formateur_nom_ar,
                   CASE 
                       WHEN f.discount = 'oui' AND f.valeur_disc IS NOT NULL THEN f.prix - f.valeur_disc
                       ELSE f.prix
                   END as prix_final
            FROM formation f
            LEFT JOIN type_formation tf ON f.id_type_formation = tf.id
            LEFT JOIN duree d ON f.id_duree = d.id
            LEFT JOIN categorie c ON f.id_categorie = c.id
            LEFT JOIN formateur form ON f.id_formateur = form.id
            WHERE f.actif = 'oui'
            ORDER BY f.created_at DESC
        `);
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};

const getFormationsWithDiscount = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT f.*, 
                   tf.type_formation,
                   d.type_duree,
                   c.categorie_fr, c.categorie_ar,
                   form.nom_prenom_fr as formateur_nom_fr,
                   form.nom_prenom_ar as formateur_nom_ar,
                   CASE 
                       WHEN f.discount = 'oui' AND f.valeur_disc IS NOT NULL THEN f.prix - f.valeur_disc
                       ELSE f.prix
                   END as prix_final
            FROM formation f
            LEFT JOIN type_formation tf ON f.id_type_formation = tf.id
            LEFT JOIN duree d ON f.id_duree = d.id
            LEFT JOIN categorie c ON f.id_categorie = c.id
            LEFT JOIN formateur form ON f.id_formateur = form.id
            WHERE f.discount = 'oui' AND f.actif = 'oui'
            ORDER BY prix_final ASC
        `);
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};

const getFormationsByCategorie = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await db.query(`
            SELECT f.*, 
                   tf.type_formation,
                   d.type_duree,
                   c.categorie_fr, c.categorie_ar,
                   form.nom_prenom_fr as formateur_nom_fr,
                   form.nom_prenom_ar as formateur_nom_ar,
                   CASE 
                       WHEN f.discount = 'oui' AND f.valeur_disc IS NOT NULL THEN f.prix - f.valeur_disc
                       ELSE f.prix
                   END as prix_final
            FROM formation f
            LEFT JOIN type_formation tf ON f.id_type_formation = tf.id
            LEFT JOIN duree d ON f.id_duree = d.id
            LEFT JOIN categorie c ON f.id_categorie = c.id
            LEFT JOIN formateur form ON f.id_formateur = form.id
            WHERE f.id_categorie = ? AND f.actif = 'oui'
        `, [id]);
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};

const getAllFormationsAdmin = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT f.*, 
                   tf.type_formation,
                   d.type_duree,
                   c.categorie_fr, c.categorie_ar,
                   form.nom_prenom_fr as formateur_nom_fr,
                   form.nom_prenom_ar as formateur_nom_ar,
                   CASE 
                       WHEN f.discount = 'oui' AND f.valeur_disc IS NOT NULL THEN f.prix - f.valeur_disc
                       ELSE f.prix
                   END as prix_final
            FROM formation f
            LEFT JOIN type_formation tf ON f.id_type_formation = tf.id
            LEFT JOIN duree d ON f.id_duree = d.id
            LEFT JOIN categorie c ON f.id_categorie = c.id
            LEFT JOIN formateur form ON f.id_formateur = form.id
            ORDER BY f.created_at DESC
        `);
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};

module.exports = {
    getAllFormations,
    getFormationById,
    createFormation,
    updateFormation,
    deleteFormation,
    hardDeleteFormation,
    getActiveFormations,
    getFormationsWithDiscount,
    getFormationsByCategorie,
    getAllFormationsAdmin
};