import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Megaphone, Plus, Pencil, Trash2, Pin, Calendar, Paperclip } from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import SearchInput from '../../components/ui/SearchInput';
import FormInput from '../../components/ui/FormInput';
import FormSelect from '../../components/ui/FormSelect';
import FormTextarea from '../../components/ui/FormTextarea';
import EmptyState from '../../components/ui/EmptyState';
import { LoadingSpinner } from '../../components/ui/Loading';

import { pengumumanApi } from '../../services/endpoints';
import useAuthStore from '../../store/authStore';
import { PRIORITAS, badgeForPrioritas, labelOf } from '../../utils/constants';
import { formatTanggal } from '../../utils/format';

const pengumumanSchema = z.object({
  judul: z.string().min(3, 'Judul minimal 3 karakter'),
  isi: z.string().min(10, 'Isi minimal 10 karakter'),
  kategori: z.string().optional(),
  prioritas: z.string().min(1, 'Pilih prioritas'),
  tanggalMulai: z.string().min(1, 'Tanggal mulai wajib diisi'),
  tanggalSelesai: z.string().optional(),
  status: z.string().min(1, 'Pilih status'),
});

const PAGE_SIZE = 9;

const PengumumanPage = () => {
  const queryClient = useQueryClient();
  const canManage = useAuthStore((s) => s.canManage());

  const [params, setParams] = useState({ page: 1, limit: PAGE_SIZE, search: '', status: '' });
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['pengumuman', params],
    queryFn: () => pengumumanApi.getAll(params),
  });
  const { pengumuman = [], pagination } = data?.data || {};

  const createMutation = useMutation({
    mutationFn: pengumumanApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pengumuman'] });
      queryClient.invalidateQueries({ queryKey: ['pengumuman-aktif'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Pengumuman dipublikasikan');
      closeModal();
    },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => pengumumanApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pengumuman'] });
      queryClient.invalidateQueries({ queryKey: ['pengumuman-aktif'] });
      toast.success('Pengumuman diperbarui');
      closeModal();
    },
  });
  const deleteMutation = useMutation({
    mutationFn: pengumumanApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pengumuman'] });
      queryClient.invalidateQueries({ queryKey: ['pengumuman-aktif'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Pengumuman dihapus');
      setDeleteTarget(null);
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(pengumumanSchema) });

  const openCreateModal = () => {
    reset({
      judul: '', isi: '', kategori: 'umum', prioritas: 'sedang',
      tanggalMulai: new Date().toISOString().slice(0, 10), tanggalSelesai: '', status: 'aktif',
    });
    setEditing(null);
    setModalOpen(true);
  };

  const openEditModal = (row) => {
    reset({
      judul: row.judul,
      isi: row.isi,
      kategori: row.kategori || 'umum',
      prioritas: row.prioritas,
      tanggalMulai: row.tanggal_mulai ? row.tanggal_mulai.slice(0, 10) : '',
      tanggalSelesai: row.tanggal_selesai ? row.tanggal_selesai.slice(0, 10) : '',
      status: row.status,
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
    const payload = { ...formData };
    if (!payload.tanggalSelesai) delete payload.tanggalSelesai;
    if (editing) updateMutation.mutate({ id: editing.id, data: payload });
    else createMutation.mutate(payload);
  };

  const isAktif = (p) =>
    p.status === 'aktif' &&
    p.tanggal_mulai <= new Date().toISOString().slice(0, 10) &&
    (!p.tanggal_selesai || p.tanggal_selesai >= new Date().toISOString().slice(0, 10));

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Pengumuman"
        subtitle="Publikasi pengumuman & informasi untuk jamaah"
        icon={Megaphone}
        actions={
          canManage && (
            <Button icon={Plus} onClick={openCreateModal}>
              Buat Pengumuman
            </Button>
          )
        }
      />

      {canManage && (
        <Card noPadding className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex-1">
              <SearchInput
                value={params.search}
                onChange={(search) => setParams((p) => ({ ...p, search, page: 1 }))}
                placeholder="Cari judul atau isi pengumuman..."
              />
            </div>
            <div className="w-full sm:w-44">
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
              <Button variant="ghost" onClick={() => setParams((p) => ({ ...p, search: '', status: '', page: 1 }))}>
                Reset filter
              </Button>
            )}
          </div>
        </Card>
      )}

      {isLoading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner size="lg" />
        </div>
      ) : pengumuman.length === 0 ? (
        <Card>
          <EmptyState
            icon={Megaphone}
            title="Belum ada pengumuman"
            description={params.search ? `Tidak ada hasil untuk "${params.search}"` : 'Pengumuman akan tampil di sini.'}
            action={canManage ? <Button icon={Plus} onClick={openCreateModal}>Buat Pengumuman</Button> : null}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {pengumuman.map((p) => (
            <Card key={p.id} className="flex flex-col !p-5">
              <div className="flex items-start justify-between gap-2">
                <span className={badgeForPrioritas(p.prioritas)}>
                  {p.prioritas === 'tinggi' && <Pin className="h-3 w-3" />}
                  {labelOf(PRIORITAS, p.prioritas)}
                </span>
                <span className={isAktif(p) ? 'badge-green' : 'badge-gray'}>
                  {isAktif(p) ? 'Berlaku' : p.status === 'nonaktif' ? 'Nonaktif' : 'Selesai'}
                </span>
              </div>

              <h3 className="mt-3 font-bold text-dark-900">{p.judul}</h3>
              <p className="mt-1.5 line-clamp-4 flex-1 text-sm text-dark-600">{p.isi}</p>

              <div className="mt-4 space-y-1.5 border-t border-dark-50 pt-3 text-xs text-dark-400">
                <p className="flex items-center gap-1.5">
                  <Calendar className="h-3 w-3" />
                  {formatTanggal(p.tanggal_mulai)}
                  {p.tanggal_selesai && ` - ${formatTanggal(p.tanggal_selesai)}`}
                </p>
                {p.attachment_url && (
                  <p className="flex items-center gap-1.5">
                    <Paperclip className="h-3 w-3" /> Lampiran tersedia
                  </p>
                )}
                {p.dibuat_oleh && <p>Oleh: {p.dibuat_oleh}</p>}
              </div>

              {canManage && (
                <div className="mt-4 flex gap-2 border-t border-dark-50 pt-3">
                  <button
                    type="button"
                    onClick={() => openEditModal(p)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700"
                  >
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(p)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Hapus
                  </button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Pagination sederhana */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={params.page === 1}
            onClick={() => setParams((p) => ({ ...p, page: p.page - 1 }))}
          >
            ← Sebelumnya
          </Button>
          <span className="text-sm text-dark-500">
            Hal. {params.page} / {pagination.totalPages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={params.page === pagination.totalPages}
            onClick={() => setParams((p) => ({ ...p, page: p.page + 1 }))}
          >
            Berikutnya →
          </Button>
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editing ? 'Edit Pengumuman' : 'Buat Pengumuman'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={closeModal}>
              Batal
            </Button>
            <Button onClick={handleSubmit(onSubmit)} loading={createMutation.isPending || updateMutation.isPending}>
              {editing ? 'Simpan' : 'Publikasikan'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <FormInput label="Judul" required error={errors.judul} {...register('judul')} />
          <FormTextarea label="Isi Pengumuman" rows={5} required error={errors.isi} {...register('isi')} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormInput label="Kategori" placeholder="umum" error={errors.kategori} {...register('kategori')} />
            <FormSelect label="Prioritas" required error={errors.prioritas} {...register('prioritas')}>
              {PRIORITAS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </FormSelect>
            <FormInput label="Tanggal Mulai" type="date" required error={errors.tanggalMulai} {...register('tanggalMulai')} />
            <FormInput
              label="Tanggal Selesai"
              type="date"
              error={errors.tanggalSelesai}
              hint="Kosongkan = berlaku selamanya"
              {...register('tanggalSelesai')}
            />
            <FormSelect label="Status" required error={errors.status} {...register('status')}>
              <option value="aktif">Aktif</option>
              <option value="nonaktif">Nonaktif</option>
            </FormSelect>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
        loading={deleteMutation.isPending}
        title="Hapus Pengumuman"
        message={`Hapus pengumuman "${deleteTarget?.judul}"?`}
        confirmText="Ya, hapus"
      />
    </div>
  );
};

export default PengumumanPage;
