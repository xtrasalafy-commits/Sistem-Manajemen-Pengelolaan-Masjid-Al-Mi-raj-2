const { body } = require('express-validator');

const KONDISI = ['baik', 'rusak_ringan', 'rusak_berat', 'hilang'];

const createInventarisRules = [
  body('nama').trim().notEmpty().withMessage('Nama wajib diisi').isLength({ max: 255 }),
  body('kode').optional().trim().notEmpty(),
  body('kategori').optional().trim(),
  body('jumlah').optional().isInt({ min: 0 }).withMessage('Jumlah harus >= 0').toInt(),
  body('satuan').optional().trim(),
  body('kondisi').optional().isIn(KONDISI).withMessage('Kondisi tidak valid'),
  body('tanggalBeli').optional().isISO8601().withMessage('Tanggal beli tidak valid').toDate(),
  body('hargaBeli').optional().isFloat({ min: 0 }).toFloat(),
  body('estimasiNilai').optional().isFloat({ min: 0 }).toFloat(),
  body('lokasi').optional().trim(),
  body('sumberDana').optional().trim(),
];

const updateInventarisRules = [
  body('nama').optional().trim().notEmpty().isLength({ max: 255 }),
  body('jumlah').optional().isInt({ min: 0 }).toInt(),
  body('kondisi').optional().isIn(KONDISI),
  body('tanggalBeli').optional().isISO8601().toDate(),
  body('hargaBeli').optional().isFloat({ min: 0 }).toFloat(),
  body('estimasiNilai').optional().isFloat({ min: 0 }).toFloat(),
];

module.exports = { createInventarisRules, updateInventarisRules, KONDISI };
