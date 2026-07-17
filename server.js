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

console.log('⚙️  Configuration des middlewares...');

// Middleware
app.use(cors());
console.log('   ✅ CORS activé');

app.use(express.json());
console.log('   ✅ JSON parser activé');

app.use(express.urlencoded({ extended: true }));
console.log('   ✅ URL-encoded parser activé');

// =============================================
// CRÉATION DU DOSSIER UPLOADS
// =============================================
const uploadsDir = path.join(__dirname, 'uploads');
const formationsDir = path.join(uploadsDir, 'formations');

// Créer les dossiers s'ils n'existent pas
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('   📁 Dossier "uploads" créé');
}

if (!fs.existsSync(formationsDir)) {
    fs.mkdirSync(formationsDir, { recursive: true });
    console.log('   📁 Dossier "uploads/formations" créé');
}

// Servir les fichiers statiques
app.use('/uploads', express.static(uploadsDir));
console.log('   ✅ Uploads statiques activés');

console.log('✅ Middlewares configurés avec succès');

// =============================================
// IMPORT DES ROUTES
// =============================================
console.log('📌 Import des routes...');

// Déclaration des variables
let formationRoutes;
let formateurRoutes;
let categorieRoutes;
let uploadRoutes;
let uploadImageRoutes; // 👈 NOUVEAU: route pour l'upload d'images
let videosRoutes;
let dureeRoutes;
let typeFormationRoutes;
let adherentRoutes;
let chatbotRoutes;

try {
    formationRoutes = require('./routes/formations');
    console.log('   ✅ Route formations chargée');
} catch (error) {
    console.error('   ❌ Erreur chargement formations:', error.message);
}

try {
    formateurRoutes = require('./routes/formateurs');
    console.log('   ✅ Route formateurs chargée');
} catch (error) {
    console.error('   ❌ Erreur chargement formateurs:', error.message);
}

try {
    categorieRoutes = require('./routes/categories');
    console.log('   ✅ Route categories chargée');
} catch (error) {
    console.error('   ❌ Erreur chargement categories:', error.message);
}

try {
    uploadRoutes = require('./routes/upload');
    console.log('   ✅ Route upload chargée');
} catch (error) {
    console.error('   ❌ Erreur chargement upload:', error.message);
}

// 👈 NOUVEAU: Import de la route uploadImage
try {
    uploadImageRoutes = require('./routes/uploadImage');
    console.log('   ✅ Route uploadImage chargée');
} catch (error) {
    console.error('   ❌ Erreur chargement uploadImage:', error.message);
}

try {
    videosRoutes = require('./routes/videos');
    console.log('   ✅ Route videos chargée');
} catch (error) {
    console.error('   ❌ Erreur chargement videos:', error.message);
}

try {
    dureeRoutes = require('./routes/duree');
    console.log('   ✅ Route duree chargée');
} catch (error) {
    console.error('   ❌ Erreur chargement duree:', error.message);
}

try {
    typeFormationRoutes = require('./routes/typeFormation');
    console.log('   ✅ Route typeFormation chargée');
} catch (error) {
    console.error('   ❌ Erreur chargement typeFormation:', error.message);
}

try {
    adherentRoutes = require('./routes/adherentRoutes');
    console.log('   ✅ Route adherentRoutes chargée');
} catch (error) {
    console.error('   ❌ Erreur chargement adherentRoutes:', error.message);
}

try {
    chatbotRoutes = require('./routes/chatbot');
    console.log('   ✅ Route chatbot chargée');
} catch (error) {
    console.error('   ❌ Erreur chargement chatbot:', error.message);
}

// =============================================
// UTILISATION DES ROUTES
// =============================================
console.log('\n📌 Enregistrement des routes...');

// Route de test
app.get('/api/test', (req, res) => {
    console.log('🔍 [GET /api/test] Test API appelé');
    res.json({ 
        success: true, 
        message: 'API fonctionne !',
        timestamp: new Date().toISOString(),
        routes: [
            '/api/formations',
            '/api/formateurs',
            '/api/categories',
            '/api/upload',
            '/api/upload/image', // 👈 NOUVEAU
            '/api/videos',
            '/api/durees',
            '/api/duree',
            '/api/types-formation',
            '/api/adherents',
            '/api/chatbot'
        ]
    });
});

// Formation routes
if (formationRoutes) {
    app.use('/api/formations', (req, res, next) => {
        console.log(`📥 [formations] ${req.method} ${req.url}`);
        if (req.method === 'POST' || req.method === 'PUT') {
            console.log(`   📋 Body: ${JSON.stringify(req.body).substring(0, 200)}...`);
        }
        next();
    }, formationRoutes);
    console.log('   ✅ /api/formations enregistré');
} else {
    console.log('   ⚠️ /api/formations non enregistré (route manquante)');
}

// Formateur routes
if (formateurRoutes) {
    app.use('/api/formateurs', (req, res, next) => {
        console.log(`📥 [formateurs] ${req.method} ${req.url}`);
        if (req.method === 'POST' || req.method === 'PUT') {
            console.log(`   📋 Body: ${JSON.stringify(req.body).substring(0, 200)}...`);
        }
        next();
    }, formateurRoutes);
    console.log('   ✅ /api/formateurs enregistré');
} else {
    console.log('   ⚠️ /api/formateurs non enregistré (route manquante)');
}

// Categories routes
if (categorieRoutes) {
    app.use('/api/categories', (req, res, next) => {
        console.log(`📥 [categories] ${req.method} ${req.url}`);
        if (req.method === 'POST' || req.method === 'PUT') {
            console.log(`   📋 Body: ${JSON.stringify(req.body).substring(0, 200)}...`);
        }
        next();
    }, categorieRoutes);
    console.log('   ✅ /api/categories enregistré');
} else {
    console.log('   ⚠️ /api/categories non enregistré (route manquante)');
}

// Upload routes
if (uploadRoutes) {
    app.use('/api/upload', (req, res, next) => {
        console.log(`📥 [upload] ${req.method} ${req.url}`);
        next();
    }, uploadRoutes);
    console.log('   ✅ /api/upload enregistré');
} else {
    console.log('   ⚠️ /api/upload non enregistré (route manquante)');
}

// 👈 NOUVEAU: Upload Image routes
if (uploadImageRoutes) {
    app.use('/api/upload', (req, res, next) => {
        console.log(`📥 [uploadImage] ${req.method} ${req.url}`);
        next();
    }, uploadImageRoutes);
    console.log('   ✅ /api/upload/image enregistré');
} else {
    console.log('   ⚠️ /api/upload/image non enregistré (route manquante)');
}

// Videos routes
if (videosRoutes) {
    app.use('/api/videos', (req, res, next) => {
        console.log(`📥 [videos] ${req.method} ${req.url}`);
        if (req.method === 'POST' || req.method === 'PUT') {
            console.log(`   📋 Body: ${JSON.stringify(req.body).substring(0, 200)}...`);
        }
        next();
    }, videosRoutes);
    console.log('   ✅ /api/videos enregistré');
} else {
    console.log('   ⚠️ /api/videos non enregistré (route manquante)');
}

// Duree routes
if (dureeRoutes) {
    app.use('/api/durees', (req, res, next) => {
        console.log(`📥 [durees] ${req.method} ${req.url}`);
        if (req.method === 'POST' || req.method === 'PUT') {
            console.log(`   📋 Body: ${JSON.stringify(req.body).substring(0, 200)}...`);
        }
        next();
    }, dureeRoutes);
    console.log('   ✅ /api/durees enregistré (AVEC "s")');

    app.use('/api/duree', (req, res, next) => {
        console.log(`📥 [duree] ${req.method} ${req.url}`);
        console.log(`   🔄 Redirection vers /api/durees (compatible frontend)`);
        req.url = req.url.replace('/api/duree', '/api/durees');
        next();
    }, dureeRoutes);
    console.log('   ✅ /api/duree enregistré (SANS "s") - REDIRECTION');
} else {
    console.log('   ⚠️ /api/duree non enregistré (route manquante)');
}

// Type Formation routes
if (typeFormationRoutes) {
    app.use('/api/types-formation', (req, res, next) => {
        console.log(`📥 [types-formation] ${req.method} ${req.url}`);
        if (req.method === 'POST' || req.method === 'PUT') {
            console.log(`   📋 Body: ${JSON.stringify(req.body).substring(0, 200)}...`);
        }
        next();
    }, typeFormationRoutes);
    console.log('   ✅ /api/types-formation enregistré');
} else {
    console.log('   ⚠️ /api/types-formation non enregistré (route manquante)');
}

// Adherent routes
if (adherentRoutes) {
    app.use('/api/adherents', (req, res, next) => {
        console.log(`📥 [adherents] ${req.method} ${req.url}`);
        if (req.method === 'POST' || req.method === 'PUT') {
            console.log(`   📋 Body: ${JSON.stringify(req.body).substring(0, 200)}...`);
        }
        next();
    }, adherentRoutes);
    console.log('   ✅ /api/adherents enregistré');
} else {
    console.log('   ⚠️ /api/adherents non enregistré (route manquante)');
}

// Chatbot routes
if (chatbotRoutes) {
    app.use('/api/chatbot', (req, res, next) => {
        console.log(`📥 [chatbot] ${req.method} ${req.url}`);
        next();
    }, chatbotRoutes);
    console.log('   ✅ /api/chatbot enregistré');
} else {
    console.log('   ⚠️ /api/chatbot non enregistré (route manquante)');
}

// =============================================
// ROUTE D'ACCUEIL
// =============================================
app.get('/', (req, res) => {
    console.log('🔍 [GET /] Page d\'accueil appelée');
    res.json({ 
        message: 'Bienvenue sur l\'API Nafahat',
        version: '1.0.0',
        endpoints: [
            { method: 'GET', path: '/api/test', description: 'Test de l\'API' },
            { method: 'GET,POST,PUT,DELETE', path: '/api/formations', description: 'Gestion des formations' },
            { method: 'GET,POST,PUT,DELETE', path: '/api/formateurs', description: 'Gestion des formateurs' },
            { method: 'GET,POST,PUT,DELETE', path: '/api/categories', description: 'Gestion des catégories' },
            { method: 'POST', path: '/api/upload', description: 'Upload d\'images (ancien)' },
            { method: 'POST', path: '/api/upload/image', description: 'Upload d\'images (nouveau)' },
            { method: 'GET,POST,PUT,DELETE', path: '/api/videos', description: 'Gestion des vidéos' },
            { method: 'GET,POST,PUT,DELETE', path: '/api/durees', description: 'Gestion des durées (AVEC "s")' },
            { method: 'GET,POST,PUT,DELETE', path: '/api/duree', description: 'Gestion des durées (SANS "s") - REDIRECTION' },
            { method: 'GET,POST,PUT,DELETE', path: '/api/types-formation', description: 'Gestion des types de formation' },
            { method: 'GET,POST,PUT,DELETE', path: '/api/adherents', description: 'Gestion des adhérents' },
            { method: 'GET,POST', path: '/api/chatbot', description: 'Chatbot - Questions/Réponses' }
        ]
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
            '/api/categories',
            '/api/upload',
            '/api/upload/image', // 👈 NOUVEAU
            '/api/videos',
            '/api/durees',
            '/api/duree',
            '/api/types-formation',
            '/api/adherents',
            '/api/chatbot'
        ]
    });
});

// =============================================
// GESTION DES ERREURS SERVEUR
// =============================================
app.use((err, req, res, next) => {
    console.error(`❌ [ERREUR SERVEUR] ${err.message}`);
    console.error('   Stack:', err.stack);
    res.status(500).json({ 
        success: false, 
        message: 'Erreur interne du serveur',
        error: err.message 
    });
});

// =============================================
// DÉMARRAGE DU SERVEUR
// =============================================
console.log('\n📋 RÉSUMÉ DES ROUTES DISPONIBLES:');
console.log('   ✅ /api/test');
console.log('   ✅ /api/formations');
console.log('   ✅ /api/formateurs');
console.log('   ✅ /api/categories');
console.log('   ✅ /api/upload');
console.log('   ✅ /api/upload/image (NOUVEAU)');
console.log('   ✅ /api/videos');
console.log('   ✅ /api/durees (AVEC "s")');
console.log('   ✅ /api/duree (SANS "s") - REDIRECTION');
console.log('   ✅ /api/types-formation');
console.log('   ✅ /api/adherents');
console.log('   ✅ /api/chatbot');
console.log('   ✅ /');

console.log('\n🚀 DÉMARRAGE DU SERVEUR...');
app.listen(PORT, () => {
    console.log(`✅ Serveur démarré sur http://localhost:${PORT}`);
    console.log(`📋 Testez l'API: http://localhost:${PORT}/api/test`);
    console.log(`📋 Upload image: http://localhost:${PORT}/api/upload/image`);
    console.log(`📋 Durées (avec s): http://localhost:${PORT}/api/durees`);
    console.log(`📋 Durées (sans s): http://localhost:${PORT}/api/duree`);
    console.log(`📋 Chatbot: http://localhost:${PORT}/api/chatbot/categories`);
    console.log('\n💡 IMPORTANT:');
    console.log('   - Les images uploadées sont stockées dans uploads/formations/');
    console.log('   - Le frontend appelle /api/upload/image pour uploader les images');
    console.log('   - Le frontend appelle /api/duree (sans "s")');
    console.log('   - Le backend utilise /api/durees (avec "s")');
    console.log('   - La redirection est automatique !');
});