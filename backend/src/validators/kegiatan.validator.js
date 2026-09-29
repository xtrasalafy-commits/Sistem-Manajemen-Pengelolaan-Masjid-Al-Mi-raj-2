const { body } = require('express-validator');

const KATEGORI_KEGIATAN = ['ibadah', 'pendidikan', 'sosial', 'pemuda', 'perempuan', 'lainnya'];
const STATUS_KEGIATAN = ['direncanakan', 'berlangsung', 'selesai', 'dibatalkan'];

const createKegiatanRules = [
  body('judul').trim().notEmpty().withMessage('Judul wajib diisi').isLength({ max: 255 }),
  body('deskripsi').optional().trim(),
  body('kategori').optional().isIn(KATEGORI_KEGIATAN).withMessage('Kategori tidak valid'),
  body('tanggalMulai').isISO8601().withMessage('Tanggal mulai wajib diisi & valid').toDate(),
  body('tanggalSelesai')
    .optional()
    .isISO8601()
    .withMessage('Tanggal selesai tidak valid')
    .toDate(),
  body('lokasi').optional().trim(),
  body('pic').optional().trim(),
  body('status').optional().isIn(STATUS_KEGIATAN).withMessage('Status tidak valid'),
];

const updateKegiatanRules = [
  body('judul').optional().trim().notEmpty().isLength({ max: 255 }),
  body('kategori').optional().isIn(KATEGORI_KEGIATAN),
  body('tanggalMulai').optional().isISO8601().toDate(),
  body('tanggalSelesai').optional().isISO8601().toDate(),
  body('status').optional().isIn(STATUS_KEGIATAN),
];

module.exports = { createKegiatanRules, updateKegiatanRules, KATEGORI_KEGIATAN, STATUS_KEGIATAN };
