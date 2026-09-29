const express = require('express');
const router = express.Router();

const { authenticate, adminAndPengurus, adminOnly } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { parsePagination, paginationRules } = require('../middlewares/pagination');
const { createLaporanRules } = require('../validators/laporan.validator');
const {
  getAllLaporan,
  getLaporanById,
  createLaporan,
  deleteLaporan,
  generateLaporan,
} = require('../controllers/laporan.controller');

/**
 * @route  GET /api/laporan
 * @access Private
 */
router.get('/', authenticate, paginationRules, validate, parsePagination, getAllLaporan);

/**
 * @route  POST /api/laporan/generate
 * @desc   Generate file laporan (xlsx/pdf) berdasarkan jenis & periode
 * @access Admin, Pengurus
 * @body   { jenis, format: 'xlsx'|'pdf', periodeMulai, periodeSelesai, save?: bool, judul?: string }
 */
router.post('/generate', authenticate, adminAndPengurus, generateLaporan);

/**
 * @route  GET /api/laporan/:id
 * @access Private
 */
router.get('/:id', authenticate, getLaporanById);

/**
 * @route  POST /api/laporan
 * @desc   Simpan metadata laporan
 * @access Admin, Pengurus
 */
router.post('/', authenticate, adminAndPengurus, createLaporanRules, validate, createLaporan);

/**
 * @route  DELETE /api/laporan/:id
 * @access Admin
 */
router.delete('/:id', authenticate, adminOnly, deleteLaporan);

module.exports = router;
