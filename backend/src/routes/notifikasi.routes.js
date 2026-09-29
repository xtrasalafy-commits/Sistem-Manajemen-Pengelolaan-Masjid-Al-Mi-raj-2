const express = require('express');
const router = express.Router();

const { authenticate, adminOnly } = require('../middlewares/auth');
const {
  getMyNotifikasi,
  markAsRead,
  markAllAsRead,
  broadcastNotifikasi,
} = require('../controllers/notifikasi.controller');

/**
 * @route  GET /api/notifikasi
 * @desc   Notifikasi user + broadcast + jumlah belum dibaca
 * @access Private
 */
router.get('/', authenticate, getMyNotifikasi);

/**
 * @route  PUT /api/notifikasi/read-all
 * @access Private
 */
router.put('/read-all', authenticate, markAllAsRead);

/**
 * @route  PUT /api/notifikasi/:id/read
 * @access Private
 */
router.put('/:id/read', authenticate, markAsRead);

/**
 * @route  POST /api/notifikasi/broadcast
 * @desc   Kirim notifikasi ke seluruh user (atau role tertentu)
 * @access Admin
 */
router.post('/broadcast', authenticate, adminOnly, broadcastNotifikasi);

module.exports = router;
