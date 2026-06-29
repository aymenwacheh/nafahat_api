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
// EXPORT
// =============================================

// Export de la fonction query pour être compatible avec l'ancien code
module.exports = {
    query,          // ✅ Pour les contrôleurs qui utilisent db.query()
    pool: promisePool,
    testConnection,
    executeQuery: query // Alias pour compatibilité
};

console.log('📦 Module database exporté avec succès');