// nafahat_api/config/database.js
const mysql = require('mysql2');
const dotenv = require('dotenv');

console.log('📂 Chargement de la configuration de la base de données...');

dotenv.config();

console.log('🔍 Lecture des variables d\'environnement...');
console.log(`   DB_HOST: ${process.env.DB_HOST || 'non défini'}`);
console.log(`   DB_USER: ${process.env.DB_USER || 'non défini'}`);
console.log(`   DB_PASSWORD: ${process.env.DB_PASSWORD ? '********' : 'non défini'}`);
console.log(`   DB_NAME: ${process.env.DB_NAME || 'non défini'}`);

// Vérification des variables obligatoires
const requiredEnvVars = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
let hasError = false;

requiredEnvVars.forEach(varName => {
    if (!process.env[varName]) {
        console.error(`❌ Variable d'environnement manquante: ${varName}`);
        hasError = true;
    }
});

if (hasError) {
    console.error('❌ Veuillez configurer le fichier .env avec les variables requises');
    console.error('📋 Exemple de .env:');
    console.error('   DB_HOST=localhost');
    console.error('   DB_USER=root');
    console.error('   DB_PASSWORD=votre_mot_de_passe');
    console.error('   DB_NAME=nafahat_db');
}

console.log('📝 Création du pool de connexions MySQL...');

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'nafahat_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
});

console.log('✅ Pool de connexions créé avec succès');
console.log(`   📋 Configuration: ${process.env.DB_HOST}:3306/${process.env.DB_NAME}`);

// Promisify pour utiliser async/await
const promisePool = pool.promise();

// =============================================
// FONCTION QUERY PRINCIPALE (compatible avec l'ancien code)
// =============================================

/**
 * Exécute une requête SQL (compatible avec l'ancien db.query)
 * @param {string} sql - Requête SQL
 * @param {Array} params - Paramètres de la requête
 * @returns {Promise<Array>} [rows, fields]
 */
const query = async (sql, params = []) => {
    const startTime = Date.now();
    console.log(`📝 Exécution de la requête SQL...`);
    console.log(`   📋 SQL: ${sql.substring(0, 200)}${sql.length > 200 ? '...' : ''}`);
    if (params.length > 0) {
        console.log(`   📋 Paramètres: ${JSON.stringify(params)}`);
    }
    
    try {
        const [rows, fields] = await promisePool.query(sql, params);
        const duration = Date.now() - startTime;
        console.log(`   ✅ Requête exécutée en ${duration}ms`);
        console.log(`   📋 ${rows.length} lignes retournées`);
        return [rows, fields];
    } catch (error) {
        const duration = Date.now() - startTime;
        console.error(`❌ Erreur lors de l'exécution de la requête (${duration}ms):`);
        console.error(`   📋 Message: ${error.message}`);
        console.error(`   📋 Code: ${error.code || 'N/A'}`);
        console.error(`   📋 SQL: ${sql}`);
        throw error;
    }
};

// =============================================
// FONCTIONS DE TEST DE CONNEXION
// =============================================

const testConnection = async () => {
    console.log('🔍 Test de connexion à la base de données...');
    try {
        const connection = await promisePool.getConnection();
        console.log('✅ Connexion à la base de données réussie!');
        
        const [rows] = await connection.query('SELECT DATABASE() as db_name, NOW() as server_time, VERSION() as mysql_version');
        console.log(`   📋 Base de données: ${rows[0].db_name}`);
        console.log(`   📋 Heure serveur: ${rows[0].server_time}`);
        console.log(`   📋 Version MySQL: ${rows[0].mysql_version}`);
        
        const [tables] = await connection.query("SHOW TABLES LIKE 'duree'");
        if (tables.length > 0) {
            console.log('   ✅ Table "duree" trouvée');
            const [count] = await connection.query('SELECT COUNT(*) as count FROM duree');
            console.log(`   📋 ${count[0].count} enregistrements dans la table "duree"`);
        } else {
            console.log('   ⚠️ Table "duree" non trouvée!');
        }
        
        // ✅ Vérification de la table paiement
        const [paiementTables] = await connection.query("SHOW TABLES LIKE 'paiement'");
        if (paiementTables.length > 0) {
            console.log('   ✅ Table "paiement" trouvée');
            const [count] = await connection.query('SELECT COUNT(*) as count FROM paiement');
            console.log(`   📋 ${count[0].count} enregistrements dans la table "paiement"`);
            
            // Vérifier la structure de la table paiement
            const [columns] = await connection.query('SHOW COLUMNS FROM paiement');
            console.log(`   📋 Colonnes de paiement (${columns.length}): ${columns.map(col => col.Field).join(', ')}`);
        } else {
            console.log('   ⚠️ Table "paiement" non trouvée!');
            console.log('   💡 Exécutez le script SQL pour créer la table paiement');
            console.log('   📋 Script: CREATE TABLE paiement ...');
        }
        
        // ✅ Vérification de la table adherent
        const [adherentTables] = await connection.query("SHOW TABLES LIKE 'adherent'");
        if (adherentTables.length > 0) {
            console.log('   ✅ Table "adherent" trouvée');
            const [count] = await connection.query('SELECT COUNT(*) as count FROM adherent');
            console.log(`   📋 ${count[0].count} enregistrements dans la table "adherent"`);
        } else {
            console.log('   ⚠️ Table "adherent" non trouvée!');
        }
        
        // ✅ Vérification de la table formation
        const [formationTables] = await connection.query("SHOW TABLES LIKE 'formation'");
        if (formationTables.length > 0) {
            console.log('   ✅ Table "formation" trouvée');
            const [count] = await connection.query('SELECT COUNT(*) as count FROM formation');
            console.log(`   📋 ${count[0].count} enregistrements dans la table "formation"`);
        } else {
            console.log('   ⚠️ Table "formation" non trouvée!');
        }
        
        const [allTables] = await connection.query('SHOW TABLES');
        console.log(`   📋 Tables disponibles (${allTables.length}): ${allTables.map(row => Object.values(row)[0]).join(', ')}`);
        
        connection.release();
        console.log('✅ Test de connexion terminé avec succès');
        return true;
    } catch (error) {
        console.error('❌ Erreur de connexion à la base de données:');
        console.error(`   📋 Message: ${error.message}`);
        console.error(`   📋 Code: ${error.code || 'N/A'}`);
        console.error('\n💡 Solutions possibles:');
        console.error('   1. Vérifiez que MySQL est démarré');
        console.error('   2. Vérifiez les identifiants dans le fichier .env');
        console.error('   3. Vérifiez que la base de données existe');
        return false;
    }
};

// =============================================
// FONCTIONS SPÉCIFIQUES POUR LES PAIEMENTS
// =============================================

/**
 * Vérifie si la table paiement existe
 */
const checkPaiementTableExists = async () => {
    try {
        const [rows] = await query("SHOW TABLES LIKE 'paiement'");
        return rows.length > 0;
    } catch (error) {
        console.error('❌ Erreur lors de la vérification de la table paiement:', error);
        return false;
    }
};

/**
 * Crée la table paiement si elle n'existe pas
 */
const createPaiementTableIfNotExists = async () => {
    try {
        const exists = await checkPaiementTableExists();
        if (exists) {
            console.log('✅ Table paiement existe déjà');
            return true;
        }

        console.log('📝 Création de la table paiement...');
        
        const sql = `
            CREATE TABLE IF NOT EXISTS paiement (
                id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
                adherent_id INT NOT NULL,
                adherent_nom_prenom VARCHAR(255) NOT NULL,
                adherent_whatsapp VARCHAR(20) NOT NULL,
                formation_id INT NOT NULL,
                formation_titre_fr VARCHAR(255) NOT NULL,
                formation_titre_ar VARCHAR(255) NOT NULL,
                formation_prix DECIMAL(10,2) NOT NULL,
                formation_devise VARCHAR(10) NOT NULL DEFAULT 'TND',
                modalite_paiement ENUM('bancaire', 'postal', 'en_ligne', 'en_attente') NOT NULL DEFAULT 'en_attente',
                statut_paiement ENUM('en_attente', 'valide', 'refuse', 'annule') NOT NULL DEFAULT 'en_attente',
                montant_paye DECIMAL(10,2) NOT NULL,
                date_paiement DATETIME DEFAULT NULL,
                url_quittance VARCHAR(500) DEFAULT NULL,
                numero_quittance VARCHAR(100) DEFAULT NULL,
                reference_paiement VARCHAR(100) DEFAULT NULL,
                id_paiement_externe VARCHAR(255) DEFAULT NULL,
                commentaire TEXT DEFAULT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                
                INDEX idx_adherent_id (adherent_id),
                INDEX idx_formation_id (formation_id),
                INDEX idx_statut_paiement (statut_paiement),
                INDEX idx_date_paiement (date_paiement),
                INDEX idx_reference_paiement (reference_paiement),
                
                CONSTRAINT fk_paiement_adherent FOREIGN KEY (adherent_id) REFERENCES adherent(id) ON DELETE CASCADE,
                CONSTRAINT fk_paiement_formation FOREIGN KEY (formation_id) REFERENCES formation(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `;

        await query(sql);
        console.log('✅ Table paiement créée avec succès');
        return true;
    } catch (error) {
        console.error('❌ Erreur lors de la création de la table paiement:', error);
        return false;
    }
};

/**
 * Vérifier l'intégrité des clés étrangères pour paiement
 */
const checkPaiementForeignKeys = async () => {
    try {
        console.log('🔍 Vérification des clés étrangères pour paiement...');
        
        // Vérifier si les tables référencées existent
        const [adherentTables] = await query("SHOW TABLES LIKE 'adherent'");
        if (adherentTables.length === 0) {
            console.log('⚠️ Table adherent manquante - clé étrangère ignorée');
            // On peut créer la table adherent si elle n'existe pas
            // Mais c'est déjà géré ailleurs
            return false;
        }

        const [formationTables] = await query("SHOW TABLES LIKE 'formation'");
        if (formationTables.length === 0) {
            console.log('⚠️ Table formation manquante - clé étrangère ignorée');
            return false;
        }

        console.log('✅ Toutes les tables référencées existent');
        return true;
    } catch (error) {
        console.error('❌ Erreur lors de la vérification des clés étrangères:', error);
        return false;
    }
};

// =============================================
// EXPORT
// =============================================

// Export de la fonction query pour être compatible avec l'ancien code
module.exports = {
    query,          // ✅ Pour les contrôleurs qui utilisent db.query()
    pool: promisePool,
    testConnection,
    executeQuery: query, // Alias pour compatibilité
    // ✅ Nouvelles fonctions pour les paiements
    checkPaiementTableExists,
    createPaiementTableIfNotExists,
    checkPaiementForeignKeys
};

console.log('📦 Module database exporté avec succès');
console.log('   ✅ Fonctions disponibles:');
console.log('      - query()');
console.log('      - pool (promise)');
console.log('      - testConnection()');
console.log('      - checkPaiementTableExists()');
console.log('      - createPaiementTableIfNotExists()');
console.log('      - checkPaiementForeignKeys()');