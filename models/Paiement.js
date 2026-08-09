// nafahat_api/models/Paiement.js
const db = require('../config/database');

class Paiement {
  /**
   * Créer un nouveau paiement
   */
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
        statut_paiement, 
        montant_paye, 
        date_paiement,
        url_quittance, 
        numero_quittance, 
        reference_paiement,
        id_paiement_externe, 
        commentaire
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    // ✅ Utiliser db.query au lieu de pool.execute
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
      data.statut_paiement || 'en_attente',
      data.montant_paye,
      data.date_paiement || null,
      data.url_quittance || null,
      data.numero_quittance || null,
      data.reference_paiement || null,
      data.id_paiement_externe || null,
      data.commentaire || null
    ]);
    
    return result.insertId;
  }

  /**
   * Récupérer un paiement par son ID
   */
  static async getById(id) {
    // ✅ Utiliser db.query au lieu de pool.execute
    const [rows] = await db.query(
      'SELECT * FROM paiement WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  }

  /**
   * Récupérer les paiements d'un adhérent
   */
  static async getByAdherent(adherentId) {
    // ✅ Utiliser db.query au lieu de pool.execute
    const [rows] = await db.query(
      'SELECT * FROM paiement WHERE adherent_id = ? ORDER BY created_at DESC',
      [adherentId]
    );
    return rows;
  }

  /**
   * Récupérer les paiements d'une formation
   */
  static async getByFormation(formationId) {
    // ✅ Utiliser db.query au lieu de pool.execute
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

  /**
   * Mettre à jour le statut d'un paiement
   */
  static async updateStatut(id, statut, commentaire = null) {
    const query = `
      UPDATE paiement SET 
        statut_paiement = ?, 
        commentaire = ?,
        updated_at = NOW()
      WHERE id = ?
    `;
    // ✅ Utiliser db.query au lieu de pool.execute
    const [result] = await db.query(query, [statut, commentaire, id]);
    return result.affectedRows > 0;
  }

  /**
   * Mettre à jour avec les informations de paiement (après upload quittance)
   */
  static async updatePaymentInfo(id, datePaiement, urlQuittance, numeroQuittance, referencePaiement = null) {
    const query = `
      UPDATE paiement SET 
        date_paiement = ?, 
        url_quittance = ?, 
        numero_quittance = ?,
        reference_paiement = ?,
        statut_paiement = 'valide',
        updated_at = NOW()
      WHERE id = ?
    `;
    // ✅ Utiliser db.query au lieu de pool.execute
    const [result] = await db.query(query, [
      datePaiement,
      urlQuittance,
      numeroQuittance,
      referencePaiement,
      id
    ]);
    return result.affectedRows > 0;
  }

  /**
   * Mettre à jour la modalité de paiement
   */
  static async updateModalite(id, modalite) {
    const query = `
      UPDATE paiement SET 
        modalite_paiement = ?,
        updated_at = NOW()
      WHERE id = ?
    `;
    // ✅ Utiliser db.query au lieu de pool.execute
    const [result] = await db.query(query, [modalite, id]);
    return result.affectedRows > 0;
  }

  /**
   * Récupérer les paiements par statut
   */
  static async getByStatut(statut, limit = 100) {
    // ✅ Utiliser db.query au lieu de pool.execute
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

  /**
   * Statistiques des paiements
   */
  static async getStats() {
    // ✅ Utiliser db.query au lieu de pool.execute
    const [rows] = await db.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN statut_paiement = 'valide' THEN 1 ELSE 0 END) as valides,
        SUM(CASE WHEN statut_paiement = 'en_attente' THEN 1 ELSE 0 END) as en_attente,
        SUM(CASE WHEN statut_paiement = 'refuse' THEN 1 ELSE 0 END) as refuses,
        SUM(CASE WHEN statut_paiement = 'annule' THEN 1 ELSE 0 END) as annules,
        SUM(CASE WHEN statut_paiement = 'valide' THEN montant_paye ELSE 0 END) as total_montant
      FROM paiement
    `);
    return rows[0];
  }

  /**
   * Générer un numéro de quittance unique
   */
  static generateQuittanceNumber() {
    const prefix = 'Q';
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return prefix + year + month + random;
  }

  /**
   * Vérifier si un paiement existe
   */
  static async exists(id) {
    // ✅ Utiliser db.query au lieu de pool.execute
    const [rows] = await db.query(
      'SELECT COUNT(*) as count FROM paiement WHERE id = ?',
      [id]
    );
    return rows[0].count > 0;
  }

  /**
   * Supprimer un paiement (soft delete - mise à jour statut)
   */
  static async delete(id) {
    return await Paiement.updateStatut(id, 'annule', 'Supprimé par l\'utilisateur');
  }
}

module.exports = Paiement;