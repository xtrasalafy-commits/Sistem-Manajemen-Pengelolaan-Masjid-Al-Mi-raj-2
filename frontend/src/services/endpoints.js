/**
 * Kumpulan semua endpoint API (fungsi thin-wrapper di atas axios instance).
 */
import api from './api';

// ===========================================================================
// AUTH
// ===========================================================================
export const authApi = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  logout: () => api.post('/auth/logout', {}),
  refresh: () => api.post('/auth/refresh', {}),
  me: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/me', data),
  changePassword: (data) => api.put('/auth/change-password', data),
};

// ===========================================================================
// USERS (admin)
// ===========================================================================
export const userApi = {
  getAll: (params = {}) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  remove: (id) => api.delete(`/users/${id}`),
};

// ===========================================================================
// DASHBOARD
// ===========================================================================
export const dashboardApi = {
  getStats: () => api.get('/dashboard'),
};

// ===========================================================================
// JAMAAH
// ===========================================================================
export const jamaahApi = {
  getAll: (params = {}) => api.get('/jamaah', { params }),
  getById: (id) => api.get(`/jamaah/${id}`),
  create: (data) => api.post('/jamaah', data),
  update: (id, data) => api.put(`/jamaah/${id}`, data),
  remove: (id) => api.delete(`/jamaah/${id}`),
  getStatistik: () => api.get('/jamaah/statistik'),
};

// ===========================================================================
// JADWAL SHOLAT
// ===========================================================================
export const jadwalApi = {
  getAll: (params = {}) => api.get('/jadwal', { params }),
  getToday: (kota) => api.get('/jadwal/today', { params: { kota } }),
  getById: (id) => api.get(`/jadwal/${id}`),
  create: (data) => api.post('/jadwal', data),
  bulkCreate: (data) => api.post('/jadwal/bulk', data),
  update: (id, data) => api.put(`/jadwal/${id}`, data),
  remove: (id) => api.delete(`/jadwal/${id}`),
};

// ===========================================================================
// KEGIATAN
// ===========================================================================
export const kegiatanApi = {
  getAll: (params = {}) => api.get('/kegiatan', { params }),
  getCalendar: (bulan) => api.get('/kegiatan/calendar', { params: { bulan } }),
  getBerlangsung: () => api.get('/kegiatan/berlangsung'),
  getById: (id) => api.get(`/kegiatan/${id}`),
  create: (data) => api.post('/kegiatan', data),
  update: (id, data) => api.put(`/kegiatan/${id}`, data),
  remove: (id) => api.delete(`/kegiatan/${id}`),
};

// ===========================================================================
// KEUANGAN
// ===========================================================================
export const keuanganApi = {
  getAll: (params = {}) => api.get('/keuangan', { params }),
  getStatistik: (tahun) => api.get('/keuangan/statistik', { params: { tahun } }),
  create: (data) => api.post('/keuangan', data),
  update: (id, data) => api.put(`/keuangan/${id}`, data),
  remove: (id) => api.delete(`/keuangan/${id}`),
  export: (params) => api.get('/keuangan/export', { params, responseType: 'blob' }),
  // Donasi
  getDonasi: (params = {}) => api.get('/keuangan/donasi', { params }),
  createDonasi: (data) => api.post('/keuangan/donasi', data),
  removeDonasi: (id) => api.delete(`/keuangan/donasi/${id}`),
};

// ===========================================================================
// INVENTARIS
// ===========================================================================
export const inventarisApi = {
  getAll: (params = {}) => api.get('/inventaris', { params }),
  getById: (id) => api.get(`/inventaris/${id}`),
  create: (data) => api.post('/inventaris', data),
  update: (id, data) => api.put(`/inventaris/${id}`, data),
  remove: (id) => api.delete(`/inventaris/${id}`),
  getStatistik: () => api.get('/inventaris/statistik'),
};

// ===========================================================================
// PENGUMUMAN
// ===========================================================================
export const pengumumanApi = {
  getAll: (params = {}) => api.get('/pengumuman', { params }),
  getAktif: (limit) => api.get('/pengumuman/aktif', { params: { limit } }),
  getById: (id) => api.get(`/pengumuman/${id}`),
  create: (data) => api.post('/pengumuman', data),
  update: (id, data) => api.put(`/pengumuman/${id}`, data),
  remove: (id) => api.delete(`/pengumuman/${id}`),
};

// ===========================================================================
// LAPORAN
// ===========================================================================
export const laporanApi = {
  getAll: (params = {}) => api.get('/laporan', { params }),
  getById: (id) => api.get(`/laporan/${id}`),
  create: (data) => api.post('/laporan', data),
  remove: (id) => api.delete(`/laporan/${id}`),
  generate: (data) =>
    api.post('/laporan/generate', data, { responseType: 'blob', _silent: true }),
};

// ===========================================================================
// NOTIFIKASI
// ===========================================================================
export const notifikasiApi = {
  getMine: (limit) => api.get('/notifikasi', { params: { limit } }),
  markRead: (id) => api.put(`/notifikasi/${id}/read`),
  markAllRead: () => api.put('/notifikasi/read-all'),
  broadcast: (data) => api.post('/notifikasi/broadcast', data),
};

// ===========================================================================
// FILES
// ===========================================================================
export const fileApi = {
  getAll: (params = {}) => api.get('/files', { params }),
  upload: (formData, onProgress) =>
    api.post('/files/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: onProgress,
    }),
  remove: (id) => api.delete(`/files/${id}`),
};

// ===========================================================================
// AUDIT (admin)
// ===========================================================================
export const auditApi = {
  getAll: (params = {}) => api.get('/audit', { params }),
  getModulList: () => api.get('/audit/modul'),
};

/**
 * Helper: download file blob dari response API.
 */
export const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(new Blob([blob]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => window.URL.revokeObjectURL(url), 1000);
};
