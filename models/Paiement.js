// nafahat_api/models/Paiement.js
const db = require('../config/database');

class Paiement {

  // ============================================================
  // ✅ CONFIGURATION DES TYPES DE PAIEMENT PÉRIODIQUE
  // ============================================================
   // ============================================================
  // ✅ CONFIGURATION DES TYPES DE PAIEMENT PÉRIODIQUE
  // ============================================================
  
  /**
   * Retourne la configuration d'un type de paiement
   */
  static getTypeConfig(typePaiement) {
    const configs = {
      'formation': {
        labelFr: 'Paiement complet',
        labelAr: 'دفع كامل',
        isPeriodic: false,
        periods: 1,
      },
      'mois': {
        labelFr: 'Paiement mensuel',
        labelAr: 'دفع شهري',
        isPeriodic: true,
        periods: 1,
        addFn: (date, n = 1) => {
          const d = new Date(date);
          d.setMonth(d.getMonth() + n);
          return d;
        },
      },
      'semaine': {
        labelFr: 'Paiement hebdomadaire',
        labelAr: 'دفع أسبوعي',
        isPeriodic: true,
        periods: 1,
        addFn: (date, n = 1) => {
          const d = new Date(date);
          d.setDate(d.getDate() + (7 * n));
          return d;
        },
      },
      'trimestre': {
        labelFr: 'Paiement trimestriel',
        labelAr: 'دفع ربع سنوي',
        isPeriodic: true,
        periods: 3,
        addFn: (date, n = 1) => {
          const d = new Date(date);
          d.setMonth(d.getMonth() + (3 * n));
          return d;
        },
      },
      'annee': {
        labelFr: 'Paiement annuel',
        labelAr: 'دفع سنوي',
        isPeriodic: true,
        periods: 12,
        addFn: (date, n = 1) => {
          const d = new Date(date);
          d.setFullYear(d.getFullYear() + n);
          return d;
        },
      },
      'seance': {
        labelFr: 'Paiement par séance',
        labelAr: 'دفع بالحصة',
        isPeriodic: true,
        periods: 1,
        addFn: (date, n = 1) => {
          // +7 jours entre les séances par défaut
          const d = new Date(date);
          d.setDate(d.getDate() + (7 * n));
          return d;
        },
      },
      // ✅ NOUVEAU : Paiement par heure
      'heure': {
        labelFr: 'Paiement par heure',
        labelAr: 'دفع بالساعة',
        isPeriodic: true,
        periods: 1,
        addFn: (date, n = 1) => {
          // +1 heure (utile pour calculer la prochaine échéance)
          const d = new Date(date);
          d.setHours(d.getHours() + n);
          return d;
        },
      },
    };
    
    return configs[typePaiement] || configs['formation'];
  }

  /**
   * Vérifie si un type de paiement est valide
   */
  static isValidType(typePaiement) {
    const validTypes = [
      'formation', 'mois', 'semaine', 
      'trimestre', 'annee', 'seance', 'heure'
    ];
    return validTypes.includes(typePaiement);
  }

  /**
   * Retourne tous les types valides
   */
  static getValidTypes() {
    return [
      'formation', 'mois', 'semaine', 
      'trimestre', 'annee', 'seance', 'heure'
    ];
  }

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
        nombre_periodes,
        montant_par_periode,
        montant_restant,
        paiements_effectues,
        date_paiement,
        url_quittance, 
        numero_quittance, 
        reference_paiement,
        id_paiement_externe, 
        commentaire
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      // ✅ Nouveaux champs
      data.nombre_periodes || 1,
      data.montant_par_periode || null,
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
  // ✅ MISE À JOUR AVEC TYPE DE PAIEMENT (GÉNÉRALISÉE)
  // Supporte : formation, mois, semaine, trimestre, annee, seance
  // ============================================================
  
  static async updateModaliteWithType(
    paymentId,
    modalite,
    typePaiement,
    montantAPayer,
    nombrePeriodes,
    montantParPeriode
  ) {
    console.log('🟢 [Paiement.updateModaliteWithType] Appelée avec:', {
      paymentId,
      modalite,
      typePaiement,
      montantAPayer,
      nombrePeriodes,
      montantParPeriode,
    });

    // ✅ Vérifier le type
    if (!Paiement.isValidType(typePaiement)) {
      console.log('❌ [updateModaliteWithType] Type invalide:', typePaiement);
      return false;
    }

    const paiement = await Paiement.getById(paymentId);
    if (!paiement) {
      console.log('❌ [updateModaliteWithType] Paiement introuvable');
      return false;
    }

    const prixTotal = parseFloat(paiement.formation_prix) || 0;
    const config = Paiement.getTypeConfig(typePaiement);
    const isPeriodic = config.isPeriodic;

    let montantEcheance = montantAPayer;
    let montantParPeriodeFinal = montantParPeriode;
    let montantRestant = 0;
    let nombrePeriodesFinal = nombrePeriodes || 1;

    // ✅ Champs de compatibilité (pour anciens paiements "mois")
    let nombreMoisCompat = 1;
    let montantMensuelCompat = null;

    if (isPeriodic) {
      // ✅ Calcul du montant par période
      montantParPeriodeFinal = montantParPeriode || (prixTotal / nombrePeriodesFinal);
      montantEcheance = montantParPeriodeFinal;
      montantRestant = prixTotal - montantEcheance;

      // ✅ Compatibilité : si "mois", remplir aussi nombre_mois/montant_mensuel
      if (typePaiement === 'mois') {
        nombreMoisCompat = nombrePeriodesFinal;
        montantMensuelCompat = montantParPeriodeFinal;
      } else {
        nombreMoisCompat = 1;
        montantMensuelCompat = montantParPeriodeFinal;
      }
    } else {
      // Paiement complet
      montantParPeriodeFinal = null;
      montantEcheance = prixTotal;
      montantRestant = 0;
      nombrePeriodesFinal = 1;
      nombreMoisCompat = 1;
      montantMensuelCompat = null;
    }

    if (montantRestant < 0) montantRestant = 0;

    console.log('📊 [Calcul] Type:', typePaiement, '| Périodique:', isPeriodic);
    console.log('📊 [Calcul] Prix total:', prixTotal);
    console.log('📊 [Calcul] Nombre périodes:', nombrePeriodesFinal);
    console.log('📊 [Calcul] Montant/période:', montantParPeriodeFinal);
    console.log('📊 [Calcul] Échéance:', montantEcheance);
    console.log('📊 [Calcul] Restant:', montantRestant);

    const query = `
      UPDATE paiement SET 
        modalite_paiement = ?,
        type_paiement = ?,
        montant_a_payer = ?,
        montant_paye = ?,
        nombre_mois = ?,
        montant_mensuel = ?,
        nombre_periodes = ?,
        montant_par_periode = ?,
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
      typePaiement,
      montantEcheance,
      isPeriodic ? 0 : prixTotal,
      nombreMoisCompat,
      montantMensuelCompat,
      nombrePeriodesFinal,
      montantParPeriodeFinal,
      montantRestant,
      isPeriodic ? montantEcheance : null,
      isPeriodic ? 1 : 0,
      paymentId,
    ]);

    console.log('🟢 [updateModaliteWithType] Lignes modifiées:', result.affectedRows);
    if (isPeriodic) {
      console.log(`   ⏳ 1ère tranche (${typePaiement}) mise en attente:`, montantEcheance);
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
  // ✅ SOUMETTRE UNE TRANCHE (GÉNÉRALISÉ)
  // ============================================================
  
  static async soumettreTranche(paymentId, montantTranche, quittanceUrl = null) {
    console.log('🟢 [Paiement.soumettreTranche] Appelée:', {
      paymentId, montantTranche, quittanceUrl,
    });

    const paiement = await Paiement.getById(paymentId);
    if (!paiement) {
      return { success: false, message: 'Paiement introuvable' };
    }

    // ✅ Vérifier que c'est un paiement périodique (pas formation)
    const config = Paiement.getTypeConfig(paiement.type_paiement);
    if (!config.isPeriodic) {
      return { success: false, message: 'Ce paiement n\'est pas périodique' };
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
  // ✅ VALIDER UNE TRANCHE (GÉNÉRALISÉ - calcule la prochaine date)
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
    const typePaiement = paiement.type_paiement || 'mois';
    const nombrePeriodes = parseInt(paiement.nombre_periodes) 
      || parseInt(paiement.nombre_mois) 
      || 1;
    const paiementsEffectues = parseInt(paiement.paiements_effectues) || 0;

    const nouveauMontantPaye = montantPayeActuel + montantTranche;
    const nouveauMontantRestant = Math.max(0, prixTotal - nouveauMontantPaye);
    const nouveauPaiementsEffectues = paiementsEffectues + 1;

    // ✅ Calcul de la prochaine date selon le type
    let prochaineDate = null;
    if (nouveauMontantRestant > 0 && nouveauPaiementsEffectues < nombrePeriodes) {
      const config = Paiement.getTypeConfig(typePaiement);
      if (config.isPeriodic && config.addFn) {
        const date = config.addFn(new Date(), 1);
        prochaineDate = date.toISOString().slice(0, 10);
      }
    }

    console.log('📊 [validerTranche] Type:', typePaiement);
    console.log('   - Ancien payé:', montantPayeActuel);
    console.log('   - Tranche validée:', montantTranche);
    console.log('   - Nouveau payé:', nouveauMontantPaye);
    console.log('   - Nouveau restant:', nouveauMontantRestant);
    console.log('   - Effectués:', nouveauPaiementsEffectues, '/', nombrePeriodes);
    console.log('   - Prochaine date:', prochaineDate);

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
        type_paiement: typePaiement,
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
        SUM(CASE WHEN type_paiement = 'semaine' THEN 1 ELSE 0 END) as paiements_hebdo,
        SUM(CASE WHEN type_paiement = 'trimestre' THEN 1 ELSE 0 END) as paiements_trimestriels,
        SUM(CASE WHEN type_paiement = 'annee' THEN 1 ELSE 0 END) as paiements_annuels,
        SUM(CASE WHEN type_paiement = 'seance' THEN 1 ELSE 0 END) as paiements_seances,
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