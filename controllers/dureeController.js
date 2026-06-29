// nafahat_api/controllers/dureeController.js
const db = require('../config/database');

console.log('📂 Chargement du contrôleur dureeController.js...');

// Vérification de la connexion à la base de données
console.log('🔍 Vérification de la connexion à la base de données...');

// =============================================
// FONCTIONS
// =============================================

const getAllDuree = async (req, res) => {
    console.log('🔄 [getAllDuree] Début de l\'exécution');
    try {
        console.log('📝 [getAllDuree] Exécution de la requête SQL: SELECT * FROM duree ORDER BY type_duree');
        const [rows] = await db.query('SELECT * FROM duree ORDER BY type_duree');
        console.log(`✅ [getAllDuree] ${rows.length} durées récupérées`);
        console.log(`📋 [getAllDuree] Données: ${JSON.stringify(rows).substring(0, 200)}...`);
        
        const response = { success: true, data: rows };
        console.log('📤 [getAllDuree] Réponse envoyée');
        res.json(response);
    } catch (error) {
        console.error('❌ [getAllDuree] Erreur:', error.message);
        console.error('❌ [getAllDuree] Stack:', error.stack);
        res.status(500).json({ 
            success: false, 
            message: 'Erreur serveur',
            error: error.message 
        });
    }
};

const getDureeById = async (req, res) => {
    console.log(`🔄 [getDureeById] Début de l'exécution pour l'ID: ${req.params.id}`);
    try {
        const { id } = req.params;
        console.log(`📝 [getDureeById] Exécution de la requête SQL: SELECT * FROM duree WHERE id = ${id}`);
        const [rows] = await db.query('SELECT * FROM duree WHERE id = ?', [id]);
        
        if (rows.length === 0) {
            console.log(`⚠️ [getDureeById] Aucune durée trouvée pour l'ID: ${id}`);
            return res.status(404).json({ success: false, message: 'Durée non trouvée' });
        }
        
        console.log(`✅ [getDureeById] Durée trouvée: ${JSON.stringify(rows[0])}`);
        res.json({ success: true, data: rows[0] });
    } catch (error) {
        console.error(`❌ [getDureeById] Erreur pour l'ID ${req.params.id}:`, error.message);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};

const createDuree = async (req, res) => {
    console.log('🔄 [createDuree] Début de l\'exécution');
    try {
        const { type_duree, ch1, ch2, ch3, ch4, ch5, ch6 } = req.body;
        console.log(`📋 [createDuree] Données reçues: type_duree=${type_duree}, ch1=${ch1}, ch2=${ch2}, ch3=${ch3}, ch4=${ch4}, ch5=${ch5}, ch6=${ch6}`);
        
        if (!type_duree) {
            console.log('⚠️ [createDuree] type_duree manquant');
            return res.status(400).json({ success: false, message: 'type_duree requis' });
        }
        
        const values = [type_duree, ch1 || null, ch2 || null, ch3 || null, ch4 || null, ch5 || null, ch6 || null];
        console.log(`📝 [createDuree] Exécution de la requête INSERT avec les valeurs: ${JSON.stringify(values)}`);
        
        const [result] = await db.query(
            `INSERT INTO duree (type_duree, ch1, ch2, ch3, ch4, ch5, ch6)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            values
        );
        
        console.log(`✅ [createDuree] Durée créée avec l'ID: ${result.insertId}`);
        res.status(201).json({ 
            success: true, 
            message: 'Durée créée', 
            id: result.insertId 
        });
    } catch (error) {
        console.error('❌ [createDuree] Erreur:', error.message);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};

const updateDuree = async (req, res) => {
    console.log(`🔄 [updateDuree] Début de l'exécution pour l'ID: ${req.params.id}`);
    try {
        const { id } = req.params;
        const { type_duree, ch1, ch2, ch3, ch4, ch5, ch6 } = req.body;
        console.log(`📋 [updateDuree] Données reçues: type_duree=${type_duree}, ch1=${ch1}, ch2=${ch2}, ch3=${ch3}, ch4=${ch4}, ch5=${ch5}, ch6=${ch6}`);
        
        // Vérification de l'existence
        console.log(`📝 [updateDuree] Vérification de l'existence de l'ID ${id}`);
        const [existing] = await db.query('SELECT * FROM duree WHERE id = ?', [id]);
        if (existing.length === 0) {
            console.log(`⚠️ [updateDuree] Aucune durée trouvée pour l'ID: ${id}`);
            return res.status(404).json({ success: false, message: 'Durée non trouvée' });
        }
        
        console.log(`📝 [updateDuree] Mise à jour de l'ID ${id}`);
        await db.query(
            `UPDATE duree SET
                type_duree = COALESCE(?, type_duree),
                ch1 = COALESCE(?, ch1),
                ch2 = COALESCE(?, ch2),
                ch3 = COALESCE(?, ch3),
                ch4 = COALESCE(?, ch4),
                ch5 = COALESCE(?, ch5),
                ch6 = COALESCE(?, ch6),
                updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [type_duree, ch1, ch2, ch3, ch4, ch5, ch6, id]
        );
        
        console.log(`✅ [updateDuree] Durée ${id} mise à jour avec succès`);
        res.json({ success: true, message: 'Durée mise à jour' });
    } catch (error) {
        console.error(`❌ [updateDuree] Erreur pour l'ID ${req.params.id}:`, error.message);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};

const deleteDuree = async (req, res) => {
    console.log(`🔄 [deleteDuree] Début de l'exécution pour l'ID: ${req.params.id}`);
    try {
        const { id } = req.params;
        
        // Vérification de l'utilisation
        console.log(`📝 [deleteDuree] Vérification si la durée ${id} est utilisée dans des formations`);
        const [used] = await db.query('SELECT COUNT(*) as count FROM formation WHERE id_duree = ?', [id]);
        if (used[0].count > 0) {
            console.log(`⚠️ [deleteDuree] Durée ${id} utilisée dans ${used[0].count} formation(s), suppression impossible`);
            return res.status(400).json({ 
                success: false, 
                message: 'Durée utilisée dans des formations, suppression impossible' 
            });
        }
        
        console.log(`📝 [deleteDuree] Suppression de l'ID ${id}`);
        await db.query('DELETE FROM duree WHERE id = ?', [id]);
        
        console.log(`✅ [deleteDuree] Durée ${id} supprimée avec succès`);
        res.json({ success: true, message: 'Durée supprimée' });
    } catch (error) {
        console.error(`❌ [deleteDuree] Erreur pour l'ID ${req.params.id}:`, error.message);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};

console.log('✅ Contrôleur dureeController.js chargé avec succès');
console.log('📋 Fonctions exportées: getAllDuree, getDureeById, createDuree, updateDuree, deleteDuree');

module.exports = {
    getAllDuree,
    getDureeById,
    createDuree,
    updateDuree,
    deleteDuree
};