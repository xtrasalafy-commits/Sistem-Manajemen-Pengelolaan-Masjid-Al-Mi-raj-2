const express = require('express');
const router = express.Router();

const { authenticate, adminAndPengurus, adminOnly } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { parsePagination, paginationRules } = require('../middlewares/pagination');
const {
  createPengumumanRules,
  updatePengumumanRules,
} = require('../validators/pengumuman.validator');
const {
  getAllPengumuman,
  getPengumumanAktif,
  getPengumumanById,
  createPengumuman,
  updatePengumuman,
  deletePengumuman,
} = require('../controllers/pengumuman.controller');

/**
 * @route  GET /api/pengumuman
 * @access Private
 */
router.get('/', authenticate, paginationRules, validate, parsePagination, getAllPengumuman);

/**
 * @route  GET /api/pengumuman/aktif
 * @desc   Pengumuman yang sedang aktif (untuk dashboard/publik)
 * @access Private
 */
router.get('/aktif', authenticate, getPengumumanAktif);

/**
 * @route  GET /api/pengumuman/:id
 * @access Private
 */
router.get('/:id', authenticate, getPengumumanById);

/**
 * @route  POST /api/pengumuman
 * @access Admin, Pengurus
 */
router.post('/', authenticate, adminAndPengurus, createPengumumanRules, validate, createPengumuman);

/**
 * @route  PUT /api/pengumuman/:id
 * @access Admin, Pengurus
 */
router.put('/:id', authenticate, adminAndPengurus, updatePengumumanRules, validate, updatePengumuman);

/**
 * @route  DELETE /api/pengumuman/:id
 * @access Admin
 */
router.delete('/:id', authenticate, adminOnly, deletePengumuman);

module.exports = router;
