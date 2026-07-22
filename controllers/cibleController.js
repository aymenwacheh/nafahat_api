// nafahat_api/controllers/cibleController.js
const db = require('../config/database');

// =============================================
// ✅ GET - Récupérer toutes les cibles
// =============================================
const getAllCibles = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT * FROM cible 
            ORDER BY nom_cible ASC
        `);
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('❌ Erreur getAllCibles:', error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};

// =============================================
// ✅ GET - Récupérer une cible par ID
// =============================================
const getCibleById = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await db.query(
            'SELECT * FROM cible WHERE id = ?',
            [id]
        );
        
        if (rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Cible non trouvée' 
            });
        }
        
        res.json({ success: true, data: rows[0] });
    } catch (error) {
        console.error('❌ Erreur getCibleById:', error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};

// =============================================
// ✅ POST - Créer une nouvelle cible
// =============================================
const createCible = async (req, res) => {
    try {
        const { nom_cible, ch1, ch2, ch3 } = req.body;

        // Validation
        if (!nom_cible || nom_cible.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Le nom de la cible est obligatoire'
            });
        }

        // ✅ Correction : utilisation de la table 'cible' au lieu de 'pub_cible'
        const [result] = await db.query(
            `INSERT INTO cible (nom_cible, ch1, ch2, ch3) 
             VALUES (?, ?, ?, ?)`,
            [nom_cible.trim(), ch1 || null, ch2 || null, ch3 || null]
        );

        // Récupérer la cible créée
        const [newCible] = await db.query(
            'SELECT * FROM cible WHERE id = ?',
            [result.insertId]
        );

        console.log(`✅ [createCible] Cible créée avec l'ID: ${result.insertId}`);
        
        res.status(201).json({
            success: true,
            message: 'Cible créée avec succès',
            data: newCible[0]
        });
    } catch (error) {
        console.error('❌ Erreur createCible:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            error: error.sqlMessage || error.message
        });
    }
};

// =============================================
// ✅ PUT - Mettre à jour une cible
// =============================================
const updateCible = async (req, res) => {
    try {
        const { id } = req.params;
        const { nom_cible, ch1, ch2, ch3 } = req.body;

        // Vérifier si la cible existe
        const [existing] = await db.query(
            'SELECT id FROM cible WHERE id = ?',
            [id]
        );
        
        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Cible non trouvée'
            });
        }

        // Validation
        if (!nom_cible || nom_cible.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Le nom de la cible est obligatoire'
            });
        }

        // ✅ Correction : utilisation de la table 'cible'
        const [result] = await db.query(
            `UPDATE cible SET 
                nom_cible = ?, 
                ch1 = ?, 
                ch2 = ?, 
                ch3 = ? 
             WHERE id = ?`,
            [nom_cible.trim(), ch1 || null, ch2 || null, ch3 || null, id]
        );

        // Récupérer la cible mise à jour
        const [updatedCible] = await db.query(
            'SELECT * FROM cible WHERE id = ?',
            [id]
        );

        console.log(`✅ [updateCible] Cible ID ${id} mise à jour avec succès`);
        
        res.json({
            success: true,
            message: 'Cible mise à jour avec succès',
            data: updatedCible[0]
        });
    } catch (error) {
        console.error('❌ Erreur updateCible:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            error: error.sqlMessage || error.message
        });
    }
};

// =============================================
// ❌ DELETE - Supprimer une cible
// =============================================
const deleteCible = async (req, res) => {
    try {
        const { id } = req.params;

        // Vérifier si la cible existe
        const [existing] = await db.query(
            'SELECT id FROM cible WHERE id = ?',
            [id]
        );
        
        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Cible non trouvée'
            });
        }

        // ✅ Correction : utilisation de la table 'cible'
        await db.query('DELETE FROM cible WHERE id = ?', [id]);

        console.log(`✅ [deleteCible] Cible ID ${id} supprimée avec succès`);
        
        res.json({
            success: true,
            message: 'Cible supprimée avec succès'
        });
    } catch (error) {
        console.error('❌ Erreur deleteCible:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            error: error.sqlMessage || error.message
        });
    }
};

// =============================================
// 📤 EXPORTS
// =============================================
module.exports = {
    getAllCibles,
    getCibleById,
    createCible,
    updateCible,
    deleteCible
};