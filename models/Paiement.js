// nafahat_api/models/Paiement.js
const db = require('../config/database');

class Paiement {

  // ============================================================
  // CRÉER UN PAIEMENT
  // ============================================================
  
  static async create(data) {
    const query = `
      INSERT INTO paiement (
        adherent_id, 
        adherent_nom_prenom, 
        adherent_whatsapp,
        formation_id, 
        formation_titre_fr, 
        formation_titre_ar,
        formation_prix, 
        formation_devise, 
        modalite_paiement,
        type_paiement,
        statut_paiement, 
        montant_paye, 
        montant_a_payer,
        nombre_mois,
        montant_mensuel,
        montant_restant,
        paiements_effectues,
        date_paiement,
        url_quittance, 
        numero_quittance, 
        reference_paiement,
        id_paiement_externe, 
        commentaire
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const [result] = await db.query(query, [
      data.adherent_id,
      data.adherent_nom_prenom,
      data.adherent_whatsapp,
      data.formation_id,
      data.formation_titre_fr,
      data.formation_titre_ar,
      data.formation_prix,
      data.formation_devise || 'TND',
      data.modalite_paiement || 'en_attente',
      data.type_paiement || 'formation',
      data.statut_paiement || 'en_attente',
      data.montant_paye || data.formation_prix,
      data.montant_a_payer || data.formation_prix,
      data.nombre_mois || 1,
      data.montant_mensuel || null,
      data.montant_restant || 0,
      data.paiements_effectues || 0,
      data.date_paiement || null,
      data.url_quittance || null,
      data.numero_quittance || null,
      data.reference_paiement || null,
      data.id_paiement_externe || null,
      data.commentaire || null
    ]);
    
    return result.insertId;
  }

  // ============================================================
  // LECTURE
  // ============================================================
  
  static async getById(id) {
    const [rows] = await db.query('SELECT * FROM paiement WHERE id = ?', [id]);
    return rows[0] || null;
  }

  static async getByAdherent(adherentId) {
    const [rows] = await db.query(
      'SELECT * FROM paiement WHERE adherent_id = ? ORDER BY created_at DESC',
      [adherentId]
    );
    return rows;
  }

  static async getByFormation(formationId) {
    const [rows] = await db.query(
      `SELECT p.*, a.nom_prenom as adherent_nom, a.whatsapp as adherent_whatsapp 
       FROM paiement p 
       JOIN adherent a ON p.adherent_id = a.id 
       WHERE p.formation_id = ? 
       ORDER BY p.created_at DESC`,
      [formationId]
    );
    return rows;
  }

  static async getByStatut(statut, limit = 100) {
    const [rows] = await db.query(
      `SELECT p.*, a.nom_prenom as adherent_nom, a.whatsapp as adherent_whatsapp,
              f.titre_fr as formation_titre, f.titre_ar as formation_titre_ar
       FROM paiement p 
       JOIN adherent a ON p.adherent_id = a.id 
       JOIN formation f ON p.formation_id = f.id 
       WHERE p.statut_paiement = ? 
       ORDER BY p.created_at DESC 
       LIMIT ?`,
      [statut, limit]
    );
    return rows;
  }

  // ============================================================
  // MISE À JOUR SIMPLE
  // ============================================================
  
  static async updateStatut(id, statut, commentaire = null) {
    const query = `
      UPDATE paiement SET 
        statut_paiement = ?, 
        commentaire = ?,
        updated_at = NOW()
      WHERE id = ?
    `;
    const [result] = await db.query(query, [statut, commentaire, id]);
    return result.affectedRows > 0;
  }

  static async updatePaymentInfo(id, datePaiement, urlQuittance, numeroQuittance, referencePaiement = null) {
    const query = `
      UPDATE paiement SET 
        date_paiement = ?, 
        url_quittance = ?, 
        numero_quittance = ?,
        reference_paiement = ?,
        updated_at = NOW()
      WHERE id = ?
    `;
    const [result] = await db.query(query, [
      datePaiement,
      urlQuittance,
      numeroQuittance,
      referencePaiement,
      id
    ]);
    return result.affectedRows > 0;
  }

  static async updateModalite(id, modalite) {
    const [result] = await db.query(
      `UPDATE paiement SET modalite_paiement = ?, updated_at = NOW() WHERE id = ?`,
      [modalite, id]
    );
    return result.affectedRows > 0;
  }

  // ============================================================
  // ✅ MISE À JOUR AVEC TYPE DE PAIEMENT (CORRIGÉE)
  // La 1ère tranche est EN ATTENTE de validation admin
  // ============================================================
  
  static async updateModaliteWithType(
    paymentId,
    modalite,
    typePaiement,
    montantAPayer,
    nombreMois,
    montantMensuel
  ) {
    console.log('🟢 [Paiement.updateModaliteWithType] Appelée avec:', {
      paymentId, modalite, typePaiement, montantAPayer, nombreMois, montantMensuel,
    });

    const paiement = await Paiement.getById(paymentId);
    if (!paiement) {
      console.log('❌ [updateModaliteWithType] Paiement introuvable');
      return false;
    }

    const prixTotal = parseFloat(paiement.formation_prix) || 0;
    
    let montantEcheance = montantAPayer;
    let montantMensuelFinal = montantMensuel;
    let montantRestant = 0;
    let nombreMoisFinal = nombreMois || 1;
    let isMensuel = false;

    if (typePaiement === 'mois') {
      // ✅ Paiement mensuel
      isMensuel = true;
      montantMensuelFinal = montantMensuel || (prixTotal / nombreMoisFinal);
      montantEcheance = montantMensuelFinal;
      montantRestant = prixTotal - montantEcheance;
    } else {
      // ✅ Paiement complet
      isMensuel = false;
      montantMensuelFinal = null;
      montantEcheance = prixTotal;
      montantRestant = 0;
      nombreMoisFinal = 1;
    }

    if (montantRestant < 0) montantRestant = 0;

    console.log('📊 [Calcul] Prix total:', prixTotal);
    console.log('📊 [Calcul] Échéance:', montantEcheance);
    console.log('📊 [Calcul] Mensuel:', montantMensuelFinal);
    console.log('📊 [Calcul] Restant:', montantRestant);
    console.log('📊 [Calcul] Type:', isMensuel ? 'MENSUEL' : 'COMPLET');

    // ✅ LOGIQUE CORRIGÉE :
    // - Si MENSUEL : montant_paye = 0, la 1ère tranche va en tranche_en_attente
    // - Si COMPLET : montant_paye = prixTotal (à valider)
    const query = `
      UPDATE paiement SET 
        modalite_paiement = ?,
        type_paiement = ?,
        montant_a_payer = ?,
        montant_paye = ?,
        nombre_mois = ?,
        montant_mensuel = ?,
        montant_restant = ?,
        paiements_effectues = 0,
        tranche_en_attente = ?,
        tranche_numero = ?,
        statut_paiement = 'en_attente',
        updated_at = NOW()
      WHERE id = ?
    `;

    const [result] = await db.query(query, [
      modalite,
      typePaiement || 'formation',
      montantEcheance,
      // ✅ CORRECTION : mensuel → 0, complet → prixTotal
      isMensuel ? 0 : prixTotal,
      nombreMoisFinal,
      montantMensuelFinal,
      montantRestant,
      // ✅ 1ère tranche en attente pour mensuel
      isMensuel ? montantEcheance : null,
      isMensuel ? 1 : 0,
      paymentId,
    ]);

    console.log('🟢 [updateModaliteWithType] Lignes modifiées:', result.affectedRows);
    if (isMensuel) {
      console.log('   ⏳ 1ère tranche mise en attente:', montantEcheance);
    }
    return result.affectedRows > 0;
  }

  static async updateMontantRestant(paymentId, montantPaye) {
    const paiement = await Paiement.getById(paymentId);
    if (!paiement) return false;

    const prixTotal = parseFloat(paiement.formation_prix) || 0;
    const montantRestant = Math.max(0, prixTotal - parseFloat(montantPaye));

    const [result] = await db.query(
      `UPDATE paiement SET montant_restant = ?, updated_at = NOW() WHERE id = ?`,
      [montantRestant, paymentId]
    );
    return result.affectedRows > 0;
  }

  // ============================================================
  // SOUMETTRE UNE TRANCHE (2ème, 3ème, ...)
  // ============================================================
  
  static async soumettreTranche(paymentId, montantTranche, quittanceUrl = null) {
    console.log('🟢 [Paiement.soumettreTranche] Appelée:', {
      paymentId, montantTranche, quittanceUrl,
    });

    const paiement = await Paiement.getById(paymentId);
    if (!paiement) {
      return { success: false, message: 'Paiement introuvable' };
    }

    if (paiement.type_paiement !== 'mois') {
      return { success: false, message: 'Ce paiement n\'est pas mensuel' };
    }

    const montantRestant = parseFloat(paiement.montant_restant) || 0;
    if (montantRestant <= 0) {
      return { success: false, message: 'Toutes les tranches sont déjà payées' };
    }

    const trancheEnAttente = parseFloat(paiement.tranche_en_attente) || 0;
    if (trancheEnAttente > 0) {
      return {
        success: false,
        message: 'Une tranche est déjà en attente de validation',
      };
    }

    const paiementsEffectues = parseInt(paiement.paiements_effectues) || 0;
    const numeroTranche = paiementsEffectues + 1;

    const query = `
      UPDATE paiement SET 
        tranche_en_attente = ?,
        tranche_quittance_url = ?,
        tranche_numero = ?,
        statut_paiement = 'en_attente',
        date_paiement = NOW(),
        updated_at = NOW()
      WHERE id = ?
    `;

    const [result] = await db.query(query, [
      montantTranche,
      quittanceUrl,
      numeroTranche,
      paymentId,
    ]);

    console.log('🟢 [soumettreTranche] Tranche enregistrée:', numeroTranche);

    return {
      success: result.affectedRows > 0,
      data: {
        numero_tranche: numeroTranche,
        montant_tranche: montantTranche,
        statut: 'en_attente',
      },
    };
  }

  // ============================================================
  // ✅ VALIDER UNE TRANCHE (appelée par admin)
  // ============================================================
  
  static async validerTranche(paymentId) {
    console.log('🟢 [Paiement.validerTranche] Appelée:', { paymentId });

    const paiement = await Paiement.getById(paymentId);
    if (!paiement) {
      return { success: false, message: 'Paiement introuvable' };
    }

    const montantTranche = parseFloat(paiement.tranche_en_attente) || 0;
    if (montantTranche <= 0) {
      console.log('⚠️ [validerTranche] Aucune tranche en attente');
      return { success: false, message: 'Aucune tranche en attente' };
    }

    const prixTotal = parseFloat(paiement.formation_prix) || 0;
    const montantPayeActuel = parseFloat(paiement.montant_paye) || 0;
    const nombreMois = parseInt(paiement.nombre_mois) || 1;
    const paiementsEffectues = parseInt(paiement.paiements_effectues) || 0;

    const nouveauMontantPaye = montantPayeActuel + montantTranche;
    const nouveauMontantRestant = Math.max(0, prixTotal - nouveauMontantPaye);
    const nouveauPaiementsEffectues = paiementsEffectues + 1;

    // Prochaine date
    let prochaineDate = null;
    if (nouveauMontantRestant > 0 && nouveauPaiementsEffectues < nombreMois) {
      const date = new Date();
      date.setMonth(date.getMonth() + 1);
      prochaineDate = date.toISOString().slice(0, 10);
    }

    console.log('📊 [validerTranche] Calcul:');
    console.log('   - Ancien payé:', montantPayeActuel);
    console.log('   - Tranche validée:', montantTranche);
    console.log('   - Nouveau payé:', nouveauMontantPaye);
    console.log('   - Nouveau restant:', nouveauMontantRestant);
    console.log('   - Effectués:', nouveauPaiementsEffectues, '/', nombreMois);

    const query = `
      UPDATE paiement SET 
        montant_paye = ?,
        montant_restant = ?,
        paiements_effectues = ?,
        prochain_paiement_date = ?,
        tranche_en_attente = NULL,
        tranche_quittance_url = NULL,
        tranche_numero = 0,
        statut_paiement = 'valide',
        updated_at = NOW()
      WHERE id = ?
    `;

    const [result] = await db.query(query, [
      nouveauMontantPaye,
      nouveauMontantRestant,
      nouveauPaiementsEffectues,
      prochaineDate,
      paymentId,
    ]);

    console.log('🟢 [validerTranche] Tranche validée avec succès');

    return {
      success: result.affectedRows > 0,
      data: {
        montant_paye: nouveauMontantPaye,
        montant_restant: nouveauMontantRestant,
        paiements_effectues: nouveauPaiementsEffectues,
        prochain_paiement_date: prochaineDate,
      },
    };
  }

  // ============================================================
  // REFUSER UNE TRANCHE
  // ============================================================
  
  static async refuserTranche(paymentId, commentaire = null) {
    console.log('🟢 [Paiement.refuserTranche] Appelée:', { paymentId });

    const query = `
      UPDATE paiement SET 
        tranche_en_attente = NULL,
        tranche_quittance_url = NULL,
        tranche_numero = 0,
        statut_paiement = 'refuse',
        commentaire = COALESCE(?, commentaire),
        updated_at = NOW()
      WHERE id = ?
    `;

    const [result] = await db.query(query, [commentaire, paymentId]);

    console.log('🟢 [refuserTranche] Tranche refusée');

    return {
      success: result.affectedRows > 0,
      message: 'Tranche refusée',
    };
  }

  // ============================================================
  // STATISTIQUES
  // ============================================================
  
  static async getStats() {
    const [rows] = await db.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN statut_paiement = 'valide' THEN 1 ELSE 0 END) as valides,
        SUM(CASE WHEN statut_paiement = 'en_attente' THEN 1 ELSE 0 END) as en_attente,
        SUM(CASE WHEN statut_paiement = 'refuse' THEN 1 ELSE 0 END) as refuses,
        SUM(CASE WHEN statut_paiement = 'annule' THEN 1 ELSE 0 END) as annules,
        SUM(CASE WHEN statut_paiement = 'valide' THEN montant_paye ELSE 0 END) as total_montant,
        SUM(CASE WHEN type_paiement = 'mois' THEN 1 ELSE 0 END) as paiements_mensuels,
        SUM(CASE WHEN type_paiement = 'formation' THEN 1 ELSE 0 END) as paiements_complets,
        SUM(montant_restant) as total_restant,
        SUM(CASE WHEN tranche_en_attente IS NOT NULL THEN 1 ELSE 0 END) as tranches_en_attente
      FROM paiement
    `);
    return rows[0];
  }

  // ============================================================
  // UTILITAIRES
  // ============================================================
  
  static generateQuittanceNumber() {
    const prefix = 'Q';
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return prefix + year + month + random;
  }

  static async exists(id) {
    const [rows] = await db.query(
      'SELECT COUNT(*) as count FROM paiement WHERE id = ?',
      [id]
    );
    return rows[0].count > 0;
  }

  static async delete(id) {
    return await Paiement.updateStatut(id, 'annule', 'Supprimé par l\'utilisateur');
  }

  // ============================================================
  // ANCIENNE MÉTHODE : Conserver pour compatibilité
  // ============================================================
  
  static async ajouterTranche(paymentId, montantTranche, datePaiement = null) {
    console.log('⚠️ [Paiement.ajouterTranche] Méthode obsolète, utilisez soumettreTranche');
    return await Paiement.soumettreTranche(paymentId, montantTranche, null);
  }
}

module.exports = Paiement;