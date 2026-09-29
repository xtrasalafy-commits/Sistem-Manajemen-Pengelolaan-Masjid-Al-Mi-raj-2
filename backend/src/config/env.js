const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

/**
 * Pusat konfigurasi aplikasi (membaca .env sekali, divalidasi saat startup).
 */
const config = {
  env: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV !== 'production',

  port: parseInt(process.env.PORT, 10) || 5000,

  // Database (Neon)
  databaseUrl: process.env.DATABASE_URL,
  pgSslMode: process.env.PGSSLMODE || 'require',

  // Client URL untuk CORS (bisa banyak, dipisah koma)
  clientUrls: (process.env.CLIENT_URL || 'http://localhost:5173')
    .split(',')
    .map((url) => url.trim())
    .filter(Boolean),

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '2h',
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    cookieName: process.env.COOKIE_NAME || 'masjid_refresh_token',
    cookieSecure: process.env.COOKIE_SECURE === 'true',
  },

  // Upload
  uploadDir: process.env.UPLOAD_DIR || 'uploads',
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 10 * 1024 * 1024,
  useCloudStorage: process.env.USE_CLOUD_STORAGE === 'true',

  // Rate limit
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 300,
  },

  logLevel: process.env.LOG_LEVEL || 'dev',
};

module.exports = config;
