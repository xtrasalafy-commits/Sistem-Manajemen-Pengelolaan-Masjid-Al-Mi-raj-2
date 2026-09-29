const express = require('express');
const router = express.Router();

const { authenticate, adminAndPengurus, adminOnly } = require('../middlewares/auth');
const {
  uploadFile,
  getAllFiles,
  getFile,
  deleteFile,
} = require('../controllers/file.controller');

/**
 * @route  POST /api/files/upload
 * @desc   Upload file (multipart/form-data: file, kategori?, referenceId?)
 * @access Admin, Pengurus
 */
router.post('/upload', authenticate, adminAndPengurus, uploadFile);

/**
 * @route  GET /api/files
 * @desc   Daftar file (filter kategori, search)
 * @access Private
 */
router.get('/', authenticate, getAllFiles);

/**
 * @route  GET /api/files/:namaFile
 * @desc   Akses/download file
 * @access Public (di production dapat dibatasi via signed URL / middleware)
 */
router.get('/:namaFile', getFile);

/**
 * @route  DELETE /api/files/:id
 * @access Admin
 */
router.delete('/:id', authenticate, adminOnly, deleteFile);

module.exports = router;
