import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Users, Plus, Pencil, Trash2, UserCheck, UserX, Download } from 'lucide-react';

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

import { jamaahApi } from '../../services/endpoints';
import useAuthStore from '../../store/authStore';
import {
  JENIS_KELAMIN,
  STATUS_PERNIKAHAN,
  labelOf,
} from '../../utils/constants';
import { formatTanggal } from '../../utils/format';

const jamaahSchema = z.object({
  nama: z.string().min(3, 'Nama minimal 3 karakter'),
  nik: z
    .string()
    .optional()
    .refine((v) => !v || /^[0-9]{16}$/.test(v), 'NIK harus 16 digit angka'),
  jenisKelamin: z.string().optional(),
  tempatLahir: z.string().optional(),
  tanggalLahir: z.string().optional(),
  telepon: z
    .string()
    .optional()
    .refine((v) => !v || /^[0-9+\-\s]{8,20}$/.test(v), 'Telepon tidak valid'),
  email: z.string().optional().refine((v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), 'Email tidak valid'),
  alamat: z.string().optional(),
  pekerjaan: z.string().optional(),
  statusPernikahan: z.string().optional(),
  tanggalBergabung: z.string().min(1, 'Tanggal bergabung wajib diisi'),
  status: z.enum(['aktif', 'nonaktif']),
});

const PAGE_SIZE = 10;

const JamaahPage = () => {
  const queryClient = useQueryClient();
  const canManage = useAuthStore((s) => s.canManage());

  const [params, setParams] = useState({ page: 1, limit: PAGE_SIZE, search: '', status: '' });
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // --- Query list ---
  const { data, isLoading } = useQuery({
    queryKey: ['jamaah', params],
    queryFn: () => jamaahApi.getAll(params),
  });

  const { jamaah = [], pagination } = data?.data || {};

  // --- Mutations ---
  const createMutation = useMutation({
    mutationFn: jamaahApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jamaah'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Data jamaah berhasil ditambahkan');
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => jamaahApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jamaah'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Data jamaah diperbarui');
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: jamaahApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jamaah'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Data jamaah dihapus');
      setDeleteTarget(null);
    },
  });

  // --- Form ---
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(jamaahSchema),
  });

  const openCreateModal = () => {
    reset({
      nama: '', nik: '', telepon: '', email: '', alamat: '', pekerjaan: '',
      tanggalBergabung: new Date().toISOString().slice(0, 10), status: 'aktif',
    });
    setEditing(null);
    setModalOpen(true);
  };

  const openEditModal = (row) => {
    reset({
      nama: row.nama || '',
      nik: row.nik || '',
      jenisKelamin: row.jenis_kelamin || '',
      tempatLahir: row.tempat_lahir || '',
      tanggalLahir: row.tanggal_lahir ? row.tanggal_lahir.slice(0, 10) : '',
      telepon: row.telepon || '',
      email: row.email || '',
      alamat: row.alamat || '',
      pekerjaan: row.pekerjaan || '',
      statusPernikahan: row.status_pernikahan || '',
      tanggalBergabung: row.tanggal_bergabung ? row.tanggal_bergabung.slice(0, 10) : '',
      status: row.status || 'aktif',
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
    // Hapus field kosong agar tidak menimpa data lama dengan string kosong
    const payload = Object.fromEntries(Object.entries(formData).filter(([, v]) => v !== ''));
    if (editing) {
      updateMutation.mutate({ id: editing.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleSort = (key) => {
    const currentSort = params.sortBy === key && params.sortOrder === 'asc' ? 'desc' : 'asc';
    setParams((p) => ({ ...p, sortBy: key, sortOrder: currentSort, page: 1 }));
  };

  const columns = [
    {
      key: 'nama',
      header: 'Nama Jamaah',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700">
            {(row.nama || '?').split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="font-medium text-dark-800">{row.nama}</p>
            <p className="text-xs text-dark-400">{row.nik || 'NIK belum ada'}</p>
          </div>
        </div>
      ),
    },
    { key: 'jenis_kelamin', header: 'J. Kelamin', render: (row) => labelOf(JENIS_KELAMIN, row.jenis_kelamin) || '-' },
    { key: 'telepon', header: 'Telepon', render: (row) => row.telepon || '-' },
    { key: 'pekerjaan', header: 'Pekerjaan', render: (row) => row.pekerjaan || '-' },
    {
      key: 'tanggal_bergabung',
      header: 'Bergabung',
      sortable: true,
      render: (row) => formatTanggal(row.tanggal_bergabung, 'dd MMM yyyy'),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (row) => (
        <span className={row.status === 'aktif' ? 'badge-green' : 'badge-gray'}>
          {row.status === 'aktif' ? <UserCheck className="h-3 w-3" /> : <UserX className="h-3 w-3" />}
          {row.status}
        </span>
      ),
    },
    ...(canManage
      ? [
          {
            key: 'aksi',
            header: 'Aksi',
            render: (row) => (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => openEditModal(row)}
                  className="rounded-lg p-1.5 text-dark-500 transition-colors hover:bg-primary-50 hover:text-primary-700"
                  aria-label="Edit jamaah"
                  title="Edit"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(row)}
                  className="rounded-lg p-1.5 text-dark-500 transition-colors hover:bg-red-50 hover:text-red-600"
                  aria-label="Hapus jamaah"
                  title="Hapus"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Data Jamaah"
        subtitle="Kelola data anggota jamaah masjid"
        icon={Users}
        actions={
          canManage && (
            <>
              <Button
                variant="secondary"
                icon={Download}
                onClick={() =>
                  toast('Export data jamaah bisa dilakukan via menu Laporan', { icon: '📄' })
                }
              >
                Export
              </Button>
              <Button icon={Plus} onClick={openCreateModal}>
                Tambah Jamaah
              </Button>
            </>
          )
        }
      />

      {/* Filter & search */}
      <Card noPadding className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex-1">
            <SearchInput
              value={params.search}
              onChange={(search) => setParams((p) => ({ ...p, search, page: 1 }))}
              placeholder="Cari nama, NIK, telepon, email..."
            />
          </div>
          <div className="w-full sm:w-48">
            <FormSelect
              name="status"
              placeholder="Semua status"
              options={[
                { value: 'aktif', label: 'Aktif' },
                { value: 'nonaktif', label: 'Nonaktif' },
              ]}
              value={params.status}
              onChange={(e) => setParams((p) => ({ ...p, status: e.target.value, page: 1 }))}
            />
          </div>
          {(params.search || params.status) && (
            <Button
              variant="ghost"
              onClick={() => setParams((p) => ({ ...p, search: '', status: '', page: 1 }))}
            >
              Reset filter
            </Button>
          )}
        </div>
      </Card>

      <DataTable
        columns={columns}
        data={jamaah}
        loading={isLoading}
        rowKey="id"
        onSort={handleSort}
        sortBy={params.sortBy}
        sortOrder={params.sortOrder}
        empty={{
          icon: Users,
          title: 'Tidak ada jamaah ditemukan',
          description: params.search
            ? `Tidak ada hasil untuk pencarian "${params.search}"`
            : 'Belum ada data jamaah terdaftar.',
          action: canManage ? <Button icon={Plus} onClick={openCreateModal}>Tambah Jamaah</Button> : null,
        }}
        pagination={
          pagination
            ? {
                ...pagination,
                onPageChange: (page) => setParams((p) => ({ ...p, page })),
              }
            : null
        }
      />

      {/* Modal create/edit */}
      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editing ? 'Edit Data Jamaah' : 'Tambah Jamaah Baru'}
        description={editing ? `Memperbarui data ${editing.nama}` : 'Lengkapi data jamaah'}
        size="xl"
        footer={
          <>
            <Button variant="secondary" onClick={closeModal} disabled={createMutation.isPending || updateMutation.isPending}>
              Batal
            </Button>
            <Button
              onClick={handleSubmit(onSubmit)}
              loading={createMutation.isPending || updateMutation.isPending}
            >
              {editing ? 'Simpan Perubahan' : 'Simpan'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4 sm:grid-cols-2" noValidate>
          <FormInput
            label="Nama Lengkap"
            placeholder="Ahmad Fauzi"
            error={errors.nama}
            required
            {...register('nama')}
          />
          <FormInput label="NIK" placeholder="16 digit angka" error={errors.nik} hint="Opsional" {...register('nik')} />

          <FormSelect label="Jenis Kelamin" error={errors.jenisKelamin} {...register('jenisKelamin')}>
            {JENIS_KELAMIN.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </FormSelect>

          <FormInput label="Tempat Lahir" placeholder="Jakarta" error={errors.tempatLahir} {...register('tempatLahir')} />

          <FormInput label="Tanggal Lahir" type="date" error={errors.tanggalLahir} {...register('tanggalLahir')} />

          <FormInput label="Telepon" placeholder="0812xxxxxxxx" error={errors.telepon} {...register('telepon')} />

          <FormInput label="Email" type="email" placeholder="nama@email.com" error={errors.email} {...register('email')} />

          <FormInput label="Pekerjaan" placeholder="Guru" error={errors.pekerjaan} {...register('pekerjaan')} />

          <FormSelect label="Status Pernikahan" error={errors.statusPernikahan} {...register('statusPernikahan')}>
            {STATUS_PERNIKAHAN.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </FormSelect>

          <FormInput
            label="Tanggal Bergabung"
            type="date"
            required
            error={errors.tanggalBergabung}
            {...register('tanggalBergabung')}
          />

          <div className="sm:col-span-2">
            <FormTextarea label="Alamat" rows={2} placeholder="Jl. Damai No. 1, Jakarta" error={errors.alamat} {...register('alamat')} />
          </div>

          <FormSelect label="Status" error={errors.status} {...register('status')}>
            <option value="aktif">Aktif</option>
            <option value="nonaktif">Nonaktif</option>
          </FormSelect>

          <div className="sm:col-span-2">
            <FormTextarea label="Keterangan" rows={2} error={errors.keterangan} hint="Opsional" {...register('keterangan')} />
          </div>
        </form>
      </Modal>

      {/* Confirm delete */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
        loading={deleteMutation.isPending}
        title="Hapus Data Jamaah"
        message={`Apakah Anda yakin ingin menghapus data "${deleteTarget?.nama}"? Aksi ini tidak dapat dibatalkan.`}
        confirmText="Ya, hapus"
      />
    </div>
  );
};

export default JamaahPage;
