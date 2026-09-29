import { create } from 'zustand';
import { AUTH_STORAGE_KEY, getStoredAuth, setStoredAuth } from '../services/api';
import { ROLES } from '../utils/constants';

/**
 * Store autentikasi global (Zustand).
 * State dipersist ke localStorage agar tetap ada saat refresh (lihat api.js).
 */
const initialState = {
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: true,
};

const restoreFromStorage = () => {
  const stored = getStoredAuth();
  if (stored?.accessToken && stored?.user) {
    return {
      ...initialState,
      user: stored.user,
      accessToken: stored.accessToken,
      isAuthenticated: true,
      isLoading: false,
    };
  }
  return { ...initialState, isLoading: false };
};

const persistAuth = (user, accessToken) => {
  setStoredAuth({ user, accessToken });
};

export const useAuthStore = create((set, get) => ({
  ...restoreFromStorage(),

  /**
   * Set state setelah login/register berhasil.
   */
  setAuth: ({ user, accessToken }) => {
    persistAuth(user, accessToken);
    set({ user, accessToken, isAuthenticated: true, isLoading: false });
  },

  /**
   * Update data user tanpa mengubah token.
   */
  setUser: (user) => {
    const { accessToken } = get();
    persistAuth(user, accessToken);
    set({ user });
  },

  /**
   * Logout: hapus state + storage.
   */
  logout: () => {
    setStoredAuth(null);
    set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false });
  },

  /**
   * Helper cek role.
   * @param  {...string} roles
   */
  hasRole: (...roles) => {
    const { user } = get();
    return Boolean(user) && roles.includes(user.role);
  },

  isAdmin: () => get().hasRole(ROLES.ADMIN),
  isPengurus: () => get().hasRole(ROLES.PENGURUS),
  isJamaah: () => get().hasRole(ROLES.JAMAAH),
  canManage: () => get().hasRole(ROLES.ADMIN, ROLES.PENGURUS),
}));

// Sinkronisasi dengan event dari api layer (mis. refresh token gagal)
window.addEventListener('auth:change', (event) => {
  if (event.detail?.type === 'logout') {
    useAuthStore.getState().logout();
  }
});

export default useAuthStore;
