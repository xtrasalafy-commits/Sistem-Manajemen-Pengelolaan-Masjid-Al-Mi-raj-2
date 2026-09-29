const path = require('path');
const fs = require('fs');
const { query } = require('../config/db');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { upload, UPLOAD_BASE } = require('../middlewares/upload');
const { logAudit } = require('../utils/audit');
const config = require('../config/env');

// Middleware multer (single file, field "file")
const uploadSingle = upload.single('file');

/**
 * POST /api/files/upload  (multipart/form-data)
 * Form-data: file=..., kategori=..., referenceId=...
 */
const uploadFile = asyncHandler(async (req, res) => {
  await new Promise((resolve, reject) => {
    uploadSingle(req, res, (err) => (err ? reject(err) : resolve()));
  });

  if (!req.file) {
    throw ApiError.badRequest('File wajib diupload');
  }

  const { kategori = 'dokumen', referenceId } = req.body;
  const url = `${req.protocol}://${req.get('host')}/api/files/${req.file.filename}`;

  const { rows } = await query(
    `INSERT INTO files (nama_file, original_name, path, url, mime_type, size, kategori, reference_id, uploaded_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [
      req.file.filename,
      req.file.originalname,
      req.file.path,
      url,
      req.file.mimetype,
      req.file.size,
      kategori,
      referenceId || null,
      req.user.id,
    ]
  );

  await logAudit({ userId: req.user.id, aksi: 'CREATE', modul: 'files', recordId: rows[0].id, detail: { nama: req.file.filename, size: req.file.size } }, req);

  res.status(201).json({
    status: 'success',
    message: 'File berhasil diupload',
    data: { file: rows[0] },
  });
});

/**
 * GET /api/files  - registry file (filter kategori, search)
 */
const getAllFiles = asyncHandler(async (req, res) => {
  const { kategori, search } = req.query;
  const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);

  const conditions = [];
  const params = [];
  let idx = 1;
  if (kategori) {
    conditions.push(`kategori = $${idx++}`);
    params.push(kategori);
  }
  if (search) {
    conditions.push(`original_name ILIKE $${idx++}`);
    params.push(`%${search}%`);
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const { rows } = await query(
    `SELECT id, nama_file, original_name, url, mime_type, size, kategori, reference_id, created_at
     FROM files ${where}
     ORDER BY created_at DESC
     LIMIT $${idx}`,
    [...params, limit]
  );

  res.status(200).json({ status: 'success', data: { files: rows } });
});

/**
 * GET /api/files/:namaFile  - download / akses file (publik terbatas via token? di sini cukup statis)
 */
const getFile = asyncHandler(async (req, res) => {
  const { namaFile } = req.params;

  // Cegah path traversal
  if (namaFile.includes('..') || namaFile.includes('/') || namaFile.includes('\\')) {
    throw ApiError.badRequest('Nama file tidak valid');
  }

  const filePath = path.join(UPLOAD_BASE, path.basename(namaFile));

  if (!fs.existsSync(filePath)) {
    throw ApiError.notFound('File tidak ditemukan');
  }

  res.sendFile(filePath, (err) => {
    if (err && !res.headersSent) {
      throw ApiError.internal('Gagal mengirim file');
    }
  });
});

/**
 * DELETE /api/files/:id
 */
const deleteFile = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rows } = await query('SELECT id, nama_file, original_name, path FROM files WHERE id = $1', [id]);
  if (rows.length === 0) throw ApiError.notFound('File tidak ditemukan');

  const file = rows[0];
  if (fs.existsSync(file.path)) {
    try {
      fs.unlinkSync(file.path);
    } catch {
      // file hilang di disk tidak menggagalkan hapus record
    }
  }

  await query('DELETE FROM files WHERE id = $1', [id]);
  await logAudit({ userId: req.user.id, aksi: 'DELETE', modul: 'files', recordId: id, detail: { deleted: file.original_name } }, req);

  res.status(200).json({ status: 'success', message: 'File dihapus' });
});

module.exports = { uploadFile, getAllFiles, getFile, deleteFile };
