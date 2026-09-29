import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Package, Plus, Pencil, Trash2, Boxes } from 'lucide-react';

import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import SearchInput from '../../components/ui/SearchInput';
import FormInput from '../../components/ui/FormInput';
import FormSelect from '../../components/ui/FormSelect';
import FormTextarea from '../../components/ui/FormTextarea';
import EmptyState from '../../components/ui/EmptyState';

import { inventarisApi } from '../../services/endpoints';
import {
  KONDISI_INVENTARIS,
  badgeForKondisi,
  labelOf,
} from '../../utils/constants';
import { formatRupiah, formatTanggal } from '../../utils/format';

const inventarisSchema = z.object({
  nama: z.string().min(3, 'Nama minimal 3 karakter'),
  kode: z.string().optional(),
  kategori: z.string().optional(),
  jumlah: z.coerce.number().int().min(0, 'Jumlah >= 0'),
  satuan: z.string().optional(),
  kondisi: z.string().min(1, 'Pilih kondisi'),
  tanggalBeli: z.string().optional(),
  hargaBeli: z.coerce.number().min(0, 'Harga >= 0').optional(),
  estimasiNilai: z.coerce.number().min(0, 'Nilai >= 0').optional(),
  lokasi: z.string().optional(),
  sumberDana: z.string().optional(),
  keterangan: z.string().optional(),
});

const PAGE_SIZE = 10;

const InventarisPage = () => {
  const queryClient = useQueryClient();

  const [params, setParams] = useState({ page: 1, limit: PAGE_SIZE, search: '', kondisi: '' });
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['inventaris', params],
    queryFn: () => inventarisApi.getAll(params),
  });
  const { inventaris = [], pagination } = data?.data || {};

  const { data: statsData } = useQuery({
    queryKey: ['inventaris-statistik'],
    queryFn: inventarisApi.getStatistik,
  });
  const stats = statsData?.data || {};

  const createMutation = useMutation({
    mutationFn: inventarisApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventaris'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Inventaris ditambahkan');
      closeModal();
    },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => inventarisApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventaris'] });
      queryClient.invalidateQueries({ queryKey: ['inventaris-statistik'] });
      toast.success('Inventaris diperbarui');
      closeModal();
    },
  });
  const deleteMutation = useMutation({
    mutationFn: inventarisApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventaris'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Inventaris dihapus');
      setDeleteTarget(null);
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(inventarisSchema) });

  const openCreateModal = () => {
    reset({
      nama: '', kode: '', kategori: '', jumlah: 1, satuan: 'unit', kondisi: 'baik',
      tanggalBeli: '', hargaBeli: '', estimasiNilai: '', lokasi: '', sumberDana: '', keterangan: '',
    });
    setEditing(null);
    setModalOpen(true);
  };

  const openEditModal = (row) => {
    reset({
      nama: row.nama || '',
      kode: row.kode || '',
      kategori: row.kategori || '',
      jumlah: row.jumlah ?? 1,
      satuan: row.satuan || 'unit',
      kondisi: row.kondisi || 'baik',
      tanggalBeli: row.tanggal_beli ? row.tanggal_beli.slice(0, 10) : '',
      hargaBeli: row.harga_beli ?? '',
      estimasiNilai: row.estimasi_nilai ?? '',
      lokasi: row.lokasi || '',
      sumberDana: row.sumber_dana || '',
      keterangan: row.keterangan || '',
    });
    setEditing(row);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    reset();
  };

  const onSubmit = (formData) => {
    const payload = { ...formData, jumlah: Number(formData.jumlah) };
    ['hargaBeli', 'estimasiNilai'].forEach((k) => {
      payload[k] = payload[k] === '' || payload[k] == null ? null : Number(payload[k]);
    });
    if (!payload.tanggalBeli) delete payload.tanggalBeli;
    if (editing) updateMutation.mutate({ id: editing.id, data: payload });
    else createMutation.mutate(payload);
  };

  const columns = [
    {
      key: 'nama',
      header: 'Nama Aset',
      sortable: true,
      render: (row) => (
        <div className="min-w-0">
          <p className="font-medium text-dark-800">{row.nama}</p>
          {row.kode && <p className="text-xs text-dark-400">{row.kode}</p>}
        </div>
      ),
    },
    { key: 'kategori', header: 'Kategori', render: (row) => row.kategori || '-' },
    {
      key: 'jumlah',
      header: 'Jumlah',
      render: (row) => (
        <span className="font-medium">
          {row.jumlah} <span className="text-xs font-normal text-dark-400">{row.satuan}</span>
        </span>
      ),
    },
    {
      key: 'kondisi',
      header: 'Kondisi',
      render: (row) => <span className={badgeForKondisi(row.kondisi)}>{labelOf(KONDISI_INVENTARIS, row.kondisi)}</span>,
    },
    {
      key: 'harga_beli',
      header: 'Harga Beli',
      render: (row) => (row.harga_beli ? formatRupiah(row.harga_beli) : '-'),
    },
    {
      key: 'estimasi_nilai',
      header: 'Estimasi Nilai',
      render: (row) => (row.estimasi_nilai ? formatRupiah(row.estimasi_nilai) : '-'),
    },
    { key: 'lokasi', header: 'Lokasi', render: (row) => row.lokasi || '-' },
    {
      key: 'tanggal_beli',
      header: 'Tgl Beli',
      render: (row) => (row.tanggal_beli ? formatTanggal(row.tanggal_beli, 'dd MMM yyyy') : '-'),
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
            aria-label="Edit inventaris"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setDeleteTarget(row)}
            className="rounded-lg p-1.5 text-dark-500 transition-colors hover:bg-red-50 hover:text-red-600"
            aria-label="Hapus inventaris"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Inventaris & Aset"
        subtitle="Kelola aset dan perlengkapan masjid"
        icon={Package}
        actions={
          <Button icon={Plus} onClick={openCreateModal}>
            Tambah Aset
          </Button>
        }
      />

      {/* Ringkasan */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50">
              <Boxes className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <p className="text-xs text-dark-500">Total Item</p>
              <p className="text-lg font-bold text-dark-900">{stats.total || 0}</p>
            </div>
          </div>
        </Card>
        <Card className="!p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
              <Package className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-dark-500">Total Unit</p>
              <p className="text-lg font-bold text-dark-900">{stats.totalUnit || 0}</p>
            </div>
          </div>
        </Card>
        <Card className="col-span-2 !p-4 lg:col-span-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold-50 bg-accent-50">
              <Boxes className="h-5 w-5 text-accent-600" />
            </div>
            <div>
              <p className="text-xs text-dark-500">Total Nilai Estimasi</p>
              <p className="text-lg font-bold text-dark-900">{formatRupiah(stats.totalNilai || 0)}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Kondisi ringkas */}
      {stats.perKondisi?.length > 0 && (
        <Card className="!p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-dark-600">Kondisi aset:</span>
            {stats.perKondisi.map((k) => (
              <span key={k.kondisi} className={badgeForKondisi(k.kondisi)}>
                {labelOf(KONDISI_INVENTARIS, k.kondisi)}: {k.total}
              </span>
            ))}
          </div>
        </Card>
      )}

      <Card noPadding className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex-1">
            <SearchInput
              value={params.search}
              onChange={(search) => setParams((p) => ({ ...p, search, page: 1 }))}
              placeholder="Cari nama, kode, kategori, lokasi..."
            />
          </div>
          <div className="w-full sm:w-48">
            <FormSelect
              name="kondisi"
              placeholder="Semua kondisi"
              options={KONDISI_INVENTARIS}
              value={params.kondisi}
              onChange={(e) => setParams((p) => ({ ...p, kondisi: e.target.value, page: 1 }))}
            />
          </div>
          {(params.search || params.kondisi) && (
            <Button variant="ghost" onClick={() => setParams((p) => ({ ...p, search: '', kondisi: '', page: 1 }))}>
              Reset filter
            </Button>
          )}
        </div>
      </Card>

      <DataTable
        columns={columns}
        data={inventaris}
        loading={isLoading}
        rowKey="id"
        empty={{
          icon: Package,
          title: 'Tidak ada inventaris',
          description: params.search ? `Tidak ada hasil untuk "${params.search}"` : 'Belum ada aset terdaftar.',
          action: <Button icon={Plus} onClick={openCreateModal}>Tambah Aset</Button>,
        }}
        pagination={
          pagination
            ? { ...pagination, onPageChange: (page) => setParams((p) => ({ ...p, page })) }
            : null
        }
      />

      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editing ? 'Edit Inventaris' : 'Tambah Inventaris'}
        size="lg"
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
          <FormInput label="Nama Aset" required error={errors.nama} {...register('nama')} />
          <FormInput label="Kode Inventaris" placeholder="INV-XXX-001" error={errors.kode} {...register('kode')} />
          <FormInput label="Kategori" placeholder="Elektronik" error={errors.kategori} {...register('kategori')} />
          <FormInput label="Jumlah" type="number" min="0" error={errors.jumlah} {...register('jumlah')} />
          <FormInput label="Satuan" placeholder="unit" error={errors.satuan} {...register('satuan')} />
          <FormSelect label="Kondisi" required error={errors.kondisi} {...register('kondisi')}>
            {KONDISI_INVENTARIS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </FormSelect>
          <FormInput label="Tanggal Pembelian" type="date" error={errors.tanggalBeli} {...register('tanggalBeli')} />
          <FormInput label="Harga Beli (Rp)" type="number" min="0" error={errors.hargaBeli} {...register('hargaBeli')} />
          <FormInput
            label="Estimasi Nilai (Rp)"
            type="number"
            min="0"
            error={errors.estimasiNilai}
            hint="Nilai saat ini (opsional)"
            {...register('estimasiNilai')}
          />
          <FormInput label="Lokasi" placeholder="Ruang utama" error={errors.lokasi} {...register('lokasi')} />
          <FormInput label="Sumber Dana" placeholder="Kas masjid / donasi" error={errors.sumberDana} {...register('sumberDana')} />
          <div className="sm:col-span-2">
            <FormTextarea label="Keterangan" rows={2} error={errors.keterangan} {...register('keterangan')} />
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
        loading={deleteMutation.isPending}
        title="Hapus Inventaris"
        message={`Hapus aset "${deleteTarget?.nama}"? Aksi ini tidak dapat dibatalkan.`}
        confirmText="Ya, hapus"
      />
    </div>
  );
};

export default InventarisPage;
