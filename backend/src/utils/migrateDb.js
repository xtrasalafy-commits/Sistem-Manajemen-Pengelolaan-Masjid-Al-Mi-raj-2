const fs = require('fs');
const path = require('path');
const { query, pool } = require('../config/db');
const logger = require('./logger');

const MIGRATIONS_DIR = path.join(__dirname, '../../../database/migrations');

const runMigrations = async () => {
  try {
    logger.info('🔍 Membaca migration files...');

    if (!fs.existsSync(MIGRATIONS_DIR)) {
      logger.error(`Folder migrations tidak ditemukan: ${MIGRATIONS_DIR}`);
      process.exit(1);
    }

    const files = fs
      .readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    if (files.length === 0) {
      logger.warn('Tidak ada file migration.');
      return;
    }

    // Buat tabel tracking migrations bila belum ada
    await query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        filename VARCHAR(255) PRIMARY KEY,
        executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    const { rows: executed } = await query('SELECT filename FROM schema_migrations');
    const executedSet = new Set(executed.map((r) => r.filename));

    for (const file of files) {
      if (executedSet.has(file)) {
        logger.info(`⏭️  Skipped (sudah dijalankan): ${file}`);
        continue;
      }

      const filePath = path.join(MIGRATIONS_DIR, file);
      const sql = fs.readFileSync(filePath, 'utf8');

      logger.info(`▶️  Menjalankan: ${file}`);
      await query(sql);
      await query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file]);
      logger.info(`✅ Selesai: ${file}`);
    }

    logger.info('🎉 Semua migration selesai dijalankan.');
  } catch (err) {
    logger.error('❌ Migration gagal:', err.message);
    console.error(err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
};

runMigrations();
