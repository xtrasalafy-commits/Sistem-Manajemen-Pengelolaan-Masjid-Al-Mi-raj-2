const express = require('express');
const router = express.Router();

const { authenticate, adminAndPengurus, adminOnly } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { parsePagination, paginationRules } = require('../middlewares/pagination');
const {
  createJamaahRules,
  updateJamaahRules,
} = require('../validators/jamaah.validator');
const {
  getAllJamaah,
  getJamaahById,
  createJamaah,
  updateJamaah,
  deleteJamaah,
  getStatistikJamaah,
} = require('../controllers/jamaah.controller');

/**
 * @route  GET /api/jamaah
 * @desc   Daftar jamaah (search, filter, pagination)
 * @access Private (semua role terautentikasi)
 */
router.get('/', authenticate, paginationRules, validate, parsePagination, getAllJamaah);

/**
 * @route  GET /api/jamaah/statistik
 * @access Private
 */
router.get('/statistik', authenticate, getStatistikJamaah);

/**
 * @route  GET /api/jamaah/:id
 * @access Private
 */
router.get('/:id', authenticate, getJamaahById);

/**
 * @route  POST /api/jamaah
 * @access Admin, Pengurus
 */
router.post('/', authenticate, adminAndPengurus, createJamaahRules, validate, createJamaah);

/**
 * @route  PUT /api/jamaah/:id
 * @access Admin, Pengurus
 */
router.put('/:id', authenticate, adminAndPengurus, updateJamaahRules, validate, updateJamaah);

/**
 * @route  DELETE /api/jamaah/:id
 * @access Admin
 */
router.delete('/:id', authenticate, adminOnly, deleteJamaah);

module.exports = router;
