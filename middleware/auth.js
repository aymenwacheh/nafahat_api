// nafahat_api/middleware/auth.js
const jwt = require('jsonwebtoken');

// Middleware pour protéger les routes
exports.protect = async (req, res, next) => {
    try {
        let token;

        // 🔥 MODE DÉVELOPPEMENT : Simuler un utilisateur admin
        if (process.env.NODE_ENV !== 'production') {
            console.log('🔓 [DEV MODE] Authentification automatique');
            req.user = { 
                id: 9,
                role_id: 5,
                role_nom: 'super_admin',
                nom_prenom: 'Super Admin'
            };
            return next();
        }

        // Vérifier si le token est dans le header Authorization
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Non autorisé - Token manquant'
            });
        }

        // Vérifier le token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'nafahat_secret_key_2024');

        // Ajouter l'utilisateur à la requête
        req.user = decoded;

        next();
    } catch (error) {
        console.error('Erreur auth:', error);
        return res.status(401).json({
            success: false,
            message: 'Non autorisé - Token invalide'
        });
    }
};

// Middleware pour vérifier les rôles
exports.authorize = (...roles) => {
    return (req, res, next) => {
        // 🔥 MODE DÉVELOPPEMENT : Autoriser tout
        if (process.env.NODE_ENV !== 'production') {
            console.log(`🔓 [DEV MODE] Autorisation accordée pour: ${req.user?.nom_prenom || 'Admin'}`);
            return next();
        }

        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Non autorisé'
            });
        }

        // Vérifier si le rôle de l'utilisateur est autorisé
        if (!roles.includes(req.user.role_nom)) {
            return res.status(403).json({
                success: false,
                message: 'Accès refusé - Rôle non autorisé'
            });
        }

        next();
    };
};