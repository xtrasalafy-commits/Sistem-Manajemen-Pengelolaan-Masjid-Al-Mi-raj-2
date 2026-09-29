const express = require('express');
const router = express.Router();

const { authenticate } = require('../middlewares/auth');
const { getDashboardStats } = require('../controllers/dashboard.controller');

/**
 * @route  GET /api/dashboard
 * @desc   Statistik ringkas untuk dashboard admin (semua role bisa lihat)
 * @access Private
 */
router.get('/', authenticate, getDashboardStats);

module.exports = router;
