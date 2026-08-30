// nafahat_api/controllers/formateurController.js
const db = require('../config/database');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// ============================================================
// CONSTANTES - DOSSIER D'UPLOAD
// ============================================================
const UPLOAD_DIR = path.join(__dirname, '../uploads/formateurs');

// S'assurer que le dossier existe
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    console.log('   📁 Dossier "uploads/formateurs" créé');
}

// ============================================================
// FONCTION UTILITAIRE : Upload de la photo
// ============================================================
const uploadFormateurPhoto = async (req, res) => {
    try {
        if (!req.files || !req.files.photo) {
            return res.status(400).json({
                success: false,
                message: 'Aucune photo envoyée'
            });
        }

        const photo = req.files.photo;
        const maxSize = 5 * 1024 * 1024; // 5MB

        // Vérifier la taille
        if (photo.size > maxSize) {
            return res.status(400).json({
                success: false,
                message: 'La photo ne doit pas dépasser 5MB'
            });
        }

        // Vérifier le type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!allowedTypes.includes(photo.mimetype)) {
            return res.status(400).json({
                success: false,
                message: 'Format non supporté. Utilisez JPG, PNG, WEBP ou GIF'
            });
        }

        // Générer un nom unique
        const extension = path.extname(photo.name);
        const fileName = `formateur_${uuidv4()}${extension}`;
        const filePath = path.join(UPLOAD_DIR, fileName);

        // Déplacer le fichier
        await photo.mv(filePath);

        console.log(`✅ Photo formateur uploadée: ${fileName}`);

        res.status(200).json({
            success: true,
            message: 'Photo uploadée avec succès',
            fileName: fileName,
            filePath: `/uploads/formateurs/${fileName}`
        });

    } catch (error) {
        console.error('❌ Erreur upload photo formateur:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de l\'upload: ' + error.message
        });
    }
};

// ============================================================
// RÉCUPÉRER TOUS LES FORMATEURS
// ============================================================
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

// ============================================================
// RÉCUPÉRER UN FORMATEUR PAR ID
// ============================================================
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

// ============================================================
// CRÉER UN FORMATEUR
// ============================================================
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

// ============================================================
// METTRE À JOUR UN FORMATEUR
// ============================================================
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

// ============================================================
// SUPPRIMER UN FORMATEUR
// ============================================================
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

        // Récupérer le nom de la photo avant suppression
        const [formateur] = await db.query(
            'SELECT photo FROM formateur WHERE id = ?',
            [id]
        );

        const [result] = await db.query('DELETE FROM formateur WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Formateur non trouvé' });
        }

        // Supprimer la photo si elle existe
        if (formateur.length > 0 && formateur[0].photo) {
            const photoPath = path.join(UPLOAD_DIR, formateur[0].photo);
            if (fs.existsSync(photoPath)) {
                fs.unlinkSync(photoPath);
                console.log(`🗑️ Photo supprimée: ${formateur[0].photo}`);
            }
        }

        res.json({ success: true, message: 'Formateur supprimé avec succès' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};

// ============================================================
// EXPORTATION
// ============================================================
module.exports = {
    uploadFormateurPhoto,
    getAllFormateurs,
    getFormateurById,
    createFormateur,
    updateFormateur,
    deleteFormateur
};