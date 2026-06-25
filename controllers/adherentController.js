const pool = require('../config/database');

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
// INSCRIPTION (POST) - AVEC CRÉATION DES ACCÈS
// ============================================================
exports.inscrireAdherent = async (req, res) => {
  const { adherent, enfants } = req.body;

  if (!adherent || !adherent.whatsapp || !adherent.nomPrenom) {
    return res.status(400).json({ error: 'Données manquantes' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Insertion adhérent
    const [result] = await connection.query(
      `INSERT INTO adherent 
        (whatsapp, nom_prenom, pays, ville, email, date_naissance, genre, source_connaissance, source_autre_detail, objectif, suggestions, accord_publication)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        adherent.whatsapp,
        adherent.nomPrenom,
        adherent.pays,
        adherent.ville,
        adherent.email,
        adherent.dateNaissance,
        adherent.genre,
        adherent.sourceConnaissance,
        adherent.sourceAutreDetail || null,
        adherent.objectif || null,
        adherent.suggestions || null,
        adherent.accordPublication ? 1 : 0,
      ]
    );

    const adherentId = result.insertId;

    // 2. Génération du mot de passe
    const motDePasse = `nafa-${adherentId}`;

    // 3. Insertion dans la table acces_adherent
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

    // 4. Insertion des enfants
    if (enfants && enfants.length > 0) {
      for (const enfant of enfants) {
        await connection.query(
          `INSERT INTO enfant 
            (adherent_id, nom_prenom, date_naissance, genre, niveau_tilawa, memorisation, memorisation_autre_detail, objectif, accord_inscription)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            adherentId,
            enfant.nomPrenom,
            enfant.dateNaissance,
            enfant.genre,
            enfant.niveauTilawa,
            enfant.memorisation || null,
            enfant.memorisationAutreDetail || null,
            enfant.objectif || null,
            enfant.accordInscription ? 1 : null,
          ]
        );
      }
    }

    await connection.commit();

    // 5. Construction du message WhatsApp
    const message = generateWhatsAppMessage(
      adherent.nomPrenom,
      adherent.whatsapp,
      motDePasse
    );

    // 6. Préparation de l'URL WhatsApp
    const cleanPhone = adherent.whatsapp.replace(/[^0-9+]/g, '');
    const encodedMessage = encodeURIComponent(message);
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;

    // 7. Réponse avec les identifiants
    res.status(201).json({
      success: true,
      message: 'Inscription réussie',
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
    console.error('❌ Erreur inscription:', error);
    res.status(500).json({ error: 'Erreur serveur lors de l\'inscription' });
  } finally {
    connection.release();
  }
};

// ============================================================
// LISTE DES ADHÉRENTS (GET)
// ============================================================
exports.getAdherents = async (req, res) => {
  try {
    const [rows] = await pool.query(
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
    console.error('❌ Erreur getAdherents:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// ============================================================
// ADHÉRENT PAR ID (GET)
// ============================================================
exports.getAdherentById = async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await pool.query(
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
      return res.status(404).json({ error: 'Adhérent non trouvé' });
    }

    res.status(200).json({
      success: true,
      data: rows[0],
    });
  } catch (error) {
    console.error('❌ Erreur getAdherentById:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// ============================================================
// RÉCUPÉRER LES IDENTIFIANTS D'UN ADHÉRENT (GET)
// ============================================================
exports.getAdherentCredentials = async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await pool.query(
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
      return res.status(404).json({ error: 'Identifiants non trouvés' });
    }

    res.status(200).json({
      success: true,
      data: rows[0],
    });
  } catch (error) {
    console.error('❌ Erreur getAdherentCredentials:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// ============================================================
// AUTHENTIFICATION (POST) - LOGIN
// ============================================================
exports.login = async (req, res) => {
  const { whatsapp, motDePasse } = req.body;

  if (!whatsapp || !motDePasse) {
    return res.status(400).json({ error: 'Identifiants manquants' });
  }

  try {
    const [rows] = await pool.query(
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
      return res.status(401).json({ 
        success: false,
        error: 'Identifiants invalides' 
      });
    }

    // Ne pas renvoyer le mot de passe pour des raisons de sécurité
    const { mot_de_passe, ...userData } = rows[0];

    res.status(200).json({
      success: true,
      data: userData,
      message: 'Authentification réussie',
    });
  } catch (error) {
    console.error('❌ Erreur login:', error);
    res.status(500).json({ error: 'Erreur serveur lors de l\'authentification' });
  }
};

// ============================================================
// METTRE À JOUR UN ADHÉRENT (PUT) - AVEC MISE À JOUR DES ACCÈS
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

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Mise à jour de l'adhérent
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

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Adhérent non trouvé' });
    }

    // 2. Mise à jour des accès (si l'adhérent a des accès)
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
      message: 'Adhérent mis à jour avec succès',
    });
  } catch (error) {
    await connection.rollback();
    console.error('❌ Erreur updateAdherent:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  } finally {
    connection.release();
  }
};

// ============================================================
// SUPPRIMER UN ADHÉRENT (DELETE) - SUPPRIME AUSSI LES ACCÈS (CASCADE)
// ============================================================
exports.deleteAdherent = async (req, res) => {
  const { id } = req.params;

  try {
    // La suppression en cascade supprime aussi acces_adherent et enfant
    const [result] = await pool.query(
      'DELETE FROM adherent WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Adhérent non trouvé' });
    }

    res.status(200).json({
      success: true,
      message: 'Adhérent supprimé avec succès',
    });
  } catch (error) {
    console.error('❌ Erreur deleteAdherent:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// ============================================================
// RÉINITIALISER LE MOT DE PASSE D'UN ADHÉRENT (POST)
// ============================================================
exports.resetPassword = async (req, res) => {
  const { id } = req.params;

  try {
    // Récupérer l'adhérent pour vérifier qu'il existe
    const [adherent] = await pool.query(
      'SELECT id, nom_prenom, whatsapp FROM adherent WHERE id = ?',
      [id]
    );

    if (adherent.length === 0) {
      return res.status(404).json({ error: 'Adhérent non trouvé' });
    }

    // Générer un nouveau mot de passe (même format)
    const newMotDePasse = `nafa-${id}`;

    // Mettre à jour le mot de passe
    await pool.query(
      `UPDATE acces_adherent SET mot_de_passe = ? WHERE adherent_id = ?`,
      [newMotDePasse, id]
    );

    // Construire le message WhatsApp
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
      message: 'Mot de passe réinitialisé avec succès',
      newMotDePasse,
      whatsappUrl: waUrl,
    });
  } catch (error) {
    console.error('❌ Erreur resetPassword:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};