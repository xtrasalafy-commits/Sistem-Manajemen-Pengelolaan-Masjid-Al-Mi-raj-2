const path = require('path');
const fs = require('fs');
const multer = require('multer');
const config = require('../config/env');
const ApiError = require('../utils/ApiError');

const UPLOAD_BASE = path.isAbsolute(config.uploadDir)
  ? config.uploadDir
  : path.join(process.cwd(), config.uploadDir);

// Pastikan folder upload ada (development/local only)
if (!config.useCloudStorage && !fs.existsSync(UPLOAD_BASE)) {
  fs.mkdirSync(UPLOAD_BASE, { recursive: true });
}

// Ekstensi & MIME yang diizinkan
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.doc', '.docx', '.xls', '.xlsx'];
const ALLOWED_MIME = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf',
  'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

const sanitizeFileName = (name) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9.\-]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 100);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_BASE);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const nama = sanitizeFileName(path.basename(file.originalname, ext));
    const finalName = `${nama}-${unique}${ext}`;
    req.uploadedFile = {
      originalname: file.originalname,
      filename: finalName,
      mimetype: file.mimetype,
      size: file.size,
      path: path.join(UPLOAD_BASE, finalName),
    };
    cb(null, finalName);
  },
});

const fileFilter = (_req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext) || !ALLOWED_MIME.includes(file.mimetype)) {
    return cb(ApiError.badRequest(`Tipe file tidak diizinkan: ${ext}`));
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: config.maxFileSize },
});

module.exports = { upload, UPLOAD_BASE, ALLOWED_EXTENSIONS, ALLOWED_MIME };
