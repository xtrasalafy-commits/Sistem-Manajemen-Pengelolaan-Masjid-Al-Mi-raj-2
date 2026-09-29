import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Clock, Plus, Pencil, Trash2, Sunrise, Sun, Sunset, Moon, CalendarDays } from 'lucide-react';

import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import FormInput from '../../components/ui/FormInput';
import FormSelect from '../../components/ui/FormSelect';
import FormTextarea from '../../components/ui/FormTextarea';
import EmptyState from '../../components/ui/EmptyState';

import { jadwalApi } from '../../services/endpoints';
import useAuthStore from '../../store/authStore';
import { SHOLAT_LIST } from '../../utils/constants';
import { formatTanggal } from '../../utils/format';

const jadwalSchema = z.object({
  tanggal: z.string().min(1, 'Tanggal wajib diisi'),
  sholat: z.string().min(1, 'Pilih sholat'),
  waktu: z.string().min(1, 'Waktu wajib diisi').regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Format HH:MM'),
  kota: z.string().min(1, 'Kota wajib diisi'),
  imam: z.string().optional(),
  khotib: z.string().optional(),
  keterangan: z.string().optional(),
});

const bulkSchema = z.object({
  kota: z.string().min(1, 'Kota wajib diisi'),
  imam: z.string().optional(),
  items: z.string().min(1, 'Isi minimal 1 baris'),
});

const SHOLAT_ICONS = {
  subuh: Sunrise,
  dzuhur: Sun,
  ashar: Sun,
  maghrib: Sunset,
  isya: Moon,
  jumat: CalendarDays,
};

const JadwalSholatPage = () => {
  const queryClient = useQueryClient();
  const canManage = useAuthStore((s) => s.canManage());

  const [tanggal, setTanggal] = useState(new Date().toISOString().slice(0, 10));
  const [modalOpen, setModalOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['jadwal', tanggal],
    queryFn: () => jadwalApi.getAll({ tanggal }),
  });

  const jadwal = data?.data?.jadwal || [];

  const createMutation = useMutation({
    mutationFn: jadwalApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jadwal'] });
      toast.success('Jadwal sholat ditambahkan');
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => jadwalApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jadwal'] });
      toast.success('Jadwal diperbarui');
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: jadwalApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jadwal'] });
      toast.success('Jadwal dihapus');
      setDeleteTarget(null);
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(jadwalSchema) });

  const {
    register: registerBulk,
    handleSubmit: handleBulkSubmit,
    reset: resetBulk,
    formState: { errors: bulkErrors },
  } = useForm({ resolver: zodResolver(bulkSchema) });

  const openCreateModal = () => {
    reset({ tanggal, sholat: '', waktu: '', kota: 'Jakarta', imam: '', khotib: '', keterangan: '' });
    setEditing(null);
    setModalOpen(true);
  };

  const openEditModal = (row) => {
    reset({
      tanggal: row.tanggal?.slice(0, 10) || tanggal,
      sholat: row.sholat,
      waktu: row.waktu,
      kota: row.kota,
      imam: row.imam || '',
      khotib: row.khotib || '',
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
    const payload = Object.fromEntries(Object.entries(formData).filter(([, v]) => v !== ''));
    if (editing) updateMutation.mutate({ id: editing.id, data: payload });
    else createMutation.mutate(payload);
  };

  const onBulkSubmit = (formData) => {
    const items = formData.items
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [tgl, sholat, waktu] = line.split(',').map((s) => s.trim());
        return { tanggal: tgl, sholat, waktu };
      })
      .filter((i) => i.tanggal && i.sholat && i.waktu);

    if (items.length === 0) {
      toast.error('Tidak ada baris valid');
      return;
    }
    bulkMutation.mutate({ ...formData, items });
  };

  const bulkMutation = useMutation({
    mutationFn: jadwalApi.bulkCreate,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['jadwal'] });
      toast.success(res.message || 'Bulk insert selesai');
      setBulkOpen(false);
      resetBulk();
    },
  });

  // Slot sholat yang belum diisi
  const sudahIsi = new Set(jadwal.map((j) => j.sholat));
  const slotKosong = SHOLAT_LIST.filter((s) => !sudahIsi.has(s.value));

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Jadwal Sholat"
        subtitle="Jadwal waktu sholat & imam masjid"
        icon={Clock}
        actions={
          canManage && (
            <>
              <Button variant="secondary" icon={Plus} onClick={() => setBulkOpen(true)}>
                Input Banyak
              </Button>
              <Button icon={Plus} onClick={openCreateModal}>
                Tambah Jadwal
              </Button>
            </>
          )
        }
      />

      {/* Pilih tanggal */}
      <Card className="!p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <CalendarDays className="h-5 w-5 text-primary-600" />
            <div>
              <FormInput
                label=""
                type="date"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                className="!py-2"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const d = new Date(tanggal);
                d.setDate(d.getDate() - 1);
                setTanggal(d.toISOString().slice(0, 10));
              }}
            >
              ← Hari sebelumnya
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const d = new Date(tanggal);
                d.setDate(d.getDate() + 1);
                setTanggal(d.toISOString().slice(0, 10));
              }}
            >
              Hari berikutnya →
            </Button>
          </div>
        </div>
      </Card>

      <p className="text-sm font-medium text-dark-700">
        {formatTanggal(tanggal, 'EEEE, dd MMMM yyyy')}
      </p>

      {/* Kartu jadwal */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl bg-dark-100" />
          ))}
        </div>
      ) : jadwal.length === 0 ? (
        <Card>
          <EmptyState
            icon={Clock}
            title="Belum ada jadwal"
            description={`Jadwal sholat untuk ${formatTanggal(tanggal)} belum diinput.`}
            action={canManage ? <Button icon={Plus} onClick={openCreateModal}>Tambah Jadwal</Button> : null}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {jadwal.map((j) => {
            const Icon = SHOLAT_ICONS[j.sholat] || Clock;
            return (
              <div
                key={j.id}
                className="group relative overflow-hidden rounded-xl border border-dark-100 bg-white p-5 shadow-card transition-shadow hover:shadow-soft"
              >
                <div className="absolute right-0 top-0 h-24 w-24 -translate-y-8 translate-x-8 rounded-full bg-primary-50" aria-hidden />
                <div className="relative flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-100">
                      <Icon className="h-5 w-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="font-semibold capitalize text-dark-900">{j.sholat}</p>
                      <p className="text-xs text-dark-400">{j.kota}</p>
                    </div>
                  </div>
                  <p className="font-arabic text-3xl font-bold text-primary-700" dir="ltr">
                    {j.waktu}
                  </p>
                </div>
                <div className="relative mt-4 space-y-1 text-sm">
                  {j.imam && (
                    <p className="text-dark-600">
                      <span className="text-dark-400">Imam:</span> {j.imam}
                    </p>
                  )}
                  {j.khotib && (
                    <p className="text-dark-600">
                      <span className="text-dark-400">Khotib:</span> {j.khotib}
                    </p>
                  )}
                  {j.keterangan && <p className="text-xs text-dark-400">{j.keterangan}</p>}
                </div>

                {canManage && (
                  <div className="relative mt-4 flex gap-2 border-t border-dark-50 pt-3">
                    <button
                      type="button"
                      onClick={() => openEditModal(j)}
                      className="inline-flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700"
                    >
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(j)}
                      className="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Hapus
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {/* Slot kosong */}
          {canManage &&
            slotKosong.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={openCreateModal}
                className="flex min-h-[160px] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-dark-200 text-dark-400 transition-colors hover:border-primary-400 hover:text-primary-600"
              >
                <Plus className="h-6 w-6" />
                <span className="text-sm font-medium capitalize">Isi jadwal {s.label}</span>
              </button>
            ))}
        </div>
      )}

      {/* Modal form */}
      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editing ? 'Edit Jadwal Sholat' : 'Tambah Jadwal Sholat'}
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
          <FormInput label="Tanggal" type="date" required error={errors.tanggal} {...register('tanggal')} />
          <FormSelect label="Sholat" required error={errors.sholat} {...register('sholat')}>
            {SHOLAT_LIST.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </FormSelect>
          <FormInput label="Waktu (HH:MM)" type="time" required error={errors.waktu} {...register('waktu')} />
          <FormInput label="Kota" required error={errors.kota} {...register('kota')} />
          <FormInput label="Imam" placeholder="Ustadz..." error={errors.imam} {...register('imam')} />
          <FormInput label="Khotib" placeholder="Khusus Jumat" error={errors.khotib} {...register('khotib')} />
          <div className="sm:col-span-2">
            <FormTextarea label="Keterangan" rows={2} error={errors.keterangan} {...register('keterangan')} />
          </div>
        </form>
      </Modal>

      {/* Bulk input */}
      <Modal
        isOpen={bulkOpen}
        onClose={() => setBulkOpen(false)}
        title="Input Jadwal Banyak Sekaligus"
        description="Satu baris per jadwal dengan format: tanggal,sholat,waktu"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setBulkOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleBulkSubmit(onBulkSubmit)} loading={bulkMutation.isPending}>
              Proses
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormInput label="Kota" required error={bulkErrors.kota} {...registerBulk('kota')} />
            <FormInput label="Imam (berlaku semua)" {...registerBulk('imam')} />
          </div>
          <FormTextarea
            label="Daftar jadwal"
            rows={8}
            required
            placeholder={'2025-01-01,subuh,04:35\n2025-01-01,dzuhur,11:55\n2025-01-01,ashar,15:15'}
            hint="Format: YYYY-MM-DD,sholat,waktu (satu per baris)"
            error={bulkErrors.items}
            {...registerBulk('items')}
          />
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
        loading={deleteMutation.isPending}
        title="Hapus Jadwal"
        message={`Hapus jadwal ${deleteTarget?.sholat} (${deleteTarget?.waktu})?`}
        confirmText="Ya, hapus"
      />
    </div>
  );
};

export default JadwalSholatPage;
