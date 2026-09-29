const { body } = require('express-validator');

const JENIS_LAPORAN = ['keuangan', 'jamaah', 'kegiatan', 'inventaris', 'umum'];

const createLaporanRules = [
  body('judul').trim().notEmpty().withMessage('Judul wajib diisi').isLength({ max: 255 }),
  body('jenis').isIn(JENIS_LAPORAN).withMessage('Jenis laporan tidak valid'),
  body('periodeMulai').isISO8601().withMessage('Periode mulai wajib diisi & valid').toDate(),
  body('periodeSelesai')
    .isISO8601()
    .withMessage('Periode selesai wajib diisi & valid')
    .toDate()
    .custom((value, { req }) => {
      if (new Date(value) < new Date(req.body.periodeMulai)) {
        throw new Error('Periode selesai tidak boleh sebelum periode mulai');
      }
      return true;
    }),
  body('ringkasan').optional().trim(),
];

module.exports = { createLaporanRules, JENIS_LAPORAN };
