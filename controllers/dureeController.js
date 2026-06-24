// nafahat_api/controllers/dureeController.js
const db = require('../config/database');

const getAllDurees = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM duree ORDER BY type_duree');
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};

const getDureeById = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await db.query('SELECT * FROM duree WHERE id = ?', [id]);
        if (rows.length === 0) return res.status(404).json({ success: false, message: 'Durée non trouvée' });
        res.json({ success: true, data: rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};

const createDuree = async (req, res) => {
    try {
        const { type_duree, ch1, ch2, ch3, ch4, ch5, ch6 } = req.body;
        if (!type_duree) {
            return res.status(400).json({ success: false, message: 'type_duree requis' });
        }
        const [result] = await db.query(
            `INSERT INTO duree (type_duree, ch1, ch2, ch3, ch4, ch5, ch6)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [type_duree, ch1 || null, ch2 || null, ch3 || null, ch4 || null, ch5 || null, ch6 || null]
        );
        res.status(201).json({ success: true, message: 'Durée créée', id: result.insertId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};

const updateDuree = async (req, res) => {
    try {
        const { id } = req.params;
        const { type_duree, ch1, ch2, ch3, ch4, ch5, ch6 } = req.body;
        const [existing] = await db.query('SELECT * FROM duree WHERE id = ?', [id]);
        if (existing.length === 0) return res.status(404).json({ success: false, message: 'Durée non trouvée' });
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
        res.json({ success: true, message: 'Durée mise à jour' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};

const deleteDuree = async (req, res) => {
    try {
        const { id } = req.params;
        const [used] = await db.query('SELECT COUNT(*) as count FROM formation WHERE id_duree = ?', [id]);
        if (used[0].count > 0) {
            return res.status(400).json({ success: false, message: 'Durée utilisée dans des formations, suppression impossible' });
        }
        await db.query('DELETE FROM duree WHERE id = ?', [id]);
        res.json({ success: true, message: 'Durée supprimée' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
};

module.exports = {
    getAllDurees,
    getDureeById,
    createDuree,
    updateDuree,
    deleteDuree
};