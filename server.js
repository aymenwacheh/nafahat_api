// nafahat_api/server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

console.log('🚀 Démarrage du serveur Nafahat API...');
console.log('📂 Chargement des modules...');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// =============================================
// MIDDLEWARES
// =============================================
console.log('⚙️  Configuration des middlewares...');

// CORS
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: true
}));
console.log('   ✅ CORS activé');

// JSON Parser avec limite augmentée
app.use(express.json({ limit: '10mb' }));
console.log('   ✅ JSON parser activé (limite 10MB)');

// URL-encoded Parser avec limite augmentée
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
console.log('   ✅ URL-encoded parser activé (limite 10MB)');

// ⚠️ SUPPRESSION DE express-fileupload
// Il cause un conflit avec multer dans uploadImage.js
// Les uploads sont gérés par multer dans les routes dédiées
console.log('   ✅ Upload géré par multer (dans les routes)');

// =============================================
// CRÉATION DES DOSSIERS UPLOADS
// =============================================
console.log('📁 Création des dossiers uploads...');

const uploadsDir = path.join(__dirname, 'uploads');
const formationsDir = path.join(uploadsDir, 'formations');
const quittancesDir = path.join(uploadsDir, 'quittances');
const formateursDir = path.join(uploadsDir, 'formateurs');

// Fonction utilitaire pour créer les dossiers
const createDirectory = (dirPath, name) => {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`   📁 Dossier "${name}" créé`);
        return true;
    }
    return false;
};

createDirectory(uploadsDir, 'uploads');
createDirectory(formationsDir, 'uploads/formations');
createDirectory(quittancesDir, 'uploads/quittances');
createDirectory(formateursDir, 'uploads/formateurs');

// =============================================
// SERVIRE LES FICHIERS STATIQUES
// =============================================
console.log('📁 Configuration des fichiers statiques...');

// Routes statiques principales
app.use('/uploads', express.static(uploadsDir));
console.log('   ✅ /uploads activé');

// =============================================
// CONFIGURATION ENVIRONNEMENT
// =============================================
const isProduction = process.env.NODE_ENV === 'production' || 
                     process.env.HOSTNAME === 'www.nafahat-academy.com' ||
                     process.env.BASE_URL === 'http://www.nafahat-academy.com';

console.log(`   🌍 Environnement: ${isProduction ? 'PRODUCTION 🔥' : 'DÉVELOPPEMENT 💻'}`);

// Routes statiques pour la production
const staticRoutes = [
    { path: '/nafahat_api/uploads', dir: uploadsDir },
    { path: '/nafahat_api/uploads/formations', dir: formationsDir },
    { path: '/nafahat_api/uploads/quittances', dir: quittancesDir },
    { path: '/nafahat_api/uploads/formateurs', dir: formateursDir }
];

staticRoutes.forEach(({ path: routePath, dir }) => {
    app.use(routePath, express.static(dir));
    console.log(`   ✅ ${routePath} activé`);
});

// =============================================
// ROUTES DIRECTES POUR LES FICHIERS
// =============================================
const serveFile = (dir, altDir, type, typeName) => {
    app.get(`/nafahat_api/uploads/${type}/:filename`, (req, res) => {
        const filePath = path.join(dir, req.params.filename);
        
        if (fs.existsSync(filePath)) {
            return res.sendFile(filePath);
        }
        
        if (isProduction && altDir) {
            const altPath = path.join(altDir, req.params.filename);
            if (fs.existsSync(altPath)) {
                return res.sendFile(altPath);
            }
        }
        
        res.status(404).json({ 
            success: false, 
            message: `${typeName} non trouvée` 
        });
    });
    console.log(`   ✅ Route directe pour les ${typeName} activée`);
};

serveFile(formationsDir, '/var/www/nafahat_api/uploads/formations', 'formations', 'images de formations');
serveFile(quittancesDir, '/var/www/nafahat_api/uploads/quittances', 'quittances', 'quittances');
serveFile(formateursDir, '/var/www/nafahat_api/uploads/formateurs', 'formateurs', 'photos des formateurs');

console.log('✅ Middlewares configurés avec succès');

// =============================================
// IMPORT DES ROUTES
// =============================================
console.log('📌 Import des routes...');

// Fonction utilitaire pour charger les routes
const loadRoute = (routePath, routeName) => {
    try {
        const route = require(routePath);
        console.log(`   ✅ Route ${routeName} chargée`);
        return route;
    } catch (error) {
        console.error(`   ❌ Erreur chargement ${routeName}:`, error.message);
        return null;
    }
};

// Chargement de toutes les routes
const formationRoutes = loadRoute('./routes/formations', 'formations');
const formateurRoutes = loadRoute('./routes/formateurs', 'formateurs');
const categorieRoutes = loadRoute('./routes/categories', 'categories');
const uploadRoutes = loadRoute('./routes/upload', 'upload');
const uploadImageRoutes = loadRoute('./routes/uploadImage', 'uploadImage');
const videosRoutes = loadRoute('./routes/videos', 'videos');
const dureeRoutes = loadRoute('./routes/duree', 'duree');
const typeFormationRoutes = loadRoute('./routes/typeFormation', 'typeFormation');
const adherentRoutes = loadRoute('./routes/adherentRoutes', 'adherentRoutes');
const adminRoutes = loadRoute('./routes/adminRoutes', 'adminRoutes');
const chatbotRoutes = loadRoute('./routes/chatbot', 'chatbot');
const cibleRoutes = loadRoute('./routes/cibles', 'cibles');
const paymentRoutes = loadRoute('./routes/paymentRoutes', 'paymentRoutes');
const aboutRoutes = loadRoute('./routes/aboutRoutes', 'aboutRoutes');
const cmplUserRoutes = loadRoute('./routes/cmplUserRoutes', 'cmplUserRoutes');
const paiementValidationRoutes = loadRoute('./routes/paiementValidationRoutes', 'paiementValidationRoutes');

// =============================================
// MIDDLEWARE DE LOG POUR LES ROUTES
// =============================================
const logMiddleware = (routeName) => (req, res, next) => {
    console.log(`📥 [${routeName}] ${req.method} ${req.url}`);
    
    // Log des fichiers uploadés (multer les met dans req.file)
    if (req.file) {
        console.log(`   📎 Fichier reçu: ${req.file.originalname} (${(req.file.size / 1024).toFixed(1)}KB)`);
    }
    
    // Log du body (sans les données sensibles)
    if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
        const logBody = { ...req.body };
        if (logBody.password) logBody.password = '***';
        if (logBody.token) logBody.token = '***';
        const bodyStr = JSON.stringify(logBody);
        if (bodyStr.length > 300) {
            console.log(`   📋 Body: ${bodyStr.substring(0, 300)}...`);
        } else {
            console.log(`   📋 Body: ${bodyStr}`);
        }
    }
    
    next();
};

// =============================================
// ENREGISTREMENT DES ROUTES
// =============================================
console.log('\n📌 Enregistrement des routes...');

// Route de test
app.get('/api/test', (req, res) => {
    console.log('🔍 [GET /api/test] Test API appelé');
    res.json({ 
        success: true, 
        message: 'API fonctionne !',
        timestamp: new Date().toISOString(),
        environment: isProduction ? 'PRODUCTION' : 'DEVELOPPEMENT',
        upload: {
            enabled: true,
            maxSize: '10MB',
            supportedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
            endpoints: [
                '/api/upload/image',
                '/api/upload/image-auto',
                '/api/upload/simple'
            ]
        },
        routes: [
            '/api/test',
            '/api/formations',
            '/api/formateurs',
            '/api/formateurs/upload ⭐',
            '/api/categories',
            '/api/upload',
            '/api/upload/image',
            '/api/upload/image-auto',
            '/api/upload/simple',
            '/api/videos',
            '/api/durees',
            '/api/duree',
            '/api/types-formation',
            '/api/adherents',
            '/api/admin',
            '/api/chatbot',
            '/api/cibles',
            '/api/payments',
            '/api/about'
        ]
    });
});

// Fonction pour enregistrer une route avec logs
const registerRoute = (route, path, name) => {
    if (route) {
        app.use(path, logMiddleware(name), route);
        console.log(`   ✅ ${path} enregistré`);
        return true;
    } else {
        console.log(`   ⚠️ ${path} non enregistré (route manquante)`);
        return false;
    }
};

// =============================================
// ENREGISTREMENT DES ROUTES D'UPLOAD
// =============================================

// ✅ Route principale d'upload d'images (formations) - utilise multer
registerRoute(uploadImageRoutes, '/api/upload', 'uploadImage');

// ✅ Route alternative pour compatibilité (upload simple) - utilise multer
if (uploadRoutes) {
    app.use('/api/upload/simple', logMiddleware('upload'), uploadRoutes);
    console.log('   ✅ /api/upload/simple enregistré (compatibilité)');
}

// =============================================
// ENREGISTREMENT DES AUTRES ROUTES
// =============================================

registerRoute(formationRoutes, '/api/formations', 'formations');
registerRoute(formateurRoutes, '/api/formateurs', 'formateurs');
registerRoute(categorieRoutes, '/api/categories', 'categories');
registerRoute(videosRoutes, '/api/videos', 'videos');

// Route /api/durees (avec 's')
registerRoute(dureeRoutes, '/api/durees', 'durees');

// Route /api/duree (sans 's') avec redirection
if (dureeRoutes) {
    app.use('/api/duree', logMiddleware('duree'), (req, res, next) => {
        req.url = req.url.replace('/api/duree', '/api/durees');
        next();
    }, dureeRoutes);
    console.log('   ✅ /api/duree enregistré (REDIRECTION vers /api/durees)');
}

registerRoute(typeFormationRoutes, '/api/types-formation', 'types-formation');
registerRoute(adherentRoutes, '/api/adherents', 'adherents');
registerRoute(adminRoutes, '/api/admin', 'admin');
registerRoute(chatbotRoutes, '/api/chatbot', 'chatbot');
registerRoute(cibleRoutes, '/api/cibles', 'cibles');
registerRoute(paymentRoutes, '/api/payments', 'payments');
registerRoute(aboutRoutes, '/api/about', 'about');
registerRoute(cmplUserRoutes, '/api/adherents', 'cmplUser');
registerRoute(paiementValidationRoutes, '/api/admin/paiement-validation', 'paiement-validation');

// =============================================
// ROUTE D'ACCUEIL
// =============================================
app.get('/', (req, res) => {
    console.log('🔍 [GET /] Page d\'accueil appelée');
    res.json({ 
        message: 'Bienvenue sur l\'API Nafahat',
        version: '1.0.0',
        environment: isProduction ? 'PRODUCTION' : 'DEVELOPPEMENT',
        upload: {
            enabled: true,
            maxSize: '10MB',
            supportedFormats: ['JPG', 'PNG', 'WEBP', 'GIF'],
            endpoints: {
                formations: '/api/upload/image',
                formationsAuto: '/api/upload/image-auto',
                formateurs: '/api/formateurs/upload'
            }
        },
        documentation: '/api/test'
    });
});

// =============================================
// GESTION DES ERREURS 404
// =============================================
app.use((req, res) => {
    console.log(`❌ [404] Route non trouvée: ${req.method} ${req.url}`);
    res.status(404).json({ 
        success: false, 
        message: `Route ${req.method} ${req.url} non trouvée`,
        availableRoutes: [
            '/api/test',
            '/api/formations',
            '/api/formateurs',
            '/api/formateurs/upload ⭐',
            '/api/categories',
            '/api/upload',
            '/api/upload/image',
            '/api/upload/image-auto',
            '/api/upload/simple',
            '/api/videos',
            '/api/durees',
            '/api/duree',
            '/api/types-formation',
            '/api/adherents',
            '/api/admin',
            '/api/chatbot',
            '/api/cibles',
            '/api/payments',
            '/api/about'
        ]
    });
});

// =============================================
// GESTION DES ERREURS SERVEUR
// =============================================
app.use((err, req, res, next) => {
    console.error(`❌ [ERREUR SERVEUR] ${err.message}`);
    console.error('   Stack:', err.stack);
    
    // Erreur de file upload (trop volumineux)
    if (err.code === 'FILE_TOO_LARGE') {
        return res.status(413).json({
            success: false,
            message: 'Le fichier est trop volumineux (max 10MB)'
        });
    }
    
    // Erreur de type de fichier
    if (err.code === 'UNSUPPORTED_MEDIA_TYPE') {
        return res.status(415).json({
            success: false,
            message: 'Type de fichier non supporté'
        });
    }
    
    // Erreur multer
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
            success: false,
            message: 'Fichier trop volumineux (max 10MB)'
        });
    }
    
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({
            success: false,
            message: 'Champ de fichier inattendu. Utilisez "image" comme nom de champ.'
        });
    }
    
    res.status(500).json({ 
        success: false, 
        message: 'Erreur interne du serveur',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// =============================================
// DÉMARRAGE DU SERVEUR
// =============================================
console.log('\n📋 RÉSUMÉ DES ROUTES DISPONIBLES:');
console.log('   ✅ /api/test');
console.log('   ✅ /api/formations');
console.log('   ✅ /api/formateurs');
console.log('   ✅ /api/formateurs/upload ⭐ (UPLOAD PHOTOS FORMATEURS)');
console.log('   ✅ /api/categories');
console.log('   ✅ /api/upload');
console.log('   ✅ /api/upload/image (UPLOAD IMAGES FORMATIONS)');
console.log('   ✅ /api/upload/image-auto (UPLOAD IMAGES FORMATIONS - AUTO)');
console.log('   ✅ /api/upload/simple');
console.log('   ✅ /api/videos');
console.log('   ✅ /api/durees (AVEC "s")');
console.log('   ✅ /api/duree (SANS "s") - REDIRECTION');
console.log('   ✅ /api/types-formation');
console.log('   ✅ /api/adherents');
console.log('   ✅ /api/admin');
console.log('   ✅ /api/chatbot');
console.log('   ✅ /api/cibles');
console.log('   ✅ /api/payments');
console.log('   ✅ /api/about');
console.log('   ✅ /');

console.log(`\n🌍 Environnement: ${isProduction ? 'PRODUCTION 🔥' : 'DÉVELOPPEMENT 💻'}`);
console.log(`📁 Dossier uploads: ${uploadsDir}`);
console.log(`📁 Dossier formations: ${formationsDir}`);
console.log(`📁 Dossier quittances: ${quittancesDir}`);
console.log(`📁 Dossier formateurs: ${formateursDir}`);

console.log('\n📸 UPLOAD PHOTOS FORMATEURS:');
console.log(`   URL: http://localhost:${PORT}/api/formateurs/upload`);
console.log('   Méthode: POST');
console.log('   Champ: photo');
console.log('   Formats: JPG, PNG, WEBP, GIF');
console.log('   Taille max: 5MB (configuré dans le contrôleur)');

console.log('\n📸 UPLOAD IMAGES FORMATIONS:');
console.log(`   URL: http://localhost:${PORT}/api/upload/image`);
console.log(`   URL alternative: http://localhost:${PORT}/api/upload/image-auto`);
console.log('   Méthode: POST');
console.log('   Champ: image');
console.log('   Formats: JPG, PNG, WEBP, GIF');
console.log('   Taille max: 10MB');

console.log('\n📝 TEST AVEC CURL:');
console.log('   # Upload image formation:');
console.log(`   curl -X POST http://localhost:${PORT}/api/upload/image \\`);
console.log('        -F "image=@/chemin/vers/image.jpg"');
console.log('');
console.log('   # Upload photo formateur:');
console.log(`   curl -X POST http://localhost:${PORT}/api/formateurs/upload \\`);
console.log('        -F "photo=@/chemin/vers/photo.jpg"');

console.log('\n🔍 TEST AVEC FLUTTER:');
console.log('   Vérifiez que votre URL est:');
console.log(`   ${isProduction ? 'https://www.nafahat-academy.com' : 'http://localhost:3000'}/api/upload/image`);

console.log('\n🚀 DÉMARRAGE DU SERVEUR...');
app.listen(PORT, () => {
    console.log(`\n✅ Serveur démarré sur http://localhost:${PORT}`);
    console.log(`📋 Testez l'API: http://localhost:${PORT}/api/test`);
    console.log(`📸 Upload formation: http://localhost:${PORT}/api/upload/image`);
    console.log(`📸 Upload formateur: http://localhost:${PORT}/api/formateurs/upload`);
    console.log('\n💡 IMPORTANT:');
    console.log('   - Les images de formations sont stockées dans uploads/formations/');
    console.log('   - Les quittances sont stockées dans uploads/quittances/');
    console.log('   - Les photos des formateurs sont stockées dans uploads/formateurs/');
    console.log('   - Le frontend appelle /api/upload/image pour uploader les images de formations');
    console.log('   - Le frontend appelle /api/formateurs/upload pour uploader les photos des formateurs');
    console.log(`   - Les images sont servies sur /nafahat_api/uploads/formations/`);
    console.log(`   - Les quittances sont servies sur /nafahat_api/uploads/quittances/`);
    console.log(`   - Les photos des formateurs sont servies sur /nafahat_api/uploads/formateurs/`);
    console.log(`   - Environnement: ${isProduction ? 'PRODUCTION 🔥' : 'DÉVELOPPEMENT 💻'}`);
    console.log('\n✅ Serveur prêt à recevoir les uploads de photos !');
});