import { useQuery } from '@tanstack/react-query';
import {
  Users,
  Wallet,
  CalendarDays,
  Package,
  TrendingUp,
  TrendingDown,
  Clock,
  Megaphone,
  ArrowRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/ui/StatCard';
import Card from '../../components/ui/Card';
import { LoadingOverlay } from '../../components/ui/Loading';
import EmptyState from '../../components/ui/EmptyState';

import { dashboardApi, jadwalApi, pengumumanApi, kegiatanApi } from '../../services/endpoints';
import useAuthStore from '../../store/authStore';
import { ROLES } from '../../utils/constants';
import { formatRupiah, formatTanggalWaktu, potong } from '../../utils/format';

// Komponen chart lokal
import DashboardCharts from '../../components/dashboard/DashboardCharts';

const DashboardPage = () => {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const canManage = useAuthStore((s) => s.canManage());

  const { data: statsData, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardApi.getStats(),
  });

  const { data: jadwalData } = useQuery({
    queryKey: ['jadwal-today'],
    queryFn: () => jadwalApi.getToday(),
  });

  const { data: pengumumanData } = useQuery({
    queryKey: ['pengumuman-aktif'],
    queryFn: () => pengumumanApi.getAktif(4),
  });

  const { data: kegiatanData } = useQuery({
    queryKey: ['kegiatan-berlangsung'],
    queryFn: () => kegiatanApi.getBerlangsung(),
  });

  const stats = statsData?.data || {};
  const jadwal = jadwalData?.data?.jadwal || [];
  const pengumuman = pengumumanData?.data?.pengumuman || [];
  const kegiatan = kegiatanData?.data?.kegiatan || [];

  if (isLoading) {
    return (
      <>
        <PageHeader
          title="Dashboard"
          subtitle={`Selamat datang kembali, ${user?.nama || 'Pengguna'}`}
          icon={Wallet}
        />
        <LoadingOverlay label="Memuat statistik..." />
      </>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Dashboard"
        subtitle={`Assalamu'alaikum, ${user?.nama || 'Pengguna'} — ringkasan pengelolaan masjid hari ini`}
        icon={Wallet}
      />

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {canManage && (
          <StatCard
            title="Total Kas (Tahun ini)"
            value={formatRupiah(stats.keuangan?.tahun?.saldo || 0)}
            subtitle={`Masuk ${formatRupiah(stats.keuangan?.tahun?.masuk || 0)} • Keluar ${formatRupiah(stats.keuangan?.tahun?.keluar || 0)}`}
            icon={Wallet}
            color="green"
          />
        )}
        {canManage && (
          <StatCard
            title="Kas Bulan Ini"
            value={formatRupiah(stats.keuangan?.bulanIni?.saldo || 0)}
            subtitle={`Donasi ${formatRupiah(stats.donasiBulanIni || 0)}`}
            icon={stats.keuangan?.bulanIni?.saldo >= 0 ? TrendingUp : TrendingDown}
            color={(stats.keuangan?.bulanIni?.saldo || 0) >= 0 ? 'green' : 'red'}
          />
        )}
        <StatCard
          title="Jamaah Terdaftar"
          value={stats.jamaah?.total || 0}
          subtitle={`${stats.jamaah?.aktif || 0} jamaah aktif`}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Kegiatan Mendatang"
          value={stats.kegiatan?.upcoming || 0}
          subtitle={`Dari ${stats.kegiatan?.total || 0} total kegiatan`}
          icon={CalendarDays}
          color="gold"
        />
        {canManage && (
          <StatCard
            title="Inventaris"
            value={stats.inventaris?.total || 0}
            subtitle={`Nilai estimasi ${formatRupiah(stats.inventaris?.nilai || 0)}`}
            icon={Package}
            color="purple"
          />
        )}
        <StatCard
          title="Pengumuman Aktif"
          value={stats.pengumumanAktif || 0}
          subtitle="Pengumuman sedang berlaku"
          icon={Megaphone}
          color="gray"
        />
      </div>

      {/* Charts */}
      {canManage && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card title="Pemasukan vs Pengeluaran" subtitle="Tren bulanan tahun berjalan" noPadding>
              <DashboardCharts.TypeLine data={stats.chartBulanan || []} />
            </Card>
          </div>
          <Card title="Donasi per Tujuan" subtitle="Tahun berjalan" noPadding>
            <DashboardCharts.TypeDonut data={stats.chartDonasi || []} />
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Jadwal sholat hari ini */}
        <Card
          title="Jadwal Sholat Hari Ini"
          subtitle={new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          action={
            <button
              type="button"
              onClick={() => navigate('/jadwal-sholat')}
              className="btn btn-ghost btn-sm"
            >
              Lihat <ArrowRight className="h-3.5 w-3.5" />
            </button>
          }
          className="lg:col-span-2"
          noPadding
        >
          {jadwal.length === 0 ? (
            <EmptyState icon={Clock} title="Belum ada jadwal" description="Jadwal sholat hari ini belum diinput." />
          ) : (
            <div className="grid grid-cols-2 gap-3 p-6 sm:grid-cols-3">
              {jadwal.map((j) => (
                <div
                  key={j.id}
                  className="rounded-xl border border-dark-100 bg-gradient-to-br from-primary-50 to-white p-4 transition-shadow hover:shadow-soft"
                >
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary-600" aria-hidden />
                    <p className="text-sm font-semibold capitalize text-dark-800">{j.sholat}</p>
                  </div>
                  <p className="mt-2 font-arabic text-2xl font-bold text-primary-700" dir="ltr">
                    {j.waktu}
                  </p>
                  {j.imam && <p className="mt-1 text-xs text-dark-500">Imam: {potong(j.imam, 24)}</p>}
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Pengumuman */}
        <Card
          title="Pengumuman"
          action={
            <button
              type="button"
              onClick={() => navigate('/pengumuman')}
              className="btn btn-ghost btn-sm"
            >
              Lihat <ArrowRight className="h-3.5 w-3.5" />
            </button>
          }
          noPadding
        >
          <div className="max-h-80 divide-y divide-dark-50 overflow-y-auto">
            {pengumuman.length === 0 ? (
              <EmptyState icon={Megaphone} title="Tidak ada pengumuman" />
            ) : (
              pengumuman.map((p) => (
                <div key={p.id} className="px-6 py-4">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-sm font-semibold text-dark-800">{p.judul}</h4>
                    <span
                      className={
                        {
                          tinggi: 'badge-red',
                          sedang: 'badge-yellow',
                          rendah: 'badge-gray',
                        }[p.prioritas] || 'badge-gray'
                      }
                    >
                      {p.prioritas}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-dark-500">{p.isi}</p>
                  <p className="mt-1.5 text-[10px] text-dark-400">{formatTanggalWaktu(p.tanggal_mulai)}</p>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Kegiatan mendatang */}
      <Card
        title="Kegiatan Mendatang"
        action={
          <button
            type="button"
            onClick={() => navigate('/kegiatan')}
            className="btn btn-ghost btn-sm"
          >
            Lihat semua <ArrowRight className="h-3.5 w-3.5" />
          </button>
        }
        noPadding
      >
        {kegiatan.length === 0 ? (
          <EmptyState icon={CalendarDays} title="Belum ada kegiatan" description="Belum ada kegiatan yang direncanakan." />
        ) : (
          <div className="divide-y divide-dark-50">
            {kegiatan.map((k) => (
              <div key={k.id} className="flex items-center gap-4 px-6 py-4">
                <div className="flex h-12 w-12 flex-shrink-0 flex-col items-center justify-center rounded-xl bg-primary-600 text-white">
                  <span className="text-[10px] font-medium uppercase">
                    {new Date(k.tanggal_mulai).toLocaleDateString('id-ID', { month: 'short' })}
                  </span>
                  <span className="text-base font-bold leading-none">
                    {new Date(k.tanggal_mulai).getDate()}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="truncate text-sm font-semibold text-dark-800">{k.judul}</h4>
                  <p className="truncate text-xs text-dark-500">
                    {formatTanggalWaktu(k.tanggal_mulai)} • {k.lokasi}
                  </p>
                </div>
                <span className="badge-blue flex-shrink-0">{k.status}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default DashboardPage;
