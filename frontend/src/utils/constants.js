/**
 * Konstanta global aplikasi.
 */

export const APP_NAME = import.meta.env.VITE_APP_NAME || "Sistem Manajemen Masjid Al-Mi'raj";
export const APP_SHORT = "Al-Mi'raj";

export const ROLES = {
  ADMIN: 'admin',
  PENGURUS: 'pengurus',
  JAMAAH: 'jamaah',
};

export const ROLE_LABEL = {
  admin: 'Administrator',
  pengurus: 'Pengurus',
  jamaah: 'Jamaah',
};

export const ROLE_BADGE = {
  admin: 'badge-red',
  pengurus: 'badge-yellow',
  jamaah: 'badge-green',
};

export const STATUS_LABEL = {
  aktif: 'Aktif',
  nonaktif: 'Nonaktif',
};

// --- Opsi dropdown --------------------------------------------------------

export const KATEGORI_KEGIATAN = [
  { value: 'ibadah', label: 'Ibadah' },
  { value: 'pendidikan', label: 'Pendidikan' },
  { value: 'sosial', label: 'Sosial' },
  { value: 'pemuda', label: 'Pemuda' },
  { value: 'perempuan', label: 'Muslimat' },
  { value: 'lainnya', label: 'Lainnya' },
];

export const STATUS_KEGIATAN = [
  { value: 'direncanakan', label: 'Direncanakan' },
  { value: 'berlangsung', label: 'Berlangsung' },
  { value: 'selesai', label: 'Selesai' },
  { value: 'dibatalkan', label: 'Dibatalkan' },
];

export const JENIS_KELAMIN = [
  { value: 'laki-laki', label: 'Laki-laki' },
  { value: 'perempuan', label: 'Perempuan' },
];

export const STATUS_PERNIKAHAN = [
  { value: 'belum_menikah', label: 'Belum Menikah' },
  { value: 'menikah', label: 'Menikah' },
  { value: 'janda', label: 'Janda' },
  { value: 'duda', label: 'Duda' },
];

export const KATEGORI_KEUANGAN = [
  'kas bulanan',
  'donasi',
  'infaq',
  'sedekah',
  'zakat',
  'pembangunan',
  'operasional',
  'utilitas',
  'gaji',
  'pemeliharaan',
  'kegiatan',
  'perlengkapan',
  'lainnya',
];

export const JENIS_TRANSAKSI = [
  { value: 'masuk', label: 'Pemasukan' },
  { value: 'keluar', label: 'Pengeluaran' },
];

export const KONDISI_INVENTARIS = [
  { value: 'baik', label: 'Baik' },
  { value: 'rusak_ringan', label: 'Rusak Ringan' },
  { value: 'rusak_berat', label: 'Rusak Berat' },
  { value: 'hilang', label: 'Hilang' },
];

export const PRIORITAS = [
  { value: 'tinggi', label: 'Tinggi' },
  { value: 'sedang', label: 'Sedang' },
  { value: 'rendah', label: 'Rendah' },
];

export const JENIS_LAPORAN = [
  { value: 'keuangan', label: 'Keuangan' },
  { value: 'jamaah', label: 'Jamaah' },
  { value: 'kegiatan', label: 'Kegiatan' },
  { value: 'inventaris', label: 'Inventaris' },
  { value: 'umum', label: 'Umum' },
];

export const SHOLAT_LIST = [
  { value: 'subuh', label: 'Subuh' },
  { value: 'dzuhur', label: 'Dzuhur' },
  { value: 'ashar', label: 'Ashar' },
  { value: 'maghrib', label: 'Maghrib' },
  { value: 'isya', label: 'Isya' },
  { value: 'jumat', label: 'Jumat' },
];

export const labelOf = (list, value) =>
  list.find((item) => item.value === value)?.label ?? (value || '-');

export const badgeForKondisi = (kondisi) =>
  ({
    baik: 'badge-green',
    rusak_ringan: 'badge-yellow',
    rusak_berat: 'badge-red',
    hilang: 'badge-gray',
  })[kondisi] || 'badge-gray';

export const badgeForStatusKegiatan = (status) =>
  ({
    direncanakan: 'badge-blue',
    berlangsung: 'badge-yellow',
    selesai: 'badge-green',
    dibatalkan: 'badge-red',
  })[status] || 'badge-gray';

export const badgeForPrioritas = (p) =>
  ({
    tinggi: 'badge-red',
    sedang: 'badge-yellow',
    rendah: 'badge-gray',
  })[p] || 'badge-gray';
