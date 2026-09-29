import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

/**
 * Layout utama aplikasi (Sidebar + Topbar + content area).
 */
const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-dark-50 bg-pattern-islamic">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Content area, offset dengan lebar sidebar di desktop */}
      <div className="flex flex-col lg:pl-72">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-7xl">
            <Outlet />
          </div>
        </main>

        <footer className="border-t border-dark-100 px-4 py-4 text-center lg:px-8">
          <p className="text-xs text-dark-400">
            Sistem Manajemen Pengelolaan Masjid Al-Mi'raj &bull; Dibangun dengan React, Express &amp; Neon PostgreSQL
          </p>
        </footer>
      </div>
    </div>
  );
};

export default MainLayout;
