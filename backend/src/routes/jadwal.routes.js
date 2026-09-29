const express = require('express');
const router = express.Router();

const { authenticate, adminAndPengurus, adminOnly } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const {
  createJadwalRules,
  updateJadwalRules,
} = require('../validators/jadwal.validator');
const {
  getAllJadwal,
  getJadwalToday,
  getJadwalById,
  createJadwal,
  bulkCreateJadwal,
  updateJadwal,
  deleteJadwal,
} = require('../controllers/jadwal.controller');

/**
 * @route  GET /api/jadwal?tanggal=|bulan=YYYY-MM&kota=
 * @access Private
 */
router.get('/', authenticate, getAllJadwal);

/**
 * @route  GET /api/jadwal/today?kota=
 * @access Private
 */
router.get('/today', authenticate, getJadwalToday);

/**
 * @route  GET /api/jadwal/:id
 * @access Private
 */
router.get('/:id', authenticate, getJadwalById);

/**
 * @route  POST /api/jadwal
 * @access Admin, Pengurus
 */
router.post('/', authenticate, adminAndPengurus, createJadwalRules, validate, createJadwal);

/**
 * @route  POST /api/jadwal/bulk
 * @desc   Input jadwal banyak sekaligus (mis. 1 bulan)
 * @access Admin, Pengurus
 */
router.post('/bulk', authenticate, adminAndPengurus, bulkCreateJadwal);

/**
 * @route  PUT /api/jadwal/:id
 * @access Admin, Pengurus
 */
router.put('/:id', authenticate, adminAndPengurus, updateJadwalRules, validate, updateJadwal);

/**
 * @route  DELETE /api/jadwal/:id
 * @access Admin
 */
router.delete('/:id', authenticate, adminOnly, deleteJadwal);

module.exports = router;
