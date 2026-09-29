const express = require('express');
const router = express.Router();

const {
  register,
  login,
  logout,
  refresh,
  me,
  updateProfile,
  changePassword,
} = require('../controllers/auth.controller');

const { authenticate } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { authLimiter } = require('../middlewares/rateLimiter');
const {
  registerRules,
  loginRules,
  changePasswordRules,
  updateProfileRules,
} = require('../validators/auth.validator');

/**
 * @route  POST /api/auth/register
 * @desc   Register user baru (role default jamaah; admin bisa tentukan role)
 * @access Public
 */
router.post('/register', authLimiter, registerRules, validate, register);

/**
 * @route  POST /api/auth/login
 * @desc   Login & dapatkan access + refresh token
 * @access Public
 */
router.post('/login', authLimiter, loginRules, validate, login);

/**
 * @route  POST /api/auth/logout
 * @desc   Logout & hapus refresh token
 * @access Public
 */
router.post('/logout', logout);

/**
 * @route  POST /api/auth/refresh
 * @desc   Rotation refresh token -> access token baru
 * @access Public (butuh refresh token di cookie/body)
 */
router.post('/refresh', refresh);

/**
 * @route  GET /api/auth/me
 * @desc   Profil user yang sedang login
 * @access Private
 */
router.get('/me', authenticate, me);

/**
 * @route  PUT /api/auth/me
 * @desc   Update profil sendiri
 * @access Private
 */
router.put('/me', authenticate, updateProfileRules, validate, updateProfile);

/**
 * @route  PUT /api/auth/change-password
 * @desc   Ubah password (butuh password lama)
 * @access Private
 */
router.put('/change-password', authenticate, changePasswordRules, validate, changePassword);

module.exports = router;
