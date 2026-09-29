const { body } = require('express-validator');

const registerRules = [
  body('nama').trim().notEmpty().withMessage('Nama wajib diisi').isLength({ max: 255 }),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email wajib diisi')
    .isEmail()
    .withMessage('Format email tidak valid')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password wajib diisi')
    .isStrongPassword({
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 0,
    })
    .withMessage('Password minimal 8 karakter, harus ada huruf besar, huruf kecil & angka'),
  body('role')
    .optional()
    .isIn(['admin', 'pengurus', 'jamaah'])
    .withMessage('Role tidak valid'),
  body('telepon')
    .optional()
    .trim()
    .matches(/^[0-9+\-\s]{8,20}$/)
    .withMessage('Nomor telepon tidak valid'),
];

const loginRules = [
  body('email').trim().notEmpty().withMessage('Email wajib diisi').isEmail().withMessage('Format email tidak valid').normalizeEmail(),
  body('password').notEmpty().withMessage('Password wajib diisi'),
];

const changePasswordRules = [
  body('passwordLama').notEmpty().withMessage('Password lama wajib diisi'),
  body('passwordBaru')
    .notEmpty()
    .withMessage('Password baru wajib diisi')
    .isStrongPassword({
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 0,
    })
    .withMessage('Password baru minimal 8 karakter, harus ada huruf besar, huruf kecil & angka'),
];

const updateProfileRules = [
  body('nama').optional().trim().notEmpty().isLength({ max: 255 }),
  body('telepon')
    .optional()
    .trim()
    .matches(/^[0-9+\-\s]{8,20}$/)
    .withMessage('Nomor telepon tidak valid'),
  body('alamat').optional().trim(),
];

module.exports = {
  registerRules,
  loginRules,
  changePasswordRules,
  updateProfileRules,
};
