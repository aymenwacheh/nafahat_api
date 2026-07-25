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
  
  // Vérifier le numéro WhatsApp
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
  
  // Vérifier l'email
  if (email) {
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
// INSCRIPTION (POST) - AVEC VÉRIFICATIONS D'UNICITÉ
// ============================================================
exports.inscrireAdherent = async (req, res) => {
  const { adherent, enfants } = req.body;

  console.log('📝 [inscrireAdherent] Données reçues:', JSON.stringify(req.body, null, 2));

  // ============================================================
  // 1. VALIDATION DES DONNÉES OBLIGATOIRES
  // ============================================================
  if (!adherent || !adherent.whatsapp || !adherent.nomPrenom) {
    return res.status(400).json({ 
      success: false,
      error: 'Données manquantes. Veuillez remplir tous les champs obligatoires (*).',
      fields: ['whatsapp', 'nomPrenom']
    });
  }

  try {
    // ============================================================
    // 2. VÉRIFICATION DES DOUBLONS
    // ============================================================
    const errors = await checkExistingUser(adherent.whatsapp, adherent.email);
    
    if (errors.length > 0) {
      // Construire un message d'erreur personnalisé
      let errorMessage = '';
      const fieldErrors = {};
      
      errors.forEach(err => {
        if (err.field === 'whatsapp') {
          errorMessage = '❌ Ce numéro WhatsApp est déjà utilisé. Veuillez vous connecter ou utiliser un autre numéro.';
          fieldErrors.whatsapp = err.message;
        }
        if (err.field === 'email') {
          errorMessage = '❌ Cet email est déjà utilisé. Veuillez vous connecter ou utiliser un autre email.';
          fieldErrors.email = err.message;
        }
      });
      
      // Si les deux sont en double
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

    // ============================================================
    // 3. INSERTION DE L'ADHÉRENT
    // ============================================================
    const connection = await db.pool.getConnection();
    
    try {
      await connection.beginTransaction();

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

      // ============================================================
      // 4. GÉNÉRATION DU MOT DE PASSE
      // ============================================================
      const motDePasse = `nafa-${adherentId}`;

      // ============================================================
      // 5. INSERTION DANS LA TABLE acces_adherent
      // ============================================================
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

      // ============================================================
      // 6. INSERTION DES ENFANTS (si présents)
      // ============================================================
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

      // ============================================================
      // 7. CONSTRUCTION DU MESSAGE WHATSAPP
      // ============================================================
      const message = generateWhatsAppMessage(
        adherent.nomPrenom,
        adherent.whatsapp,
        motDePasse
      );

      const cleanPhone = adherent.whatsapp.replace(/[^0-9+]/g, '');
      const encodedMessage = encodeURIComponent(message);
      const waUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;

      // ============================================================
      // 8. RÉPONSE SUCCÈS
      // ============================================================
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
      console.log('📝 [inscrireAdherent] Connexion libérée');
    }

  } catch (error) {
    console.error('❌ [inscrireAdherent] Erreur:', error);
    
    // Gestion spécifique des erreurs de duplication (si la vérification a échoué)
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
// LISTE DES ADHÉRENTS (GET)
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
        acc.id as acces_id
       FROM adherent a
       LEFT JOIN acces_adherent acc ON a.id = acc.adherent_id
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
// ADHÉRENT PAR ID (GET)
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
        acc.id as acces_id
       FROM adherent a
       LEFT JOIN acces_adherent acc ON a.id = acc.adherent_id
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
// RÉCUPÉRER LES IDENTIFIANTS D'UN ADHÉRENT (GET)
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
// AUTHENTIFICATION (POST) - LOGIN
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
        a.email,
        a.pays,
        a.ville,
        a.date_naissance,
        a.genre,
        a.accord_publication
       FROM acces_adherent acc
       JOIN adherent a ON acc.adherent_id = a.id
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

    res.status(200).json({
      success: true,
      data: userData,
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
// METTRE À JOUR UN ADHÉRENT (PUT)
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
    // Vérifier si l'adhérent existe
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

    // Vérifier les doublons (sauf pour l'adhérent actuel)
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
    
    if (email) {
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

      const [result] = await connection.query(
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
          accord_publication = ?
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
          whatsapp = ?
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
// SUPPRIMER UN ADHÉRENT (DELETE)
// ============================================================
exports.deleteAdherent = async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await db.query(
      'DELETE FROM adherent WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Adhérent non trouvé' 
      });
    }

    res.status(200).json({
      success: true,
      message: '✅ Adhérent supprimé avec succès',
    });
  } catch (error) {
    console.error('❌ [deleteAdherent] Erreur:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erreur serveur' 
    });
  }
};
// adherentController.js - Ajouter ces fonctions

// ============================================================
// VÉRIFICATION WHATSAPP (GET)
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
// VÉRIFICATION EMAIL (GET)
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
// RÉINITIALISER LE MOT DE PASSE (POST)
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
      `UPDATE acces_adherent SET mot_de_passe = ? WHERE adherent_id = ?`,
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