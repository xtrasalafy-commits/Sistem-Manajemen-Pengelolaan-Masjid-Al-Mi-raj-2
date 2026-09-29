const { body } = require('express-validator');

const JENIS_TRANSAKSI = ['masuk', 'keluar'];

const createKeuanganRules = [
  body('jenis').isIn(JENIS_TRANSAKSI).withMessage('Jenis harus "masuk" atau "keluar"'),
  body('kategori').trim().notEmpty().withMessage('Kategori wajib diisi'),
  body('jumlah')
    .isFloat({ gt: 0 })
    .withMessage('Jumlah harus angka > 0')
    .toFloat(),
  body('tanggal').isISO8601().withMessage('Tanggal wajib diisi & valid').toDate(),
  body('keterangan').optional().trim(),
  body('metode').optional().trim(),
];

const updateKeuanganRules = [
  body('jenis').optional().isIn(JENIS_TRANSAKSI),
  body('kategori').optional().trim().notEmpty(),
  body('jumlah').optional().isFloat({ gt: 0 }).toFloat(),
  body('tanggal').optional().isISO8601().toDate(),
];

const createDonasiRules = [
  body('namaDonatur').trim().notEmpty().withMessage('Nama donatur wajib diisi'),
  body('jamaahId').optional().isUUID().withMessage('ID jamaah tidak valid'),
  body('jumlah').isFloat({ gt: 0 }).withMessage('Jumlah harus angka > 0').toFloat(),
  body('tanggal').isISO8601().withMessage('Tanggal wajib diisi & valid').toDate(),
  body('metode').optional().trim(),
  body('tujuan').optional().trim(),
];

module.exports = { createKeuanganRules, updateKeuanganRules, createDonasiRules, JENIS_TRANSAKSI };
