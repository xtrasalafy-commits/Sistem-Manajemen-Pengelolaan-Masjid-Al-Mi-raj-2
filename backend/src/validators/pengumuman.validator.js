const { body } = require('express-validator');

const PRIORITAS = ['tinggi', 'sedang', 'rendah'];

const createPengumumanRules = [
  body('judul').trim().notEmpty().withMessage('Judul wajib diisi').isLength({ max: 255 }),
  body('isi').trim().notEmpty().withMessage('Isi pengumuman wajib diisi'),
  body('kategori').optional().trim(),
  body('prioritas').optional().isIn(PRIORITAS).withMessage('Prioritas tidak valid'),
  body('tanggalMulai').isISO8601().withMessage('Tanggal mulai wajib diisi & valid').toDate(),
  body('tanggalSelesai').optional().isISO8601().withMessage('Tanggal selesai tidak valid').toDate(),
  body('status').optional().isIn(['aktif', 'nonaktif']),
];

const updatePengumumanRules = [
  body('judul').optional().trim().notEmpty().isLength({ max: 255 }),
  body('isi').optional().trim().notEmpty(),
  body('prioritas').optional().isIn(PRIORITAS),
  body('tanggalMulai').optional().isISO8601().toDate(),
  body('tanggalSelesai').optional().isISO8601().toDate(),
  body('status').optional().isIn(['aktif', 'nonaktif']),
];

module.exports = { createPengumumanRules, updatePengumumanRules, PRIORITAS };
