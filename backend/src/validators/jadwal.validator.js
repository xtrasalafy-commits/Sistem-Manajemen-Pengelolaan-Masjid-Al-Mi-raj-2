const { body } = require('express-validator');

const createJadwalRules = [
  body('tanggal').isISO8601().withMessage('Tanggal wajib diisi & valid').toDate(),
  body('sholat')
    .isIn(['subuh', 'dzuhur', 'ashar', 'maghrib', 'isya', 'jumat'])
    .withMessage('Sholat tidak valid'),
  body('waktu').matches(/^([01]\d|2[0-3]):[0-5]\d$/).withMessage('Waktu harus format HH:MM'),
  body('kota').optional().trim().notEmpty(),
  body('imam').optional().trim(),
  body('khotib').optional().trim(),
  body('keterangan').optional().trim(),
];

const updateJadwalRules = [
  body('tanggal').optional().isISO8601().toDate(),
  body('sholat')
    .optional()
    .isIn(['subuh', 'dzuhur', 'ashar', 'maghrib', 'isya', 'jumat'])
    .withMessage('Sholat tidak valid'),
  body('waktu').optional().matches(/^([01]\d|2[0-3]):[0-5]\d$/).withMessage('Waktu harus format HH:MM'),
];

module.exports = { createJadwalRules, updateJadwalRules };
