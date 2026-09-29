const rateLimit = require('express-rate-limit');
const config = require('../config/env');

/** Rate limiter global untuk seluruh API. */
const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'fail',
    message: 'Terlalu banyak permintaan. Silakan coba lagi beberapa saat lagi.',
  },
  // Key per IP + user (jika terautentikasi)
  keyGenerator: (req) => (req.user?.id ? `${req.ip}:${req.user.id}` : req.ip),
});

/** Rate limiter khusus auth (mencegah brute force login/register). */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 10, // maks 10 percobaan per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'fail',
    message: 'Terlalu banyak percobaan autentikasi. Coba lagi dalam 15 menit.',
  },
});

module.exports = { apiLimiter, authLimiter };
