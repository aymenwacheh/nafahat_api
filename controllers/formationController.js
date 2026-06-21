// nafahat_api/controllers/formationController.js
const db = require('../config/database');

// Récupérer toutes les formations
const getAllFormations = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM v_formation_complete');
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};

// Récupérer une formation par ID
const getFormationById = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await db.query('SELECT * FROM v_formation_complete WHERE id = ?', [id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Formation non trouvée' });
        }
        
        res.json({ success: true, data: rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};

// ✅ Créer une formation
const createFormation = async (req, res) => {
    try {
        const {
            titre_fr,
            titre_ar,
            type,
            cible_fr,
            cible_ar,
            duree,
            periode,
            prix,
            discount,
            valeur_disc,
            descri_fr,
            descri_ar,
            id_categorie,
            id_formateur,
            photo
        } = req.body;

        if (!titre_fr || !titre_ar || !type || !cible_fr || !duree || !prix || !descri_fr || !descri_ar) {
            return res.status(400).json({
                success: false,
                message: 'Champs obligatoires manquants',
                missing: { titre_fr, titre_ar, type, cible_fr, duree, prix, descri_fr, descri_ar }
            });
        }

        const [result] = await db.query(
            `INSERT INTO formation 
            (titre_fr, titre_ar, type, cible_fr, cible_ar, duree, periode, 
             prix, discount, valeur_disc, descri_fr, descri_ar, id_categorie, id_formateur, photo, actif) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'oui')`,
            [
                titre_fr,
                titre_ar,
                type,
                cible_fr || titre_fr,
                cible_ar || titre_ar,
                duree,
                periode || 'À définir',
                prix,
                discount || 'non',
                valeur_disc || null,
                descri_fr,
                descri_ar,
                id_categorie || null,
                id_formateur || null,
                photo || null
            ]
        );

        res.json({ 
            success: true, 
            message: 'Formation créée avec succès',
            id: result.insertId 
        });
    } catch (error) {
        console.error('Erreur createFormation:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erreur serveur',
            error: error.sqlMessage || error.message
        });
    }
};

// ✅ Mettre à jour une formation (CORRIGÉ)
const updateFormation = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            titre_fr,
            titre_ar,
            type,
            cible_fr,
            cible_ar,
            duree,
            periode,
            prix,
            discount,
            valeur_disc,
            descri_fr,
            descri_ar,
            id_categorie,
            id_formateur,
            photo,
            actif
        } = req.body;

        // Vérifier si la formation existe
        const [existing] = await db.query('SELECT id FROM formation WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ success: false, message: 'Formation non trouvée' });
        }

        const [result] = await db.query(
            `UPDATE formation SET 
                titre_fr = ?, 
                titre_ar = ?, 
                type = ?, 
                cible_fr = ?, 
                cible_ar = ?, 
                duree = ?, 
                periode = ?, 
                prix = ?, 
                discount = ?, 
                valeur_disc = ?, 
                descri_fr = ?, 
                descri_ar = ?, 
                id_categorie = ?, 
                id_formateur = ?, 
                photo = ?,
                actif = ?
            WHERE id = ?`,
            [
                titre_fr,
                titre_ar,
                type,
                cible_fr || titre_fr,
                cible_ar || titre_ar,
                duree,
                periode || 'À définir',
                prix,
                discount || 'non',
                valeur_disc || null,
                descri_fr,
                descri_ar,
                id_categorie || null,
                id_formateur || null,
                photo || null,
                actif || 'oui',
                id
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Formation non trouvée' });
        }

        res.json({ 
            success: true, 
            message: 'Formation mise à jour avec succès',
            id: id
        });
    } catch (error) {
        console.error('Erreur updateFormation:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erreur serveur',
            error: error.sqlMessage || error.message
        });
    }
};

// ✅ Supprimer une formation (soft delete)
const deleteFormation = async (req, res) => {
    try {
        const { id } = req.params;

        const [existing] = await db.query('SELECT id FROM formation WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ success: false, message: 'Formation non trouvée' });
        }

        const [result] = await db.query('UPDATE formation SET actif = "non" WHERE id = ?', [id]);

        res.json({ 
            success: true, 
            message: 'Formation désactivée avec succès' 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};

// ✅ Supprimer définitivement une formation (hard delete)
const hardDeleteFormation = async (req, res) => {
    try {
        const { id } = req.params;

        const [existing] = await db.query('SELECT id FROM formation WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ success: false, message: 'Formation non trouvée' });
        }

        const [result] = await db.query('DELETE FROM formation WHERE id = ?', [id]);

        res.json({ 
            success: true, 
            message: 'Formation supprimée définitivement' 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};

// Récupérer les formations actives
const getActiveFormations = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM v_formation_complete WHERE actif = "oui" ORDER BY created_at DESC');
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};

// Récupérer les formations avec discount
const getFormationsWithDiscount = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM v_formations_promo');
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};

// Récupérer les formations par catégorie
const getFormationsByCategorie = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await db.query(
            'SELECT * FROM v_formation_complete WHERE id_categorie = ? AND actif = "oui"',
            [id]
        );
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};

// ✅ Récupérer toutes les formations (incluant inactives) pour admin
const getAllFormationsAdmin = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM v_formation_complete ORDER BY created_at DESC');
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