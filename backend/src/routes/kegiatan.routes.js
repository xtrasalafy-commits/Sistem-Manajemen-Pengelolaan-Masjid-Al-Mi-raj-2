const express = require('express');
const router = express.Router();

const { authenticate, adminAndPengurus, adminOnly } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { parsePagination, paginationRules } = require('../middlewares/pagination');
const {
  createKegiatanRules,
  updateKegiatanRules,
} = require('../validators/kegiatan.validator');
const {
  getAllKegiatan,
  getKegiatanCalendar,
  getKegiatanBerlangsung,
  getKegiatanById,
  createKegiatan,
  updateKegiatan,
  deleteKegiatan,
} = require('../controllers/kegiatan.controller');

/**
 * @route  GET /api/kegiatan
 * @access Private
 */
router.get('/', authenticate, paginationRules, validate, parsePagination, getAllKegiatan);

/**
 * @route  GET /api/kegiatan/calendar?bulan=YYYY-MM
 * @access Private
 */
router.get('/calendar', authenticate, getKegiatanCalendar);

/**
 * @route  GET /api/kegiatan/berlangsung
 * @access Private
 */
router.get('/berlangsung', authenticate, getKegiatanBerlangsung);

/**
 * @route  GET /api/kegiatan/:id
 * @access Private
 */
router.get('/:id', authenticate, getKegiatanById);

/**
 * @route  POST /api/kegiatan
 * @access Admin, Pengurus
 */
router.post('/', authenticate, adminAndPengurus, createKegiatanRules, validate, createKegiatan);

/**
 * @route  PUT /api/kegiatan/:id
 * @access Admin, Pengurus
 */
router.put('/:id', authenticate, adminAndPengurus, updateKegiatanRules, validate, updateKegiatan);

/**
 * @route  DELETE /api/kegiatan/:id
 * @access Admin
 */
router.delete('/:id', authenticate, adminOnly, deleteKegiatan);

module.exports = router;
