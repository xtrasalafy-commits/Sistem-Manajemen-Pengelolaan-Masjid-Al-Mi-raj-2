import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import {
  FileBarChart,
  FileText,
  FileSpreadsheet,
  Trash2,
  Download,
  Sparkles,
  Wallet,
  Users,
  CalendarDays,
  Package,
  LayoutGrid,
} from 'lucide-react';

import PageHeader from '../../components/common/PageHeader';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import DataTable from '../../components/ui/DataTable';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import FormInput from '../../components/ui/FormInput';
import FormSelect from '../../components/ui/FormSelect';
import FormTextarea from '../../components/ui/FormTextarea';
import Modal from '../../components/ui/Modal';

import { laporanApi } from '../../services/endpoints';
import { downloadBlob } from '../../services/endpoints';
import { JENIS_LAPORAN, labelOf } from '../../utils/constants';
import { formatTanggal } from '../../utils/format';

const generateSchema = z.object({
  jenis: z.string().min(1, 'Pilih jenis laporan'),
  format: z.enum(['xlsx', 'pdf']),
  periodeMulai: z.string().min(1, 'Periode mulai wajib diisi'),
  periodeSelesai: z.string().min(1, 'Periode selesai wajib diisi'),
  judul: z.string().optional(),
  save: z.boolean().optional(),
});

const JENIS_ICONS = {
  keuangan: Wallet,
  jamaah: Users,
  kegiatan: CalendarDays,
  inventaris: Package,
  umum: LayoutGrid,
};

const LaporanPage = () => {
  const queryClient = useQueryClient();

  const [params, setParams] = useState({ page: 1, limit: 10 });
  const [generateOpen, setGenerateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [loadingGenerate, setLoadingGenerate] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['laporan', params],
    queryFn: () => laporanApi.getAll(params),
  });
  const { laporan = [], pagination } = data?.data || {};

  const deleteMutation = useMutation({
    mutationFn: laporanApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['laporan'] });
      toast.success('Laporan dihapus');
      setDeleteTarget(null);
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(generateSchema),
    defaultValues: {
      jenis: 'keuangan',
      format: 'xlsx',
      periodeMulai: `${new Date().getFullYear()}-01-01`,
      periodeSelesai: new Date().toISOString().slice(0, 10),
      save: true,
    },
  });

  const handleGenerate = async (formData) => {
    const fmt = formData.format;
    setLoadingGenerate(fmt);
    try {
      const res = await laporanApi.generate(formData);
      const jenisLabel = labelOf(JENIS_LAPORAN, formData.jenis).toLowerCase().replace(/\s+/g, '-');
      downloadBlob(res, `laporan-${jenisLabel}-${formData.periodeMulai}-sd-${formData.periodeSelesai}.${fmt}`);
      toast.success(`Laporan ${fmt.toUpperCase()} berhasil dibuat${formData.save ? ' & disimpan' : ''}`);
      if (formData.save) {
        queryClient.invalidateQueries({ queryKey: ['laporan'] });
      }
      setGenerateOpen(false);
    } catch (err) {
      console.error(err);
      toast.error('Gagal membuat laporan');
    } finally {
      setLoadingGenerate(null);
    }
  };

  const columns = [
    {
      key: 'judul',
      header: 'Judul Laporan',
      render: (row) => (
        <div className="min-w-0">
          <p className="font-medium text-dark-800">{row.judul}</p>
          {row.ringkasan && <p className="text-xs text-dark-400">{row.ringkasan}</p>}
        </div>
      ),
    },
    {
      key: 'jenis',
      header: 'Jenis',
      render: (row) => {
        const Icon = JENIS_ICONS[row.jenis] || FileText;
        return (
          <span className="badge-blue">
            <Icon className="h-3 w-3" /> {labelOf(JENIS_LAPORAN, row.jenis)}
          </span>
        );
      },
    },
    {
      key: 'periode',
      header: 'Periode',
      render: (row) => (
        <span className="whitespace-nowrap text-dark-600">
          {formatTanggal(row.periode_mulai, 'dd MMM yyyy')} - {formatTanggal(row.periode_selesai, 'dd MMM yyyy')}
        </span>
      ),
    },
    { key: 'dibuat_oleh', header: 'Dibuat Oleh', render: (row) => row.dibuat_oleh || '-' },
    {
      key: 'created_at',
      header: 'Tanggal Dibuat',
      render: (row) => formatTanggal(row.created_at, 'dd MMM yyyy'),
    },
    {
      key: 'aksi',
      header: 'Aksi',
      render: (row) => (
        <button
          type="button"
          onClick={() => setDeleteTarget(row)}
          className="rounded-lg p-1.5 text-dark-500 transition-colors hover:bg-red-50 hover:text-red-600"
          aria-label="Hapus laporan"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Laporan"
        subtitle="Generate laporan dalam format PDF & Excel"
        icon={FileBarChart}
        actions={
          <Button icon={Sparkles} onClick={() => setGenerateOpen(true)}>
            Generate Laporan
          </Button>
        }
      />

      {/* Kartu cepat per jenis */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {JENIS_LAPORAN.map((j) => {
          const Icon = JENIS_ICONS[j.value] || FileText;
          return (
            <button
              key={j.value}
              type="button"
              onClick={() => {
                reset((prev) => ({ ...prev, jenis: j.value }));
                setGenerateOpen(true);
              }}
              className="group flex flex-col items-center gap-3 rounded-xl border border-dark-100 bg-white p-5 shadow-card transition-all hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-soft"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 transition-colors group-hover:bg-primary-100">
                <Icon className="h-6 w-6 text-primary-600" />
              </div>
              <p className="text-sm font-semibold text-dark-800">{j.label}</p>
            </button>
          );
        })}
      </div>

      <DataTable
        columns={columns}
        data={laporan}
        loading={isLoading}
        rowKey="id"
        empty={{
          icon: FileBarChart,
          title: 'Belum ada laporan',
          description: 'Generate laporan pertama Anda dengan menekan tombol di atas.',
          action: <Button icon={Sparkles} onClick={() => setGenerateOpen(true)}>Generate Laporan</Button>,
        }}
        pagination={
          pagination
            ? { ...pagination, onPageChange: (page) => setParams((p) => ({ ...p, page })) }
            : null
        }
      />

      {/* Modal generate */}
      <Modal
        isOpen={generateOpen}
        onClose={() => setGenerateOpen(false)}
        title="Generate Laporan"
        description="Pilih jenis, periode, dan format file"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setGenerateOpen(false)}>
              Batal
            </Button>
            <Button
              icon={Download}
              onClick={handleSubmit(handleGenerate)}
              loading={loadingGenerate !== null}
            >
              {loadingGenerate ? `Membuat ${loadingGenerate.toUpperCase()}...` : 'Download Laporan'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit(handleGenerate)} className="space-y-4" noValidate>
          <FormSelect label="Jenis Laporan" required error={errors.jenis} {...register('jenis')}>
            {JENIS_LAPORAN.map((j) => (
              <option key={j.value} value={j.value}>
                {j.label}
              </option>
            ))}
          </FormSelect>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormInput label="Periode Mulai" type="date" required error={errors.periodeMulai} {...register('periodeMulai')} />
            <FormInput
              label="Periode Selesai"
              type="date"
              required
              error={errors.periodeSelesai}
              {...register('periodeSelesai')}
            />
          </div>

          <FormSelect label="Format File" required error={errors.format} {...register('format')}>
            <option value="xlsx">Excel (.xlsx)</option>
            <option value="pdf">PDF (.pdf)</option>
          </FormSelect>

          <FormInput
            label="Judul (opsional)"
            placeholder="Otomatis jika dikosongkan"
            error={errors.judul}
            {...register('judul')}
          />

          <label className="flex items-center gap-3 rounded-lg border border-dark-100 bg-dark-50/50 px-3 py-2.5">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-dark-300 text-primary-600 focus:ring-primary-500"
              {...register('save')}
            />
            <span className="text-sm text-dark-700">Simpan ke daftar laporan</span>
          </label>

          <div className="flex gap-2 border-t border-dark-100 pt-4">
            <Button
              type="button"
              variant="secondary"
              icon={FileSpreadsheet}
              className="flex-1"
              onClick={() => {
                reset((prev) => ({ ...prev, format: 'xlsx' }));
                handleSubmit(handleGenerate)();
              }}
              disabled={loadingGenerate !== null}
            >
              Excel
            </Button>
            <Button
              type="button"
              variant="secondary"
              icon={FileText}
              className="flex-1"
              onClick={() => {
                reset((prev) => ({ ...prev, format: 'pdf' }));
                handleSubmit(handleGenerate)();
              }}
              disabled={loadingGenerate !== null}
            >
              PDF
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
        loading={deleteMutation.isPending}
        title="Hapus Laporan"
        message={`Hapus laporan "${deleteTarget?.judul}"?`}
        confirmText="Ya, hapus"
      />
    </div>
  );
};

export default LaporanPage;
