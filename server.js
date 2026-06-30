// nafahat_api/server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

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

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
console.log('   ✅ Uploads statiques activés');

console.log('✅ Middlewares configurés avec succès');

// =============================================
// IMPORT DES ROUTES
// =============================================
console.log('📌 Import des routes...');

// Déclaration des variables en dehors des blocs try
let formationRoutes;
let formateurRoutes;
let categorieRoutes;
let uploadRoutes;
let videosRoutes;
let dureeRoutes;
let typeFormationRoutes;
let adherentRoutes;
let chatbotRoutes; // 👈 NOUVEAU

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

// 👈 NOUVEAU : Import de la route chatbot
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
            '/api/videos',
            '/api/durees',
            '/api/duree',
            '/api/types-formation',
            '/api/adherents',
            '/api/chatbot' // 👈 NOUVEAU
        ]
    });
});

// Formation routes - AVEC VÉRIFICATION
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

// Formateur routes - AVEC VÉRIFICATION
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

// Categories routes - AVEC VÉRIFICATION
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

// Upload routes - AVEC VÉRIFICATION
if (uploadRoutes) {
    app.use('/api/upload', (req, res, next) => {
        console.log(`📥 [upload] ${req.method} ${req.url}`);
        next();
    }, uploadRoutes);
    console.log('   ✅ /api/upload enregistré');
} else {
    console.log('   ⚠️ /api/upload non enregistré (route manquante)');
}

// Videos routes - AVEC VÉRIFICATION
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

// Duree routes - AVEC VÉRIFICATION
if (dureeRoutes) {
    // Route avec 's' (backend)
    app.use('/api/durees', (req, res, next) => {
        console.log(`📥 [durees] ${req.method} ${req.url}`);
        if (req.method === 'POST' || req.method === 'PUT') {
            console.log(`   📋 Body: ${JSON.stringify(req.body).substring(0, 200)}...`);
        }
        next();
    }, dureeRoutes);
    console.log('   ✅ /api/durees enregistré (AVEC "s")');

    // Route sans 's' (frontend) - REDIRECTION
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

// Type Formation routes - AVEC VÉRIFICATION
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

// Adherent routes - AVEC VÉRIFICATION
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

// 👈 NOUVEAU : Chatbot routes
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
            { method: 'POST', path: '/api/upload', description: 'Upload d\'images' },
            { method: 'GET,POST,PUT,DELETE', path: '/api/videos', description: 'Gestion des vidéos' },
            { method: 'GET,POST,PUT,DELETE', path: '/api/durees', description: 'Gestion des durées (AVEC "s")' },
            { method: 'GET,POST,PUT,DELETE', path: '/api/duree', description: 'Gestion des durées (SANS "s") - REDIRECTION' },
            { method: 'GET,POST,PUT,DELETE', path: '/api/types-formation', description: 'Gestion des types de formation' },
            { method: 'GET,POST,PUT,DELETE', path: '/api/adherents', description: 'Gestion des adhérents' },
            { method: 'GET,POST', path: '/api/chatbot', description: 'Chatbot - Questions/Réponses' } // 👈 NOUVEAU
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
            '/api/videos',
            '/api/durees',
            '/api/duree',
            '/api/types-formation',
            '/api/adherents',
            '/api/chatbot' // 👈 NOUVEAU
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
console.log('   ✅ /api/videos');
console.log('   ✅ /api/durees (AVEC "s")');
console.log('   ✅ /api/duree (SANS "s") - REDIRECTION');
console.log('   ✅ /api/types-formation');
console.log('   ✅ /api/adherents');
console.log('   ✅ /api/chatbot'); // 👈 NOUVEAU
console.log('   ✅ /');

console.log('\n🚀 DÉMARRAGE DU SERVEUR...');
app.listen(PORT, () => {
    console.log(`✅ Serveur démarré sur http://localhost:${PORT}`);
    console.log(`📋 Testez l'API: http://localhost:${PORT}/api/test`);
    console.log(`📋 Durées (avec s): http://localhost:${PORT}/api/durees`);
    console.log(`📋 Durées (sans s): http://localhost:${PORT}/api/duree`);
    console.log(`📋 Chatbot: http://localhost:${PORT}/api/chatbot/categories`);
    console.log('\n💡 IMPORTANT:');
    console.log('   - Le frontend appelle /api/duree (sans "s")');
    console.log('   - Le backend utilise /api/durees (avec "s")');
    console.log('   - La redirection est automatique !');
});