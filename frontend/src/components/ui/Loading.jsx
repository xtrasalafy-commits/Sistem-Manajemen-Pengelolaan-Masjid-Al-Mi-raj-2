import { Loader2 } from 'lucide-react';
import cn from '../../utils/cn';

/** Spinner inline */
export const LoadingSpinner = ({ size = 'md', className = '' }) => {
  const sizes = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-10 w-10', xl: 'h-16 w-16' };
  return <Loader2 className={cn('animate-spin text-primary-600', sizes[size], className)} aria-label="Memuat" />;
};

/** Loading overlay untuk card/box */
export const LoadingOverlay = ({ label = 'Memuat data...' }) => (
  <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-xl bg-white/80">
    <LoadingSpinner size="lg" />
    <p className="text-sm font-medium text-dark-500">{label}</p>
  </div>
);

/** Loading full page (mis. saat init auth) */
export const LoadingPage = () => (
  <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-dark-50 bg-pattern-islamic">
    <LoadingSpinner size="xl" />
    <div className="text-center">
      <p className="text-lg font-bold text-primary-700">Sistem Manajemen Masjid Al-Mi'raj</p>
      <p className="text-sm text-dark-500">Sedang memuat...</p>
    </div>
  </div>
);

/** Skeleton bar untuk tabel/card */
export const Skeleton = ({ className = '' }) => (
  <div className={cn('animate-pulse rounded bg-dark-100', className)} aria-hidden />
);

export default LoadingSpinner;
