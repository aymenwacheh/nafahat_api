// nafahat_api/controllers/formateurController.js
const db = require('../config/database');

// Récupérer tous les formateurs
const getAllFormateurs = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT f.*, c.categorie_fr, c.categorie_ar 
            FROM formateur f
            LEFT JOIN categorie c ON f.id_categorie = c.id
            ORDER BY f.id DESC
        `);
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};

// Récupérer un formateur par ID
const getFormateurById = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await db.query(`
            SELECT f.*, c.categorie_fr, c.categorie_ar 
            FROM formateur f
            LEFT JOIN categorie c ON f.id_categorie = c.id
            WHERE f.id = ?
        `, [id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Formateur non trouvé' });
        }
        
        res.json({ success: true, data: rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};

// Créer un formateur
const createFormateur = async (req, res) => {
    try {
        const {
            nom_prenom_fr,
            nom_prenom_ar,
            email,
            telephone,
            bio_fr,
            bio_ar,
            id_categorie,
            photo
        } = req.body;

        if (!nom_prenom_fr || !nom_prenom_ar) {
            return res.status(400).json({
                success: false,
                message: 'Les champs nom_prenom_fr et nom_prenom_ar sont requis'
            });
        }

        const [result] = await db.query(
            `INSERT INTO formateur 
            (nom_prenom_fr, nom_prenom_ar, email, telephone, bio_fr, bio_ar, id_categorie, photo) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [nom_prenom_fr, nom_prenom_ar, email, telephone, bio_fr, bio_ar, id_categorie, photo || null]
        );

        res.status(201).json({
            success: true,
            message: 'Formateur créé avec succès',
            id: result.insertId
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};

// Mettre à jour un formateur
const updateFormateur = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const [result] = await db.query('UPDATE formateur SET ? WHERE id = ?', [updates, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Formateur non trouvé' });
        }

        res.json({ success: true, message: 'Formateur mis à jour avec succès' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};

// Supprimer un formateur
const deleteFormateur = async (req, res) => {
    try {
        const { id } = req.params;

        // Vérifier si des formations utilisent ce formateur
        const [formations] = await db.query(
            'SELECT COUNT(*) as count FROM formation WHERE id_formateur = ?',
            [id]
        );

        if (formations[0].count > 0) {
            return res.status(400).json({
                success: false,
                message: 'Ce formateur est utilisé par des formations, suppression impossible'
            });
        }

        const [result] = await db.query('DELETE FROM formateur WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Formateur non trouvé' });
        }

        res.json({ success: true, message: 'Formateur supprimé avec succès' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};

module.exports = {
    getAllFormateurs,
    getFormateurById,
    createFormateur,
    updateFormateur,
    deleteFormateur
};