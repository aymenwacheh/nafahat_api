// controllers/videoController.js
const db = require('../config/database'); // Votre fichier config avec MySQL

// ✅ Récupérer toutes les vidéos
exports.getAllVideos = async (req, res) => {
    try {
        const [videos] = await db.query(`
            SELECT * FROM videos 
            WHERE is_active = 1 
            ORDER BY created_at DESC
        `);
        res.json(videos);
    } catch (error) {
        console.error('❌ Erreur getAllVideos:', error);
        res.status(500).json({ 
            error: 'Erreur lors du chargement des vidéos' 
        });
    }
};

// ✅ Récupérer une vidéo par ID
exports.getVideoById = async (req, res) => {
    try {
        const { id } = req.params;
        const [videos] = await db.query(
            'SELECT * FROM videos WHERE id = ?',
            [id]
        );
        
        const video = videos[0];
        if (!video) {
            return res.status(404).json({ 
                error: 'Vidéo non trouvée' 
            });
        }
        res.json(video);
    } catch (error) {
        console.error('❌ Erreur getVideoById:', error);
        res.status(500).json({ 
            error: 'Erreur lors du chargement de la vidéo' 
        });
    }
};

// ✅ Créer une nouvelle vidéo
exports.createVideo = async (req, res) => {
    const {
        title_fr,
        title_ar,
        description_fr,
        description_ar,
        video_id,
        thumbnail_url,
        is_active = 1
    } = req.body;

    try {
        // ✅ Vérifier que les champs obligatoires sont présents
        if (!title_fr || !title_ar || !video_id) {
            return res.status(400).json({ 
                error: 'Les champs title_fr, title_ar et video_id sont obligatoires' 
            });
        }

        // ✅ Vérifier que l'ID vidéo est unique
        const [existing] = await db.query(
            'SELECT id FROM videos WHERE video_id = ?',
            [video_id]
        );

        if (existing.length > 0) {
            return res.status(400).json({ 
                error: 'Cet ID vidéo existe déjà' 
            });
        }

        // ✅ Générer automatiquement la miniature si non fournie
        const finalThumbnail = thumbnail_url || `https://img.youtube.com/vi/${video_id}/hqdefault.jpg`;

        const [result] = await db.query(`
            INSERT INTO videos (
                title_fr, 
                title_ar, 
                description_fr, 
                description_ar,
                video_id, 
                thumbnail_url, 
                is_active
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
            title_fr,
            title_ar,
            description_fr || '',
            description_ar || '',
            video_id,
            finalThumbnail,
            is_active
        ]);

        // ✅ Récupérer la vidéo créée
        const [newVideos] = await db.query(
            'SELECT * FROM videos WHERE id = ?',
            [result.insertId]
        );

        res.status(201).json({
            success: true,
            message: 'Vidéo créée avec succès',
            video: newVideos[0]
        });
    } catch (error) {
        console.error('❌ Erreur createVideo:', error);
        res.status(500).json({ 
            error: 'Erreur lors de la création de la vidéo' 
        });
    }
};

// ✅ Mettre à jour une vidéo
exports.updateVideo = async (req, res) => {
    const { id } = req.params;
    const {
        title_fr,
        title_ar,
        description_fr,
        description_ar,
        video_id,
        thumbnail_url,
        is_active
    } = req.body;

    try {
        // ✅ Vérifier que la vidéo existe
        const [existingVideos] = await db.query(
            'SELECT * FROM videos WHERE id = ?',
            [id]
        );

        if (existingVideos.length === 0) {
            return res.status(404).json({ 
                error: 'Vidéo non trouvée' 
            });
        }

        const existing = existingVideos[0];

        // ✅ Vérifier que l'ID vidéo est unique (si changement)
        if (video_id && video_id !== existing.video_id) {
            const [duplicate] = await db.query(
                'SELECT id FROM videos WHERE video_id = ? AND id != ?',
                [video_id, id]
            );
            if (duplicate.length > 0) {
                return res.status(400).json({ 
                    error: 'Cet ID vidéo existe déjà' 
                });
            }
        }

        // ✅ Générer la miniature si nouveau video_id
        let finalThumbnail = thumbnail_url;
        if (!finalThumbnail && video_id) {
            finalThumbnail = `https://img.youtube.com/vi/${video_id}/hqdefault.jpg`;
        }

        await db.query(`
            UPDATE videos SET
                title_fr = COALESCE(?, title_fr),
                title_ar = COALESCE(?, title_ar),
                description_fr = COALESCE(?, description_fr),
                description_ar = COALESCE(?, description_ar),
                video_id = COALESCE(?, video_id),
                thumbnail_url = COALESCE(?, thumbnail_url),
                is_active = COALESCE(?, is_active),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [
            title_fr,
            title_ar,
            description_fr,
            description_ar,
            video_id,
            finalThumbnail || existing.thumbnail_url,
            is_active,
            id
        ]);

        // ✅ Récupérer la vidéo mise à jour
        const [updatedVideos] = await db.query(
            'SELECT * FROM videos WHERE id = ?',
            [id]
        );

        res.json({
            success: true,
            message: 'Vidéo mise à jour avec succès',
            video: updatedVideos[0]
        });
    } catch (error) {
        console.error('❌ Erreur updateVideo:', error);
        res.status(500).json({ 
            error: 'Erreur lors de la mise à jour de la vidéo' 
        });
    }
};

// ✅ Supprimer une vidéo
exports.deleteVideo = async (req, res) => {
    try {
        const { id } = req.params;

        // ✅ Vérifier que la vidéo existe
        const [existing] = await db.query(
            'SELECT * FROM videos WHERE id = ?',
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({ 
                error: 'Vidéo non trouvée' 
            });
        }

        await db.query(
            'DELETE FROM videos WHERE id = ?',
            [id]
        );

        res.json({
            success: true,
            message: 'Vidéo supprimée avec succès'
        });
    } catch (error) {
        console.error('❌ Erreur deleteVideo:', error);
        res.status(500).json({ 
            error: 'Erreur lors de la suppression de la vidéo' 
        });
    }
};

// ✅ Incrémenter les vues
exports.incrementViews = async (req, res) => {
    try {
        const { id } = req.params;

        // ✅ Vérifier que la vidéo existe
        const [existing] = await db.query(
            'SELECT * FROM videos WHERE id = ?',
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({ 
                error: 'Vidéo non trouvée' 
            });
        }

        await db.query(`
            UPDATE videos 
            SET views = views + 1 
            WHERE id = ?
        `, [id]);

        // ✅ Récupérer le nouveau nombre de vues
        const [video] = await db.query(
            'SELECT views FROM videos WHERE id = ?',
            [id]
        );

        res.json({
            success: true,
            views: video[0].views
        });
    } catch (error) {
        console.error('❌ Erreur incrementViews:', error);
        res.status(500).json({ 
            error: 'Erreur lors de l\'incrémentation des vues' 
        });
    }
};