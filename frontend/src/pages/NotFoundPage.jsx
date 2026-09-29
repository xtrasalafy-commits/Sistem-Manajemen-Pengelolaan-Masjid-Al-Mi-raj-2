import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import Button from '../components/ui/Button';

const NotFoundPage = () => (
  <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-dark-50 bg-pattern-islamic p-4 text-center">
    <div className="space-y-2">
      <p className="font-arabic text-7xl font-bold text-primary-200">٤٠٤</p>
      <p className="text-6xl font-bold text-primary-700">404</p>
      <h1 className="text-xl font-bold text-dark-900">Halaman Tidak Ditemukan</h1>
      <p className="max-w-md text-sm text-dark-500">
        Maaf, halaman yang Anda cari tidak tersedia atau telah dipindahkan.
      </p>
    </div>
    <div className="flex flex-wrap items-center justify-center gap-3">
      <Link to="/">
        <Button icon={Home}>Kembali ke Dashboard</Button>
      </Link>
      <Button variant="secondary" icon={ArrowLeft} onClick={() => window.history.back()}>
        Halaman Sebelumnya
      </Button>
    </div>
  </div>
);

export default NotFoundPage;
