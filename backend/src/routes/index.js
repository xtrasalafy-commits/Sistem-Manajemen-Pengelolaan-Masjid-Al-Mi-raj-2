const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const jamaahRoutes = require('./jamaah.routes');
const jadwalRoutes = require('./jadwal.routes');
const kegiatanRoutes = require('./kegiatan.routes');
const keuanganRoutes = require('./keuangan.routes');
const inventarisRoutes = require('./inventaris.routes');
const pengumumanRoutes = require('./pengumuman.routes');
const laporanRoutes = require('./laporan.routes');
const notifikasiRoutes = require('./notifikasi.routes');
const fileRoutes = require('./file.routes');
const auditRoutes = require('./audit.routes');
const dashboardRoutes = require('./dashboard.routes');

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/jamaah', jamaahRoutes);
router.use('/jadwal', jadwalRoutes);
router.use('/kegiatan', kegiatanRoutes);
router.use('/keuangan', keuanganRoutes);
router.use('/inventaris', inventarisRoutes);
router.use('/pengumuman', pengumumanRoutes);
router.use('/laporan', laporanRoutes);
router.use('/notifikasi', notifikasiRoutes);
router.use('/files', fileRoutes);
router.use('/audit', auditRoutes);
router.use('/dashboard', dashboardRoutes);

module.exports = router;
