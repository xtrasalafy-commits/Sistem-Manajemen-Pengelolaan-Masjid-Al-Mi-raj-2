const jwt = require('jsonwebtoken');
const config = require('../config/env');
const ApiError = require('./ApiError');

/**
 * Generate access token (short-lived) & refresh token (long-lived).
 */
const generateTokens = (user) => {
  const payload = {
    id: user.id,
    email: user.email,
    nama: user.nama,
    role: user.role,
  };

  const accessToken = jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });

  const refreshToken = jwt.sign({ id: user.id }, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn,
  });

  return { accessToken, refreshToken };
};

/** Verifikasi access token -> lempar ApiError 401 jika tidak valid. */
const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, config.jwt.secret);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw ApiError.unauthorized('Token kadaluarsa, silakan login kembali');
    }
    throw ApiError.unauthorized('Token tidak valid');
  }
};

/** Verifikasi refresh token. */
const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, config.jwt.refreshSecret);
  } catch (err) {
    throw ApiError.unauthorized('Refresh token tidak valid atau kadaluarsa');
  }
};

/** Opsi cookie untuk refresh token (httpOnly + secure + sameSite). */
const cookieOptions = () => ({
  httpOnly: true,
  secure: config.jwt.cookieSecure,
  sameSite: config.isProduction ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 hari
  path: '/api/auth',
});

module.exports = {
  generateTokens,
  verifyAccessToken,
  verifyRefreshToken,
  cookieOptions,
};
