// controllers/aboutController.js
const About = require('../models/About');

// Récupérer les données "À propos"
exports.getAbout = async (req, res) => {
    console.log('🔍 [getAbout] Appelé');
    try {
        const about = await About.findOne();
        console.log('🔍 [getAbout] Résultat:', about);
        
        if (!about) {
            return res.status(404).json({
                success: false,
                message: 'Aucune donnée trouvée',
                data: null
            });
        }

        return res.status(200).json({
            success: true,
            data: about
        });
    } catch (error) {
        console.error('❌ Erreur getAbout:', error);
        return res.status(500).json({
            success: false,
            message: 'Erreur lors du chargement: ' + error.message
        });
    }
};

// Vérifier si les données existent
exports.exists = async (req, res) => {
    console.log('🔍 [exists] Appelé');
    try {
        const exists = await About.exists();
        return res.status(200).json({
            success: true,
            exists: exists
        });
    } catch (error) {
        console.error('❌ Erreur exists:', error);
        return res.status(500).json({
            success: false,
            message: 'Erreur: ' + error.message
        });
    }
};

// Créer ou mettre à jour les données "À propos"
exports.saveAbout = async (req, res) => {
    console.log('🔍 [saveAbout] Appelé');
    try {
        const data = req.body;

        // Validation
        if (!data.title_fr || !data.title_ar || !data.slogan_fr || !data.slogan_ar || 
            !data.subtitle_fr || !data.subtitle_ar || !data.description_fr || !data.description_ar ||
            !data.cta_fr || !data.cta_ar || !data.email || !data.phone || 
            !data.address_fr || !data.address_ar) {
            return res.status(422).json({
                success: false,
                message: 'Champs obligatoires manquants'
            });
        }

        // Vérifier si les données existent déjà
        const existing = await About.findOne();
        
        let about;
        if (existing) {
            // Mise à jour
            about = await About.findByIdAndUpdate(existing.id, data);
            return res.status(200).json({
                success: true,
                message: 'Données mises à jour avec succès',
                data: about
            });
        } else {
            // Création
            about = await About.create(data);
            return res.status(201).json({
                success: true,
                message: 'Données créées avec succès',
                data: about
            });
        }

    } catch (error) {
        console.error('❌ Erreur saveAbout:', error);
        return res.status(500).json({
            success: false,
            message: 'Erreur lors de la sauvegarde: ' + error.message
        });
    }
};

// Supprimer les données "À propos"
exports.deleteAbout = async (req, res) => {
    console.log('🔍 [deleteAbout] Appelé');
    try {
        const { id } = req.params;
        
        const about = await About.findByIdAndDelete(id);
        
        if (!about) {
            return res.status(404).json({
                success: false,
                message: 'Données non trouvées'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Données supprimées avec succès'
        });
    } catch (error) {
        console.error('❌ Erreur deleteAbout:', error);
        return res.status(500).json({
            success: false,
            message: 'Erreur lors de la suppression: ' + error.message
        });
    }
};