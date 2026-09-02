// nafahat_api/controllers/bullController.js
const db = require('../config/database');

// ============================================================
// BULL CONTROLLER - Version async/await (promise pool)
// ============================================================
const bullController = {

    // ============================================================
    // GET /api/bulls - Récupérer tous les bulls
    // ============================================================
    getBulls: async (req, res) => {
        console.log('📥 [GET] /api/bulls');

        const query = `
            SELECT 
                b.*,
                CASE 
                    WHEN b.target_type = 'categorie' THEN c.categorie_fr
                    WHEN b.target_type = 'formateur' THEN f.nom_prenom_fr
                    WHEN b.target_type = 'video' THEN v.title_fr
                    ELSE NULL
                END as target_name_fr,
                CASE 
                    WHEN b.target_type = 'categorie' THEN c.categorie_ar
                    WHEN b.target_type = 'formateur' THEN f.nom_prenom_ar
                    WHEN b.target_type = 'video' THEN v.title_ar
                    ELSE NULL
                END as target_name_ar
            FROM bulls b
            LEFT JOIN categorie c ON b.target_type = 'categorie' AND b.target_id = c.id
            LEFT JOIN formateur f ON b.target_type = 'formateur' AND b.target_id = f.id
            LEFT JOIN videos v ON b.target_type = 'video' AND b.target_id = v.id
            ORDER BY b.order_index ASC
        `;

        try {
            const [results] = await db.query(query);

            const bulls = results.map(row => ({
                id: row.id,
                title: row.title,
                titleAr: row.title_ar,
                titleFr: row.title_fr,
                targetType: row.target_type,
                targetId: row.target_id,
                link: row.link,
                backgroundColor: row.background_color,
                textColor: row.text_color,
                borderColor: row.border_color,
                fontSize: parseFloat(row.font_size),
                order: parseInt(row.order_index),
                isActive: row.is_active === 1,
                targetInfo: row.target_id ? {
                    id: row.target_id,
                    nameFr: row.target_name_fr,
                    nameAr: row.target_name_ar
                } : null,
                createdAt: row.created_at,
                updatedAt: row.updated_at
            }));

            res.json({
                success: true,
                data: bulls,
                count: bulls.length
            });
        } catch (err) {
            console.error('❌ Erreur GET bulls:', err);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération des bulls',
                error: process.env.NODE_ENV === 'development' ? err.message : undefined
            });
        }
    },

    // ============================================================
    // GET /api/bulls/default - Bulls par défaut
    // ============================================================
    getDefaultBulls: (req, res) => {
        console.log('📥 [GET] /api/bulls/default');
        const defaultBulls = [
            {
                id: '1',
                title: 'Formations',
                titleAr: 'الدورات',
                titleFr: 'Formations',
                targetType: 'page',
                targetId: null,
                link: '/formations',
                backgroundColor: '#0D443E',
                textColor: '#FFFFFF',
                borderColor: '#C4A46C',
                fontSize: 14,
                order: 0,
                isActive: true
            },
            {
                id: '2',
                title: 'Vidéos',
                titleAr: 'الفيديوهات',
                titleFr: 'Vidéos',
                targetType: 'page',
                targetId: null,
                link: '/videos',
                backgroundColor: '#d57653',
                textColor: '#FFFFFF',
                borderColor: '#C4A46C',
                fontSize: 14,
                order: 1,
                isActive: true
            },
            {
                id: '3',
                title: 'À propos',
                titleAr: 'عن المنصة',
                titleFr: 'À propos',
                targetType: 'page',
                targetId: null,
                link: '/about',
                backgroundColor: '#2c221e',
                textColor: '#FFFFFF',
                borderColor: '#C4A46C',
                fontSize: 14,
                order: 2,
                isActive: true
            }
        ];
        res.json({
            success: true,
            data: defaultBulls
        });
    },

    // ============================================================
    // GET /api/bulls/:id - Récupérer un bull par ID
    // ============================================================
    getBullById: async (req, res) => {
        console.log(`📥 [GET] /api/bulls/${req.params.id}`);

        const { id } = req.params;

        const query = `
            SELECT 
                b.*,
                CASE 
                    WHEN b.target_type = 'categorie' THEN c.categorie_fr
                    WHEN b.target_type = 'formateur' THEN f.nom_prenom_fr
                    WHEN b.target_type = 'video' THEN v.title_fr
                    ELSE NULL
                END as target_name_fr,
                CASE 
                    WHEN b.target_type = 'categorie' THEN c.categorie_ar
                    WHEN b.target_type = 'formateur' THEN f.nom_prenom_ar
                    WHEN b.target_type = 'video' THEN v.title_ar
                    ELSE NULL
                END as target_name_ar
            FROM bulls b
            LEFT JOIN categorie c ON b.target_type = 'categorie' AND b.target_id = c.id
            LEFT JOIN formateur f ON b.target_type = 'formateur' AND b.target_id = f.id
            LEFT JOIN videos v ON b.target_type = 'video' AND b.target_id = v.id
            WHERE b.id = ?
        `;

        try {
            const [results] = await db.query(query, [id]);

            if (results.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Bull non trouvé'
                });
            }

            const row = results[0];
            const bull = {
                id: row.id,
                title: row.title,
                titleAr: row.title_ar,
                titleFr: row.title_fr,
                targetType: row.target_type,
                targetId: row.target_id,
                link: row.link,
                backgroundColor: row.background_color,
                textColor: row.text_color,
                borderColor: row.border_color,
                fontSize: parseFloat(row.font_size),
                order: parseInt(row.order_index),
                isActive: row.is_active === 1,
                targetInfo: row.target_id ? {
                    id: row.target_id,
                    nameFr: row.target_name_fr,
                    nameAr: row.target_name_ar
                } : null,
                createdAt: row.created_at,
                updatedAt: row.updated_at
            };

            res.json({
                success: true,
                data: bull
            });
        } catch (err) {
            console.error(`❌ Erreur GET bulls/${id}:`, err);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération du bull'
            });
        }
    },

    // ============================================================
    // POST /api/bulls - Créer un nouveau bull
    // ============================================================
    createBull: async (req, res) => {
        console.log('📥 [POST] /api/bulls');
        console.log('   Body:', req.body);

        const {
            title, titleAr, titleFr,
            targetType, targetId, link,
            backgroundColor, textColor, borderColor,
            fontSize, order, isActive
        } = req.body;

        if (!title) {
            return res.status(400).json({
                success: false,
                message: 'Le champ "title" est requis'
            });
        }

        let finalLink = link;
        if (!finalLink && targetType && targetId) {
            finalLink = `/${targetType}/${targetId}`;
        } else if (!finalLink) {
            finalLink = `/${title.toLowerCase().replace(/\s+/g, '-')}`;
        }

        const id = Date.now().toString();
        const query = `
            INSERT INTO bulls 
            (id, title, title_ar, title_fr, target_type, target_id, link, 
             background_color, text_color, border_color, font_size, order_index, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
            id,
            title,
            titleAr || null,
            titleFr || null,
            targetType || 'page',
            targetId || null,
            finalLink,
            backgroundColor || '#0D443E',
            textColor || '#FFFFFF',
            borderColor || '#C4A46C',
            fontSize || 14.0,
            order || 0,
            isActive !== undefined ? (isActive ? 1 : 0) : 1
        ];

        try {
            await db.query(query, values);

            res.status(201).json({
                success: true,
                data: {
                    id: id,
                    title: title,
                    titleAr: titleAr || null,
                    titleFr: titleFr || null,
                    targetType: targetType || 'page',
                    targetId: targetId || null,
                    link: finalLink,
                    backgroundColor: backgroundColor || '#0D443E',
                    textColor: textColor || '#FFFFFF',
                    borderColor: borderColor || '#C4A46C',
                    fontSize: fontSize || 14.0,
                    order: order || 0,
                    isActive: isActive !== undefined ? isActive : true
                },
                message: 'Bull créé avec succès'
            });
        } catch (err) {
            console.error('❌ Erreur POST bulls:', err);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la création du bull',
                error: process.env.NODE_ENV === 'development' ? err.message : undefined
            });
        }
    },

    // ============================================================
    // PUT /api/bulls/:id - Mettre à jour un bull
    // ============================================================
    updateBull: async (req, res) => {
        console.log(`📥 [PUT] /api/bulls/${req.params.id}`);
        console.log('   Body:', req.body);

        const { id } = req.params;
        const updates = req.body;

        try {
            // Vérifier que le bull existe
            const [existing] = await db.query('SELECT * FROM bulls WHERE id = ?', [id]);

            if (existing.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Bull non trouvé'
                });
            }

            const fields = [];
            const values = [];

            if (updates.title !== undefined) { fields.push('title = ?'); values.push(updates.title); }
            if (updates.titleAr !== undefined) { fields.push('title_ar = ?'); values.push(updates.titleAr); }
            if (updates.titleFr !== undefined) { fields.push('title_fr = ?'); values.push(updates.titleFr); }
            if (updates.targetType !== undefined) { fields.push('target_type = ?'); values.push(updates.targetType); }
            if (updates.targetId !== undefined) { fields.push('target_id = ?'); values.push(updates.targetId || null); }
            if (updates.link !== undefined) { fields.push('link = ?'); values.push(updates.link); }
            if (updates.backgroundColor !== undefined) { fields.push('background_color = ?'); values.push(updates.backgroundColor); }
            if (updates.textColor !== undefined) { fields.push('text_color = ?'); values.push(updates.textColor); }
            if (updates.borderColor !== undefined) { fields.push('border_color = ?'); values.push(updates.borderColor); }
            if (updates.fontSize !== undefined) { fields.push('font_size = ?'); values.push(updates.fontSize); }
            if (updates.order !== undefined) { fields.push('order_index = ?'); values.push(updates.order); }
            if (updates.isActive !== undefined) { fields.push('is_active = ?'); values.push(updates.isActive ? 1 : 0); }

            if (fields.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Aucune donnée à mettre à jour'
                });
            }

            values.push(id);
            const query = `UPDATE bulls SET ${fields.join(', ')} WHERE id = ?`;

            await db.query(query, values);

            // Récupérer le bull mis à jour
            const [results] = await db.query('SELECT * FROM bulls WHERE id = ?', [id]);

            if (results.length === 0) {
                return res.json({
                    success: true,
                    message: 'Bull mis à jour avec succès'
                });
            }

            const row = results[0];
            res.json({
                success: true,
                data: {
                    id: row.id,
                    title: row.title,
                    titleAr: row.title_ar,
                    titleFr: row.title_fr,
                    targetType: row.target_type,
                    targetId: row.target_id,
                    link: row.link,
                    backgroundColor: row.background_color,
                    textColor: row.text_color,
                    borderColor: row.border_color,
                    fontSize: parseFloat(row.font_size),
                    order: parseInt(row.order_index),
                    isActive: row.is_active === 1
                },
                message: 'Bull mis à jour avec succès'
            });
        } catch (err) {
            console.error(`❌ Erreur PUT bulls/${id}:`, err);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la mise à jour du bull',
                error: process.env.NODE_ENV === 'development' ? err.message : undefined
            });
        }
    },

    // ============================================================
    // DELETE /api/bulls/:id - Supprimer un bull
    // ============================================================
    deleteBull: async (req, res) => {
        console.log(`📥 [DELETE] /api/bulls/${req.params.id}`);

        const { id } = req.params;

        try {
            const [existing] = await db.query('SELECT * FROM bulls WHERE id = ?', [id]);

            if (existing.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Bull non trouvé'
                });
            }

            await db.query('DELETE FROM bulls WHERE id = ?', [id]);

            res.json({
                success: true,
                message: 'Bull supprimé avec succès'
            });
        } catch (err) {
            console.error(`❌ Erreur DELETE bulls/${id}:`, err);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la suppression du bull',
                error: process.env.NODE_ENV === 'development' ? err.message : undefined
            });
        }
    },

    // ============================================================
    // GET /api/bulls/available-targets - Récupérer les cibles disponibles
    // ============================================================
    getAvailableTargets: async (req, res) => {
        console.log('📥 [GET] /api/bulls/available-targets');

        const results = {
            categories: [],
            formateurs: [],
            videos: [],
            pages: [
                { id: 'page_1', nameFr: 'Accueil', nameAr: 'الرئيسية', path: '/' },
                { id: 'page_2', nameFr: 'Formations', nameAr: 'الدورات', path: '/formations' },
                { id: 'page_3', nameFr: 'Vidéos', nameAr: 'الفيديوهات', path: '/videos' },
                { id: 'page_4', nameFr: 'Formateurs', nameAr: 'المكونين', path: '/formateurs' },
                { id: 'page_5', nameFr: 'À propos', nameAr: 'عن المنصة', path: '/about' },
                { id: 'page_6', nameFr: 'Contact', nameAr: 'اتصل بنا', path: '/contact' }
            ],
            sections: [
                { id: 'section_1', nameFr: 'Hero Section', nameAr: 'قسم الهيرو', path: '/section/hero' },
                { id: 'section_2', nameFr: 'Formations', nameAr: 'التكوينات', path: '/section/trainings' },
                { id: 'section_3', nameFr: 'Vidéos', nameAr: 'الفيديوهات', path: '/section/videos' },
                { id: 'section_4', nameFr: 'Formateurs', nameAr: 'المكونين', path: '/section/formateurs' },
                { id: 'section_5', nameFr: 'Inscription', nameAr: 'التسجيل', path: '/section/inscription' }
            ]
        };

        try {
            const [categories] = await db.query(
                'SELECT id, categorie_fr as nameFr, categorie_ar as nameAr FROM categorie ORDER BY categorie_fr'
            );
            results.categories = categories;
        } catch (err) {
            console.error('❌ Erreur récupération categories:', err);
        }

        try {
            const [formateurs] = await db.query(
                'SELECT id, nom_prenom_fr as nameFr, nom_prenom_ar as nameAr FROM formateur ORDER BY nom_prenom_fr'
            );
            results.formateurs = formateurs;
        } catch (err) {
            console.error('❌ Erreur récupération formateurs:', err);
        }

        try {
            const [videos] = await db.query(
                'SELECT id, title_fr as nameFr, title_ar as nameAr FROM videos ORDER BY title_fr'
            );
            results.videos = videos;
        } catch (err) {
            console.error('❌ Erreur récupération videos:', err);
        }

        res.json({
            success: true,
            data: results
        });
    },

    // ============================================================
    // POST /api/bulls/reorder - Réorganiser les bulls
    // ============================================================
    reorderBulls: async (req, res) => {
        console.log('📥 [POST] /api/bulls/reorder');
        console.log('   Body:', req.body);

        const { orderedIds } = req.body;

        if (!orderedIds || !Array.isArray(orderedIds)) {
            return res.status(400).json({
                success: false,
                message: 'La liste des IDs est requise'
            });
        }

        try {
            // Mettre à jour l'ordre de chaque bull, une requête après l'autre
            for (let i = 0; i < orderedIds.length; i++) {
                await db.query('UPDATE bulls SET order_index = ? WHERE id = ?', [i, orderedIds[i]]);
            }

            res.json({
                success: true,
                message: 'Ordre mis à jour avec succès'
            });
        } catch (err) {
            console.error('❌ Erreur reorder bulls:', err);
            res.status(500).json({
                success: false,
                message: 'Erreur lors de la réorganisation des bulls'
            });
        }
    }
};

module.exports = bullController;