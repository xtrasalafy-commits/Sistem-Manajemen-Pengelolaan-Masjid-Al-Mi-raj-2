import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import {
  Wallet,
  Plus,
  Pencil,
  Trash2,
  TrendingUp,
  TrendingDown,
  Scale,
  FileSpreadsheet,
  FileText,
  Heart,
  Download,
} from 'lucide-react';

import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import StatCard from '../../components/ui/StatCard';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import SearchInput from '../../components/ui/SearchInput';
import FormInput from '../../components/ui/FormInput';
import FormSelect from '../../components/ui/FormSelect';
import FormTextarea from '../../components/ui/FormTextarea';

import { keuanganApi } from '../../services/endpoints';
import { downloadBlob } from '../../services/endpoints';
import {
  KATEGORI_KEUANGAN,
  JENIS_TRANSAKSI,
  labelOf,
} from '../../utils/constants';
import { formatRupiah, formatTanggal } from '../../utils/format';

const keuanganSchema = z.object({
  jenis: z.string().min(1, 'Pilih jenis'),
  kategori: z.string().min(1, 'Kategori wajib diisi'),
  jumlah: z.coerce.number().positive('Jumlah harus > 0'),
  tanggal: z.string().min(1, 'Tanggal wajib diisi'),
  metode: z.string().optional(),
  keterangan: z.string().optional(),
});

const donasiSchema = z.object({
  namaDonatur: z.string().min(3, 'Nama donatur minimal 3 karakter'),
  jamaahId: z.string().optional(),
  jumlah: z.coerce.number().positive('Jumlah harus > 0'),
  tanggal: z.string().min(1, 'Tanggal wajib diisi'),
  metode: z.string().optional(),
  tujuan: z.string().optional(),
  keterangan: z.string().optional(),
});

const PAGE_SIZE = 10;

const KeuanganPage = () => {
  const queryClient = useQueryClient();

  const [tab, setTab] = useState('transaksi'); // 'transaksi' | 'donasi'
  const [params, setParams] = useState({
    page: 1,
    limit: PAGE_SIZE,
    search: '',
    jenis: '',
    tanggalMulai: '',
    tanggalSelesai: '',
  });
  const [donasiParams, setDonasiParams] = useState({ page: 1, limit: PAGE_SIZE, search: '' });

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [exportLoading, setExportLoading] = useState(null);

  // --- Query transaksi ---
  const { data, isLoading } = useQuery({
    queryKey: ['keuangan', params],
    queryFn: () => keuanganApi.getAll(params),
  });
  const { transaksi = [], ringkasan, pagination } = data?.data || {};

  // --- Query donasi ---
  const { data: donasiData, isLoading: donasiLoading } = useQuery({
    queryKey: ['donasi', donasiParams],
    queryFn: () => keuanganApi.getDonasi(donasiParams),
  });
  const { donasi = [], totalDonasi } = donasiData?.data || {};
  const donasiPagination = donasiData?.data?.pagination;

  // --- Mutations ---
  const createMutation = useMutation({
    mutationFn: keuanganApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['keuangan'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Transaksi ditambahkan');
      closeModal();
    },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => keuanganApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['keuangan'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Transaksi diperbarui');
      closeModal();
    },
  });
  const deleteMutation = useMutation({
    mutationFn: keuanganApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['keuangan'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Transaksi dihapus');
      setDeleteTarget(null);
    },
  });

  const createDonasiMutation = useMutation({
    mutationFn: keuanganApi.createDonasi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['keuangan'] });
      queryClient.invalidateQueries({ queryKey: ['donasi'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Donasi berhasil dicatat');
      closeModal();
    },
  });
  const deleteDonasiMutation = useMutation({
    mutationFn: keuanganApi.removeDonasi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['keuangan'] });
      queryClient.invalidateQueries({ queryKey: ['donasi'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Donasi dihapus');
      setDeleteTarget(null);
    },
  });

  // --- Forms ---
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({ resolver: zodResolver(keuanganSchema) });

  const {
    register: registerDonasi,
    handleSubmit: handleDonasiSubmit,
    reset: resetDonasi,
    formState: { errors: donasiErrors },
  } = useForm({ resolver: zodResolver(donasiSchema) });

  const jenisValue = watch('jenis');

  const openCreateModal = () => {
    if (tab === 'donasi') {
      resetDonasi({
        namaDonatur: '', jumlah: '', tanggal: new Date().toISOString().slice(0, 10),
        metode: 'tunai', tujuan: '', keterangan: '',
      });
    } else {
      reset({
        jenis: 'masuk', kategori: '', jumlah: '', tanggal: new Date().toISOString().slice(0, 10),
        metode: 'tunai', keterangan: '',
      });
    }
    setEditing(null);
    setModalOpen(true);
  };

  const openEditModal = (row) => {
    reset({
      jenis: row.jenis,
      kategori: row.kategori,
      jumlah: row.jumlah,
      tanggal: row.tanggal ? row.tanggal.slice(0, 10) : '',
      metode: row.metode || 'tunai',
      keterangan: row.keterangan || '',
    });
    setEditing(row);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    reset();
    resetDonasi();
  };

  const onSubmit = (formData) => {
    const payload = { ...formData, jumlah: Number(formData.jumlah) };
    if (editing) updateMutation.mutate({ id: editing.id, data: payload });
    else createMutation.mutate(payload);
  };

  const onDonasiSubmit = (formData) => {
    const payload = { ...formData, jumlah: Number(formData.jumlah) };
    if (!payload.jamaahId) delete payload.jamaahId;
    createDonasiMutation.mutate(payload);
  };

  // --- Export ---
  const handleExport = async (format) => {
    setExportLoading(format);
    try {
      const res = await keuanganApi.export({ format, ...params, page: undefined, limit: undefined });
      const filename = `laporan-keuangan-${new Date().toISOString().slice(0, 10)}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
      downloadBlob(res, filename);
      toast.success(`Export ${format.toUpperCase()} berhasil`);
    } catch (err) {
      console.error(err);
      toast.error('Export gagal');
    } finally {
      setExportLoading(null);
    }
  };

  const isFiltered = params.search || params.jenis || params.tanggalMulai || params.tanggalSelesai;

  const columns = [
    {
      key: 'tanggal',
      header: 'Tanggal',
      sortable: false,
      render: (row) => <span className="whitespace-nowrap">{formatTanggal(row.tanggal, 'dd MMM yyyy')}</span>,
    },
    {
      key: 'jenis',
      header: 'Jenis',
      render: (row) => (
        <span className={row.jenis === 'masuk' ? 'badge-green' : 'badge-red'}>
          {row.jenis === 'masuk' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {labelOf(JENIS_TRANSAKSI, row.jenis)}
        </span>
      ),
    },
    {
      key: 'kategori',
      header: 'Kategori',
      render: (row) => <span className="capitalize">{row.kategori}</span>,
    },
    {
      key: 'jumlah',
      header: 'Jumlah',
      render: (row) => (
        <span className={`font-semibold ${row.jenis === 'masuk' ? 'text-primary-700' : 'text-red-600'}`}>
          {row.jenis === 'masuk' ? '+' : '-'} {formatRupiah(row.jumlah)}
        </span>
      ),
    },
    { key: 'metode', header: 'Metode', render: (row) => <span className="capitalize text-dark-500">{row.metode || '-'}</span> },
    {
      key: 'keterangan',
      header: 'Keterangan',
      render: (row) => <span className="block max-w-xs truncate text-dark-500">{row.keterangan || '-'}</span>,
    },
    {
      key: 'aksi',
      header: 'Aksi',
      render: (row) => (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => openEditModal(row)}
            className="rounded-lg p-1.5 text-dark-500 transition-colors hover:bg-primary-50 hover:text-primary-700"
            aria-label="Edit transaksi"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setDeleteTarget(row)}
            className="rounded-lg p-1.5 text-dark-500 transition-colors hover:bg-red-50 hover:text-red-600"
            aria-label="Hapus transaksi"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  const donasiColumns = [
    {
      key: 'tanggal',
      header: 'Tanggal',
      render: (row) => formatTanggal(row.tanggal, 'dd MMM yyyy'),
    },
    {
      key: 'nama_donatur',
      header: 'Donatur',
      render: (row) => (
        <div>
          <p className="font-medium text-dark-800">{row.nama_donatur}</p>
          {row.jamaah_nama && <p className="text-xs text-dark-400">Jamaah: {row.jamaah_nama}</p>}
        </div>
      ),
    },
    { key: 'tujuan', header: 'Tujuan', render: (row) => row.tujuan || 'Umum' },
    { key: 'metode', header: 'Metode', render: (row) => <span className="capitalize text-dark-500">{row.metode}</span> },
    {
      key: 'jumlah',
      header: 'Jumlah',
      render: (row) => <span className="font-semibold text-primary-700">{formatRupiah(row.jumlah)}</span>,
    },
    { key: 'keterangan', header: 'Keterangan', render: (row) => <span className="block max-w-xs truncate text-dark-500">{row.keterangan || '-'}</span> },
    {
      key: 'aksi',
      header: 'Aksi',
      render: (row) => (
        <button
          type="button"
          onClick={() => setDeleteTarget({ ...row, isDonasi: true })}
          className="rounded-lg p-1.5 text-dark-500 transition-colors hover:bg-red-50 hover:text-red-600"
          aria-label="Hapus donasi"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Keuangan Masjid"
        subtitle="Kelola kas, transaksi & donasi masjid"
        icon={Wallet}
        actions={
          tab === 'transaksi' ? (
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="secondary"
                icon={FileText}
                onClick={() => handleExport('pdf')}
                loading={exportLoading === 'pdf'}
                disabled={exportLoading !== null}
              >
                PDF
              </Button>
              <Button
                variant="secondary"
                icon={FileSpreadsheet}
                onClick={() => handleExport('xlsx')}
                loading={exportLoading === 'xlsx'}
                disabled={exportLoading !== null}
              >
                Excel
              </Button>
              <Button icon={Plus} onClick={openCreateModal}>
                Tambah Transaksi
              </Button>
            </div>
          ) : (
            <Button icon={Heart} onClick={openCreateModal}>
              Catat Donasi
            </Button>
          )
        }
      />

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard title="Total Pemasukan" value={formatRupiah(ringkasan?.totalMasuk || 0)} icon={TrendingUp} color="green" />
        <StatCard title="Total Pengeluaran" value={formatRupiah(ringkasan?.totalKeluar || 0)} icon={TrendingDown} color="red" />
        <StatCard
          title="Saldo"
          value={formatRupiah(ringkasan?.saldo || 0)}
          icon={Scale}
          color={(ringkasan?.saldo || 0) >= 0 ? 'gold' : 'red'}
          subtitle={tab === 'donasi' ? `Total donasi: ${formatRupiah(totalDonasi || 0)}` : 'Sesuai filter di bawah'}
        />
      </div>

      {/* Tabs */}
      <div className="flex w-full max-w-xs rounded-lg border border-dark-200 bg-white p-0.5">
        <button
          type="button"
          onClick={() => setTab('transaksi')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            tab === 'transaksi' ? 'bg-primary-600 text-white' : 'text-dark-600 hover:bg-dark-50'
          }`}
        >
          <Wallet className="h-4 w-4" /> Transaksi
        </button>
        <button
          type="button"
          onClick={() => setTab('donasi')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            tab === 'donasi' ? 'bg-primary-600 text-white' : 'text-dark-600 hover:bg-dark-50'
          }`}
        >
          <Heart className="h-4 w-4" /> Donasi
        </button>
      </div>

      {tab === 'transaksi' ? (
        <>
          <Card noPadding className="p-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="lg:col-span-1">
                <SearchInput
                  value={params.search}
                  onChange={(search) => setParams((p) => ({ ...p, search, page: 1 }))}
                  placeholder="Cari kategori/keterangan..."
                />
              </div>
              <FormSelect
                name="jenisFilter"
                placeholder="Semua jenis"
                options={JENIS_TRANSAKSI}
                value={params.jenis}
                onChange={(e) => setParams((p) => ({ ...p, jenis: e.target.value, page: 1 }))}
              />
              <FormInput
                label=""
                type="date"
                value={params.tanggalMulai}
                onChange={(e) => setParams((p) => ({ ...p, tanggalMulai: e.target.value, page: 1 }))}
              />
              <FormInput
                label=""
                type="date"
                value={params.tanggalSelesai}
                onChange={(e) => setParams((p) => ({ ...p, tanggalSelesai: e.target.value, page: 1 }))}
              />
            </div>
            {isFiltered && (
              <div className="mt-3 flex items-center justify-between">
                <p className="text-xs text-dark-500">Filter aktif</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setParams((p) => ({ ...p, search: '', jenis: '', tanggalMulai: '', tanggalSelesai: '', page: 1 }))}
                >
                  Reset filter
                </Button>
              </div>
            )}
          </Card>

          <DataTable
            columns={columns}
            data={transaksi}
            loading={isLoading}
            rowKey="id"
            empty={{
              icon: Wallet,
              title: 'Tidak ada transaksi',
              description: params.search
                ? `Tidak ada hasil untuk "${params.search}"`
                : 'Belum ada transaksi keuangan tercatat.',
              action: <Button icon={Plus} onClick={openCreateModal}>Tambah Transaksi</Button>,
            }}
            pagination={
              pagination
                ? { ...pagination, onPageChange: (page) => setParams((p) => ({ ...p, page })) }
                : null
            }
          />
        </>
      ) : (
        <>
          <Card noPadding className="p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex-1">
                <SearchInput
                  value={donasiParams.search}
                  onChange={(search) => setDonasiParams((p) => ({ ...p, search, page: 1 }))}
                  placeholder="Cari nama donatur / tujuan..."
                />
              </div>
              {donasiParams.search && (
                <Button
                  variant="ghost"
                  onClick={() => setDonasiParams((p) => ({ ...p, search: '', page: 1 }))}
                >
                  Reset filter
                </Button>
              )}
            </div>
          </Card>

          <DataTable
            columns={donasiColumns}
            data={donasi}
            loading={donasiLoading}
            rowKey="id"
            empty={{
              icon: Heart,
              title: 'Belum ada donasi',
              description: donasiParams.search
                ? `Tidak ada hasil untuk "${donasiParams.search}"`
                : 'Belum ada donasi yang tercatat.',
              action: <Button icon={Heart} onClick={openCreateModal}>Catat Donasi</Button>,
            }}
            pagination={
              donasiPagination
                ? { ...donasiPagination, onPageChange: (page) => setDonasiParams((p) => ({ ...p, page })) }
                : null
            }
          />
        </>
      )}

      {/* Modal transaksi */}
      <Modal
        isOpen={modalOpen && tab === 'transaksi'}
        onClose={closeModal}
        title={editing ? 'Edit Transaksi' : 'Tambah Transaksi'}
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={closeModal}>
              Batal
            </Button>
            <Button onClick={handleSubmit(onSubmit)} loading={createMutation.isPending || updateMutation.isPending}>
              {editing ? 'Simpan' : 'Tambah'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4 sm:grid-cols-2" noValidate>
          <FormSelect label="Jenis Transaksi" required error={errors.jenis} {...register('jenis')}>
            {JENIS_TRANSAKSI.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </FormSelect>
          <FormSelect label="Kategori" required error={errors.kategori} {...register('kategori')}>
            {KATEGORI_KEUANGAN.map((k) => (
              <option key={k} value={k} className="capitalize">
                {k}
              </option>
            ))}
          </FormSelect>
          <FormInput
            label="Jumlah (Rp)"
            type="number"
            required
            error={errors.jumlah}
            placeholder="500000"
            {...register('jumlah')}
          />
          <FormInput label="Tanggal" type="date" required error={errors.tanggal} {...register('tanggal')} />
          <FormSelect label="Metode" error={errors.metode} {...register('metode')}>
            <option value="tunai">Tunai</option>
            <option value="transfer">Transfer</option>
            <option value="qris">QRIS</option>
            <option value="lainnya">Lainnya</option>
          </FormSelect>
          <div className="sm:col-span-2">
            <FormTextarea label="Keterangan" rows={2} error={errors.keterangan} {...register('keterangan')} />
          </div>
          {jenisValue === 'keluar' && (
            <p className="sm:col-span-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
              Catatan: pengeluaran akan tercatat di audit trail dan mempengaruhi saldo kas.
            </p>
          )}
        </form>
      </Modal>

      {/* Modal donasi */}
      <Modal
        isOpen={modalOpen && tab === 'donasi'}
        onClose={closeModal}
        title="Catat Donasi"
        description="Donasi otomatis menjadi transaksi pemasukan kategori 'donasi'"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={closeModal}>
              Batal
            </Button>
            <Button onClick={handleDonasiSubmit(onDonasiSubmit)} loading={createDonasiMutation.isPending}>
              Simpan Donasi
            </Button>
          </>
        }
      >
        <form onSubmit={handleDonasiSubmit(onDonasiSubmit)} className="grid grid-cols-1 gap-4 sm:grid-cols-2" noValidate>
          <div className="sm:col-span-2">
            <FormInput label="Nama Donatur" required error={donasiErrors.namaDonatur} {...registerDonasi('namaDonatur')} />
          </div>
          <FormInput
            label="Jumlah (Rp)"
            type="number"
            required
            error={donasiErrors.jumlah}
            placeholder="500000"
            {...registerDonasi('jumlah')}
          />
          <FormInput label="Tanggal" type="date" required error={donasiErrors.tanggal} {...registerDonasi('tanggal')} />
          <FormSelect label="Metode" error={donasiErrors.metode} {...registerDonasi('metode')}>
            <option value="tunai">Tunai</option>
            <option value="transfer">Transfer</option>
            <option value="qris">QRIS</option>
          </FormSelect>
          <FormInput label="Tujuan" placeholder="Pembangunan / santunan..." error={donasiErrors.tujuan} {...registerDonasi('tujuan')} />
          <div className="sm:col-span-2">
            <FormTextarea label="Keterangan" rows={2} error={donasiErrors.keterangan} {...registerDonasi('keterangan')} />
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() =>
          deleteTarget?.isDonasi
            ? deleteDonasiMutation.mutate(deleteTarget.id)
            : deleteMutation.mutate(deleteTarget.id)
        }
        loading={deleteMutation.isPending || deleteDonasiMutation.isPending}
        title={deleteTarget?.isDonasi ? 'Hapus Donasi' : 'Hapus Transaksi'}
        message={
          deleteTarget?.isDonasi
            ? `Hapus donasi dari "${deleteTarget?.nama_donatur}" (${formatRupiah(deleteTarget?.jumlah)})? Transaksi keuangan terkait juga akan dihapus.`
            : `Hapus transaksi ${deleteTarget?.kategori} ${formatRupiah(deleteTarget?.jumlah)}?`
        }
        confirmText="Ya, hapus"
      />
    </div>
  );
};

export default KeuanganPage;
