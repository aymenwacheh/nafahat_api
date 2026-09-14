// controllers/adherentController.js
const db = require('../config/database');

// ============================================================
// FONCTIONS UTILITAIRES
// ============================================================

// Générer le message WhatsApp
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

// Générer le code de vérification
function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Générer l'email de bienvenue
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
              <strong>💡 Conseil :</strong> Nous vous recommandons de changer votre mot de passe lors de votre première connexion.
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
            </ul>
            <div class="footer">
              <p>© 2024 Académie Nafahat - Tous droits réservés</p>
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

      © 2024 Académie Nafahat
    `
  };
}

// Nettoyer les codes de vérification expirés
function cleanExpiredCodes() {
  if (!global.verificationCodes) {
    global.verificationCodes = {};
    return;
  }
  
  const now = Date.now();
  const expiredKeys = [];
  
  for (const key in global.verificationCodes) {
    if (now - global.verificationCodes[key].timestamp > 300000) {
      expiredKeys.push(key);
    }
  }
  
  expiredKeys.forEach(key => {
    delete global.verificationCodes[key];
  });
}

// Nettoyer les tokens de réinitialisation expirés
function cleanExpiredResetTokens() {
  if (!global.resetTokens) {
    global.resetTokens = {};
    return;
  }

  const now = Date.now();
  const expiredKeys = [];

  for (const key in global.resetTokens) {
    const data = global.resetTokens[key];
    if (data.expiresAt && now > data.expiresAt) {
      expiredKeys.push(key);
    }
  }

  expiredKeys.forEach(key => {
    delete global.resetTokens[key];
  });

  if (expiredKeys.length > 0) {
    console.log(`🧹 [cleanExpiredResetTokens] ${expiredKeys.length} token(s) expiré(s) supprimé(s)`);
  }
}

// Vérifier si l'utilisateur existe déjà
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
        message: 'Ce numéro WhatsApp est déjà enregistré.'
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
        message: 'Cet email est déjà enregistré.'
      });
    }
  }
  
  return errors;
}

// Créer l'utilisateur en base de données
async function createUserInDatabase(adherent, enfants) {
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
    console.log(`📝 [createUserInDatabase] Adhérent créé avec ID: ${adherentId}`);

    const motDePasse = `nafa-${adherentId}`;

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
// FONCTION UTILITAIRE : Obtenir l'URL de base du frontend
// ============================================================
function getFrontendUrl() {
  const isProduction = process.env.NODE_ENV === 'production' || 
                       process.env.BASE_URL === 'https://www.nafahat-academy.com';
  
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  const cleanUrl = baseUrl.replace(/\/+$/, '');
  
  console.log(`🌍 [getFrontendUrl] Environnement: ${isProduction ? 'PRODUCTION' : 'DÉVELOPPEMENT'}`);
  console.log(`🔗 [getFrontendUrl] URL utilisée: ${cleanUrl}`);
  
  return cleanUrl;
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
    const errors = await checkExistingUser(adherent.whatsapp, adherent.email);
    
    if (errors.length > 0) {
      const fieldErrors = {};
      let errorMessage = '';
      
      errors.forEach(err => {
        fieldErrors[err.field] = err.message;
        if (err.field === 'whatsapp') {
          errorMessage = '❌ Ce numéro WhatsApp est déjà utilisé.';
        }
        if (err.field === 'email') {
          errorMessage = '❌ Cet email est déjà utilisé.';
        }
      });
      
      if (errors.length > 1) {
        errorMessage = '❌ Le numéro WhatsApp et l\'email sont déjà enregistrés.';
      }
      
      return res.status(409).json({
        success: false,
        error: errorMessage,
        fieldErrors: fieldErrors,
        details: errors
      });
    }

    const result = await createUserInDatabase(adherent, enfants);

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
        errorMessage = '❌ Ce numéro WhatsApp est déjà utilisé.';
      } else if (error.sqlMessage && error.sqlMessage.includes('email')) {
        errorMessage = '❌ Cet email est déjà utilisé.';
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
// 10. RÉINITIALISER LE MOT DE PASSE (POST) - Admin
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

// 12f. LISTE DES UTILISATEURS AVEC PAGINATION (GET)
exports.getUsersPaginated = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';
    const role = req.query.role || 'tous';
    const sort = req.query.sort || 'id';
    const order = req.query.order || 'desc';

    let whereClause = '1=1';
    const params = [];

    if (search.trim() !== '') {
      whereClause += ` AND (a.nom_prenom LIKE ? OR a.whatsapp LIKE ? OR a.email LIKE ?)`;
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    if (role !== 'tous') {
      whereClause += ` AND r.nom = ?`;
      params.push(role);
    }

    const sortMapping = {
      'id': 'a.id',
      'nom_prenom': 'a.nom_prenom',
      'role_libelle': 'r.libelle',
      'whatsapp': 'a.whatsapp',
      'email': 'a.email',
    };
    const sortColumn = sortMapping[sort] || 'a.id';
    const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const query = `
      SELECT 
        a.id,
        a.whatsapp,
        a.nom_prenom,
        a.email,
        a.pays,
        a.ville,
        a.accord_publication,
        a.created_at as date_inscription,
        r.id as role_id,
        r.nom as role_nom,
        r.libelle as role_libelle,
        acc.mot_de_passe,
        acc.active
      FROM adherent a
      JOIN acces_adherent acc ON a.id = acc.adherent_id
      LEFT JOIN roles r ON acc.role_id = r.id
      WHERE ${whereClause}
      ORDER BY ${sortColumn} ${sortOrder}
      LIMIT ? OFFSET ?
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM adherent a
      JOIN acces_adherent acc ON a.id = acc.adherent_id
      LEFT JOIN roles r ON acc.role_id = r.id
      WHERE ${whereClause}
    `;

    const paramsWithPagination = [...params, limit, offset];

    const [rows] = await db.query(query, paramsWithPagination);
    const [countResult] = await db.query(countQuery, params);

    const [rolesResult] = await db.query('SELECT DISTINCT nom FROM roles ORDER BY nom');

    const total = countResult[0]?.total || 0;
    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      data: rows,
      count: total,
      totalPages: totalPages,
      currentPage: page,
      limit: limit,
      roles: rolesResult.map(r => r.nom).filter(n => n !== null && n !== ''),
      pagination: {
        total: total,
        totalPages: totalPages,
        currentPage: page,
        perPage: limit,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      }
    });

  } catch (error) {
    console.error('❌ [getUsersPaginated] Erreur:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur: ' + error.message
    });
  }
};

// 12g. CHANGER LE STATUT D'UN UTILISATEUR (PUT)
exports.toggleUserStatus = async (req, res) => {
  const { id } = req.params;
  const { active } = req.body;

  try {
    const [existing] = await db.query(
      'SELECT a.id, acc.active FROM adherent a JOIN acces_adherent acc ON a.id = acc.adherent_id WHERE a.id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur non trouvé'
      });
    }

    const newStatus = active !== undefined ? active : !existing[0].active;

    await db.query(
      `UPDATE acces_adherent SET active = ?, updated_at = NOW() WHERE adherent_id = ?`,
      [newStatus ? 1 : 0, id]
    );

    res.status(200).json({
      success: true,
      message: newStatus ? '✅ Utilisateur activé' : '✅ Utilisateur désactivé',
      active: newStatus
    });
  } catch (error) {
    console.error('❌ [toggleUserStatus] Erreur:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur: ' + error.message
    });
  }
};

// ============================================================
// 13. ENVOYER LE CODE DE VÉRIFICATION (POST)
// ============================================================
exports.sendVerificationCode = async (req, res) => {
  const { email, whatsapp, nomPrenom } = req.body;

  console.log('═══════════════════════════════════════════════════');
  console.log('📧 [EMAIL 1] Envoi du code de vérification');
  console.log('📧 Email:', email);
  console.log('📱 WhatsApp:', whatsapp);
  console.log('👤 Nom:', nomPrenom);
  console.log('═══════════════════════════════════════════════════');

  if (!email || !email.includes('@')) {
    return res.status(400).json({
      success: false,
      error: 'Email invalide'
    });
  }

  try {
    cleanExpiredCodes();

    const code = generateVerificationCode();
    console.log('🔑 Code généré:', code);
    
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

    let emailSent = false;

    try {
      let nodemailer;
      try {
        nodemailer = require('nodemailer');
      } catch (e) {
        throw new Error('Nodemailer not installed');
      }

      const emailUser = process.env.EMAIL_USER;
      const emailPassword = process.env.EMAIL_PASSWORD;
      
      if (!emailUser || !emailPassword) {
        throw new Error('Email credentials not configured');
      }

      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: emailUser,
          pass: emailPassword
        }
      });

      await transporter.verify();

      const mailOptions = {
        from: `"Académie Nafahat" <${emailUser}>`,
        to: email,
        subject: '🔐 Code de vérification - Académie Nafahat',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5;">
            <div style="background: #ffffff; padding: 40px; border-radius: 12px;">
              <div style="text-align: center; border-bottom: 3px solid #0D443E; padding-bottom: 20px;">
                <h1 style="color: #0D443E;">📚 Académie Nafahat</h1>
                <p style="color: #666;">Vérification de votre inscription</p>
              </div>
              <p>Bonjour <strong>${nomPrenom}</strong>,</p>
              <p>Pour finaliser votre inscription, veuillez utiliser le code ci-dessous :</p>
              <div style="background: #f0f7f6; border-radius: 12px; padding: 25px; text-align: center; border: 2px dashed #0D443E;">
                <div style="font-size: 48px; font-weight: bold; color: #0D443E; letter-spacing: 8px; font-family: monospace;">${code}</div>
                <p style="margin: 10px 0 0; color: #666; font-size: 14px;">⏱️ Valable 5 minutes</p>
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
            </div>
          </div>
        `,
        text: `
          🔐 Code de vérification - Académie Nafahat

          Bonjour ${nomPrenom},

          Votre code de vérification : ${code}

          ⏱️ Valable 5 minutes.

          📱 Identifiant : ${whatsapp}
          👤 Nom : ${nomPrenom}

          © 2024 Académie Nafahat
        `
      };

      await transporter.sendMail(mailOptions);
      emailSent = true;
      console.log('✅ Email envoyé avec succès !');
      
    } catch (nodemailerError) {
      console.error('❌ Erreur nodemailer:', nodemailerError.message);
    }

    if (!emailSent) {
      console.log('═══════════════════════════════════════════════════');
      console.log('📧 MODE SIMULATION - Code:', code);
      console.log('═══════════════════════════════════════════════════');
    }

    const response = {
      success: true,
      message: emailSent ? '✅ Code envoyé par email' : '📧 Code généré (SIMULATION)',
      emailSent: emailSent,
    };

    if (process.env.NODE_ENV === 'development') {
      response.code = code;
    }

    res.status(200).json(response);

  } catch (error) {
    console.error('❌ ERREUR:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'envoi du code: ' + error.message
    });
  }
};

// ============================================================
// 14. VALIDER LE CODE ET CRÉER L'UTILISATEUR (POST)
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

    if (!global.verificationCodes || !global.verificationCodes[email]) {
      return res.status(400).json({
        success: false,
        error: 'Aucun code trouvé. Veuillez en demander un nouveau.'
      });
    }

    const storedData = global.verificationCodes[email];
    const now = Date.now();

    if (now - storedData.timestamp > 300000) {
      delete global.verificationCodes[email];
      return res.status(400).json({
        success: false,
        error: 'Le code a expiré. Veuillez en demander un nouveau.'
      });
    }

    storedData.attempts = (storedData.attempts || 0) + 1;
    if (storedData.attempts > storedData.maxAttempts) {
      delete global.verificationCodes[email];
      return res.status(400).json({
        success: false,
        error: 'Trop de tentatives. Veuillez demander un nouveau code.'
      });
    }

    if (storedData.code !== code) {
      return res.status(400).json({
        success: false,
        error: `Code incorrect. ${storedData.maxAttempts - storedData.attempts} tentative(s) restante(s).`
      });
    }

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

    const createResult = await createUserInDatabase(finalAdherent, enfants || []);

    if (createResult.success) {
      // Envoyer l'email de succès
      try {
        let nodemailer;
        try {
          nodemailer = require('nodemailer');
        } catch (e) {}

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
              }
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
            
            console.log('✅ Email de succès envoyé à', finalAdherent.email);
          }
        }
      } catch (emailError) {
        console.error('❌ Erreur envoi email de succès:', emailError.message);
      }

      const message = generateWhatsAppMessage(
        finalAdherent.nomPrenom,
        finalAdherent.whatsapp,
        createResult.motDePasse
      );

      const cleanPhone = finalAdherent.whatsapp.replace(/[^0-9+]/g, '');
      const encodedMessage = encodeURIComponent(message);
      const waUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;

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

// ============================================================
// 16. DEMANDE DE RÉINITIALISATION DU MOT DE PASSE (POST)
// ============================================================
exports.requestPasswordReset = async (req, res) => {
  const { email } = req.body;

  console.log('═══════════════════════════════════════════════════');
  console.log('🔑 [RESET PASSWORD] Demande de réinitialisation');
  console.log('📧 Email:', email);
  console.log('═══════════════════════════════════════════════════');

  if (!email || !email.includes('@')) {
    return res.status(400).json({
      success: false,
      error: 'Veuillez fournir un email valide'
    });
  }

  try {
    const [users] = await db.query(
      'SELECT id, whatsapp, nom_prenom FROM adherent WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Aucun compte trouvé avec cet email'
      });
    }

    const user = users[0];
    
    const resetToken = generateVerificationCode();
    const tokenExpiry = Date.now() + 3600000;

    if (!global.resetTokens) {
      global.resetTokens = {};
    }
    
    global.resetTokens[resetToken] = {
      userId: user.id,
      email: email,
      whatsapp: user.whatsapp,
      nomPrenom: user.nom_prenom,
      timestamp: Date.now(),
      expiresAt: tokenExpiry,
      used: false
    };

    cleanExpiredResetTokens();

    console.log('🔑 Token généré:', resetToken);
    console.log('👤 Utilisateur:', user.nom_prenom);

    const baseUrl = getFrontendUrl();
    const resetLink = `${baseUrl}/reset-password?token=${resetToken}`;
    
    console.log(`🔗 Lien de réinitialisation: ${resetLink}`);

    let emailSent = false;

    try {
      let nodemailer;
      try {
        nodemailer = require('nodemailer');
      } catch (e) {
        console.log('⚠️ Nodemailer non installé');
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
            }
          });

          await transporter.verify();

          const mailOptions = {
            from: `"Académie Nafahat" <${emailUser}>`,
            to: email,
            subject: '🔑 Réinitialisation de votre mot de passe - Académie Nafahat',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background: #0D443E; padding: 20px; text-align: center; color: white; border-radius: 12px 12px 0 0;">
                  <h1>🔑 Réinitialisation du mot de passe</h1>
                  <p style="margin: 5px 0 0; opacity: 0.9;">Académie Nafahat</p>
                </div>
                <div style="background: #f5f5f5; padding: 30px; border-radius: 0 0 12px 12px;">
                  <h2>👋 Bonjour ${user.nom_prenom},</h2>
                  
                  <p>Nous avons reçu une demande de réinitialisation de votre mot de passe pour votre compte <strong>Académie Nafahat</strong>.</p>
                  
                  <div style="background: #e8f5e9; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #43a047;">
                    <strong>📱 Identifiant :</strong> ${user.whatsapp}
                  </div>
                  
                  <p>Pour réinitialiser votre mot de passe, cliquez sur le bouton ci-dessous :</p>
                  
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetLink}" style="background: #0D443E; color: white; padding: 14px 35px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">🔐 Réinitialiser mon mot de passe</a>
                  </div>
                  
                  <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
                    <p style="margin: 0; font-size: 14px;">
                      <strong>⏱️ Ce lien est valable 1 heure.</strong>
                    </p>
                    <p style="margin: 10px 0 0; font-size: 14px;">
                      Si vous n'avez pas demandé cette réinitialisation, ignorez simplement cet email.
                    </p>
                  </div>
                  
                  <p style="font-size: 12px; color: #999; text-align: center; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px;">
                    © 2024 Académie Nafahat - Tous droits réservés<br>
                    Cet email a été envoyé automatiquement suite à votre demande.
                  </p>
                </div>
              </div>
            `,
            text: `
              🔑 Réinitialisation de votre mot de passe - Académie Nafahat

              Bonjour ${user.nom_prenom},

              Nous avons reçu une demande de réinitialisation de votre mot de passe pour votre compte Académie Nafahat.

              📱 Identifiant : ${user.whatsapp}

              Pour réinitialiser votre mot de passe, cliquez sur le lien suivant :
              ${resetLink}

              ⏱️ Ce lien est valable 1 heure.

              Si vous n'avez pas demandé cette réinitialisation, ignorez simplement cet email.

              © 2024 Académie Nafahat
            `
          };

          await transporter.sendMail(mailOptions);
          emailSent = true;
          console.log('✅ Email de réinitialisation envoyé à', email);
          console.log(`   🔗 Lien: ${resetLink}`);
        } else {
          console.log('⚠️ Variables EMAIL_USER ou EMAIL_PASSWORD non définies');
        }
      }
    } catch (emailError) {
      console.error('❌ Erreur envoi email:', emailError.message);
    }

    if (!emailSent) {
      console.log('═══════════════════════════════════════════════════');
      console.log('📧 MODE SIMULATION - Lien de réinitialisation :');
      console.log(resetLink);
      console.log('═══════════════════════════════════════════════════');
    }

    res.status(200).json({
      success: true,
      message: emailSent 
        ? '✅ Un email de réinitialisation vous a été envoyé' 
        : '📧 Lien de réinitialisation généré (SIMULATION)',
      emailSent: emailSent,
      token: process.env.NODE_ENV === 'development' ? resetToken : undefined
    });

  } catch (error) {
    console.error('❌ [requestPasswordReset] Erreur:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la demande de réinitialisation: ' + error.message
    });
  }
};

// ============================================================
// 17. VALIDER LE TOKEN ET RÉINITIALISER LE MOT DE PASSE (POST)
// ============================================================
exports.resetPasswordWithToken = async (req, res) => {
  const { token, whatsapp, newPassword } = req.body;

  console.log('═══════════════════════════════════════════════════');
  console.log('🔑 [RESET PASSWORD] Validation du token');
  console.log('📝 Token:', token);
  console.log('📱 WhatsApp:', whatsapp);
  console.log('═══════════════════════════════════════════════════');

  if (!token || !whatsapp || !newPassword) {
    return res.status(400).json({
      success: false,
      error: 'Token, WhatsApp et nouveau mot de passe requis'
    });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      error: 'Le nouveau mot de passe doit contenir au moins 6 caractères'
    });
  }

  try {
    cleanExpiredResetTokens();

    if (!global.resetTokens || !global.resetTokens[token]) {
      return res.status(400).json({
        success: false,
        error: 'Token invalide ou expiré. Veuillez faire une nouvelle demande.'
      });
    }

    const resetData = global.resetTokens[token];

    if (resetData.used) {
      delete global.resetTokens[token];
      return res.status(400).json({
        success: false,
        error: 'Ce token a déjà été utilisé. Veuillez faire une nouvelle demande.'
      });
    }

    if (Date.now() > resetData.expiresAt) {
      delete global.resetTokens[token];
      return res.status(400).json({
        success: false,
        error: 'Le token a expiré. Veuillez faire une nouvelle demande.'
      });
    }

    if (resetData.whatsapp !== whatsapp) {
      return res.status(400).json({
        success: false,
        error: 'Le numéro WhatsApp ne correspond pas à la demande de réinitialisation.'
      });
    }

    await db.query(
      'UPDATE acces_adherent SET mot_de_passe = ?, updated_at = NOW() WHERE adherent_id = ?',
      [newPassword, resetData.userId]
    );

    resetData.used = true;
    global.resetTokens[token] = resetData;

    console.log('✅ Mot de passe réinitialisé pour l\'utilisateur:', resetData.userId);

    // Envoyer un email de confirmation
    try {
      let nodemailer;
      try {
        nodemailer = require('nodemailer');
      } catch (e) {}

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
            }
          });

          await transporter.sendMail({
            from: `"Académie Nafahat" <${emailUser}>`,
            to: resetData.email,
            subject: '✅ Mot de passe réinitialisé - Académie Nafahat',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: #0D443E; padding: 20px; text-align: center; color: white; border-radius: 12px 12px 0 0;">
                  <h1>✅ Mot de passe réinitialisé</h1>
                </div>
                <div style="background: #f5f5f5; padding: 30px; border-radius: 0 0 12px 12px;">
                  <h2>Bonjour ${resetData.nomPrenom},</h2>
                  <p>Votre mot de passe a été réinitialisé avec succès.</p>
                  <p>Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.</p>
                  <div style="text-align: center; margin: 20px 0;">
                    <a href="${process.env.BASE_URL || 'https://nafahat.com'}/connexion" style="background: #0D443E; color: white; padding: 12px 30px; text-decoration: none; border-radius: 8px;">Se connecter</a>
                  </div>
                </div>
              </div>
            `,
            text: `
              ✅ Mot de passe réinitialisé

              Bonjour ${resetData.nomPrenom},

              Votre mot de passe a été réinitialisé avec succès.
              Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.

              Se connecter : ${process.env.BASE_URL || 'https://nafahat.com'}/connexion
            `
          });
          console.log('✅ Email de confirmation envoyé');
        }
      }
    } catch (emailError) {
      console.error('❌ Erreur envoi email confirmation:', emailError.message);
    }

    res.status(200).json({
      success: true,
      message: '✅ Mot de passe réinitialisé avec succès. Vous pouvez maintenant vous connecter.',
      userId: resetData.userId
    });

  } catch (error) {
    console.error('❌ [resetPasswordWithToken] Erreur:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la réinitialisation: ' + error.message
    });
  }
};

// ============================================================
// 18. VÉRIFIER LA VALIDITÉ D'UN TOKEN (GET)
// ============================================================
exports.verifyResetToken = async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({
      success: false,
      error: 'Token requis'
    });
  }

  try {
    cleanExpiredResetTokens();

    if (!global.resetTokens || !global.resetTokens[token]) {
      return res.status(400).json({
        success: false,
        valid: false,
        error: 'Token invalide ou expiré'
      });
    }

    const resetData = global.resetTokens[token];

    if (resetData.used) {
      return res.status(400).json({
        success: false,
        valid: false,
        error: 'Ce token a déjà été utilisé'
      });
    }

    if (Date.now() > resetData.expiresAt) {
      delete global.resetTokens[token];
      return res.status(400).json({
        success: false,
        valid: false,
        error: 'Le token a expiré'
      });
    }

    res.status(200).json({
      success: true,
      valid: true,
      whatsapp: resetData.whatsapp,
      email: resetData.email
    });

  } catch (error) {
    console.error('❌ [verifyResetToken] Erreur:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
};

// ============================================================
// 19. RÉINITIALISATION DIRECTE DU MOT DE PASSE (POST)
// ============================================================
exports.resetPasswordDirect = async (req, res) => {
  const { email, newPassword } = req.body;

  console.log('═══════════════════════════════════════════════════');
  console.log('🔑 [RESET PASSWORD DIRECT] Réinitialisation directe');
  console.log('📧 Email:', email);
  console.log('═══════════════════════════════════════════════════');

  if (!email || !email.includes('@')) {
    return res.status(400).json({
      success: false,
      error: 'Veuillez fournir un email valide'
    });
  }

  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      error: 'Le mot de passe doit contenir au moins 6 caractères'
    });
  }

  try {
    // 1. Vérifier si l'utilisateur existe avec cet email
    const [users] = await db.query(
      'SELECT id, nom_prenom, whatsapp, email FROM adherent WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Aucun compte trouvé avec cet email'
      });
    }

    const user = users[0];

    // 2. Mettre à jour le mot de passe
    await db.query(
      'UPDATE acces_adherent SET mot_de_passe = ?, updated_at = NOW() WHERE adherent_id = ?',
      [newPassword, user.id]
    );

    console.log('✅ Mot de passe réinitialisé pour l\'utilisateur:', user.id);

    // 3. Récupérer les informations de connexion pour la réponse
    const [userData] = await db.query(
      `SELECT 
        a.id, 
        a.whatsapp, 
        a.nom_prenom, 
        a.email, 
        a.pays, 
        a.ville,
        r.id as role_id,
        r.nom as role_nom,
        r.libelle as role_libelle
       FROM adherent a
       JOIN acces_adherent acc ON a.id = acc.adherent_id
       LEFT JOIN roles r ON acc.role_id = r.id
       WHERE a.id = ?`,
      [user.id]
    );

    res.status(200).json({
      success: true,
      message: '✅ Mot de passe réinitialisé avec succès',
      userId: user.id,
      data: userData[0]
    });

  } catch (error) {
    console.error('❌ [resetPasswordDirect] Erreur:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la réinitialisation: ' + error.message
    });
  }
};

// ============================================================
// 20. RÉCUPÉRER UN UTILISATEUR PAR EMAIL (GET)
// ============================================================
exports.getUserByEmail = async (req, res) => {
  const { email } = req.query;

  if (!email || !email.includes('@')) {
    return res.status(400).json({
      success: false,
      error: 'Email invalide'
    });
  }

  try {
    const [users] = await db.query(
      `SELECT 
        a.id, 
        a.whatsapp, 
        a.nom_prenom, 
        a.email, 
        a.pays, 
        a.ville,
        r.id as role_id,
        r.nom as role_nom,
        r.libelle as role_libelle
       FROM adherent a
       JOIN acces_adherent acc ON a.id = acc.adherent_id
       LEFT JOIN roles r ON acc.role_id = r.id
       WHERE a.email = ?`,
      [email]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Aucun compte trouvé avec cet email'
      });
    }

    res.status(200).json({
      success: true,
      data: users[0]
    });

  } catch (error) {
    console.error('❌ [getUserByEmail] Erreur:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur'
    });
  }
};

// ============================================================
// EXPORTATION DES FONCTIONS
// ============================================================
module.exports = exports;