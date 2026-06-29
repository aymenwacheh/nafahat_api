// nafahat_api/routes/duree.js
const express = require('express');
const router = express.Router();

console.log('📂 Chargement du routeur duree.js...');

// Chargement du contrôleur
try {
    const dureeController = require('../controllers/dureeController');
    console.log('✅ Contrôleur dureeController chargé avec succès');
    console.log('📋 Fonctions exportées:', Object.keys(dureeController).join(', '));
    
    // Vérification que getAllDuree existe
    if (typeof dureeController.getAllDuree === 'function') {
        console.log('✅ getAllDuree est bien une fonction');
    } else {
        console.error('❌ getAllDuree N\'EST PAS une fonction! Type:', typeof dureeController.getAllDuree);
    }
    
    // =============================================
    // ROUTES
    // =============================================
    console.log('📌 Enregistrement des routes...');
    
    // GET / - Récupérer toutes les durées
    router.get('/', (req, res, next) => {
        console.log('📥 [GET /] Requête reçue pour récupérer toutes les durées');
        console.log(`📋 Headers: ${JSON.stringify(req.headers)}`);
        next();
    }, dureeController.getAllDuree);
    console.log('   ✅ GET /api/duree enregistré');
    
    // GET /:id - Récupérer une durée par ID
    router.get('/:id', (req, res, next) => {
        console.log(`📥 [GET /:id] Requête reçue pour l'ID: ${req.params.id}`);
        next();
    }, dureeController.getDureeById);
    console.log('   ✅ GET /api/duree/:id enregistré');
    
    // POST / - Créer une durée
    router.post('/', (req, res, next) => {
        console.log('📥 [POST /] Requête reçue pour créer une durée');
        console.log(`📋 Body: ${JSON.stringify(req.body)}`);
        next();
    }, dureeController.createDuree);
    console.log('   ✅ POST /api/duree enregistré');
    
    // PUT /:id - Mettre à jour une durée
    router.put('/:id', (req, res, next) => {
        console.log(`📥 [PUT /:id] Requête reçue pour l'ID: ${req.params.id}`);
        console.log(`📋 Body: ${JSON.stringify(req.body)}`);
        next();
    }, dureeController.updateDuree);
    console.log('   ✅ PUT /api/duree/:id enregistré');
    
    // DELETE /:id - Supprimer une durée
    router.delete('/:id', (req, res, next) => {
        console.log(`📥 [DELETE /:id] Requête reçue pour l'ID: ${req.params.id}`);
        next();
    }, dureeController.deleteDuree);
    console.log('   ✅ DELETE /api/duree/:id enregistré');
    
    console.log('✅ Toutes les routes ont été enregistrées avec succès');
    
} catch (error) {
    console.error('❌ Erreur lors du chargement du contrôleur:', error.message);
    console.error('❌ Stack:', error.stack);
    // En cas d'erreur, on renvoie une erreur 500 pour toutes les routes
    router.use((req, res) => {
        console.error(`❌ Route ${req.method} ${req.url} - Erreur de chargement du contrôleur`);
        res.status(500).json({
            success: false,
            message: 'Erreur de configuration du serveur',
            error: error.message
        });
    });
}

module.exports = router;