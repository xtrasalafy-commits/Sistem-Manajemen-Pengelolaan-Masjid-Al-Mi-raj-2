import axios from 'axios';
import toast from 'react-hot-toast';

const AUTH_STORAGE_KEY = 'masjid_auth';

export const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // kirim cookie refresh token
});

/** Ambil token dari localStorage (persist oleh auth store) */
const getStoredAuth = () => {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const setStoredAuth = (auth) => {
  if (auth) localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
  else localStorage.removeItem(AUTH_STORAGE_KEY);
};

/** Dispatch event global agar auth store bisa reaktif terhadap api layer */
const emitAuthEvent = (type, payload) =>
  window.dispatchEvent(new CustomEvent('auth:change', { detail: { type, payload } }));

// --- Request interceptor: lampirkan Authorization header ------------------
api.interceptors.request.use(
  (config) => {
    const auth = getStoredAuth();
    if (auth?.accessToken) {
      config.headers.Authorization = `Bearer ${auth.accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// --- Response interceptor: normalisasi error + refresh otomatis -----------
let isRefreshing = false;
let refreshSubscribers = [];

const subscribeTokenRefresh = (cb) => refreshSubscribers.push(cb);
const notifyTokenRefreshed = (token) => {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
};

api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;

    // Aborted / timeout
    if (error.code === 'ECONNABORTED') {
      toast.error('Permintaan timeout. Periksa koneksi internet Anda.');
      return Promise.reject(error);
    }

    if (!error.response) {
      toast.error('Tidak dapat terhubung ke server. Periksa koneksi Anda.');
      return Promise.reject(error);
    }

    const { status, data } = error.response;

    // 401 & belum refresh -> coba refresh token sekali
    if (status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/auth/')) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          subscribeTokenRefresh((token) => {
            if (!token) return reject(error);
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data: refreshData } = await axios.post(
          `${API_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        const newToken = refreshData.data.accessToken;
        const stored = getStoredAuth();
        setStoredAuth({ ...stored, accessToken: newToken, user: refreshData.data.user });
        notifyTokenRefreshed(newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshErr) {
        notifyTokenRefreshed(null);
        setStoredAuth(null);
        emitAuthEvent('logout');
        toast.error('Sesi berakhir. Silakan login kembali.');
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    // 403: tidak punya izin
    if (status === 403) {
      toast.error(data?.message || 'Anda tidak memiliki izin untuk aksi ini.');
      return Promise.reject(error);
    }

    // 429: rate limited
    if (status === 429) {
      toast.error('Terlalu banyak permintaan. Tunggu beberapa saat.');
      return Promise.reject(error);
    }

    // Error lain: tampilkan pesan server (jika ada) kecuali untuk validasi form
    if (status !== 422 && data?.message) {
      // Jangan toast untuk error validasi field (ditangani form)
      if (!originalRequest._silent) {
        toast.error(data.message);
      }
    }

    return Promise.reject(error);
  }
);

export { AUTH_STORAGE_KEY, getStoredAuth, setStoredAuth, emitAuthEvent };
export default api;
