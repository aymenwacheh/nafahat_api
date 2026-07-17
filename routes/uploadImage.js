// nafahat_api/routes/uploadImage.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ============================================================
// CONFIGURATION DE MULTER POUR LE STOCKAGE DES IMAGES
// ============================================================

// Configuration du stockage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/formations');
    
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname) || '.jpg';
    const filename = 'formation-' + uniqueSuffix + extension;
    cb(null, filename);
  }
});

// ✅ FILTRE AMÉLIORÉ POUR ACCEPTER PLUS DE TYPES
const fileFilter = (req, file, cb) => {
  console.log('📸 [Upload] Fichier reçu:', {
    originalname: file.originalname,
    mimetype: file.mimetype,
    fieldname: file.fieldname,
    encoding: file.encoding
  });

  // ✅ Accepter tous les types d'images courants
  const allowedMimeTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'image/bmp',
    'image/tiff',
    'image/x-icon',
    'image/vnd.microsoft.icon',
    'image/heic',
    'image/heif'
  ];
  
  // ✅ Extensions autorisées
  const allowedExtensions = [
    '.jpeg', '.jpg', '.png', '.gif', '.webp', 
    '.svg', '.bmp', '.tiff', '.tif', '.ico', 
    '.heic', '.heif'
  ];
  
  const extension = path.extname(file.originalname).toLowerCase();
  const isExtensionValid = allowedExtensions.includes(extension);
  
  // ✅ Si le mimetype est dans la liste OU l'extension est valide
  // ✅ OU si le mimetype commence par 'image/'
  const isMimeTypeValid = allowedMimeTypes.includes(file.mimetype) || 
                          file.mimetype.startsWith('image/');
  
  const isValid = isMimeTypeValid || isExtensionValid;

  console.log(`📸 [Upload] Validation: ${isValid ? '✅ ACCEPTÉ' : '❌ REJETÉ'}`);
  console.log(`   - Mimetype: ${file.mimetype} (${isMimeTypeValid ? '✅' : '❌'})`);
  console.log(`   - Extension: ${extension} (${isExtensionValid ? '✅' : '❌'})`);

  if (isValid) {
    cb(null, true);
  } else {
    cb(new Error(`❌ Type de fichier non supporté. Type reçu: ${file.mimetype}, Extension: ${extension}`));
  }
};

// Configuration multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
  },
  fileFilter: fileFilter,
});

// ============================================================
// ROUTES
// ============================================================

/**
 * POST /api/upload/image
 * Upload une image
 */
router.post('/image', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '❌ Aucun fichier n\'a été uploadé'
      });
    }

    const filename = req.file.filename;
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const imageUrl = `${baseUrl}/uploads/formations/${filename}`;

    console.log(`✅ [Upload] Image uploadée: ${imageUrl}`);

    res.json({
      success: true,
      message: '✅ Image uploadée avec succès',
      image_url: imageUrl,
      filename: filename,
      file_info: {
        original_name: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype
      }
    });

  } catch (error) {
    console.error('❌ [Upload] Erreur:', error);
    
    res.status(500).json({
      success: false,
      message: '❌ Erreur lors de l\'upload de l\'image',
      error: error.message || 'Internal server error'
    });
  }
});

// ✅ NOUVEAU: Gestion des erreurs multer
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'FILE_TOO_LARGE') {
      return res.status(413).json({
        success: false,
        message: '❌ Le fichier est trop volumineux (max 10MB)',
        error: err.message
      });
    }
    return res.status(400).json({
      success: false,
      message: '❌ Erreur d\'upload',
      error: err.message
    });
  }
  
  if (err) {
    return res.status(400).json({
      success: false,
      message: '❌ Erreur lors du traitement du fichier',
      error: err.message
    });
  }
  
  next();
});

// ============================================================
// NOUVELLE ROUTE: Upload avec détection automatique du type
// ============================================================
router.post('/image-auto', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '❌ Aucun fichier n\'a été uploadé'
      });
    }

    const filename = req.file.filename;
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const imageUrl = `${baseUrl}/uploads/formations/${filename}`;

    console.log(`✅ [Upload Auto] Image uploadée: ${imageUrl}`);

    res.json({
      success: true,
      message: '✅ Image uploadée avec succès',
      image_url: imageUrl,
      filename: filename,
      file_info: {
        original_name: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        detected_extension: path.extname(req.file.filename)
      }
    });

  } catch (error) {
    console.error('❌ [Upload Auto] Erreur:', error);
    
    res.status(500).json({
      success: false,
      message: '❌ Erreur lors de l\'upload',
      error: error.message
    });
  }
});

// ============================================================
// SUPPRESSION D'IMAGE
// ============================================================
router.delete('/image/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '../uploads/formations', filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: '❌ Fichier non trouvé'
      });
    }
    
    fs.unlinkSync(filePath);
    
    console.log(`✅ [Upload] Image supprimée: ${filename}`);
    
    res.json({
      success: true,
      message: '✅ Image supprimée avec succès'
    });
    
  } catch (error) {
    console.error('❌ [Upload] Erreur suppression:', error);
    
    res.status(500).json({
      success: false,
      message: '❌ Erreur lors de la suppression',
      error: error.message
    });
  }
});

module.exports = router;