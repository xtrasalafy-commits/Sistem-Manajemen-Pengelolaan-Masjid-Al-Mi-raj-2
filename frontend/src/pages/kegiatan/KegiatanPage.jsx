import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import {
  CalendarDays,
  Plus,
  Pencil,
  Trash2,
  List,
  Calendar as CalendarIcon,
  MapPin,
  User,
} from 'lucide-react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
  parseISO,
} from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

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

import { kegiatanApi } from '../../services/endpoints';
import useAuthStore from '../../store/authStore';
import {
  KATEGORI_KEGIATAN,
  STATUS_KEGIATAN,
  badgeForStatusKegiatan,
  labelOf,
} from '../../utils/constants';
import { formatTanggalWaktu } from '../../utils/format';

const kegiatanSchema = z.object({
  judul: z.string().min(3, 'Judul minimal 3 karakter'),
  deskripsi: z.string().optional(),
  kategori: z.string().min(1, 'Pilih kategori'),
  tanggalMulai: z.string().min(1, 'Tanggal mulai wajib diisi'),
  tanggalSelesai: z.string().optional(),
  lokasi: z.string().optional(),
  pic: z.string().optional(),
  status: z.string().min(1, 'Pilih status'),
});

const PAGE_SIZE = 10;

const KegiatanPage = () => {
  const queryClient = useQueryClient();
  const canManage = useAuthStore((s) => s.canManage());

  const [view, setView] = useState('list'); // 'list' | 'calendar'
  const [params, setParams] = useState({ page: 1, limit: PAGE_SIZE, search: '', kategori: '' });
  const [bulanKalender, setBulanKalender] = useState(new Date());
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['kegiatan', params],
    queryFn: () => kegiatanApi.getAll(params),
  });
  const { kegiatan = [], pagination } = data?.data || {};

  const bulanKey = format(bulanKalender, 'yyyy-MM');
  const { data: calData } = useQuery({
    queryKey: ['kegiatan-calendar', bulanKey],
    queryFn: () => kegiatanApi.getCalendar(bulanKey),
    enabled: view === 'calendar',
  });
  const calKegiatan = calData?.data?.kegiatan || [];

  const createMutation = useMutation({
    mutationFn: kegiatanApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kegiatan'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Kegiatan ditambahkan');
      closeModal();
    },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => kegiatanApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kegiatan'] });
      toast.success('Kegiatan diperbarui');
      closeModal();
    },
  });
  const deleteMutation = useMutation({
    mutationFn: kegiatanApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kegiatan'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Kegiatan dihapus');
      setDeleteTarget(null);
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(kegiatanSchema) });

  const openCreateModal = () => {
    reset({
      judul: '', deskripsi: '', kategori: 'ibadah',
      tanggalMulai: '', tanggalSelesai: '', lokasi: "Masjid Al-Mi'raj", pic: '', status: 'direncanakan',
    });
    setEditing(null);
    setModalOpen(true);
  };

  const openEditModal = (row) => {
    reset({
      judul: row.judul,
      deskripsi: row.deskripsi || '',
      kategori: row.kategori,
      tanggalMulai: row.tanggal_mulai ? row.tanggal_mulai.slice(0, 16) : '',
      tanggalSelesai: row.tanggal_selesai ? row.tanggal_selesai.slice(0, 16) : '',
      lokasi: row.lokasi || '',
      pic: row.pic || '',
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

  // --- Generate grid kalender ---
  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(bulanKalender), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(bulanKalender), { weekStartsOn: 0 });
    const days = [];
    let d = start;
    while (d <= end) {
      days.push(d);
      d = addDays(d, 1);
    }
    return days;
  }, [bulanKalender]);

  const kegiatanDiHari = (day) =>
    calKegiatan.filter((k) => {
      const mulai = parseISO(k.tanggal_mulai);
      const selesai = k.tanggal_selesai ? parseISO(k.tanggal_selesai) : mulai;
      return day >= startOfDay(mulai) && day <= endOfDaySafe(selesai);
    });

  const columns = [
    {
      key: 'judul',
      header: 'Kegiatan',
      sortable: true,
      render: (row) => (
        <div className="min-w-0">
          <p className="font-medium text-dark-800">{row.judul}</p>
          {row.deskripsi && <p className="line-clamp-1 text-xs text-dark-400">{row.deskripsi}</p>}
        </div>
      ),
    },
    {
      key: 'kategori',
      header: 'Kategori',
      sortable: true,
      render: (row) => <span className="badge-blue">{labelOf(KATEGORI_KEGIATAN, row.kategori)}</span>,
    },
    {
      key: 'tanggal_mulai',
      header: 'Jadwal',
      sortable: true,
      render: (row) => (
        <div className="text-xs">
          <p className="font-medium text-dark-700">Mulai: {formatTanggalWaktu(row.tanggal_mulai)}</p>
          {row.tanggal_selesai && <p className="text-dark-400">Selesai: {formatTanggalWaktu(row.tanggal_selesai)}</p>}
        </div>
      ),
    },
    { key: 'lokasi', header: 'Lokasi', render: (row) => row.lokasi || '-' },
    { key: 'pic', header: 'PIC', render: (row) => row.pic || '-' },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (row) => <span className={badgeForStatusKegiatan(row.status)}>{labelOf(STATUS_KEGIATAN, row.status)}</span>,
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
                  aria-label="Edit kegiatan"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(row)}
                  className="rounded-lg p-1.5 text-dark-500 transition-colors hover:bg-red-50 hover:text-red-600"
                  aria-label="Hapus kegiatan"
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
        title="Kegiatan Masjid"
        subtitle="Kelola agenda & kegiatan masjid"
        icon={CalendarDays}
        actions={
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-dark-200 bg-white p-0.5">
              <button
                type="button"
                onClick={() => setView('list')}
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  view === 'list' ? 'bg-primary-600 text-white' : 'text-dark-600 hover:bg-dark-50'
                }`}
              >
                <List className="h-3.5 w-3.5" /> List
              </button>
              <button
                type="button"
                onClick={() => setView('calendar')}
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  view === 'calendar' ? 'bg-primary-600 text-white' : 'text-dark-600 hover:bg-dark-50'
                }`}
              >
                <CalendarIcon className="h-3.5 w-3.5" /> Kalender
              </button>
            </div>
            {canManage && (
              <Button icon={Plus} onClick={openCreateModal}>
                Tambah Kegiatan
              </Button>
            )}
          </div>
        }
      />

      {view === 'list' ? (
        <>
          <Card noPadding className="p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex-1">
                <SearchInput
                  value={params.search}
                  onChange={(search) => setParams((p) => ({ ...p, search, page: 1 }))}
                  placeholder="Cari judul, deskripsi, lokasi..."
                />
              </div>
              <div className="w-full sm:w-48">
                <FormSelect
                  name="kategori"
                  placeholder="Semua kategori"
                  options={KATEGORI_KEGIATAN}
                  value={params.kategori}
                  onChange={(e) => setParams((p) => ({ ...p, kategori: e.target.value, page: 1 }))}
                />
              </div>
              {(params.search || params.kategori) && (
                <Button
                  variant="ghost"
                  onClick={() => setParams((p) => ({ ...p, search: '', kategori: '', page: 1 }))}
                >
                  Reset filter
                </Button>
              )}
            </div>
          </Card>

          <DataTable
            columns={columns}
            data={kegiatan}
            loading={isLoading}
            rowKey="id"
            empty={{
              icon: CalendarDays,
              title: 'Tidak ada kegiatan',
              description: params.search ? `Tidak ada hasil untuk "${params.search}"` : 'Belum ada kegiatan terjadwal.',
              action: canManage ? <Button icon={Plus} onClick={openCreateModal}>Tambah Kegiatan</Button> : null,
            }}
            pagination={
              pagination
                ? { ...pagination, onPageChange: (page) => setParams((p) => ({ ...p, page })) }
                : null
            }
          />
        </>
      ) : (
        <CalendarView
          bulanKalender={bulanKalender}
          setBulanKalender={setBulanKalender}
          calendarDays={calendarDays}
          kegiatanDiHari={kegiatanDiHari}
          onEdit={canManage ? openEditModal : null}
        />
      )}

      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editing ? 'Edit Kegiatan' : 'Tambah Kegiatan'}
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
          <div className="sm:col-span-2">
            <FormInput label="Judul Kegiatan" required error={errors.judul} {...register('judul')} />
          </div>
          <div className="sm:col-span-2">
            <FormTextarea label="Deskripsi" rows={3} error={errors.deskripsi} {...register('deskripsi')} />
          </div>
          <FormSelect label="Kategori" required error={errors.kategori} {...register('kategori')}>
            {KATEGORI_KEGIATAN.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </FormSelect>
          <FormSelect label="Status" required error={errors.status} {...register('status')}>
            {STATUS_KEGIATAN.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </FormSelect>
          <FormInput
            label="Tanggal & Waktu Mulai"
            type="datetime-local"
            required
            error={errors.tanggalMulai}
            {...register('tanggalMulai')}
          />
          <FormInput
            label="Tanggal & Waktu Selesai"
            type="datetime-local"
            error={errors.tanggalSelesai}
            hint="Opsional"
            {...register('tanggalSelesai')}
          />
          <FormInput label="Lokasi" error={errors.lokasi} {...register('lokasi')} />
          <FormInput label="Penanggung Jawab (PIC)" error={errors.pic} {...register('pic')} />
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
        loading={deleteMutation.isPending}
        title="Hapus Kegiatan"
        message={`Hapus kegiatan "${deleteTarget?.judul}"?`}
        confirmText="Ya, hapus"
      />
    </div>
  );
};

// Helpers untuk filter hari
const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const endOfDaySafe = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);

/**
 * Tampilan kalender bulanan sederhana.
 */
const CalendarView = ({ bulanKalender, setBulanKalender, calendarDays, kegiatanDiHari, onEdit }) => {
  const HARI = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

  return (
    <Card noPadding>
      <div className="flex items-center justify-between border-b border-dark-100 px-6 py-4">
        <h3 className="font-bold text-dark-900 capitalize">
          {format(bulanKalender, 'MMMM yyyy', { locale: idLocale })}
        </h3>
        <div className="flex gap-1.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setBulanKalender(new Date(bulanKalender.getFullYear(), bulanKalender.getMonth() - 1, 1))}
          >
            ←
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setBulanKalender(new Date(bulanKalender.getFullYear(), bulanKalender.getMonth() + 1, 1))}
          >
            →
          </Button>
        </div>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-7 gap-1.5">
          {HARI.map((h) => (
            <div key={h} className="pb-2 text-center text-xs font-semibold uppercase text-dark-400">
              {h}
            </div>
          ))}
          {calendarDays.map((day) => {
            const inMonth = isSameMonth(day, bulanKalender);
            const isToday = isSameDay(day, new Date());
            const items = kegiatanDiHari(day);

            return (
              <div
                key={day.toISOString()}
                className={`min-h-[88px] rounded-lg border p-1.5 transition-colors sm:min-h-[100px] ${
                  inMonth ? 'border-dark-100 bg-white' : 'border-transparent bg-dark-50/50'
                } ${isToday ? 'border-primary-300 ring-1 ring-primary-200' : ''}`}
              >
                <p
                  className={`mb-1 text-xs font-medium ${
                    isToday ? 'font-bold text-primary-700' : inMonth ? 'text-dark-600' : 'text-dark-300'
                  }`}
                >
                  {format(day, 'd')}
                </p>
                <div className="space-y-1">
                  {items.slice(0, 3).map((k) => (
                    <button
                      key={k.id}
                      type="button"
                      onClick={() => onEdit?.(k)}
                      title={`${k.judul} • ${k.lokasi}`}
                      className="block w-full truncate rounded bg-primary-50 px-1.5 py-0.5 text-left text-[10px] font-medium text-primary-700 transition-colors hover:bg-primary-100"
                    >
                      {k.judul}
                    </button>
                  ))}
                  {items.length > 3 && (
                    <p className="px-1 text-[10px] text-dark-400">+{items.length - 3} lainnya</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {calKegiatan.length === 0 && (
          <EmptyState icon={CalendarDays} title="Tidak ada kegiatan" description={`Belum ada kegiatan di ${format(bulanKalender, 'MMMM yyyy', { locale: idLocale })}.`} />
        )}

        {/* Legenda detail */}
        {calKegiatan.length > 0 && (
          <div className="mt-6 border-t border-dark-100 pt-4">
            <h4 className="mb-3 text-sm font-semibold text-dark-800">Daftar kegiatan bulan ini</h4>
            <div className="space-y-2">
              {calKegiatan.map((k) => (
                <button
                  key={k.id}
                  type="button"
                  onClick={() => onEdit?.(k)}
                  className="flex w-full items-center gap-3 rounded-lg border border-dark-100 p-3 text-left transition-colors hover:bg-dark-50"
                >
                  <span className={badgeForStatusKegiatan(k.status)}>{labelOf(STATUS_KEGIATAN, k.status)}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-dark-800">{k.judul}</p>
                    <p className="truncate text-xs text-dark-500">{formatTanggalWaktu(k.tanggal_mulai)}</p>
                  </div>
                  <span className="hidden items-center gap-1 text-xs text-dark-400 sm:inline-flex">
                    <MapPin className="h-3 w-3" /> {k.lokasi}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default KegiatanPage;
