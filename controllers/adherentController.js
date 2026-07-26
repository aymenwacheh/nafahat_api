// controllers/adherentController.js
const db = require('../config/database');

// ============================================================
// FONCTION UTILITAIRE : Générer le message WhatsApp
// ============================================================
function generateWhatsAppMessage(nomPrenom, whatsapp, motDePasse) {
  return `📢 *Confirmation d'inscription - Académie Nafahat*

👤 *Nom :* ${nomPrenom}
📱 *Identifiant :* ${whatsapp}
🔑 *Mot de passe :* ${motDePasse}

🔗 Pour accéder à votre espace :
https://nafahat.com/connexion

⚠️ Conservez ces informations précieusement.

📞 *Académie Nafahat*`;
}

// ============================================================
// FONCTION : Vérifier si l'utilisateur existe déjà
// ============================================================
async function checkExistingUser(whatsapp, email) {
  const errors = [];
  
  if (whatsapp) {
    const [rows] = await db.query(
      'SELECT id, whatsapp FROM adherent WHERE whatsapp = ?',
      [whatsapp]
    );
    if (rows.length > 0) {
      errors.push({
        field: 'whatsapp',
        message: 'Ce numéro WhatsApp est déjà enregistré. Veuillez vous connecter ou utiliser un autre numéro.'
      });
    }
  }
  
  if (email && email.trim() !== '') {
    const [rows] = await db.query(
      'SELECT id, email FROM adherent WHERE email = ?',
      [email]
    );
    if (rows.length > 0) {
      errors.push({
        field: 'email',
        message: 'Cet email est déjà enregistré. Veuillez vous connecter ou utiliser un autre email.'
      });
    }
  }
  
  return errors;
}

// ============================================================
// 1. INSCRIPTION ADHÉRENT (POST)
// ============================================================
exports.inscrireAdherent = async (req, res) => {
  const { adherent, enfants } = req.body;

  console.log('📝 [inscrireAdherent] Données reçues:', JSON.stringify(req.body, null, 2));

  if (!adherent || !adherent.whatsapp || !adherent.nomPrenom) {
    return res.status(400).json({ 
      success: false,
      error: 'Données manquantes. Veuillez remplir tous les champs obligatoires (*).',
      fields: ['whatsapp', 'nomPrenom']
    });
  }

  try {
    // Vérification des doublons
    const errors = await checkExistingUser(adherent.whatsapp, adherent.email);
    
    if (errors.length > 0) {
      const fieldErrors = {};
      let errorMessage = '';
      
      errors.forEach(err => {
        fieldErrors[err.field] = err.message;
        if (err.field === 'whatsapp') {
          errorMessage = '❌ Ce numéro WhatsApp est déjà utilisé. Veuillez vous connecter ou utiliser un autre numéro.';
        }
        if (err.field === 'email') {
          errorMessage = '❌ Cet email est déjà utilisé. Veuillez vous connecter ou utiliser un autre email.';
        }
      });
      
      if (errors.length > 1) {
        errorMessage = '❌ Le numéro WhatsApp et l\'email sont déjà enregistrés. Veuillez vous connecter.';
      }
      
      return res.status(409).json({
        success: false,
        error: errorMessage,
        fieldErrors: fieldErrors,
        details: errors
      });
    }

    const connection = await db.pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // Insertion de l'adhérent
      console.log('📝 [inscrireAdherent] Insertion adhérent...');
      const [result] = await connection.query(
        `INSERT INTO adherent 
          (whatsapp, nom_prenom, pays, ville, email, date_naissance, genre, 
           source_connaissance, source_autre_detail, objectif, suggestions, accord_publication)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          adherent.whatsapp,
          adherent.nomPrenom,
          adherent.pays || '',
          adherent.ville || '',
          adherent.email || '',
          adherent.dateNaissance || new Date().toISOString().split('T')[0],
          adherent.genre || 'homme',
          adherent.sourceConnaissance || 'instagram',
          adherent.sourceAutreDetail || null,
          adherent.objectif || null,
          adherent.suggestions || null,
          adherent.accordPublication ? 1 : 0,
        ]
      );

      const adherentId = result.insertId;
      console.log(`📝 [inscrireAdherent] Adhérent créé avec ID: ${adherentId}`);

      // Génération du mot de passe
      const motDePasse = `nafa-${adherentId}`;

      // Insertion dans acces_adherent (sans rôle = NULL pour les adhérents)
      console.log('📝 [inscrireAdherent] Insertion accès...');
      await connection.query(
        `INSERT INTO acces_adherent 
          (adherent_id, nom_prenom, whatsapp, mot_de_passe)
         VALUES (?, ?, ?, ?)`,
        [
          adherentId,
          adherent.nomPrenom,
          adherent.whatsapp,
          motDePasse,
        ]
      );

      // Insertion des enfants
      if (enfants && enfants.length > 0) {
        console.log(`📝 [inscrireAdherent] Insertion de ${enfants.length} enfant(s)...`);
        for (const enfant of enfants) {
          await connection.query(
            `INSERT INTO enfant 
              (adherent_id, nom_prenom, date_naissance, genre, niveau_tilawa, 
               memorisation, memorisation_autre_detail, objectif, accord_inscription)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              adherentId,
              enfant.nomPrenom || '',
              enfant.dateNaissance || new Date().toISOString().split('T')[0],
              enfant.genre || 'homme',
              enfant.niveauTilawa || 'debutant',
              enfant.memorisation || null,
              enfant.memorisationAutreDetail || null,
              enfant.objectif || null,
              enfant.accordInscription ? 1 : null,
            ]
          );
        }
      }

      await connection.commit();
      console.log('✅ [inscrireAdherent] Transaction validée');

      // Construction du message WhatsApp
      const message = generateWhatsAppMessage(
        adherent.nomPrenom,
        adherent.whatsapp,
        motDePasse
      );

      const cleanPhone = adherent.whatsapp.replace(/[^0-9+]/g, '');
      const encodedMessage = encodeURIComponent(message);
      const waUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;

      res.status(201).json({
        success: true,
        message: '🎉 Inscription réussie ! Bienvenue à l\'Académie Nafahat.',
        adherentId,
        motDePasse,
        whatsappUrl: waUrl,
        credentials: {
          identifiant: adherent.whatsapp,
          motDePasse: motDePasse,
        },
      });

    } catch (error) {
      await connection.rollback();
      console.error('❌ [inscrireAdherent] Erreur transaction:', error);
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('❌ [inscrireAdherent] Erreur:', error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      let errorMessage = '❌ Ces informations sont déjà enregistrées.';
      if (error.sqlMessage && error.sqlMessage.includes('whatsapp')) {
        errorMessage = '❌ Ce numéro WhatsApp est déjà utilisé. Veuillez vous connecter.';
      } else if (error.sqlMessage && error.sqlMessage.includes('email')) {
        errorMessage = '❌ Cet email est déjà utilisé. Veuillez vous connecter.';
      }
      
      return res.status(409).json({ 
        success: false,
        error: errorMessage,
        code: error.code
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: 'Erreur serveur lors de l\'inscription: ' + error.message 
    });
  }
};

// ============================================================
// 2. AUTHENTIFICATION - LOGIN (POST)
// ============================================================
exports.login = async (req, res) => {
  const { whatsapp, motDePasse } = req.body;

  console.log(`📝 [login] Tentative: ${whatsapp}`);

  if (!whatsapp || !motDePasse) {
    return res.status(400).json({ 
      success: false,
      error: 'Identifiants manquants' 
    });
  }

  try {
    const [rows] = await db.query(
      `SELECT 
        acc.id as acces_id,
        acc.adherent_id,
        acc.nom_prenom,
        acc.whatsapp,
        acc.mot_de_passe,
        r.id as role_id,
        r.nom as role_nom,
        r.libelle as role_libelle,
        r.description as role_description,
        a.email,
        a.pays,
        a.ville,
        a.date_naissance,
        a.genre,
        a.accord_publication
       FROM acces_adherent acc
       JOIN adherent a ON acc.adherent_id = a.id
       LEFT JOIN roles r ON acc.role_id = r.id
       WHERE acc.whatsapp = ? AND acc.mot_de_passe = ?`,
      [whatsapp, motDePasse]
    );

    if (rows.length === 0) {
      console.log(`❌ [login] Échec: ${whatsapp}`);
      return res.status(401).json({ 
        success: false,
        error: 'Identifiants invalides' 
      });
    }

    console.log(`✅ [login] Succès: ${whatsapp}`);
    const { mot_de_passe, ...userData } = rows[0];

    const responseData = {
      ...userData,
      role: userData.role_nom ? {
        id: userData.role_id,
        nom: userData.role_nom,
        libelle: userData.role_libelle,
        description: userData.role_description
      } : null
    };

    res.status(200).json({
      success: true,
      data: responseData,
      message: 'Authentification réussie',
    });
  } catch (error) {
    console.error('❌ [login] Erreur:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur serveur lors de l\'authentification' 
    });
  }
};

// ============================================================
// 3. VÉRIFICATION WHATSAPP (GET)
// ============================================================
exports.checkWhatsapp = async (req, res) => {
  const { whatsapp } = req.query;
  
  if (!whatsapp) {
    return res.status(400).json({ exists: false, error: 'WhatsApp requis' });
  }
  
  try {
    const [rows] = await db.query(
      'SELECT id FROM adherent WHERE whatsapp = ?',
      [whatsapp]
    );
    
    res.json({ 
      exists: rows.length > 0,
      message: rows.length > 0 ? 'Numéro déjà utilisé' : 'Numéro disponible'
    });
  } catch (error) {
    console.error('❌ checkWhatsapp:', error);
    res.status(500).json({ exists: false, error: 'Erreur serveur' });
  }
};

// ============================================================
// 4. VÉRIFICATION EMAIL (GET)
// ============================================================
exports.checkEmail = async (req, res) => {
  const { email } = req.query;
  
  if (!email) {
    return res.status(400).json({ exists: false, error: 'Email requis' });
  }
  
  try {
    const [rows] = await db.query(
      'SELECT id FROM adherent WHERE email = ?',
      [email]
    );
    
    res.json({ 
      exists: rows.length > 0,
      message: rows.length > 0 ? 'Email déjà utilisé' : 'Email disponible'
    });
  } catch (error) {
    console.error('❌ checkEmail:', error);
    res.status(500).json({ exists: false, error: 'Erreur serveur' });
  }
};

// ============================================================
// 5. LISTE DES ADHÉRENTS (GET)
// ============================================================
exports.getAdherents = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT 
        a.id, 
        a.whatsapp, 
        a.nom_prenom, 
        a.pays, 
        a.ville, 
        a.email, 
        a.date_naissance, 
        a.genre, 
        a.source_connaissance, 
        a.source_autre_detail, 
        a.objectif, 
        a.suggestions, 
        a.accord_publication, 
        a.created_at,
        acc.mot_de_passe,
        acc.id as acces_id,
        r.id as role_id,
        r.nom as role_nom,
        r.libelle as role_libelle
       FROM adherent a
       LEFT JOIN acces_adherent acc ON a.id = acc.adherent_id
       LEFT JOIN roles r ON acc.role_id = r.id
       ORDER BY a.id DESC`
    );

    res.status(200).json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error('❌ [getAdherents] Erreur:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur serveur' 
    });
  }
};

// ============================================================
// 6. ADHÉRENT PAR ID (GET)
// ============================================================
exports.getAdherentById = async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await db.query(
      `SELECT 
        a.id, 
        a.whatsapp, 
        a.nom_prenom, 
        a.pays, 
        a.ville, 
        a.email, 
        a.date_naissance, 
        a.genre, 
        a.source_connaissance, 
        a.source_autre_detail, 
        a.objectif, 
        a.suggestions, 
        a.accord_publication, 
        a.created_at,
        acc.mot_de_passe,
        acc.id as acces_id,
        r.id as role_id,
        r.nom as role_nom,
        r.libelle as role_libelle
       FROM adherent a
       LEFT JOIN acces_adherent acc ON a.id = acc.adherent_id
       LEFT JOIN roles r ON acc.role_id = r.id
       WHERE a.id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Adhérent non trouvé' 
      });
    }

    res.status(200).json({
      success: true,
      data: rows[0],
    });
  } catch (error) {
    console.error('❌ [getAdherentById] Erreur:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur serveur' 
    });
  }
};

// ============================================================
// 7. RÉCUPÉRER LES IDENTIFIANTS D'UN ADHÉRENT (GET)
// ============================================================
exports.getAdherentCredentials = async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await db.query(
      `SELECT 
        acc.id, 
        acc.adherent_id, 
        acc.nom_prenom, 
        acc.whatsapp, 
        acc.mot_de_passe,
        acc.created_at,
        acc.updated_at
       FROM acces_adherent acc
       WHERE acc.adherent_id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Identifiants non trouvés' 
      });
    }

    res.status(200).json({
      success: true,
      data: rows[0],
    });
  } catch (error) {
    console.error('❌ [getAdherentCredentials] Erreur:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur serveur' 
    });
  }
};

// ============================================================
// 8. METTRE À JOUR UN ADHÉRENT (PUT)
// ============================================================
exports.updateAdherent = async (req, res) => {
  const { id } = req.params;
  const { 
    whatsapp, 
    nomPrenom, 
    pays, 
    ville, 
    email, 
    dateNaissance, 
    genre, 
    sourceConnaissance, 
    sourceAutreDetail, 
    objectif, 
    suggestions, 
    accordPublication 
  } = req.body;

  try {
    const [existing] = await db.query(
      'SELECT id FROM adherent WHERE id = ?',
      [id]
    );
    if (existing.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Adhérent non trouvé' 
      });
    }

    const errors = [];
    
    if (whatsapp) {
      const [rows] = await db.query(
        'SELECT id FROM adherent WHERE whatsapp = ? AND id != ?',
        [whatsapp, id]
      );
      if (rows.length > 0) {
        errors.push({
          field: 'whatsapp',
          message: 'Ce numéro WhatsApp est déjà utilisé par un autre compte.'
        });
      }
    }
    
    if (email && email.trim() !== '') {
      const [rows] = await db.query(
        'SELECT id FROM adherent WHERE email = ? AND id != ?',
        [email, id]
      );
      if (rows.length > 0) {
        errors.push({
          field: 'email',
          message: 'Cet email est déjà utilisé par un autre compte.'
        });
      }
    }
    
    if (errors.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'Certaines informations sont déjà utilisées.',
        fieldErrors: errors
      });
    }

    const connection = await db.pool.getConnection();
    
    try {
      await connection.beginTransaction();

      await connection.query(
        `UPDATE adherent SET
          whatsapp = ?,
          nom_prenom = ?,
          pays = ?,
          ville = ?,
          email = ?,
          date_naissance = ?,
          genre = ?,
          source_connaissance = ?,
          source_autre_detail = ?,
          objectif = ?,
          suggestions = ?,
          accord_publication = ?,
          updated_at = NOW()
         WHERE id = ?`,
        [
          whatsapp,
          nomPrenom,
          pays,
          ville,
          email,
          dateNaissance,
          genre,
          sourceConnaissance,
          sourceAutreDetail || null,
          objectif || null,
          suggestions || null,
          accordPublication ? 1 : 0,
          id,
        ]
      );

      await connection.query(
        `UPDATE acces_adherent SET
          nom_prenom = ?,
          whatsapp = ?,
          updated_at = NOW()
         WHERE adherent_id = ?`,
        [nomPrenom, whatsapp, id]
      );

      await connection.commit();

      res.status(200).json({
        success: true,
        message: '✅ Adhérent mis à jour avec succès',
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('❌ [updateAdherent] Erreur:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur serveur' 
    });
  }
};

// ============================================================
// 9. SUPPRIMER UN ADHÉRENT (DELETE)
// ============================================================
exports.deleteAdherent = async (req, res) => {
  const { id } = req.params;

  try {
    const connection = await db.pool.getConnection();
    
    try {
      await connection.beginTransaction();

      await connection.query(
        'DELETE FROM acces_adherent WHERE adherent_id = ?',
        [id]
      );

      await connection.query(
        'DELETE FROM enfant WHERE adherent_id = ?',
        [id]
      );

      const [result] = await connection.query(
        'DELETE FROM adherent WHERE id = ?',
        [id]
      );

      if (result.affectedRows === 0) {
        await connection.rollback();
        return res.status(404).json({ 
          success: false,
          error: 'Adhérent non trouvé' 
        });
      }

      await connection.commit();

      res.status(200).json({
        success: true,
        message: '✅ Adhérent supprimé avec succès',
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('❌ [deleteAdherent] Erreur:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur serveur' 
    });
  }
};

// ============================================================
// 10. RÉINITIALISER LE MOT DE PASSE (POST)
// ============================================================
exports.resetPassword = async (req, res) => {
  const { id } = req.params;

  try {
    const [adherent] = await db.query(
      'SELECT id, nom_prenom, whatsapp FROM adherent WHERE id = ?',
      [id]
    );

    if (adherent.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Adhérent non trouvé' 
      });
    }

    const newMotDePasse = `nafa-${id}`;

    await db.query(
      `UPDATE acces_adherent SET mot_de_passe = ?, updated_at = NOW() WHERE adherent_id = ?`,
      [newMotDePasse, id]
    );

    const message = generateWhatsAppMessage(
      adherent[0].nom_prenom,
      adherent[0].whatsapp,
      newMotDePasse
    );

    const cleanPhone = adherent[0].whatsapp.replace(/[^0-9+]/g, '');
    const encodedMessage = encodeURIComponent(message);
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;

    res.status(200).json({
      success: true,
      message: '✅ Mot de passe réinitialisé avec succès',
      newMotDePasse,
      whatsappUrl: waUrl,
    });
  } catch (error) {
    console.error('❌ [resetPassword] Erreur:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur serveur' 
    });
  }
};

// ============================================================
// 11. GESTION DES RÔLES
// ============================================================

// 11a. LISTE DES RÔLES (GET)
exports.getRoles = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, nom, libelle, description, created_at, updated_at FROM roles ORDER BY id'
    );
    
    res.status(200).json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error('❌ getRoles:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur serveur' 
    });
  }
};

// 11b. CRÉER UN RÔLE (POST)
exports.createRole = async (req, res) => {
  const { nom, libelle, description } = req.body;

  if (!nom || !libelle) {
    return res.status(400).json({
      success: false,
      error: 'Le nom et le libellé du rôle sont requis'
    });
  }

  try {
    const [existing] = await db.query(
      'SELECT id FROM roles WHERE nom = ?',
      [nom]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'Ce rôle existe déjà'
      });
    }

    const [result] = await db.query(
      `INSERT INTO roles (nom, libelle, description, created_at, updated_at)
       VALUES (?, ?, ?, NOW(), NOW())`,
      [nom, libelle, description || null]
    );

    res.status(201).json({
      success: true,
      message: 'Rôle créé avec succès',
      data: {
        id: result.insertId,
        nom,
        libelle,
        description
      }
    });
  } catch (error) {
    console.error('❌ createRole:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
};

// 11c. MODIFIER UN RÔLE (PUT)
exports.updateRole = async (req, res) => {
  const { id } = req.params;
  const { nom, libelle, description } = req.body;

  try {
    const [existing] = await db.query(
      'SELECT id FROM roles WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Rôle non trouvé'
      });
    }

    await db.query(
      `UPDATE roles SET
        nom = ?,
        libelle = ?,
        description = ?,
        updated_at = NOW()
       WHERE id = ?`,
      [nom, libelle, description || null, id]
    );

    res.status(200).json({
      success: true,
      message: 'Rôle mis à jour avec succès'
    });
  } catch (error) {
    console.error('❌ updateRole:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
};

// 11d. SUPPRIMER UN RÔLE (DELETE)
exports.deleteRole = async (req, res) => {
  const { id } = req.params;

  try {
    const [used] = await db.query(
      'SELECT id FROM acces_adherent WHERE role_id = ?',
      [id]
    );

    if (used.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'Ce rôle est utilisé par des utilisateurs et ne peut pas être supprimé'
      });
    }

    const [result] = await db.query(
      'DELETE FROM roles WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: 'Rôle non trouvé'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Rôle supprimé avec succès'
    });
  } catch (error) {
    console.error('❌ deleteRole:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
};

// ============================================================
// 12. GESTION DES UTILISATEURS (SUPER ADMIN)
// ============================================================

// 12a. CRÉER UN UTILISATEUR (POST)
exports.creerUtilisateur = async (req, res) => {
  const { adherent, enfants, roleId, motDePassePersonnalise } = req.body;

  console.log('📝 [creerUtilisateur] Données reçues:', JSON.stringify(req.body, null, 2));

  if (!adherent || !adherent.whatsapp || !adherent.nomPrenom || !roleId) {
    return res.status(400).json({ 
      success: false,
      error: 'Données manquantes. Veuillez remplir tous les champs obligatoires (*).'
    });
  }

  try {
    const errors = await checkExistingUser(adherent.whatsapp, adherent.email);
    
    if (errors.length > 0) {
      const fieldErrors = {};
      errors.forEach(err => {
        fieldErrors[err.field] = err.message;
      });
      
      return res.status(409).json({
        success: false,
        error: 'Certaines informations sont déjà utilisées.',
        fieldErrors: fieldErrors
      });
    }

    const connection = await db.pool.getConnection();
    
    try {
      await connection.beginTransaction();

      const [result] = await connection.query(
        `INSERT INTO adherent 
          (whatsapp, nom_prenom, pays, ville, email, date_naissance, genre, 
           source_connaissance, source_autre_detail, objectif, suggestions, accord_publication)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          adherent.whatsapp,
          adherent.nomPrenom,
          adherent.pays || '',
          adherent.ville || '',
          adherent.email || '',
          adherent.dateNaissance || new Date().toISOString().split('T')[0],
          adherent.genre || 'homme',
          adherent.sourceConnaissance || 'instagram',
          adherent.sourceAutreDetail || null,
          adherent.objectif || null,
          adherent.suggestions || null,
          adherent.accordPublication ? 1 : 0,
        ]
      );

      const adherentId = result.insertId;
      console.log(`📝 [creerUtilisateur] Adhérent créé avec ID: ${adherentId}`);

      let motDePasse = motDePassePersonnalise || `nafa-${adherentId}`;

      await connection.query(
        `INSERT INTO acces_adherent 
          (adherent_id, role_id, nom_prenom, whatsapp, mot_de_passe)
         VALUES (?, ?, ?, ?, ?)`,
        [
          adherentId,
          roleId,
          adherent.nomPrenom,
          adherent.whatsapp,
          motDePasse,
        ]
      );

      if (enfants && enfants.length > 0) {
        for (const enfant of enfants) {
          await connection.query(
            `INSERT INTO enfant 
              (adherent_id, nom_prenom, date_naissance, genre, niveau_tilawa, 
               memorisation, memorisation_autre_detail, objectif, accord_inscription)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              adherentId,
              enfant.nomPrenom || '',
              enfant.dateNaissance || new Date().toISOString().split('T')[0],
              enfant.genre || 'homme',
              enfant.niveauTilawa || 'debutant',
              enfant.memorisation || null,
              enfant.memorisationAutreDetail || null,
              enfant.objectif || null,
              enfant.accordInscription ? 1 : null,
            ]
          );
        }
      }

      await connection.commit();

      const [roleRows] = await db.query(
        'SELECT libelle FROM roles WHERE id = ?',
        [roleId]
      );
      const roleLibelle = roleRows.length > 0 ? roleRows[0].libelle : '';

      res.status(201).json({
        success: true,
        message: `✅ Utilisateur créé avec succès avec le rôle "${roleLibelle}"`,
        userId: adherentId,
        identifiant: adherent.whatsapp,
        motDePasse: motDePasse,
        credentials: {
          identifiant: adherent.whatsapp,
          motDePasse: motDePasse,
        },
      });

    } catch (error) {
      await connection.rollback();
      console.error('❌ [creerUtilisateur] Erreur transaction:', error);
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('❌ [creerUtilisateur] Erreur:', error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ 
        success: false,
        error: 'Ces informations sont déjà enregistrées.',
        code: error.code
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: 'Erreur serveur: ' + error.message 
    });
  }
};

// 12b. LISTE DES UTILISATEURS (GET)
exports.getUsers = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT 
        a.id,
        a.whatsapp,
        a.nom_prenom,
        a.email,
        a.pays,
        a.ville,
        a.created_at,
        r.id as role_id,
        r.nom as role_nom,
        r.libelle as role_libelle,
        acc.mot_de_passe
       FROM adherent a
       JOIN acces_adherent acc ON a.id = acc.adherent_id
       LEFT JOIN roles r ON acc.role_id = r.id
       ORDER BY a.id DESC`
    );

    res.status(200).json({
      success: true,
      data: rows,
      count: rows.length
    });
  } catch (error) {
    console.error('❌ getUsers:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
};

// 12c. UTILISATEUR PAR ID (GET)
exports.getUserById = async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await db.query(
      `SELECT 
        a.id,
        a.whatsapp,
        a.nom_prenom,
        a.email,
        a.pays,
        a.ville,
        a.date_naissance,
        a.genre,
        a.accord_publication,
        a.created_at,
        r.id as role_id,
        r.nom as role_nom,
        r.libelle as role_libelle,
        acc.mot_de_passe
       FROM adherent a
       JOIN acces_adherent acc ON a.id = acc.adherent_id
       LEFT JOIN roles r ON acc.role_id = r.id
       WHERE a.id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur non trouvé'
      });
    }

    res.status(200).json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    console.error('❌ getUserById:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
};

// 12d. MODIFIER UN UTILISATEUR (PUT)
exports.updateUser = async (req, res) => {
  const { id } = req.params;
  const { 
    whatsapp, 
    nomPrenom, 
    pays, 
    ville, 
    email, 
    dateNaissance, 
    genre, 
    roleId,
    motDePasse
  } = req.body;

  try {
    const connection = await db.pool.getConnection();
    
    try {
      await connection.beginTransaction();

      await connection.query(
        `UPDATE adherent SET
          whatsapp = ?,
          nom_prenom = ?,
          pays = ?,
          ville = ?,
          email = ?,
          date_naissance = ?,
          genre = ?,
          updated_at = NOW()
         WHERE id = ?`,
        [whatsapp, nomPrenom, pays, ville, email, dateNaissance, genre, id]
      );

      let updateAccesQuery = `
        UPDATE acces_adherent SET
          nom_prenom = ?,
          whatsapp = ?
      `;
      const params = [nomPrenom, whatsapp];

      if (roleId) {
        updateAccesQuery += `, role_id = ?`;
        params.push(roleId);
      }

      if (motDePasse) {
        updateAccesQuery += `, mot_de_passe = ?`;
        params.push(motDePasse);
      }

      updateAccesQuery += `, updated_at = NOW() WHERE adherent_id = ?`;
      params.push(id);

      await connection.query(updateAccesQuery, params);

      await connection.commit();

      res.status(200).json({
        success: true,
        message: 'Utilisateur mis à jour avec succès'
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('❌ updateUser:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
};

// 12e. SUPPRIMER UN UTILISATEUR (DELETE)
exports.deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    const connection = await db.pool.getConnection();
    
    try {
      await connection.beginTransaction();

      await connection.query(
        'DELETE FROM acces_adherent WHERE adherent_id = ?',
        [id]
      );

      await connection.query(
        'DELETE FROM enfant WHERE adherent_id = ?',
        [id]
      );

      const [result] = await connection.query(
        'DELETE FROM adherent WHERE id = ?',
        [id]
      );

      if (result.affectedRows === 0) {
        await connection.rollback();
        return res.status(404).json({
          success: false,
          error: 'Utilisateur non trouvé'
        });
      }

      await connection.commit();

      res.status(200).json({
        success: true,
        message: 'Utilisateur supprimé avec succès'
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('❌ deleteUser:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
};