import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Clock,
  CalendarDays,
  Wallet,
  Package,
  Megaphone,
  FileBarChart,
  ShieldCheck,
  UserCog,
  X,
} from 'lucide-react';
import cn from '../../utils/cn';
import { APP_NAME, APP_SHORT, ROLES } from '../../utils/constants';
import useAuthStore from '../../store/authStore';

/**
 * Daftar menu sidebar (dengan RBAC).
 */
const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, roles: [ROLES.ADMIN, ROLES.PENGURUS, ROLES.JAMAAH] },
  { to: '/jamaah', label: 'Data Jamaah', icon: Users, roles: [ROLES.ADMIN, ROLES.PENGURUS] },
  { to: '/jadwal-sholat', label: 'Jadwal Sholat', icon: Clock, roles: [ROLES.ADMIN, ROLES.PENGURUS, ROLES.JAMAAH] },
  { to: '/kegiatan', label: 'Kegiatan', icon: CalendarDays, roles: [ROLES.ADMIN, ROLES.PENGURUS, ROLES.JAMAAH] },
  { to: '/keuangan', label: 'Keuangan', icon: Wallet, roles: [ROLES.ADMIN, ROLES.PENGURUS] },
  { to: '/inventaris', label: 'Inventaris', icon: Package, roles: [ROLES.ADMIN, ROLES.PENGURUS] },
  { to: '/pengumuman', label: 'Pengumuman', icon: Megaphone, roles: [ROLES.ADMIN, ROLES.PENGURUS, ROLES.JAMAAH] },
  { to: '/laporan', label: 'Laporan', icon: FileBarChart, roles: [ROLES.ADMIN, ROLES.PENGURUS] },
  { to: '/audit', label: 'Audit Trail', icon: ShieldCheck, roles: [ROLES.ADMIN] },
  { to: '/manajemen-user', label: 'Manajemen User', icon: UserCog, roles: [ROLES.ADMIN] },
];

const Sidebar = ({ isOpen = false, onClose = () => {} }) => {
  const user = useAuthStore((s) => s.user);

  const visibleItems = NAV_ITEMS.filter((item) =>
    user ? item.roles.includes(user.role) : false
  );

  return (
    <>
      {/* Backdrop untuk mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-dark-900/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-dark-100 bg-white shadow-xl transition-transform duration-300 lg:translate-x-0 lg:shadow-none',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        aria-label="Navigasi utama"
      >
        {/* Brand header */}
        <div className="flex items-center justify-between gap-3 border-b border-dark-100 bg-gradient-to-r from-primary-700 to-primary-600 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white/15">
              <svg viewBox="0 0 24 24" className="h-6 w-6 text-white" fill="currentColor" aria-hidden>
                <path d="M12 2c1.2 2.6 3.7 4.3 6.5 4.3-.2 3.5-1.8 6.5-4.4 8.3h4.1v3.3H5.8v-3.3h4.1C7.3 12.8 5.7 9.8 5.5 6.3 8.3 6.3 10.8 4.6 12 2zm-6 16.4h12v1.7H6v-1.7z" />
              </svg>
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-base font-bold leading-tight text-white">Masjid Al-Mi'raj</h1>
              <p className="truncate text-xs text-primary-100">Sistem Manajemen Pengelolaan</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-white/80 transition-colors hover:bg-white/15 hover:text-white lg:hidden"
            aria-label="Tutup menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-4" aria-label="Menu">
          {visibleItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={onClose}
              className={({ isActive }) => cn('nav-link', isActive && 'nav-link-active')}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" aria-hidden />
              <span className="truncate">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-dark-100 p-4">
          <div className="rounded-lg bg-primary-50 p-3 text-center">
            <p className="font-arabic text-lg text-primary-700" dir="rtl">بسم الله الرحمن الرحيم</p>
            <p className="mt-1 text-xs text-dark-500">Semoga bermanfaat untuk umat</p>
          </div>
          <p className="mt-3 text-center text-xs text-dark-400">&copy; {new Date().getFullYear()} {APP_SHORT}</p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
export { NAV_ITEMS };
export const menuTitle = APP_NAME;
