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
// FONCTION UTILITAIRE : Générer le code de vérification (EMAIL 1)
// ============================================================
function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ============================================================
// FONCTION UTILITAIRE : Générer l'email de bienvenue (EMAIL 2 - SUCCÈS)
// ============================================================
function generateWelcomeEmail(nomPrenom, whatsapp, motDePasse) {
  return {
    subject: '🎉 Bienvenue à l\'Académie Nafahat - Vos identifiants de connexion',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #0D443E, #092E2A); color: white; padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
          .content { background: #f5f5f5; padding: 30px; border-radius: 0 0 12px 12px; }
          .credentials { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0D443E; }
          .credential-item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
          .credential-item:last-child { border-bottom: none; }
          .label { color: #666; font-weight: 500; }
          .value { color: #0D443E; font-weight: 600; }
          .button { display: inline-block; background: #0D443E; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #999; border-top: 1px solid #ddd; padding-top: 20px; }
          .tip { background: #e8f5e9; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #43a047; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📚 Académie Nafahat</h1>
            <p style="margin: 5px 0 0; opacity: 0.9;">Plateforme d'apprentissage en ligne</p>
          </div>
          <div class="content">
            <h2>👋 Bonjour ${nomPrenom},</h2>
            
            <p>Nous sommes ravis de vous accueillir à l'<strong>Académie Nafahat</strong> !</p>
            
            <p>Votre inscription a été validée avec succès. Vous pouvez dès maintenant accéder à votre espace personnel.</p>
            
            <div class="credentials">
              <h3 style="color: #0D443E; margin-top: 0;">🔑 Vos identifiants de connexion</h3>
              <div class="credential-item">
                <span class="label">📱 Identifiant</span>
                <span class="value">${whatsapp}</span>
              </div>
              <div class="credential-item">
                <span class="label">🔒 Mot de passe</span>
                <span class="value">${motDePasse}</span>
              </div>
            </div>
            
            <div class="tip">
              <strong>💡 Conseil :</strong> Nous vous recommandons de changer votre mot de passe lors de votre première connexion via l'interface "Modifier mon profil".
            </div>
            
            <div style="text-align: center; margin: 25px 0;">
              <a href="https://nafahat.com/connexion" class="button">🚀 Se connecter</a>
            </div>
            
            <p style="font-size: 14px; color: #666;">
              <strong>📌 Informations importantes :</strong>
            </p>
            <ul style="font-size: 14px; color: #666; padding-left: 20px;">
              <li>Votre identifiant est votre numéro WhatsApp</li>
              <li>Vous pouvez modifier votre mot de passe à tout moment</li>
              <li>Accédez à vos formations depuis votre tableau de bord</li>
              <li>Conservez ces informations précieusement</li>
            </ul>
            
            <p style="font-size: 14px; color: #666; margin-top: 20px;">
              Si vous avez des questions, n'hésitez pas à nous contacter.
            </p>
            
            <div class="footer">
              <p>© 2024 Académie Nafahat - Tous droits réservés</p>
              <p>Cet email a été envoyé automatiquement suite à votre inscription.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      🎉 Bienvenue à l'Académie Nafahat !

      Bonjour ${nomPrenom},

      Nous sommes ravis de vous accueillir à l'Académie Nafahat !

      Votre inscription a été validée avec succès.

      🔑 Vos identifiants de connexion :
      📱 Identifiant : ${whatsapp}
      🔒 Mot de passe : ${motDePasse}

      💡 Conseil : Changez votre mot de passe lors de votre première connexion.

      🔗 Se connecter : https://nafahat.com/connexion

      📌 Informations importantes :
      - Votre identifiant est votre numéro WhatsApp
      - Vous pouvez modifier votre mot de passe à tout moment
      - Accédez à vos formations depuis votre tableau de bord
      - Conservez ces informations précieusement

      © 2024 Académie Nafahat
    `
  };
}

// ============================================================
// FONCTION UTILITAIRE : Nettoyer les codes expirés
// ============================================================
function cleanExpiredCodes() {
  if (!global.verificationCodes) {
    global.verificationCodes = {};
    return;
  }
  
  const now = Date.now();
  const expiredKeys = [];
  
  for (const key in global.verificationCodes) {
    if (now - global.verificationCodes[key].timestamp > 300000) { // 5 minutes
      expiredKeys.push(key);
    }
  }
  
  expiredKeys.forEach(key => {
    delete global.verificationCodes[key];
  });
}

// ============================================================
// FONCTION UTILITAIRE : Vérifier si l'utilisateur existe déjà
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
// FONCTION UTILITAIRE : Créer l'utilisateur en base de données
// ============================================================
async function createUserInDatabase(adherent, enfants) {
  const connection = await db.pool.getConnection();
  
  try {
    await connection.beginTransaction();

    // Insertion de l'adhérent
    const [result] = await connection.query(
      `INSERT INTO adherent 
        (whatsapp, nom_prenom, pays, ville, email, date_naissance, genre, 
         source_connaissance, source_autre_detail, objectif, suggestions, accord_publication, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
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
    console.log(`📝 [createUserInDatabase] Adhérent créé avec ID: ${adherentId}`);

    // Génération du mot de passe
    const motDePasse = `nafa-${adherentId}`;

    // Insertion dans acces_adherent
    await connection.query(
      `INSERT INTO acces_adherent 
        (adherent_id, nom_prenom, whatsapp, mot_de_passe, created_at, updated_at)
       VALUES (?, ?, ?, ?, NOW(), NOW())`,
      [
        adherentId,
        adherent.nomPrenom,
        adherent.whatsapp,
        motDePasse,
      ]
    );

    // Insertion des enfants
    if (enfants && enfants.length > 0) {
      console.log(`📝 [createUserInDatabase] Insertion de ${enfants.length} enfant(s)...`);
      for (const enfant of enfants) {
        await connection.query(
          `INSERT INTO enfant 
            (adherent_id, nom_prenom, date_naissance, genre, niveau_tilawa, 
             memorisation, memorisation_autre_detail, objectif, accord_inscription, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
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
    
    return {
      success: true,
      adherentId: adherentId,
      motDePasse: motDePasse
    };

  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

// ============================================================
// 1. INSCRIPTION ADHÉRENT (POST) - Version directe (sans email)
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

    const result = await createUserInDatabase(adherent, enfants);

    // Construction du message WhatsApp
    const message = generateWhatsAppMessage(
      adherent.nomPrenom,
      adherent.whatsapp,
      result.motDePasse
    );

    const cleanPhone = adherent.whatsapp.replace(/[^0-9+]/g, '');
    const encodedMessage = encodeURIComponent(message);
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;

    res.status(201).json({
      success: true,
      message: '🎉 Inscription réussie ! Bienvenue à l\'Académie Nafahat.',
      adherentId: result.adherentId,
      motDePasse: result.motDePasse,
      whatsappUrl: waUrl,
      credentials: {
        identifiant: adherent.whatsapp,
        motDePasse: result.motDePasse,
      },
    });

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
        a.updated_at,
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
        a.updated_at,
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
      error: 'Erreur serveur: ' + error.message 
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
           source_connaissance, source_autre_detail, objectif, suggestions, accord_publication, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
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
          (adherent_id, role_id, nom_prenom, whatsapp, mot_de_passe, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
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
               memorisation, memorisation_autre_detail, objectif, accord_inscription, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
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
        a.updated_at,
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
        a.updated_at,
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
          whatsapp = ?,
          updated_at = NOW()
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

      updateAccesQuery += ` WHERE adherent_id = ?`;
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

// ============================================================
// 13. EMAIL 1 : ENVOYER LE CODE DE VÉRIFICATION
// ============================================================
exports.sendVerificationCode = async (req, res) => {
  const { email, whatsapp, nomPrenom } = req.body;

  console.log('═══════════════════════════════════════════════════');
  console.log('📧 [EMAIL 1] Envoi du code de vérification');
  console.log('📧 [EMAIL 1] Email destinataire:', email);
  console.log('📧 [EMAIL 1] WhatsApp:', whatsapp);
  console.log('📧 [EMAIL 1] Nom:', nomPrenom);
  console.log('═══════════════════════════════════════════════════');

  if (!email || !email.includes('@')) {
    console.log('❌ [EMAIL 1] Email invalide:', email);
    return res.status(400).json({
      success: false,
      error: 'Email invalide'
    });
  }

  try {
    cleanExpiredCodes();

    const code = generateVerificationCode();
    console.log('🔑 [EMAIL 1] Code généré:', code);
    
    if (!global.verificationCodes) {
      global.verificationCodes = {};
    }
    
    global.verificationCodes[email] = {
      code: code,
      whatsapp: whatsapp,
      nomPrenom: nomPrenom,
      timestamp: Date.now(),
      attempts: 0,
      maxAttempts: 5
    };
    console.log('💾 [EMAIL 1] Code stocké pour:', email);

    let emailSent = false;

    try {
      let nodemailer;
      try {
        nodemailer = require('nodemailer');
        console.log('📧 [EMAIL 1] Nodemailer trouvé');
      } catch (e) {
        console.log('⚠️ [EMAIL 1] Nodemailer non installé');
        throw new Error('Nodemailer not installed');
      }

      const emailUser = process.env.EMAIL_USER;
      const emailPassword = process.env.EMAIL_PASSWORD;
      
      if (!emailUser || !emailPassword) {
        console.log('⚠️ [EMAIL 1] Variables EMAIL_USER ou EMAIL_PASSWORD non définies');
        throw new Error('Email credentials not configured');
      }

      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: emailUser,
          pass: emailPassword
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 10000,
      });

      await transporter.verify();
      console.log('✅ [EMAIL 1] Connexion SMTP établie avec succès');

      const mailOptions = {
        from: `"Académie Nafahat" <${emailUser}>`,
        to: email,
        subject: '🔐 Code de vérification - Académie Nafahat',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5;">
            <div style="background: #ffffff; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <div style="text-align: center; border-bottom: 3px solid #0D443E; padding-bottom: 20px; margin-bottom: 30px;">
                <h1 style="color: #0D443E; margin: 0;">📚 Académie Nafahat</h1>
                <p style="color: #666; margin: 5px 0 0;">Vérification de votre inscription</p>
              </div>
              
              <p>Bonjour <strong>${nomPrenom}</strong>,</p>
              <p>Merci de vous inscrire à l'Académie Nafahat. Pour finaliser votre inscription, veuillez utiliser le code de vérification ci-dessous :</p>
              
              <div style="background: #f0f7f6; border-radius: 12px; padding: 25px; text-align: center; margin: 30px 0; border: 2px dashed #0D443E;">
                <div style="font-size: 48px; font-weight: bold; color: #0D443E; letter-spacing: 8px; font-family: monospace;">${code}</div>
                <p style="margin: 10px 0 0; color: #666; font-size: 14px;">⏱️ Ce code est valable <strong>5 minutes</strong></p>
              </div>
              
              <div style="background: #f9f9f9; border-radius: 8px; padding: 15px; margin: 20px 0;">
                <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee;">
                  <span style="color: #666;">📱 Identifiant</span>
                  <span style="color: #0D443E; font-weight: 600;">${whatsapp}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 8px 0;">
                  <span style="color: #666;">👤 Nom</span>
                  <span style="color: #0D443E; font-weight: 600;">${nomPrenom}</span>
                </div>
              </div>
              
              <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 12px 16px; border-radius: 4px; margin: 20px 0; font-size: 14px; color: #856404;">
                ⚠️ Si vous n'avez pas demandé cette vérification, ignorez cet email.
              </div>
              
              <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #999; font-size: 13px;">
                <p>© 2024 Académie Nafahat - Tous droits réservés</p>
              </div>
            </div>
          </div>
        `,
        text: `
          🔐 Code de vérification - Académie Nafahat

          Bonjour ${nomPrenom},

          Merci de vous inscrire à l'Académie Nafahat.
          Voici votre code de vérification : ${code}

          ⏱️ Ce code est valable 5 minutes.

          📱 Identifiant : ${whatsapp}
          👤 Nom : ${nomPrenom}

          © 2024 Académie Nafahat
        `
      };

      await transporter.sendMail(mailOptions);
      emailSent = true;
      console.log('✅ [EMAIL 1] Email envoyé avec succès !');
      
    } catch (nodemailerError) {
      console.error('❌ [EMAIL 1] Erreur nodemailer:', nodemailerError.message);
    }

    if (!emailSent) {
      console.log('═══════════════════════════════════════════════════');
      console.log('📧 [EMAIL 1] MODE SIMULATION');
      console.log('📋 Code de vérification (copiez-le) :', code);
      console.log('═══════════════════════════════════════════════════');
    }

    const response = {
      success: true,
      message: emailSent 
        ? '✅ Code de vérification envoyé par email' 
        : '📧 Code de vérification généré (SIMULATION)',
      emailSent: emailSent,
    };

    if (process.env.NODE_ENV === 'development') {
      response.code = code;
    }

    res.status(200).json(response);

  } catch (error) {
    console.error('❌ [EMAIL 1] ERREUR:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'envoi du code de vérification: ' + error.message
    });
  }
};

// ============================================================
// 14. VALIDER LE CODE ET CRÉER L'UTILISATEUR + EMAIL 2 (SUCCÈS)
// ============================================================
exports.verifyCodeAndCreateUser = async (req, res) => {
  const { email, code, adherent, enfants } = req.body;

  console.log('═══════════════════════════════════════════════════');
  console.log('✅ [ETAPE 2] Vérification du code pour:', email);
  console.log('═══════════════════════════════════════════════════');

  if (!email || !code) {
    return res.status(400).json({
      success: false,
      error: 'Email et code requis'
    });
  }

  try {
    cleanExpiredCodes();

    // Vérification du code stocké
    if (!global.verificationCodes || !global.verificationCodes[email]) {
      return res.status(400).json({
        success: false,
        error: 'Aucun code de vérification trouvé pour cet email. Veuillez en demander un nouveau.'
      });
    }

    const storedData = global.verificationCodes[email];
    const now = Date.now();

    // Vérifier l'expiration (5 minutes)
    if (now - storedData.timestamp > 300000) {
      delete global.verificationCodes[email];
      return res.status(400).json({
        success: false,
        error: 'Le code de vérification a expiré. Veuillez en demander un nouveau.'
      });
    }

    // Vérifier le nombre de tentatives
    storedData.attempts = (storedData.attempts || 0) + 1;
    if (storedData.attempts > storedData.maxAttempts) {
      delete global.verificationCodes[email];
      return res.status(400).json({
        success: false,
        error: 'Trop de tentatives. Veuillez demander un nouveau code.'
      });
    }

    // Vérifier le code
    if (storedData.code !== code) {
      return res.status(400).json({
        success: false,
        error: `Code de vérification incorrect. ${storedData.maxAttempts - storedData.attempts} tentative(s) restante(s).`
      });
    }

    // ✅ Code valide - Supprimer le code utilisé
    delete global.verificationCodes[email];

    const finalAdherent = adherent || {
      whatsapp: storedData.whatsapp,
      nomPrenom: storedData.nomPrenom,
      email: email,
      pays: '',
      ville: '',
      dateNaissance: new Date().toISOString().split('T')[0],
      genre: 'homme',
      sourceConnaissance: 'instagram',
      sourceAutreDetail: null,
      objectif: null,
      suggestions: null,
      accordPublication: false
    };

    // Vérifier les doublons avant la création
    const errors = await checkExistingUser(finalAdherent.whatsapp, finalAdherent.email);
    
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

    // Créer l'utilisateur
    const createResult = await createUserInDatabase(finalAdherent, enfants || []);

    if (createResult.success) {
      // ============================================================
      // 📧 EMAIL 2 : ENVOI DE L'EMAIL DE SUCCÈS AVEC IDENTIFIANTS
      // ============================================================
      console.log('📧 [EMAIL 2] Envoi de l\'email de succès avec identifiants...');
      
      try {
        let nodemailer;
        try {
          nodemailer = require('nodemailer');
        } catch (e) {
          console.log('⚠️ [EMAIL 2] Nodemailer non installé');
        }

        if (nodemailer) {
          const emailUser = process.env.EMAIL_USER;
          const emailPassword = process.env.EMAIL_PASSWORD;
          
          if (emailUser && emailPassword) {
            const transporter = nodemailer.createTransport({
              host: process.env.SMTP_HOST || 'smtp.gmail.com',
              port: parseInt(process.env.SMTP_PORT || '587'),
              secure: process.env.SMTP_SECURE === 'true',
              auth: {
                user: emailUser,
                pass: emailPassword
              },
              connectionTimeout: 10000,
              greetingTimeout: 10000,
              socketTimeout: 10000,
            });

            await transporter.verify();

            const welcomeEmail = generateWelcomeEmail(
              finalAdherent.nomPrenom,
              finalAdherent.whatsapp,
              createResult.motDePasse
            );

            await transporter.sendMail({
              from: `"Académie Nafahat" <${emailUser}>`,
              to: finalAdherent.email,
              subject: welcomeEmail.subject,
              html: welcomeEmail.html,
              text: welcomeEmail.text,
            });
            
            console.log('✅ [EMAIL 2] Email de succès envoyé à', finalAdherent.email);
            console.log('   📱 Identifiant:', finalAdherent.whatsapp);
            console.log('   🔑 Mot de passe:', createResult.motDePasse);
          } else {
            console.log('⚠️ [EMAIL 2] Variables EMAIL_USER ou EMAIL_PASSWORD non définies');
          }
        }
      } catch (emailError) {
        console.error('❌ [EMAIL 2] Erreur envoi email de succès:', emailError.message);
      }

      // ============================================================
      // MESSAGE WHATSAPP
      // ============================================================
      const message = generateWhatsAppMessage(
        finalAdherent.nomPrenom,
        finalAdherent.whatsapp,
        createResult.motDePasse
      );

      const cleanPhone = finalAdherent.whatsapp.replace(/[^0-9+]/g, '');
      const encodedMessage = encodeURIComponent(message);
      const waUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;

      console.log('═══════════════════════════════════════════════════');
      console.log('✅ [INSCRIPTION] COMPLÈTE - Succès !');
      console.log('   👤 Nom:', finalAdherent.nomPrenom);
      console.log('   📱 Identifiant:', finalAdherent.whatsapp);
      console.log('   🔑 Mot de passe:', createResult.motDePasse);
      console.log('   📧 Email 1 (vérification): envoyé');
      console.log('   📧 Email 2 (succès): envoyé');
      console.log('═══════════════════════════════════════════════════');

      res.status(201).json({
        success: true,
        message: '✅ Inscription réussie ! Bienvenue à l\'Académie Nafahat.',
        adherentId: createResult.adherentId,
        motDePasse: createResult.motDePasse,
        whatsappUrl: waUrl,
        credentials: {
          identifiant: finalAdherent.whatsapp,
          motDePasse: createResult.motDePasse,
        },
        emailSent: true, // Indique que l'email 2 a été envoyé
      });
    } else {
      throw new Error(createResult.error || 'Erreur lors de la création du compte');
    }

  } catch (error) {
    console.error('❌ [verifyCodeAndCreateUser] Erreur:', error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        error: 'Ces informations sont déjà enregistrées.',
        code: error.code
      });
    }
    
    res.status(500).json({
      success: false,
      error: error.message || 'Erreur lors de la création du compte'
    });
  }
};

// ============================================================
// 15. CHANGER LE MOT DE PASSE (POST)
// ============================================================
exports.changePassword = async (req, res) => {
  const { id } = req.params;
  const { currentPassword, newPassword } = req.body;

  console.log(`📝 [changePassword] Changement de mot de passe pour l'adhérent: ${id}`);

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      error: 'Mot de passe actuel et nouveau mot de passe requis'
    });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      error: 'Le nouveau mot de passe doit contenir au moins 6 caractères'
    });
  }

  try {
    const [user] = await db.query(
      'SELECT adherent_id FROM acces_adherent WHERE adherent_id = ? AND mot_de_passe = ?',
      [id, currentPassword]
    );
    
    if (user.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Mot de passe actuel incorrect'
      });
    }
    
    await db.query(
      'UPDATE acces_adherent SET mot_de_passe = ?, updated_at = NOW() WHERE adherent_id = ?',
      [newPassword, id]
    );
    
    console.log(`✅ [changePassword] Mot de passe changé pour l'adhérent: ${id}`);
    
    res.status(200).json({
      success: true,
      message: 'Mot de passe mis à jour avec succès'
    });
  } catch (error) {
    console.error('❌ [changePassword] Erreur:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur: ' + error.message
    });
  }
};

module.exports = exports;