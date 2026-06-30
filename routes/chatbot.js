// routes/chatbot.js
const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Récupérer toutes les catégories
router.get('/categories', async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT * FROM chatbot_categories WHERE active = TRUE ORDER BY nom_fr'
        );
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Erreur categories:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Récupérer toutes les questions/réponses
router.get('/qa', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT q.*, c.nom_fr as categorie_nom_fr, c.nom_ar as categorie_nom_ar
            FROM chatbot_qa q
            LEFT JOIN chatbot_categories c ON q.category_id = c.id
            WHERE q.active = TRUE
            ORDER BY q.id
        `);
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Erreur qa:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Rechercher une réponse par mot-clé ou question
router.post('/ask', async (req, res) => {
    try {
        const { message, langue = 'fr' } = req.body;
        
        if (!message || message.trim() === '') {
            return res.status(400).json({ 
                success: false, 
                message: 'Message requis' 
            });
        }

        const searchTerm = message.trim().toLowerCase();
        
        const [rows] = await db.query(`
            SELECT 
                q.id,
                q.question_fr,
                q.question_ar,
                q.reponse_fr,
                q.reponse_ar,
                q.keywords,
                c.nom_fr as categorie_nom_fr,
                c.nom_ar as categorie_nom_ar
            FROM chatbot_qa q
            LEFT JOIN chatbot_categories c ON q.category_id = c.id
            WHERE q.active = TRUE
            AND (
                LOWER(q.question_fr) LIKE ? 
                OR LOWER(q.question_ar) LIKE ?
                OR LOWER(q.keywords) LIKE ?
                OR LOWER(q.reponse_fr) LIKE ?
                OR LOWER(q.reponse_ar) LIKE ?
            )
            ORDER BY 
                CASE 
                    WHEN LOWER(q.question_fr) = ? THEN 1
                    WHEN LOWER(q.question_ar) = ? THEN 1
                    WHEN LOWER(q.keywords) LIKE ? THEN 2
                    ELSE 3
                END
            LIMIT 1
        `, [
            `%${searchTerm}%`,
            `%${searchTerm}%`,
            `%${searchTerm}%`,
            `%${searchTerm}%`,
            `%${searchTerm}%`,
            searchTerm,
            searchTerm,
            `%${searchTerm}%`
        ]);

        if (rows.length > 0) {
            const reponse = langue === 'ar' ? rows[0].reponse_ar : rows[0].reponse_fr;
            const question = langue === 'ar' ? rows[0].question_ar : rows[0].question_fr;
            const categorie = langue === 'ar' ? rows[0].categorie_nom_ar : rows[0].categorie_nom_fr;
            
            res.json({
                success: true,
                data: {
                    question: question,
                    reponse: reponse,
                    categorie: categorie,
                    id: rows[0].id
                }
            });
        } else {
            const reponseDefaut = langue === 'ar' 
                ? 'عذراً، لم أفهم سؤالك. يمكنك أن تسأل عن:\n• التكوينات 📚\n• الأسعار 💰\n• التسجيل 📝\n• الاتصال 📞\n• المؤطرين 👨‍🏫'
                : 'Désolé, je n\'ai pas compris votre question. Vous pouvez demander :\n• Formations 📚\n• Prix 💰\n• Inscription 📝\n• Contact 📞\n• Formateurs 👨‍🏫';
            
            res.json({
                success: true,
                data: {
                    question: message,
                    reponse: reponseDefaut,
                    categorie: null,
                    id: null
                }
            });
        }
    } catch (error) {
        console.error('Erreur chatbot ask:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erreur lors du traitement de votre demande' 
        });
    }
});

// Ajouter une nouvelle question/réponse (admin)
router.post('/qa', async (req, res) => {
    try {
        const { category_id, question_fr, question_ar, reponse_fr, reponse_ar, keywords } = req.body;
        
        const [result] = await db.query(
            `INSERT INTO chatbot_qa 
             (category_id, question_fr, question_ar, reponse_fr, reponse_ar, keywords) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [category_id, question_fr, question_ar, reponse_fr, reponse_ar, keywords]
        );
        
        res.json({ 
            success: true, 
            message: 'Question/réponse ajoutée avec succès',
            id: result.insertId 
        });
    } catch (error) {
        console.error('Erreur ajout qa:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Supprimer une question/réponse (admin)
router.delete('/qa/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM chatbot_qa WHERE id = ?', [id]);
        res.json({ success: true, message: 'Supprimé avec succès' });
    } catch (error) {
        console.error('Erreur suppression qa:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;