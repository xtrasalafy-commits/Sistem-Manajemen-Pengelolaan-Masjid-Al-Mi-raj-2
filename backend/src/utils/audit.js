const { query } = require('../config/db');
const logger = require('./logger');

/**
 * Catat aksi ke audit_logs (audit trail untuk transaksi & aksi kritis).
 * Aman dipanggil: tidak melempar error jika gagal (hanya log).
 *
 * @param {object} params
 * @param {string} params.userId - ID user pelaku
 * @param {string} params.aksi - CREATE | UPDATE | DELETE | EXPORT | LOGIN | LOGOUT
 * @param {string} params.modul - nama modul/tabel
 * @param {string} [params.recordId] - ID record yang terpengaruh
 * @param {object} [params.detail] - { before, after } atau info tambahan
 * @param {object} [req] - express request (untuk ip & user agent)
 */
const logAudit = async ({ userId, aksi, modul, recordId = null, detail = null }, req = null) => {
  try {
    const ipAddress = req?.ip || req?.socket?.remoteAddress || null;
    const userAgent = req?.get('user-agent') || null;

    await query(
      `INSERT INTO audit_logs (user_id, aksi, modul, record_id, detail, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [userId, aksi, modul, recordId, detail ? JSON.stringify(detail) : null, ipAddress, userAgent]
    );
  } catch (err) {
    // Audit tidak boleh menggagalkan operasi utama
    logger.error(`Gagal menulis audit log: ${err.message}`);
  }
};

module.exports = { logAudit };
