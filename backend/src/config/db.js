const { Pool } = require('pg');
const config = require('./env');

if (!config.databaseUrl) {
  // eslint-disable-next-line no-console
  console.error('❌ DATABASE_URL belum diset! Salin backend/.env.example -> backend/.env dan isi connection string Neon.');
  process.exit(1);
}

/**
 * Pool koneksi PostgreSQL untuk Neon.
 * Neon memerlukan SSL + connection pooling (gunakan connection string "-pooler").
 */
const pool = new Pool({
  connectionString: config.databaseUrl,
  ssl:
    config.databaseUrl.includes('localhost') || config.databaseUrl.includes('127.0.0.1')
      ? false
      : { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => {
  console.error('🔥 Unexpected error on idle PG client:', err.message);
});

/**
 * Helper query dengan parameterized statements (mencegah SQL injection).
 * @param {string} text - SQL dengan placeholder $1, $2, ...
 * @param {Array} params - nilai parameter
 * @returns {Promise<pg.QueryResult>}
 */
const query = async (text, params = []) => {
  const client = await pool.connect();
  try {
    return await client.query(text, params);
  } finally {
    client.release();
  }
};

/**
 * Helper transaksi: BEGIN/COMMIT/ROLLBACK otomatis.
 * @param {(client: pg.PoolClient) => Promise<any>} fn
 */
const transaction = async (fn) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/** Cek koneksi DB (dipanggil saat startup). */
const testConnection = async () => {
  const res = await query('SELECT NOW() as now');
  return res.rows[0];
};

module.exports = { pool, query, transaction, testConnection };
