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

// =============================================
// CRÉATION DES DOSSIERS UPLOADS
// =============================================
console.log('📁 Création des dossiers uploads...');

const uploadsDir = path.join(__dirname, 'uploads');
const formationsDir = path.join(uploadsDir, 'formations');
const quittancesDir = path.join(uploadsDir, 'quittances');
const formateursDir = path.join(uploadsDir, 'formateurs');

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

app.use('/uploads', express.static(uploadsDir));
console.log('   ✅ /uploads activé');

// =============================================
// CONFIGURATION ENVIRONNEMENT
// =============================================
const isProduction = process.env.NODE_ENV === 'production' || 
                     process.env.HOSTNAME === 'www.nafahat-academy.com' ||
                     process.env.BASE_URL === 'https://www.nafahat-academy.com';

console.log(`   🌍 Environnement: ${isProduction ? 'PRODUCTION 🔥' : 'DÉVELOPPEMENT 💻'}`);
console.log(`   🔗 BASE_URL: ${process.env.BASE_URL || 'http://localhost:3000'}`);

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
const bullRoutes = loadRoute('./routes/bullRoutes', 'bulls');
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
    
    if (req.file) {
        console.log(`   📎 Fichier reçu: ${req.file.originalname} (${(req.file.size / 1024).toFixed(1)}KB)`);
    }
    
    if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body && Object.keys(req.body).length > 0) {
        const logBody = { ...req.body };
        if (logBody.password) logBody.password = '***';
        if (logBody.token) logBody.token = '***';
        if (logBody.motDePasse) logBody.motDePasse = '***';
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
// ENREGISTREMENT DES ROUTES API
// =============================================
console.log('\n📌 Enregistrement des routes API...');

// Route de test
app.get('/api/test', (req, res) => {
    console.log('🔍 [GET /api/test] Test API appelé');
    res.json({ 
        success: true, 
        message: 'API fonctionne !',
        timestamp: new Date().toISOString(),
        environment: isProduction ? 'PRODUCTION' : 'DEVELOPPEMENT',
        resetPassword: {
            endpoint: '/api/adherents/request-password-reset',
            page: '/reset-password?token=XXXXX',
            baseUrl: process.env.BASE_URL || 'http://localhost:3000'
        },
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
            '/api/bulls',
            '/api/bulls/available-targets',
            '/api/bulls/reorder',
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
const registerRoute = (route, pathRoute, name) => {
    if (route) {
        app.use(pathRoute, logMiddleware(name), route);
        console.log(`   ✅ ${pathRoute} enregistré`);
        return true;
    } else {
        console.log(`   ⚠️ ${pathRoute} non enregistré (route manquante)`);
        return false;
    }
};

// Enregistrement des routes Bulls
console.log('\n📌 Enregistrement des routes Bulls...');
if (bullRoutes) {
    app.use('/api/bulls', logMiddleware('bulls'), bullRoutes);
    console.log('   ✅ /api/bulls enregistré (Gestion des liens)');
    console.log('   ✅ /api/bulls/available-targets enregistré');
    console.log('   ✅ /api/bulls/reorder enregistré');
    console.log('   ✅ /api/bulls/:id enregistré');
} else {
    console.log('   ⚠️ /api/bulls non enregistré (route manquante)');
}

// Enregistrement des routes d'upload
console.log('\n📌 Enregistrement des routes d\'upload...');
registerRoute(uploadImageRoutes, '/api/upload', 'uploadImage');

if (uploadRoutes) {
    app.use('/api/upload/simple', logMiddleware('upload'), uploadRoutes);
    console.log('   ✅ /api/upload/simple enregistré (compatibilité)');
}

// Enregistrement des autres routes
console.log('\n📌 Enregistrement des autres routes...');
registerRoute(formationRoutes, '/api/formations', 'formations');
registerRoute(formateurRoutes, '/api/formateurs', 'formateurs');
registerRoute(categorieRoutes, '/api/categories', 'categories');
registerRoute(videosRoutes, '/api/videos', 'videos');

registerRoute(dureeRoutes, '/api/durees', 'durees');

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

console.log('✅ Routes API enregistrées');

// =============================================
// ✅ ROUTES WEB (PAGES HTML)
// =============================================
console.log('\n📁 Configuration des routes web...');

// Chemin du build web Flutter
const webBuildPath = path.join(__dirname, '../build/web');
const webBuildExists = fs.existsSync(webBuildPath) && fs.existsSync(path.join(webBuildPath, 'index.html'));

// Chemin alternatif pour le build web (dans le même dossier)
const webBuildPathAlt = path.join(__dirname, 'build/web');
const webBuildExistsAlt = fs.existsSync(webBuildPathAlt) && fs.existsSync(path.join(webBuildPathAlt, 'index.html'));

// Utiliser le bon chemin
let finalWebBuildPath = null;
if (webBuildExists) {
    finalWebBuildPath = webBuildPath;
    console.log(`   ✅ Build web trouvé: ${webBuildPath}`);
} else if (webBuildExistsAlt) {
    finalWebBuildPath = webBuildPathAlt;
    console.log(`   ✅ Build web trouvé: ${webBuildPathAlt}`);
} else {
    console.log(`   ⚠️ Build web non trouvé`);
    console.log(`      - Recherché dans: ${webBuildPath}`);
    console.log(`      - Recherché dans: ${webBuildPathAlt}`);
    console.log('   💡 Pour créer le build web: flutter build web');
}

// Servir les fichiers statiques du build web
if (finalWebBuildPath) {
    app.use(express.static(finalWebBuildPath));
    console.log(`   ✅ Fichiers statiques servis depuis: ${finalWebBuildPath}`);
}


// =============================================
// ✅ ROUTE DE RÉINITIALISATION DU MOT DE PASSE
// -> Sert l'app Flutter (même pattern que /connexion) au lieu d'une
//    page HTML statique, pour que ResetPasswordPage.dart (avec la
//    connexion automatique après reset) soit réellement utilisée.
// =============================================
app.get('/reset-password', (req, res) => {
    const token = req.query.token;
    console.log(`🔑 [GET /reset-password] Token: ${token || 'Aucun token'}`);

    if (finalWebBuildPath) {
        const indexPath = path.join(finalWebBuildPath, 'index.html');
        if (fs.existsSync(indexPath)) {
            return res.sendFile(indexPath);
        }
    }

    // Fallback si le build web n'est pas disponible
    res.status(503).json({
        success: false,
        error: "L'application n'est pas disponible pour le moment."
    });
});

// =============================================
// ✅ ROUTE DE CONNEXION
// =============================================
app.get('/connexion', (req, res) => {
    console.log(`🔑 [GET /connexion] Page de connexion`);
    
    if (finalWebBuildPath) {
        const indexPath = path.join(finalWebBuildPath, 'index.html');
        if (fs.existsSync(indexPath)) {
            return res.sendFile(indexPath);
        }
    }
    
    // Fallback vers la page de reset
    res.redirect('/reset-password');
});

// =============================================
// ✅ ROUTE D'ACCUEIL (API)
// =============================================
app.get('/', (req, res) => {
    console.log('🔍 [GET /] Page d\'accueil API appelée');
    res.json({ 
        message: 'Bienvenue sur l\'API Nafahat',
        version: '1.0.0',
        environment: isProduction ? 'PRODUCTION' : 'DEVELOPPEMENT',
        baseUrl: process.env.BASE_URL || 'http://localhost:3000',
        resetPassword: {
            request: '/api/adherents/request-password-reset',
            page: '/reset-password?token=XXXXX'
        },
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
        documentation: '/api/test',
        bulls: {
            endpoints: {
                getAll: '/api/bulls',
                getById: '/api/bulls/:id',
                create: '/api/bulls',
                update: '/api/bulls/:id',
                delete: '/api/bulls/:id',
                reorder: '/api/bulls/reorder',
                availableTargets: '/api/bulls/available-targets'
            }
        }
    });
});

// =============================================
// ✅ ROUTE CATCH-ALL POUR LES PAGES WEB
// =============================================
app.get('*', (req, res) => {
    // Ne pas interférer avec les routes API
    if (req.path.startsWith('/api/')) {
        return; // Laissé passer pour le middleware 404
    }
    
    // Si le build web existe, servir index.html
    if (finalWebBuildPath) {
        const indexPath = path.join(finalWebBuildPath, 'index.html');
        if (fs.existsSync(indexPath)) {
            console.log(`📄 [GET] Servir index.html pour: ${req.path}`);
            return res.sendFile(indexPath);
        }
    }
    
    // Sinon, laisser le middleware 404 gérer
    res.status(404).json({ 
        success: false, 
        message: `Route ${req.method} ${req.url} non trouvée`
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
            '/api/bulls',
            '/api/bulls/available-targets',
            '/api/bulls/reorder',
            '/api/bulls/:id',
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
            '/api/about',
            '/reset-password',
            '/connexion',
            '/'
        ]
    });
});

// =============================================
// GESTION DES ERREURS SERVEUR
// =============================================
app.use((err, req, res, next) => {
    console.error(`❌ [ERREUR SERVEUR] ${err.message}`);
    console.error('   Stack:', err.stack);
    
    if (err.code === 'FILE_TOO_LARGE') {
        return res.status(413).json({
            success: false,
            message: 'Le fichier est trop volumineux (max 10MB)'
        });
    }
    
    if (err.code === 'UNSUPPORTED_MEDIA_TYPE') {
        return res.status(415).json({
            success: false,
            message: 'Type de fichier non supporté'
        });
    }
    
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
console.log('\n' + '═'.repeat(50));
console.log('📋 RÉSUMÉ DES ROUTES DISPONIBLES');
console.log('═'.repeat(50));

console.log('\n🔌 ROUTES API:');
console.log('   ✅ /api/test');
console.log('   ✅ /api/bulls (GESTION DES LIENS)');
console.log('   ✅ /api/bulls/available-targets');
console.log('   ✅ /api/bulls/reorder');
console.log('   ✅ /api/bulls/:id');
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

console.log('\n🌐 ROUTES WEB:');
console.log('   ✅ /reset-password (PAGE DE RÉINITIALISATION)');
console.log('   ✅ /connexion (PAGE DE CONNEXION)');
console.log(`   ✅ / (PAGE D\'ACCUEIL ${finalWebBuildPath ? 'WEB' : 'API'})`);

console.log('\n🔑 RÉINITIALISATION DU MOT DE PASSE:');
console.log(`   📧 POST   ${process.env.BASE_URL || 'http://localhost:3000'}/api/adherents/request-password-reset`);
console.log(`   🔐 POST   ${process.env.BASE_URL || 'http://localhost:3000'}/api/adherents/reset-password-with-token`);
console.log(`   ✅ GET    ${process.env.BASE_URL || 'http://localhost:3000'}/api/adherents/verify-reset-token`);
console.log(`   🌐 GET    ${process.env.BASE_URL || 'http://localhost:3000'}/reset-password?token=XXXXX`);

console.log('\n📁 DOSSIERS:');
console.log(`   📁 Dossier uploads: ${uploadsDir}`);
console.log(`   📁 Dossier formations: ${formationsDir}`);
console.log(`   📁 Dossier quittances: ${quittancesDir}`);
console.log(`   📁 Dossier formateurs: ${formateursDir}`);
console.log(`   📁 Build web: ${finalWebBuildPath || 'NON TROUVÉ'}`);

console.log(`\n🌍 Environnement: ${isProduction ? 'PRODUCTION 🔥' : 'DÉVELOPPEMENT 💻'}`);
console.log(`🔗 BASE_URL: ${process.env.BASE_URL || 'http://localhost:3000'}`);

console.log('\n📝 TEST AVEC CURL:');
console.log('   # Demander la réinitialisation:');
console.log(`   curl -X POST ${process.env.BASE_URL || 'http://localhost:3000'}/api/adherents/request-password-reset \\`);
console.log('        -H "Content-Type: application/json" \\');
console.log('        -d \'{"email":"tonemail@test.com"}\'');

console.log('\n🚀 DÉMARRAGE DU SERVEUR...');
console.log('═'.repeat(50));

app.listen(PORT, () => {
    console.log(`\n✅ Serveur démarré sur http://localhost:${PORT}`);
    console.log(`📋 Testez l'API: http://localhost:${PORT}/api/test`);
    console.log(`📸 Upload formation: http://localhost:${PORT}/api/upload/image`);
    console.log(`📸 Upload formateur: http://localhost:${PORT}/api/formateurs/upload`);
    console.log(`🔗 Bulls API: http://localhost:${PORT}/api/bulls`);
    console.log(`🔑 Reset password: http://localhost:${PORT}/reset-password?token=XXXXX`);
    console.log(`🌐 Base URL: ${process.env.BASE_URL || 'http://localhost:3000'}`);
    console.log('\n✅ Serveur prêt ! 🚀');
});