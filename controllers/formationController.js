// nafahat_api/controllers/formationController.js
const db = require('../config/database');

// ============================================================
// ✅ UTILITAIRE : Parser les types de paiement autorisés
// ============================================================
function parseTypesPaiement(rawValue) {
  const defaultTypes = ['formation'];
  
  if (!rawValue) return defaultTypes;
  
  if (Array.isArray(rawValue)) {
    return rawValue.filter(t => typeof t === 'string' && t.length > 0);
  }
  
  if (typeof rawValue === 'string') {
    try {
      const parsed = JSON.parse(rawValue);
      if (Array.isArray(parsed)) {
        return parsed.filter(t => typeof t === 'string' && t.length > 0);
      }
    } catch (e) {
      return [rawValue];
    }
  }
  
  return defaultTypes;
}

// ============================================================
// ✅ UTILITAIRE : Sérialiser les types pour la BDD
// ============================================================
function serializeTypesPaiement(types) {
  if (!types || !Array.isArray(types) || types.length === 0) {
    return JSON.stringify(['formation']);
  }
  return JSON.stringify(types.filter(t => typeof t === 'string' && t.length > 0));
}

// =============================================
// ✅ FONCTION UTILITAIRE POUR LE PRIX FINAL
// =============================================
const getPriceFinal = (prix_dt, discount, valeur_disc) => {
  if (discount === 'oui' && valeur_disc !== null) {
    return prix_dt - valeur_disc;
  }
  return prix_dt;
};

// =============================================
// ✅ GET - Toutes les formations
// =============================================
const getAllFormations = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT f.*, 
             tf.type_formation,
             d.type_duree,
             c.categorie_fr, c.categorie_ar,
             form.nom_prenom_fr as formateur_nom_fr,
             form.nom_prenom_ar as formateur_nom_ar,
             cible.nom_cible as cible_nom,
             cible.ch1 as cible_ch1,
             cible.ch2 as cible_ch2,
             cible.ch3 as cible_ch3,
             CASE 
                 WHEN f.discount = 'oui' AND f.valeur_disc IS NOT NULL THEN f.prix_dt - f.valeur_disc
                 ELSE f.prix_dt
             END as prix_final_dt
      FROM formation f
      LEFT JOIN type_formation tf ON f.id_type_formation = tf.id
      LEFT JOIN duree d ON f.id_duree = d.id
      LEFT JOIN categorie c ON f.id_categorie = c.id
      LEFT JOIN formateur form ON f.id_formateur = form.id
      LEFT JOIN cible cible ON f.id_cible = cible.id
      ORDER BY f.created_at DESC
    `);
    
    const formattedRows = rows.map(row => ({
      ...row,
      types_paiement_autorises: parseTypesPaiement(row.types_paiement_autorises),
    }));
    
    res.json({ success: true, data: formattedRows });
  } catch (error) {
    console.error('❌ Erreur getAllFormations:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// =============================================
// ✅ GET - Formation par ID
// =============================================
const getFormationById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query(`
      SELECT f.*, 
             tf.type_formation,
             d.type_duree,
             c.categorie_fr, c.categorie_ar,
             form.nom_prenom_fr as formateur_nom_fr,
             form.nom_prenom_ar as formateur_nom_ar,
             cible.nom_cible as cible_nom,
             cible.ch1 as cible_ch1,
             cible.ch2 as cible_ch2,
             cible.ch3 as cible_ch3,
             CASE 
                 WHEN f.discount = 'oui' AND f.valeur_disc IS NOT NULL THEN f.prix_dt - f.valeur_disc
                 ELSE f.prix_dt
             END as prix_final_dt
      FROM formation f
      LEFT JOIN type_formation tf ON f.id_type_formation = tf.id
      LEFT JOIN duree d ON f.id_duree = d.id
      LEFT JOIN categorie c ON f.id_categorie = c.id
      LEFT JOIN formateur form ON f.id_formateur = form.id
      LEFT JOIN cible cible ON f.id_cible = cible.id
      WHERE f.id = ?
    `, [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Formation non trouvée' });
    }
    
    const formation = {
      ...rows[0],
      types_paiement_autorises: parseTypesPaiement(rows[0].types_paiement_autorises),
    };
    
    res.json({ success: true, data: formation });
  } catch (error) {
    console.error('❌ Erreur getFormationById:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// =============================================
// ✅ POST - Créer une formation
// =============================================
const createFormation = async (req, res) => {
  try {
    const {
      titre_fr,
      titre_ar,
      id_type_formation,
      id_cible,
      cible_fr,
      cible_ar,
      id_duree,
      date_debut,
      date_fin,
      prix_dt,
      prix_eur,
      prix_usd,
      discount,
      valeur_disc,
      descri_fr,
      descri_ar,
      id_categorie,
      id_formateur,
      photo,
      nbr_heur,
      nbr_seance,
      nbr_jour,
      repetitive,
      jour_semaine,
      types_paiement_autorises,
      lien,   // ✅ NOUVEAU
    } = req.body;

    console.log('📝 [createFormation] Données reçues:', {
      titre_fr,
      titre_ar,
      prix_dt,
      prix_eur,
      prix_usd,
      id_cible,
      discount,
      valeur_disc,
      types_paiement_autorises,
      lien,   // ✅ Log
    });

    if (!titre_fr || !titre_ar || !id_type_formation || !id_cible || !id_duree || !prix_dt || !descri_fr || !descri_ar) {
      return res.status(400).json({
        success: false,
        message: 'Champs obligatoires manquants',
      });
    }

    let periode = null;
    if (date_debut && date_fin) {
      periode = `${date_debut} - ${date_fin}`;
    }

    const typesPaiementJson = serializeTypesPaiement(
      parseTypesPaiement(types_paiement_autorises)
    );

    console.log('🎯 [createFormation] Types paiement JSON:', typesPaiementJson);

    // ✅ Requête INSERT avec lien
    const [result] = await db.query(
      `INSERT INTO formation (
          titre_fr, titre_ar, id_type_formation, 
          id_cible, cible_fr, cible_ar,
          id_duree, periode, date_debut, date_fin,
          prix_dt, prix_eur, prix_usd,
          discount, valeur_disc, 
          descri_fr, descri_ar, 
          id_categorie, id_formateur, photo, actif,
          nbr_heur, nbr_seance, nbr_jour, repetitive, jour_semaine,
          types_paiement_autorises,
          lien
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'oui', ?, ?, ?, ?, ?, ?, ?)`,
      [
        titre_fr,
        titre_ar,
        id_type_formation,
        id_cible,
        cible_fr || null,
        cible_ar || null,
        id_duree,
        periode,
        date_debut || null,
        date_fin || null,
        prix_dt || 0,
        prix_eur || 0,
        prix_usd || 0,
        discount || 'non',
        valeur_disc || null,
        descri_fr,
        descri_ar,
        id_categorie || null,
        id_formateur || null,
        photo || null,
        nbr_heur ?? 0,
        nbr_seance ?? 0,
        nbr_jour ?? 0,
        repetitive ?? 'non',
        jour_semaine ?? null,
        typesPaiementJson,
        lien || null,   // ✅ NOUVEAU
      ]
    );

    console.log(`✅ [createFormation] Formation créée avec l'ID: ${result.insertId}`);
    res.json({
      success: true,
      message: 'Formation créée avec succès',
      id: result.insertId,
    });
  } catch (error) {
    console.error('❌ Erreur createFormation:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.sqlMessage || error.message,
    });
  }
};

// =============================================
// ✅ PUT - Mettre à jour une formation
// =============================================
const updateFormation = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      titre_fr,
      titre_ar,
      id_type_formation,
      id_cible,
      cible_fr,
      cible_ar,
      id_duree,
      date_debut,
      date_fin,
      prix_dt,
      prix_eur,
      prix_usd,
      discount,
      valeur_disc,
      descri_fr,
      descri_ar,
      id_categorie,
      id_formateur,
      photo,
      actif,
      nbr_heur,
      nbr_seance,
      nbr_jour,
      repetitive,
      jour_semaine,
      types_paiement_autorises,
      lien,   // ✅ NOUVEAU
    } = req.body;

    console.log(`📝 [updateFormation] Mise à jour formation ID: ${id}`);
    console.log('💰 Prix:', { prix_dt, prix_eur, prix_usd });
    console.log('🎯 Cible ID:', id_cible);
    console.log('💳 Types paiement:', types_paiement_autorises);
    console.log('🔗 Lien:', lien);   // ✅ Log

    const [existing] = await db.query('SELECT id FROM formation WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Formation non trouvée' });
    }

    let periode = null;
    if (date_debut && date_fin) {
      periode = `${date_debut} - ${date_fin}`;
    }

    const typesPaiementJson = serializeTypesPaiement(
      parseTypesPaiement(types_paiement_autorises)
    );

    // ✅ UPDATE avec lien
    const [result] = await db.query(
      `UPDATE formation SET 
          titre_fr = ?, titre_ar = ?, id_type_formation = ?, 
          id_cible = ?, cible_fr = ?, cible_ar = ?,
          id_duree = ?, periode = ?,
          date_debut = ?, date_fin = ?, 
          prix_dt = ?, prix_eur = ?, prix_usd = ?,
          discount = ?, valeur_disc = ?, 
          descri_fr = ?, descri_ar = ?, 
          id_categorie = ?, id_formateur = ?, photo = ?, actif = ?,
          nbr_heur = ?, nbr_seance = ?, nbr_jour = ?, repetitive = ?, jour_semaine = ?,
          types_paiement_autorises = ?,
          lien = ?
      WHERE id = ?`,
      [
        titre_fr,
        titre_ar,
        id_type_formation,
        id_cible,
        cible_fr || null,
        cible_ar || null,
        id_duree,
        periode,
        date_debut || null,
        date_fin || null,
        prix_dt || 0,
        prix_eur || 0,
        prix_usd || 0,
        discount || 'non',
        valeur_disc || null,
        descri_fr,
        descri_ar,
        id_categorie || null,
        id_formateur || null,
        photo || null,
        actif || 'oui',
        nbr_heur ?? 0,
        nbr_seance ?? 0,
        nbr_jour ?? 0,
        repetitive ?? 'non',
        jour_semaine ?? null,
        typesPaiementJson,
        lien || null,   // ✅ NOUVEAU
        id,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Formation non trouvée' });
    }

    console.log(`✅ [updateFormation] Formation ID ${id} mise à jour avec succès`);
    res.json({ success: true, message: 'Formation mise à jour avec succès', id });
  } catch (error) {
    console.error('❌ Erreur updateFormation:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.sqlMessage || error.message,
    });
  }
};

// =============================================
// ❌ DELETE - Désactiver une formation
// =============================================
const deleteFormation = async (req, res) => {
  try {
    const { id } = req.params;
    const [existing] = await db.query('SELECT id FROM formation WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Formation non trouvée' });
    }
    await db.query('UPDATE formation SET actif = "non" WHERE id = ?', [id]);
    res.json({ success: true, message: 'Formation désactivée avec succès' });
  } catch (error) {
    console.error('❌ Erreur deleteFormation:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// =============================================
// ❌ DELETE - Supprimer définitivement
// =============================================
const hardDeleteFormation = async (req, res) => {
  try {
    const { id } = req.params;
    const [existing] = await db.query('SELECT id FROM formation WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Formation non trouvée' });
    }
    await db.query('DELETE FROM formation WHERE id = ?', [id]);
    res.json({ success: true, message: 'Formation supprimée définitivement' });
  } catch (error) {
    console.error('❌ Erreur hardDeleteFormation:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// =============================================
// ✅ GET - Formations actives
// =============================================
const getActiveFormations = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT f.*, 
             tf.type_formation,
             d.type_duree,
             c.categorie_fr, c.categorie_ar,
             form.nom_prenom_fr as formateur_nom_fr,
             form.nom_prenom_ar as formateur_nom_ar,
             cible.nom_cible as cible_nom,
             cible.ch1 as cible_ch1,
             cible.ch2 as cible_ch2,
             cible.ch3 as cible_ch3,
             CASE 
                 WHEN f.discount = 'oui' AND f.valeur_disc IS NOT NULL THEN f.prix_dt - f.valeur_disc
                 ELSE f.prix_dt
             END as prix_final_dt
      FROM formation f
      LEFT JOIN type_formation tf ON f.id_type_formation = tf.id
      LEFT JOIN duree d ON f.id_duree = d.id
      LEFT JOIN categorie c ON f.id_categorie = c.id
      LEFT JOIN formateur form ON f.id_formateur = form.id
      LEFT JOIN cible cible ON f.id_cible = cible.id
      WHERE f.actif = 'oui'
      ORDER BY f.created_at DESC
    `);
    
    const formattedRows = rows.map(row => ({
      ...row,
      types_paiement_autorises: parseTypesPaiement(row.types_paiement_autorises),
    }));
    
    res.json({ success: true, data: formattedRows });
  } catch (error) {
    console.error('❌ Erreur getActiveFormations:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// =============================================
// ✅ GET - Formations avec réduction
// =============================================
const getFormationsWithDiscount = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT f.*, 
             tf.type_formation,
             d.type_duree,
             c.categorie_fr, c.categorie_ar,
             form.nom_prenom_fr as formateur_nom_fr,
             form.nom_prenom_ar as formateur_nom_ar,
             cible.nom_cible as cible_nom,
             cible.ch1 as cible_ch1,
             cible.ch2 as cible_ch2,
             cible.ch3 as cible_ch3,
             CASE 
                 WHEN f.discount = 'oui' AND f.valeur_disc IS NOT NULL THEN f.prix_dt - f.valeur_disc
                 ELSE f.prix_dt
             END as prix_final_dt
      FROM formation f
      LEFT JOIN type_formation tf ON f.id_type_formation = tf.id
      LEFT JOIN duree d ON f.id_duree = d.id
      LEFT JOIN categorie c ON f.id_categorie = c.id
      LEFT JOIN formateur form ON f.id_formateur = form.id
      LEFT JOIN cible cible ON f.id_cible = cible.id
      WHERE f.discount = 'oui' AND f.actif = 'oui'
      ORDER BY prix_final_dt ASC
    `);
    
    const formattedRows = rows.map(row => ({
      ...row,
      types_paiement_autorises: parseTypesPaiement(row.types_paiement_autorises),
    }));
    
    res.json({ success: true, data: formattedRows });
  } catch (error) {
    console.error('❌ Erreur getFormationsWithDiscount:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// =============================================
// ✅ GET - Formations par catégorie
// =============================================
const getFormationsByCategorie = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query(`
      SELECT f.*, 
             tf.type_formation,
             d.type_duree,
             c.categorie_fr, c.categorie_ar,
             form.nom_prenom_fr as formateur_nom_fr,
             form.nom_prenom_ar as formateur_nom_ar,
             cible.nom_cible as cible_nom,
             cible.ch1 as cible_ch1,
             cible.ch2 as cible_ch2,
             cible.ch3 as cible_ch3,
             CASE 
                 WHEN f.discount = 'oui' AND f.valeur_disc IS NOT NULL THEN f.prix_dt - f.valeur_disc
                 ELSE f.prix_dt
             END as prix_final_dt
      FROM formation f
      LEFT JOIN type_formation tf ON f.id_type_formation = tf.id
      LEFT JOIN duree d ON f.id_duree = d.id
      LEFT JOIN categorie c ON f.id_categorie = c.id
      LEFT JOIN formateur form ON f.id_formateur = form.id
      LEFT JOIN cible cible ON f.id_cible = cible.id
      WHERE f.id_categorie = ? AND f.actif = 'oui'
    `, [id]);
    
    const formattedRows = rows.map(row => ({
      ...row,
      types_paiement_autorises: parseTypesPaiement(row.types_paiement_autorises),
    }));
    
    res.json({ success: true, data: formattedRows });
  } catch (error) {
    console.error('❌ Erreur getFormationsByCategorie:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// =============================================
// ✅ GET - Toutes les formations (Admin)
// =============================================
const getAllFormationsAdmin = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT f.*, 
             tf.type_formation,
             d.type_duree,
             c.categorie_fr, c.categorie_ar,
             form.nom_prenom_fr as formateur_nom_fr,
             form.nom_prenom_ar as formateur_nom_ar,
             cible.nom_cible as cible_nom,
             cible.ch1 as cible_ch1,
             cible.ch2 as cible_ch2,
             cible.ch3 as cible_ch3,
             CASE 
                 WHEN f.discount = 'oui' AND f.valeur_disc IS NOT NULL THEN f.prix_dt - f.valeur_disc
                 ELSE f.prix_dt
             END as prix_final_dt
      FROM formation f
      LEFT JOIN type_formation tf ON f.id_type_formation = tf.id
      LEFT JOIN duree d ON f.id_duree = d.id
      LEFT JOIN categorie c ON f.id_categorie = c.id
      LEFT JOIN formateur form ON f.id_formateur = form.id
      LEFT JOIN cible cible ON f.id_cible = cible.id
      ORDER BY f.created_at DESC
    `);
    
    const formattedRows = rows.map(row => ({
      ...row,
      types_paiement_autorises: parseTypesPaiement(row.types_paiement_autorises),
    }));
    
    res.json({ success: true, data: formattedRows });
  } catch (error) {
    console.error('❌ Erreur getAllFormationsAdmin:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

// =============================================
// 📤 EXPORTS
// =============================================
module.exports = {
  getAllFormations,
  getFormationById,
  createFormation,
  updateFormation,
  deleteFormation,
  hardDeleteFormation,
  getActiveFormations,
  getFormationsWithDiscount,
  getFormationsByCategorie,
  getAllFormationsAdmin,
};