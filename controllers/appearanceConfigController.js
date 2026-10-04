// Configuration d'apparence générique pour le frontend Flutter.
// La table est créée automatiquement afin que les réglages fonctionnent aussi
// sur une base existante sans migration manuelle préalable.
const db = require('../config/database');

const KEY_RE = /^[a-zA-Z0-9_-]{1,120}$/;

async function ensureTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS appearance_config (
      config_key VARCHAR(120) NOT NULL PRIMARY KEY,
      config_json LONGTEXT NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

function isValidKey(key) {
  return typeof key === 'string' && KEY_RE.test(key);
}

function sendNoCache(res) {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
}

module.exports = {
  getConfig: async (req, res) => {
    const { key } = req.params;

    if (!isValidKey(key)) {
      return res.status(400).json({
        success: false,
        message: 'Clé de configuration invalide'
      });
    }

    try {
      await ensureTable();
      const [rows] = await db.query(
        `SELECT config_json, updated_at
         FROM appearance_config
         WHERE config_key = ?
         LIMIT 1`,
        [key]
      );

      sendNoCache(res);

      if (!rows.length) {
        return res.json({ success: true, data: null });
      }

      let parsed;
      try {
        parsed = JSON.parse(rows[0].config_json);
      } catch (parseError) {
        console.error(`appearance-config JSON invalide pour "${key}":`, parseError);
        return res.status(500).json({
          success: false,
          message: 'Configuration enregistrée invalide'
        });
      }

      return res.json({
        success: true,
        data: parsed,
        updatedAt: rows[0].updated_at
      });
    } catch (err) {
      console.error(`appearance-config GET "${key}" error:`, err);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors du chargement de la configuration d’apparence'
      });
    }
  },

  saveConfig: async (req, res) => {
    const { key } = req.params;
    const config =
      req.body && Object.prototype.hasOwnProperty.call(req.body, 'config')
        ? req.body.config
        : req.body;

    if (!isValidKey(key)) {
      return res.status(400).json({
        success: false,
        message: 'Clé de configuration invalide'
      });
    }

    if (
      config == null ||
      typeof config !== 'object' ||
      Array.isArray(config)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Configuration invalide'
      });
    }

    try {
      const serialized = JSON.stringify(config);

      // Évite d'écrire accidentellement des payloads énormes.
      if (Buffer.byteLength(serialized, 'utf8') > 1024 * 1024) {
        return res.status(413).json({
          success: false,
          message: 'Configuration trop volumineuse'
        });
      }

      await ensureTable();
      await db.query(
        `INSERT INTO appearance_config (config_key, config_json)
         VALUES (?, ?)
         ON DUPLICATE KEY UPDATE
           config_json = VALUES(config_json),
           updated_at = CURRENT_TIMESTAMP`,
        [key, serialized]
      );

      sendNoCache(res);
      return res.json({ success: true, data: config });
    } catch (err) {
      console.error(`appearance-config PUT "${key}" error:`, err);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de l’enregistrement de la configuration d’apparence'
      });
    }
  },

  deleteConfig: async (req, res) => {
    const { key } = req.params;

    if (!isValidKey(key)) {
      return res.status(400).json({
        success: false,
        message: 'Clé de configuration invalide'
      });
    }

    try {
      await ensureTable();
      await db.query(
        'DELETE FROM appearance_config WHERE config_key = ?',
        [key]
      );

      sendNoCache(res);
      return res.json({ success: true });
    } catch (err) {
      console.error(`appearance-config DELETE "${key}" error:`, err);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la réinitialisation de la configuration'
      });
    }
  }
};
