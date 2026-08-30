// nafahat_api/controllers/formateurController.js
const db = require('../config/database');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');

// ============================================================
// CONFIGURATION MULTER POUR LES PHOTOS DE FORMATEURS
// ============================================================
const UPLOAD_DIR = path.join(__dirname, '../uploads/formateurs');

// S'assurer que le dossier existe
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    console.log('   📁 Dossier "uploads/formateurs" créé');
}

// Configuration du stockage multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
        const extension = path.extname(file.originalname);
        const fileName = `formateur_${uuidv4()}${extension}`;
        cb(null, fileName);
    }
});

// Filtre pour accepter uniquement les images
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Format non supporté. Utilisez JPG, PNG, WEBP ou GIF'), false);
    }
};

// Configuration multer
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    },
    fileFilter: fileFilter
});

// Middleware multer pour l'upload de la photo
const uploadFormateurPhotoMiddleware = upload.single('photo');

// ============================================================
// FONCTION : Upload de la photo (avec multer)
// ============================================================
const uploadFormateurPhoto = async (req, res) => {
    try {
        // Utiliser le middleware multer
        uploadFormateurPhotoMiddleware(req, res, function(err) {
            if (err) {
                console.error('❌ Erreur multer:', err);
                
                if (err instanceof multer.MulterError) {
                    if (err.code === 'FILE_TOO_LARGE') {
                        return res.status(413).json({
                            success: false,
                            message: 'La photo ne doit pas dépasser 5MB'
                        });
                    }
                    return res.status(400).json({
                        success: false,
                        message: 'Erreur d\'upload: ' + err.message
                    });
                }
                
                return res.status(400).json({
                    success: false,
                    message: err.message || 'Erreur lors de l\'upload'
                });
            }

            // Vérifier si un fichier a été reçu
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'Aucune photo envoyée'
                });
            }

            console.log(`✅ Photo formateur uploadée: ${req.file.filename}`);

            res.status(200).json({
                success: true,
                message: 'Photo uploadée avec succès',
                fileName: req.file.filename,
                filePath: `/uploads/formateurs/${req.file.filename}`
            });
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