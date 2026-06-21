// nafahat_api/controllers/categorieController.js
const db = require('../config/database');

// =============================================
//               CATÉGORIES (CRUD)
// =============================================

// Récupérer toutes les catégories (avec leur parent)
const getAllCategories = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT c.*, 
                   p.categorie_fr as parent_fr, 
                   p.categorie_ar as parent_ar 
            FROM categorie c
            LEFT JOIN categorie p ON c.parent_id = p.id
            ORDER BY c.id DESC
        `);
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('❌ getAllCategories:', error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};

// Récupérer une catégorie par ID (avec ses sous-catégories)
const getCategorieById = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await db.query(`
            SELECT c.*, 
                   p.categorie_fr as parent_fr, 
                   p.categorie_ar as parent_ar 
            FROM categorie c
            LEFT JOIN categorie p ON c.parent_id = p.id
            WHERE c.id = ?
        `, [id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Catégorie non trouvée' });
        }
        
        // Récupérer les sous-catégories
        const [subs] = await db.query(
            'SELECT * FROM sous_categorie WHERE id_categorie = ? ORDER BY nom_fr',
            [id]
        );
        
        res.json({ 
            success: true, 
            data: { 
                ...rows[0], 
                sous_categories: subs 
            } 
        });
    } catch (error) {
        console.error('❌ getCategorieById:', error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};

// Créer une catégorie
const createCategorie = async (req, res) => {
    try {
        const { categorie_fr, categorie_ar, parent_id, ch1, ch2, ch3 } = req.body;

        if (!categorie_fr || !categorie_ar) {
            return res.status(400).json({
                success: false,
                message: 'Les champs categorie_fr et categorie_ar sont requis'
            });
        }

        // Vérifier parent_id
        if (parent_id) {
            const [parent] = await db.query('SELECT id FROM categorie WHERE id = ?', [parent_id]);
            if (parent.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'La catégorie parente spécifiée n\'existe pas'
                });
            }
        }

        const [result] = await db.query(
            `INSERT INTO categorie (categorie_fr, categorie_ar, parent_id, ch1, ch2, ch3)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [categorie_fr, categorie_ar, parent_id || null, ch1 || null, ch2 || null, ch3 || null]
        );

        res.status(201).json({
            success: true,
            message: 'Catégorie créée avec succès',
            id: result.insertId
        });
    } catch (error) {
        console.error('❌ createCategorie:', error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};

// Mettre à jour une catégorie
const updateCategorie = async (req, res) => {
    try {
        const { id } = req.params;
        const { categorie_fr, categorie_ar, parent_id, ch1, ch2, ch3 } = req.body;

        const [existing] = await db.query('SELECT * FROM categorie WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ success: false, message: 'Catégorie non trouvée' });
        }

        if (parent_id && parseInt(parent_id) === parseInt(id)) {
            return res.status(400).json({
                success: false,
                message: 'Une catégorie ne peut pas être son propre parent'
            });
        }

        if (parent_id) {
            const [parent] = await db.query('SELECT id FROM categorie WHERE id = ?', [parent_id]);
            if (parent.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'La catégorie parente spécifiée n\'existe pas'
                });
            }
        }

        await db.query(
            `UPDATE categorie SET
                categorie_fr = COALESCE(?, categorie_fr),
                categorie_ar = COALESCE(?, categorie_ar),
                parent_id = COALESCE(?, parent_id),
                ch1 = COALESCE(?, ch1),
                ch2 = COALESCE(?, ch2),
                ch3 = COALESCE(?, ch3),
                updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [categorie_fr, categorie_ar, parent_id || null, ch1, ch2, ch3, id]
        );

        res.json({
            success: true,
            message: 'Catégorie mise à jour avec succès'
        });
    } catch (error) {
        console.error('❌ updateCategorie:', error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};

// Supprimer une catégorie
const deleteCategorie = async (req, res) => {
    try {
        const { id } = req.params;

        // Vérifier les sous-catégories (parent_id)
        const [subsCategorie] = await db.query(
            'SELECT COUNT(*) as count FROM categorie WHERE parent_id = ?',
            [id]
        );
        if (subsCategorie[0].count > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cette catégorie possède des sous-catégories, suppression impossible'
            });
        }

        // Vérifier les sous-catégories (table séparée)
        const [subsSousCategorie] = await db.query(
            'SELECT COUNT(*) as count FROM sous_categorie WHERE id_categorie = ?',
            [id]
        );
        if (subsSousCategorie[0].count > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cette catégorie possède des sous-catégories, suppression impossible'
            });
        }

        const [result] = await db.query('DELETE FROM categorie WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Catégorie non trouvée' });
        }

        res.json({ success: true, message: 'Catégorie supprimée avec succès' });
    } catch (error) {
        console.error('❌ deleteCategorie:', error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};

// =============================================
//             SOUS-CATÉGORIES (CRUD)
// =============================================

// Récupérer toutes les sous-catégories
const getAllSousCategories = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT sc.*, c.categorie_fr, c.categorie_ar
            FROM sous_categorie sc
            JOIN categorie c ON sc.id_categorie = c.id
            ORDER BY sc.id DESC
        `);
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('❌ getAllSousCategories:', error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};

// Récupérer une sous-catégorie par ID
const getSousCategorieById = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await db.query(`
            SELECT sc.*, c.categorie_fr, c.categorie_ar
            FROM sous_categorie sc
            JOIN categorie c ON sc.id_categorie = c.id
            WHERE sc.id = ?
        `, [id]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Sous-catégorie non trouvée' });
        }
        res.json({ success: true, data: rows[0] });
    } catch (error) {
        console.error('❌ getSousCategorieById:', error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};

// Récupérer les sous-catégories d'une catégorie
const getSousCategoriesByCategorie = async (req, res) => {
    try {
        const { idCategorie } = req.params;
        const [rows] = await db.query(
            'SELECT * FROM sous_categorie WHERE id_categorie = ? ORDER BY nom_fr',
            [idCategorie]
        );
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('❌ getSousCategoriesByCategorie:', error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};

// Créer une sous-catégorie
const createSousCategorie = async (req, res) => {
    try {
        const { nom_fr, nom_ar, id_categorie, ch1, ch2, ch3, ch4, ch5 } = req.body;

        if (!nom_fr || !nom_ar || !id_categorie) {
            return res.status(400).json({
                success: false,
                message: 'Les champs nom_fr, nom_ar et id_categorie sont requis'
            });
        }

        // Vérifier la catégorie parente
        const [categorie] = await db.query('SELECT id FROM categorie WHERE id = ?', [id_categorie]);
        if (categorie.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'La catégorie spécifiée n\'existe pas'
            });
        }

        const [result] = await db.query(
            `INSERT INTO sous_categorie (nom_fr, nom_ar, id_categorie, ch1, ch2, ch3, ch4, ch5)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [nom_fr, nom_ar, id_categorie, ch1 || null, ch2 || null, ch3 || null, ch4 || null, ch5 || null]
        );

        res.status(201).json({
            success: true,
            message: 'Sous-catégorie créée avec succès',
            id: result.insertId
        });
    } catch (error) {
        console.error('❌ createSousCategorie:', error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};

// Mettre à jour une sous-catégorie
const updateSousCategorie = async (req, res) => {
    try {
        const { id } = req.params;
        const { nom_fr, nom_ar, id_categorie, ch1, ch2, ch3, ch4, ch5 } = req.body;

        const [existing] = await db.query('SELECT * FROM sous_categorie WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ success: false, message: 'Sous-catégorie non trouvée' });
        }

        if (id_categorie) {
            const [categorie] = await db.query('SELECT id FROM categorie WHERE id = ?', [id_categorie]);
            if (categorie.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'La catégorie spécifiée n\'existe pas'
                });
            }
        }

        await db.query(
            `UPDATE sous_categorie SET
                nom_fr = COALESCE(?, nom_fr),
                nom_ar = COALESCE(?, nom_ar),
                id_categorie = COALESCE(?, id_categorie),
                ch1 = COALESCE(?, ch1),
                ch2 = COALESCE(?, ch2),
                ch3 = COALESCE(?, ch3),
                ch4 = COALESCE(?, ch4),
                ch5 = COALESCE(?, ch5),
                updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [nom_fr, nom_ar, id_categorie, ch1, ch2, ch3, ch4, ch5, id]
        );

        res.json({
            success: true,
            message: 'Sous-catégorie mise à jour avec succès'
        });
    } catch (error) {
        console.error('❌ updateSousCategorie:', error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};

// Supprimer une sous-catégorie
const deleteSousCategorie = async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await db.query('DELETE FROM sous_categorie WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Sous-catégorie non trouvée' });
        }
        res.json({ success: true, message: 'Sous-catégorie supprimée avec succès' });
    } catch (error) {
        console.error('❌ deleteSousCategorie:', error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};

module.exports = {
    getAllCategories,
    getCategorieById,
    createCategorie,
    updateCategorie,
    deleteCategorie,
    getAllSousCategories,
    getSousCategorieById,
    getSousCategoriesByCategorie,
    createSousCategorie,
    updateSousCategorie,
    deleteSousCategorie
};