const express = require('express');
const router = express.Router();

const { authenticate, adminAndPengurus, adminOnly } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { parsePagination, paginationRules } = require('../middlewares/pagination');
const {
  createKeuanganRules,
  updateKeuanganRules,
  createDonasiRules,
} = require('../validators/keuangan.validator');
const {
  getAllKeuangan,
  getStatistikKeuangan,
  createKeuangan,
  updateKeuangan,
  deleteKeuangan,
  exportKeuangan,
  getAllDonasi,
  createDonasi,
  deleteDonasi,
} = require('../controllers/keuangan.controller');

/**
 * @route  GET /api/keuangan
 * @desc   List transaksi + ringkasan (filter jenis/kategori/periode, pagination)
 * @access Private
 */
router.get('/', authenticate, paginationRules, validate, parsePagination, getAllKeuangan);

/**
 * @route  GET /api/keuangan/statistik?tahun=
 * @access Private
 */
router.get('/statistik', authenticate, getStatistikKeuangan);

/**
 * @route  GET /api/keuangan/export?format=xlsx|pdf
 * @access Admin, Pengurus
 */
router.get('/export', authenticate, adminAndPengurus, exportKeuangan);

/**
 * @route  GET /api/keuangan/donasi
 * @access Private
 */
router.get('/donasi', authenticate, paginationRules, validate, parsePagination, getAllDonasi);

/**
 * @route  POST /api/keuangan/donasi
 * @desc   Catat donasi sekaligus membentuk transaksi "masuk"
 * @access Admin, Pengurus
 */
router.post('/donasi', authenticate, adminAndPengurus, createDonasiRules, validate, createDonasi);

/**
 * @route  DELETE /api/keuangan/donasi/:id
 * @access Admin
 */
router.delete('/donasi/:id', authenticate, adminOnly, deleteDonasi);

/**
 * @route  POST /api/keuangan
 * @access Admin, Pengurus
 */
router.post('/', authenticate, adminAndPengurus, createKeuanganRules, validate, createKeuangan);

/**
 * @route  PUT /api/keuangan/:id
 * @access Admin, Pengurus
 */
router.put('/:id', authenticate, adminAndPengurus, updateKeuanganRules, validate, updateKeuangan);

/**
 * @route  DELETE /api/keuangan/:id
 * @access Admin
 */
router.delete('/:id', authenticate, adminOnly, deleteKeuangan);

module.exports = router;
