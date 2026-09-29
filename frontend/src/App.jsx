import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import MainLayout from './components/layout/MainLayout';
import ProtectedRoute, { AdminRoute, PengurusRoute } from './components/common/ProtectedRoute';
import { LoadingPage } from './components/ui/Loading';

// Lazy load halaman agar initial bundle kecil
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const DashboardPage = lazy(() => import('./pages/dashboard/DashboardPage'));
const JamaahPage = lazy(() => import('./pages/jamaah/JamaahPage'));
const JadwalSholatPage = lazy(() => import('./pages/jadwal/JadwalSholatPage'));
const KegiatanPage = lazy(() => import('./pages/kegiatan/KegiatanPage'));
const KeuanganPage = lazy(() => import('./pages/keuangan/KeuanganPage'));
const InventarisPage = lazy(() => import('./pages/inventaris/InventarisPage'));
const PengumumanPage = lazy(() => import('./pages/pengumuman/PengumumanPage'));
const LaporanPage = lazy(() => import('./pages/laporan/LaporanPage'));
const AuditPage = lazy(() => import('./pages/audit/AuditPage'));
const ManajemenUserPage = lazy(() => import('./pages/manajemen-user/ManajemenUserPage'));
const ProfilPage = lazy(() => import('./pages/profil/ProfilPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

const App = () => (
  <Suspense fallback={<LoadingPage />}>
    <Routes>
      {/* Public */}
      <Route
        path="/login"
        element={
          <ProtectedRoute requireAuth={false}>
            <LoginPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/register"
        element={
          <ProtectedRoute requireAuth={false}>
            <RegisterPage />
          </ProtectedRoute>
        }
      />

      {/* Protected (butuh login) */}
      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="jamaah" element={<PengurusRoute><JamaahPage /></PengurusRoute>} />
        <Route path="jadwal-sholat" element={<JadwalSholatPage />} />
        <Route path="kegiatan" element={<KegiatanPage />} />
        <Route path="keuangan" element={<PengurusRoute><KeuanganPage /></PengurusRoute>} />
        <Route path="inventaris" element={<PengurusRoute><InventarisPage /></PengurusRoute>} />
        <Route path="pengumuman" element={<PengumumanPage />} />
        <Route path="laporan" element={<PengurusRoute><LaporanPage /></PengurusRoute>} />
        <Route path="audit" element={<AdminRoute><AuditPage /></AdminRoute>} />
        <Route path="manajemen-user" element={<AdminRoute><ManajemenUserPage /></AdminRoute>} />
        <Route path="profil" element={<ProfilPage />} />
      </Route>

      {/* Fallback */}
      <Route path="/404" element={<NotFoundPage />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  </Suspense>
);

export default App;
