const { body } = require('express-validator');

const createUserRules = [
  body('nama').trim().notEmpty().withMessage('Nama wajib diisi').isLength({ max: 255 }),
  body('email').trim().isEmail().withMessage('Email tidak valid').normalizeEmail(),
  body('password')
    .isStrongPassword({ minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 0 })
    .withMessage('Password minimal 8 karakter (huruf besar, kecil, angka)'),
  body('role').optional().isIn(['admin', 'pengurus', 'jamaah']).withMessage('Role tidak valid'),
  body('telepon').optional().trim().matches(/^[0-9+\-\s]{8,20}$/).withMessage('Telepon tidak valid'),
  body('status').optional().isIn(['aktif', 'nonaktif']).withMessage('Status tidak valid'),
];

const updateUserRules = [
  body('nama').optional().trim().notEmpty().isLength({ max: 255 }),
  body('email').optional().trim().isEmail().withMessage('Email tidak valid').normalizeEmail(),
  body('role').optional().isIn(['admin', 'pengurus', 'jamaah']).withMessage('Role tidak valid'),
  body('telepon').optional().trim().matches(/^[0-9+\-\s]{8,20}$/).withMessage('Telepon tidak valid'),
  body('status').optional().isIn(['aktif', 'nonaktif']).withMessage('Status tidak valid'),
  body('alamat').optional().trim(),
];

module.exports = { createUserRules, updateUserRules };
