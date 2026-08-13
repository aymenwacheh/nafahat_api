// models/About.js
const db = require('../config/database');

// Modèle About avec MySQL
const About = {
    // Trouver une seule ligne
    findOne: async () => {
        const result = await db.query('SELECT * FROM about LIMIT 1');
        return result.length > 0 ? result[0] : null;
    },

    // Vérifier si des données existent
    exists: async () => {
        const result = await db.query('SELECT COUNT(*) as count FROM about');
        return result[0].count > 0;
    },

    // Créer une nouvelle entrée
    create: async (data) => {
        const {
            title_fr, title_ar, slogan_fr, slogan_ar,
            subtitle_fr, subtitle_ar, description_fr, description_ar,
            cta_fr, cta_ar, vision_fr, vision_ar,
            mission_fr, mission_ar, values_json,
            stat1_value, stat1_label_fr, stat1_label_ar,
            stat2_value, stat2_label_fr, stat2_label_ar,
            stat3_value, stat3_label_fr, stat3_label_ar,
            stat4_value, stat4_label_fr, stat4_label_ar,
            email, phone, address_fr, address_ar,
            facebook_url, youtube_url, telegram_url, instagram_url,
            team_members_json
        } = data;

        const result = await db.query(
            `INSERT INTO about (
                title_fr, title_ar, slogan_fr, slogan_ar,
                subtitle_fr, subtitle_ar, description_fr, description_ar,
                cta_fr, cta_ar, vision_fr, vision_ar,
                mission_fr, mission_ar, values_json,
                stat1_value, stat1_label_fr, stat1_label_ar,
                stat2_value, stat2_label_fr, stat2_label_ar,
                stat3_value, stat3_label_fr, stat3_label_ar,
                stat4_value, stat4_label_fr, stat4_label_ar,
                email, phone, address_fr, address_ar,
                facebook_url, youtube_url, telegram_url, instagram_url,
                team_members_json
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                title_fr, title_ar, slogan_fr, slogan_ar,
                subtitle_fr, subtitle_ar, description_fr, description_ar,
                cta_fr, cta_ar, vision_fr, vision_ar,
                mission_fr, mission_ar, values_json,
                stat1_value, stat1_label_fr, stat1_label_ar,
                stat2_value, stat2_label_fr, stat2_label_ar,
                stat3_value, stat3_label_fr, stat3_label_ar,
                stat4_value, stat4_label_fr, stat4_label_ar,
                email, phone, address_fr, address_ar,
                facebook_url, youtube_url, telegram_url, instagram_url,
                team_members_json
            ]
        );
        return { id: result.insertId, ...data };
    },

    // Mettre à jour une entrée
    findByIdAndUpdate: async (id, data) => {
        const {
            title_fr, title_ar, slogan_fr, slogan_ar,
            subtitle_fr, subtitle_ar, description_fr, description_ar,
            cta_fr, cta_ar, vision_fr, vision_ar,
            mission_fr, mission_ar, values_json,
            stat1_value, stat1_label_fr, stat1_label_ar,
            stat2_value, stat2_label_fr, stat2_label_ar,
            stat3_value, stat3_label_fr, stat3_label_ar,
            stat4_value, stat4_label_fr, stat4_label_ar,
            email, phone, address_fr, address_ar,
            facebook_url, youtube_url, telegram_url, instagram_url,
            team_members_json
        } = data;

        await db.query(
            `UPDATE about SET
                title_fr = ?, title_ar = ?,
                slogan_fr = ?, slogan_ar = ?,
                subtitle_fr = ?, subtitle_ar = ?,
                description_fr = ?, description_ar = ?,
                cta_fr = ?, cta_ar = ?,
                vision_fr = ?, vision_ar = ?,
                mission_fr = ?, mission_ar = ?,
                values_json = ?,
                stat1_value = ?, stat1_label_fr = ?, stat1_label_ar = ?,
                stat2_value = ?, stat2_label_fr = ?, stat2_label_ar = ?,
                stat3_value = ?, stat3_label_fr = ?, stat3_label_ar = ?,
                stat4_value = ?, stat4_label_fr = ?, stat4_label_ar = ?,
                email = ?, phone = ?, address_fr = ?, address_ar = ?,
                facebook_url = ?, youtube_url = ?, telegram_url = ?, instagram_url = ?,
                team_members_json = ?
            WHERE id = ?`,
            [
                title_fr, title_ar, slogan_fr, slogan_ar,
                subtitle_fr, subtitle_ar, description_fr, description_ar,
                cta_fr, cta_ar, vision_fr, vision_ar,
                mission_fr, mission_ar, values_json,
                stat1_value, stat1_label_fr, stat1_label_ar,
                stat2_value, stat2_label_fr, stat2_label_ar,
                stat3_value, stat3_label_fr, stat3_label_ar,
                stat4_value, stat4_label_fr, stat4_label_ar,
                email, phone, address_fr, address_ar,
                facebook_url, youtube_url, telegram_url, instagram_url,
                team_members_json,
                id
            ]
        );
        return { id, ...data };
    },

    // Supprimer une entrée
    findByIdAndDelete: async (id) => {
        await db.query('DELETE FROM about WHERE id = ?', [id]);
        return { id };
    }
};

module.exports = About;