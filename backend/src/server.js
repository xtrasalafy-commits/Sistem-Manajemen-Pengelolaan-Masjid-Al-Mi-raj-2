const app = require('./app');
const config = require('./config/env');
const { testConnection, pool } = require('./config/db');
const logger = require('./utils/logger');

const start = async () => {
  try {
    // 1. Cek koneksi database Neon
    const dbInfo = await testConnection();
    logger.info(`✅ Database Neon terhubung: ${dbInfo.now}`);

    // 2. Mulai server Express
    const server = app.listen(config.port, () => {
      logger.info(`🚀 Server berjalan di http://localhost:${config.port} (${config.env})`);
      logger.info(`📡 API base URL: http://localhost:${config.port}/api`);
      logger.info(`🌐 Client URL(s): ${config.clientUrls.join(', ')}`);
    });

    // 3. Graceful shutdown
    const shutdown = (signal) => {
      logger.info(`\n${signal} diterima. Menutup server...`);
      server.close(async () => {
        logger.info('HTTP server ditutup.');
        await pool.end();
        logger.info('Pool database ditutup.');
        process.exit(0);
      });

      // Force exit setelah 10s jika masih ada koneksi menggantung
      setTimeout(() => {
        logger.error('Force shutdown setelah 10 detik.');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('unhandledRejection', (err) => {
      logger.error('Unhandled rejection:', err);
    });
    process.on('uncaughtException', (err) => {
      logger.error('Uncaught exception:', err);
      process.exit(1);
    });
  } catch (err) {
    logger.error('❌ Gagal memulai server:', err.message);
    process.exit(1);
  }
};

start();
