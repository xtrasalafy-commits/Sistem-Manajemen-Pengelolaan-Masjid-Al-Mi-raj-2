import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import { LoadingPage } from '../../components/ui/Loading';
import { ROLES } from '../../utils/constants';

/**
 * Guard route: hanya user terautentikasi (+ role tertentu) yang bisa akses.
 *
 * @param {object} props
 * @param {ReactNode} props.children - elemen yang diproteksi
 * @param {string[]} [props.roles] - role yang diizinkan (kosong = semua role)
 * @param {boolean} [props.requireAuth=true]
 */
const ProtectedRoute = ({ children, roles = [], requireAuth = true }) => {
  const { isAuthenticated, isLoading, user } = useAuthStore();
  const location = useLocation();

  if (isLoading) {
    return <LoadingPage />;
  }

  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // Route public (mis. login) tidak boleh diakses yang sudah login
  if (!requireAuth && isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (roles.length > 0 && user && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

/** Hanya admin */
export const AdminRoute = ({ children }) => (
  <ProtectedRoute roles={[ROLES.ADMIN]}>{children}</ProtectedRoute>
);

/** Admin & pengurus */
export const PengurusRoute = ({ children }) => (
  <ProtectedRoute roles={[ROLES.ADMIN, ROLES.PENGURUS]}>{children}</ProtectedRoute>
);

export default ProtectedRoute;
