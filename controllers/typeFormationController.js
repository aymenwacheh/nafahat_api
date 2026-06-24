// nafahat_api/controllers/typeFormationController.js
const db = require('../config/database');

const getAllTypesFormation = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM type_formation ORDER BY type_formation');
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};

const getTypeFormationById = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await db.query('SELECT * FROM type_formation WHERE id = ?', [id]);
        if (rows.length === 0) return res.status(404).json({ success: false, message: 'Type non trouvé' });
        res.json({ success: true, data: rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};

const createTypeFormation = async (req, res) => {
    try {
        const { type_formation, ch1, ch2, ch3, ch4, ch5 } = req.body;
        if (!type_formation) {
            return res.status(400).json({ success: false, message: 'type_formation requis' });
        }
        const [result] = await db.query(
            `INSERT INTO type_formation (type_formation, ch1, ch2, ch3, ch4, ch5)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [type_formation, ch1 || null, ch2 || null, ch3 || null, ch4 || null, ch5 || null]
        );
        res.status(201).json({ success: true, message: 'Type de formation créé', id: result.insertId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};

const updateTypeFormation = async (req, res) => {
    try {
        const { id } = req.params;
        const { type_formation, ch1, ch2, ch3, ch4, ch5 } = req.body;
        const [existing] = await db.query('SELECT * FROM type_formation WHERE id = ?', [id]);
        if (existing.length === 0) return res.status(404).json({ success: false, message: 'Type non trouvé' });
        await db.query(
            `UPDATE type_formation SET
                type_formation = COALESCE(?, type_formation),
                ch1 = COALESCE(?, ch1),
                ch2 = COALESCE(?, ch2),
                ch3 = COALESCE(?, ch3),
                ch4 = COALESCE(?, ch4),
                ch5 = COALESCE(?, ch5),
                updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [type_formation, ch1, ch2, ch3, ch4, ch5, id]
        );
        res.json({ success: true, message: 'Type mis à jour' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};

const deleteTypeFormation = async (req, res) => {
    try {
        const { id } = req.params;
        const [used] = await db.query('SELECT COUNT(*) as count FROM formation WHERE id_type_formation = ?', [id]);
        if (used[0].count > 0) {
            return res.status(400).json({ success: false, message: 'Type utilisé dans des formations, suppression impossible' });
        }
        await db.query('DELETE FROM type_formation WHERE id = ?', [id]);
        res.json({ success: true, message: 'Type supprimé' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};

module.exports = {
    getAllTypesFormation,
    getTypeFormationById,
    createTypeFormation,
    updateTypeFormation,
    deleteTypeFormation
};