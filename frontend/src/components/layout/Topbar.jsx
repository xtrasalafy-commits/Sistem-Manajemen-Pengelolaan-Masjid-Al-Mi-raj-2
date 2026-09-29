import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Menu, Bell, LogOut, User as UserIcon, ChevronDown, CheckCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import cn from '../../utils/cn';
import useAuthStore from '../../store/authStore';
import { authApi, notifikasiApi } from '../../services/endpoints';
import { inisial, formatRelatif } from '../../utils/format';
import { ROLE_LABEL, ROLE_BADGE } from '../../utils/constants';

const Topbar = ({ onMenuClick }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, logout } = useAuthStore();

  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const notifRef = useRef(null);
  const userRef = useRef(null);

  // Tutup dropdown saat klik di luar
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (userRef.current && !userRef.current.contains(e.target)) setUserOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const { data: notifData } = useQuery({
    queryKey: ['notifikasi', 'topbar'],
    queryFn: () => notifikasiApi.getMine(5),
    refetchInterval: 60000, // refresh tiap 1 menit
  });

  const notifikasi = notifData?.data?.notifikasi || [];
  const belumDibaca = notifData?.data?.belumDibaca || 0;

  const markAllReadMutation = useMutation({
    mutationFn: notifikasiApi.markAllRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifikasi'] });
      toast.success('Semua notifikasi ditandai dibaca');
    },
  });

  const handleLogout = async () => {
    try {
      // logout di backend (best effort)
      await authApi.logout();
    } catch {
      // ignore, tetap logout di client
    }
    logout();
    toast.success('Anda telah keluar');
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-dark-100 bg-white/95 px-4 backdrop-blur lg:px-6">
      {/* Left: hamburger + greeting */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-lg p-2 text-dark-600 transition-colors hover:bg-dark-100 lg:hidden"
          aria-label="Buka menu navigasi"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="hidden sm:block">
          <p className="text-sm font-semibold text-dark-800">
            Assalamu'alaikum, {user?.nama?.split(' ')[0] || 'Jamaah'} 👋
          </p>
          <p className="text-xs text-dark-500">{ROLE_LABEL[user?.role] || 'Pengguna'}</p>
        </div>
      </div>

      {/* Right: notifikasi + profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Notifikasi */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => setNotifOpen((v) => !v)}
            className="relative rounded-lg p-2 text-dark-600 transition-colors hover:bg-dark-100"
            aria-label="Notifikasi"
            aria-expanded={notifOpen}
          >
            <Bell className="h-5 w-5" />
            {belumDibaca > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
                {belumDibaca > 99 ? '99+' : belumDibaca}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 origin-top-right overflow-hidden rounded-xl border border-dark-100 bg-white shadow-lg animate-slide-up sm:w-96">
              <div className="flex items-center justify-between border-b border-dark-100 px-4 py-3">
                <h3 className="text-sm font-bold text-dark-900">Notifikasi</h3>
                {belumDibaca > 0 && (
                  <button
                    type="button"
                    onClick={() => markAllReadMutation.mutate()}
                    className="inline-flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700"
                  >
                    <CheckCheck className="h-3.5 w-3.5" /> Tandai dibaca
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifikasi.length === 0 ? (
                  <p className="py-8 text-center text-sm text-dark-400">Belum ada notifikasi</p>
                ) : (
                  notifikasi.map((n) => (
                    <div
                      key={n.id}
                      className={cn(
                        'flex gap-3 border-b border-dark-50 px-4 py-3 transition-colors hover:bg-dark-50',
                        !n.dibaca && 'bg-primary-50/50'
                      )}
                    >
                      <div className={cn('mt-1.5 h-2 w-2 flex-shrink-0 rounded-full', n.dibaca ? 'bg-dark-300' : 'bg-primary-600')} />
                      <div className="min-w-0 space-y-0.5">
                        <p className="text-sm font-medium text-dark-800">{n.judul}</p>
                        <p className="line-clamp-2 text-xs text-dark-500">{n.pesan}</p>
                        <p className="text-[10px] text-dark-400">{formatRelatif(n.created_at)}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile */}
        <div className="relative" ref={userRef}>
          <button
            type="button"
            onClick={() => setUserOpen((v) => !v)}
            className="flex items-center gap-2 rounded-lg p-1.5 pr-2 transition-colors hover:bg-dark-100"
            aria-label="Menu pengguna"
            aria-expanded={userOpen}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-600 text-xs font-bold text-white">
              {inisial(user?.nama)}
            </span>
            <span className="hidden text-left sm:block">
              <span className="block text-xs font-semibold leading-tight text-dark-800">{user?.nama}</span>
              <span className={cn(ROLE_BADGE[user?.role], 'mt-0.5 inline-block !py-0 !text-[10px]')}>
                {ROLE_LABEL[user?.role]}
              </span>
            </span>
            <ChevronDown className="h-4 w-4 text-dark-400" />
          </button>

          {userOpen && (
            <div className="absolute right-0 mt-2 w-56 origin-top-right overflow-hidden rounded-xl border border-dark-100 bg-white shadow-lg animate-slide-up">
              <div className="border-b border-dark-100 bg-dark-50/50 px-4 py-3">
                <p className="truncate text-sm font-semibold text-dark-900">{user?.nama}</p>
                <p className="truncate text-xs text-dark-500">{user?.email}</p>
              </div>
              <div className="py-1">
                <button
                  type="button"
                  onClick={() => {
                    setUserOpen(false);
                    navigate('/profil');
                  }}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-dark-700 transition-colors hover:bg-dark-50"
                >
                  <UserIcon className="h-4 w-4 text-dark-400" /> Profil Saya
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 transition-colors hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" /> Keluar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
