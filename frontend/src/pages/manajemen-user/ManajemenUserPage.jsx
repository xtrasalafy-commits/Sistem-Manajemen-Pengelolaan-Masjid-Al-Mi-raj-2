import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { UserCog, Plus, Pencil, Trash2, KeyRound } from 'lucide-react';

import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/ui/Button';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import SearchInput from '../../components/ui/SearchInput';
import FormInput from '../../components/ui/FormInput';
import FormSelect from '../../components/ui/FormSelect';

import { userApi } from '../../services/endpoints';
import { ROLES, ROLE_LABEL, ROLE_BADGE, STATUS_LABEL } from '../../utils/constants';
import { formatTanggalWaktu } from '../../utils/format';

const userSchema = z
  .object({
    nama: z.string().min(3, 'Nama minimal 3 karakter'),
    email: z.string().min(1, 'Email wajib diisi').email('Format email tidak valid'),
    password: z
      .string()
      .optional()
      .refine(
        (v) => !v || (v.length >= 8 && /[a-z]/.test(v) && /[A-Z]/.test(v) && /[0-9]/.test(v)),
        'Min 8 karakter: huruf besar, kecil & angka'
      ),
    role: z.string().min(1, 'Pilih role'),
    telepon: z
      .string()
      .optional()
      .refine((v) => !v || /^[0-9+\-\s]{8,20}$/.test(v), 'Telepon tidak valid'),
    status: z.string().min(1, 'Pilih status'),
  })
  .refine((data) => data.password || data._editing, {
    message: 'Password wajib diisi (min 8 karakter: huruf besar, kecil & angka)',
    path: ['password'],
  });

const ManajemenUserPage = () => {
  const queryClient = useQueryClient();

  const [params, setParams] = useState({ page: 1, limit: 10, search: '', role: '', status: '' });
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['users', params],
    queryFn: () => userApi.getAll(params),
  });
  const { users = [], pagination } = data?.data || {};

  const createMutation = useMutation({
    mutationFn: userApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('User berhasil dibuat');
      closeModal();
    },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => userApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('User diperbarui');
      closeModal();
    },
  });
  const deleteMutation = useMutation({
    mutationFn: userApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('User dihapus');
      setDeleteTarget(null);
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({ resolver: zodResolver(userSchema) });

  const openCreateModal = () => {
    reset({
      nama: '', email: '', password: '', role: 'jamaah', telepon: '', status: 'aktif', _editing: false,
    });
    setValue('_editing', false);
    setEditing(null);
    setModalOpen(true);
  };

  const openEditModal = (row) => {
    reset({
      nama: row.nama || '',
      email: row.email || '',
      password: '',
      role: row.role || 'jamaah',
      telepon: row.telepon || '',
      status: row.status || 'aktif',
      _editing: true,
    });
    setValue('_editing', true);
    setEditing(row);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    reset();
  };

  const onSubmit = (formData) => {
    const { _editing, ...payload } = formData;
    // Hapus password kosong saat edit (tidak ubah password)
    if (!payload.password) delete payload.password;
    if (editing) updateMutation.mutate({ id: editing.id, data: payload });
    else createMutation.mutate(payload);
  };

  const columns = [
    {
      key: 'nama',
      header: 'Nama',
      sortable: true,
      render: (row) => (
        <div className="min-w-0">
          <p className="font-medium text-dark-800">{row.nama}</p>
          <p className="text-xs text-dark-400">{row.email}</p>
        </div>
      ),
    },
    { key: 'telepon', header: 'Telepon', render: (row) => row.telepon || '-' },
    {
      key: 'role',
      header: 'Role',
      sortable: true,
      render: (row) => <span className={ROLE_BADGE[row.role]}>{ROLE_LABEL[row.role]}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (row) => (
        <span className={row.status === 'aktif' ? 'badge-green' : 'badge-gray'}>{STATUS_LABEL[row.status]}</span>
      ),
    },
    {
      key: 'last_login',
      header: 'Login Terakhir',
      render: (row) => (row.last_login ? formatTanggalWaktu(row.last_login) : 'Belum pernah'),
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
            aria-label="Edit user"
            title="Edit"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setDeleteTarget(row)}
            className="rounded-lg p-1.5 text-dark-500 transition-colors hover:bg-red-50 hover:text-red-600"
            aria-label="Hapus user"
            title="Hapus"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  const isFiltered = params.search || params.role || params.status;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Manajemen User"
        subtitle="Kelola akun pengguna & hak akses (RBAC)"
        icon={UserCog}
        actions={
          <Button icon={Plus} onClick={openCreateModal}>
            Tambah User
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {Object.values(ROLES).map((role) => {
          const count = users.filter((u) => u.role === role).length;
          return (
            <div key={role} className="flex items-center justify-between rounded-xl border border-dark-100 bg-white p-4 shadow-card">
              <div>
                <p className="text-xs text-dark-500">Role</p>
                <p className="font-semibold text-dark-900">{ROLE_LABEL[role]}</p>
              </div>
              <span className={`flex h-10 min-w-[2.5rem] items-center justify-center rounded-lg px-2 text-lg font-bold ${ROLE_BADGE[role]}`}>
                {count}
              </span>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-dark-100 bg-white p-4 shadow-card">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <SearchInput
              value={params.search}
              onChange={(search) => setParams((p) => ({ ...p, search, page: 1 }))}
              placeholder="Cari nama atau email..."
            />
          </div>
          <FormSelect
            name="roleFilter"
            placeholder="Semua role"
            options={Object.values(ROLES).map((r) => ({ value: r, label: ROLE_LABEL[r] }))}
            value={params.role}
            onChange={(e) => setParams((p) => ({ ...p, role: e.target.value, page: 1 }))}
          />
          <FormSelect
            name="statusFilter"
            placeholder="Semua status"
            options={[
              { value: 'aktif', label: 'Aktif' },
              { value: 'nonaktif', label: 'Nonaktif' },
            ]}
            value={params.status}
            onChange={(e) => setParams((p) => ({ ...p, status: e.target.value, page: 1 }))}
          />
        </div>
        {isFiltered && (
          <div className="mt-3 flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setParams((p) => ({ ...p, search: '', role: '', status: '', page: 1 }))}
            >
              Reset filter
            </Button>
          </div>
        )}
      </div>

      <DataTable
        columns={columns}
        data={users}
        loading={isLoading}
        rowKey="id"
        empty={{
          icon: UserCog,
          title: 'Tidak ada user',
          description: params.search ? `Tidak ada hasil untuk "${params.search}"` : 'Belum ada user terdaftar.',
          action: <Button icon={Plus} onClick={openCreateModal}>Tambah User</Button>,
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
        title={editing ? 'Edit User' : 'Tambah User'}
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={closeModal}>
              Batal
            </Button>
            <Button onClick={handleSubmit(onSubmit)} loading={createMutation.isPending || updateMutation.isPending}>
              {editing ? 'Simpan' : 'Buat'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <FormInput label="Nama Lengkap" required error={errors.nama} {...register('nama')} />
          <FormInput label="Email" type="email" required error={errors.email} {...register('email')} />
          <FormInput
            label="Password"
            type="password"
            required={!editing}
            icon={KeyRound}
            error={errors.password}
            hint={editing ? 'Kosongkan jika tidak ingin mengubah password' : 'Min 8 karakter: huruf besar, kecil & angka'}
            {...register('password')}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormInput label="Telepon" placeholder="0812xxx" error={errors.telepon} {...register('telepon')} />
            <FormSelect label="Role" required error={errors.role} {...register('role')}>
              {Object.values(ROLES).map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABEL[r]}
                </option>
              ))}
            </FormSelect>
          </div>
          <FormSelect label="Status" required error={errors.status} {...register('status')}>
            <option value="aktif">Aktif</option>
            <option value="nonaktif">Nonaktif</option>
          </FormSelect>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
        loading={deleteMutation.isPending}
        title="Hapus User"
        message={`Hapus akun "${deleteTarget?.nama}" (${deleteTarget?.email})? Aksi ini tidak dapat dibatalkan.`}
        confirmText="Ya, hapus"
      />
    </div>
  );
};

export default ManajemenUserPage;
