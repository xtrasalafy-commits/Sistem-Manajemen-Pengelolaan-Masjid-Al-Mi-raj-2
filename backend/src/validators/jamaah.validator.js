const { body } = require('express-validator');

const createJamaahRules = [
  body('nama').trim().notEmpty().withMessage('Nama wajib diisi').isLength({ max: 255 }),
  body('nik')
    .optional()
    .trim()
    .matches(/^[0-9]{16}$/)
    .withMessage('NIK harus 16 digit angka'),
  body('jenisKelamin')
    .optional()
    .isIn(['laki-laki', 'perempuan'])
    .withMessage('Jenis kelamin tidak valid'),
  body('tempatLahir').optional().trim(),
  body('tanggalLahir').optional().isISO8601().withMessage('Tanggal lahir tidak valid').toDate(),
  body('telepon')
    .optional()
    .trim()
    .matches(/^[0-9+\-\s]{8,20}$/)
    .withMessage('Telepon tidak valid'),
  body('email').optional().trim().isEmail().withMessage('Email tidak valid').normalizeEmail(),
  body('alamat').optional().trim(),
  body('pekerjaan').optional().trim(),
  body('statusPernikahan')
    .optional()
    .isIn(['belum_menikah', 'menikah', 'janda', 'duda'])
    .withMessage('Status pernikahan tidak valid'),
  body('tanggalBergabung')
    .optional()
    .isISO8601()
    .withMessage('Tanggal bergabung tidak valid')
    .toDate(),
  body('status').optional().isIn(['aktif', 'nonaktif']).withMessage('Status tidak valid'),
];

// Update = semua field optional (partial update)
const updateJamaahRules = [
  body('nama').optional().trim().notEmpty().isLength({ max: 255 }),
  body('nik')
    .optional()
    .trim()
    .matches(/^[0-9]{16}$/)
    .withMessage('NIK harus 16 digit angka'),
  body('jenisKelamin')
    .optional()
    .isIn(['laki-laki', 'perempuan'])
    .withMessage('Jenis kelamin tidak valid'),
  body('tanggalLahir').optional().isISO8601().toDate(),
  body('tanggalBergabung').optional().isISO8601().toDate(),
  body('status').optional().isIn(['aktif', 'nonaktif']),
];

module.exports = { createJamaahRules, updateJamaahRules };
