const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();

// Configuration de multer pour l'upload d'images
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/formations/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Seules les images sont autorisées'));
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
    fileFilter: fileFilter
});

// Route d'upload
router.post('/', upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Aucun fichier uploadé' });
        }
        
        const imageUrl = `/uploads/formations/${req.file.filename}`;
        res.json({ 
            success: true, 
            message: 'Image uploadée avec succès',
            imageUrl: imageUrl
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;