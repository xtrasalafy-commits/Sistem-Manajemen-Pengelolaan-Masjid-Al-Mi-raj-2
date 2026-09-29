const express = require('express');
const router = express.Router();

const { authenticate, adminAndPengurus, adminOnly } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { parsePagination, paginationRules } = require('../middlewares/pagination');
const {
  createInventarisRules,
  updateInventarisRules,
} = require('../validators/inventaris.validator');
const {
  getAllInventaris,
  getInventarisById,
  createInventaris,
  updateInventaris,
  deleteInventaris,
  getStatistikInventaris,
} = require('../controllers/inventaris.controller');

/**
 * @route  GET /api/inventaris
 * @access Private
 */
router.get('/', authenticate, paginationRules, validate, parsePagination, getAllInventaris);

/**
 * @route  GET /api/inventaris/statistik
 * @access Private
 */
router.get('/statistik', authenticate, getStatistikInventaris);

/**
 * @route  GET /api/inventaris/:id
 * @access Private
 */
router.get('/:id', authenticate, getInventarisById);

/**
 * @route  POST /api/inventaris
 * @access Admin, Pengurus
 */
router.post('/', authenticate, adminAndPengurus, createInventarisRules, validate, createInventaris);

/**
 * @route  PUT /api/inventaris/:id
 * @access Admin, Pengurus
 */
router.put('/:id', authenticate, adminAndPengurus, updateInventarisRules, validate, updateInventaris);

/**
 * @route  DELETE /api/inventaris/:id
 * @access Admin
 */
router.delete('/:id', authenticate, adminOnly, deleteInventaris);

module.exports = router;
