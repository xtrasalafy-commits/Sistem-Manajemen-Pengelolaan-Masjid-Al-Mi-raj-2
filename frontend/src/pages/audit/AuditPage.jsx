import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ShieldCheck, Search as SearchIcon } from 'lucide-react';

import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import DataTable from '../../components/ui/DataTable';
import FormSelect from '../../components/ui/FormSelect';
import FormInput from '../../components/ui/FormInput';
import SearchInput from '../../components/ui/SearchInput';

import { auditApi } from '../../services/endpoints';
import { formatTanggalWaktu, potong } from '../../utils/format';

const AKSI_BADGE = {
  CREATE: 'badge-green',
  UPDATE: 'badge-yellow',
  DELETE: 'badge-red',
  EXPORT: 'badge-blue',
  LOGIN: 'badge-blue',
  LOGOUT: 'badge-gray',
};

const AuditPage = () => {
  const [params, setParams] = useState({
    page: 1,
    limit: 15,
    search: '',
    modul: '',
    aksi: '',
    tanggalMulai: '',
    tanggalSelesai: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['audit', params],
    queryFn: () => auditApi.getAll(params),
  });
  const { audit = [], pagination } = data?.data || {};

  const { data: modulData } = useQuery({
    queryKey: ['audit-modul'],
    queryFn: auditApi.getModulList,
  });
  const modulList = modulData?.data?.modul || [];

  const isFiltered = params.search || params.modul || params.aksi || params.tanggalMulai || params.tanggalSelesai;

  const columns = [
    {
      key: 'created_at',
      header: 'Waktu',
      render: (row) => <span className="whitespace-nowrap text-dark-600">{formatTanggalWaktu(row.created_at)}</span>,
    },
    {
      key: 'user_nama',
      header: 'Pelaku',
      render: (row) => (
        <div className="min-w-0">
          <p className="font-medium text-dark-800">{row.user_nama || 'Sistem'}</p>
          <p className="text-xs text-dark-400">{row.user_email || '-'}</p>
        </div>
      ),
    },
    {
      key: 'aksi',
      header: 'Aksi',
      render: (row) => <span className={AKSI_BADGE[row.aksi] || 'badge-gray'}>{row.aksi}</span>,
    },
    { key: 'modul', header: 'Modul', render: (row) => <span className="capitalize">{row.modul.replace(/_/g, ' ')}</span> },
    { key: 'ip_address', header: 'IP', render: (row) => <span className="text-dark-500">{row.ip_address || '-'}</span> },
    {
      key: 'detail',
      header: 'Detail',
      render: (row) => {
        if (!row.detail) return '-';
        const str = typeof row.detail === 'string' ? row.detail : JSON.stringify(row.detail);
        return (
          <span className="block max-w-md truncate text-dark-500" title={str}>
            {potong(str, 80)}
          </span>
        );
      },
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Audit Trail"
        subtitle="Riwayat aksi kritis: transaksi keuangan, CRUD data, login & export"
        icon={ShieldCheck}
      />

      <Card noPadding className="p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-1">
            <SearchInput
              value={params.search}
              onChange={(search) => setParams((p) => ({ ...p, search, page: 1 }))}
              placeholder="Cari modul/aksi..."
            />
          </div>
          <FormSelect
            name="modulFilter"
            placeholder="Semua modul"
            options={modulList.map((m) => ({ value: m, label: m.replace(/_/g, ' ') }))}
            value={params.modul}
            onChange={(e) => setParams((p) => ({ ...p, modul: e.target.value, page: 1 }))}
          />
          <FormSelect
            name="aksiFilter"
            placeholder="Semua aksi"
            options={Object.keys(AKSI_BADGE).map((a) => ({ value: a, label: a }))}
            value={params.aksi}
            onChange={(e) => setParams((p) => ({ ...p, aksi: e.target.value, page: 1 }))}
          />
          <div className="flex gap-2">
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
        </div>
        {isFiltered && (
          <div className="mt-3 flex items-center justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                setParams((p) => ({
                  ...p,
                  search: '', modul: '', aksi: '', tanggalMulai: '', tanggalSelesai: '', page: 1,
                }))
              }
            >
              Reset filter
            </Button>
          </div>
        )}
      </Card>

      <DataTable
        columns={columns}
        data={audit}
        loading={isLoading}
        rowKey="id"
        empty={{
          icon: ShieldCheck,
          title: 'Tidak ada log audit',
          description: params.search ? `Tidak ada hasil untuk "${params.search}"` : 'Belum ada aksi tercatat.',
        }}
        pagination={
          pagination
            ? { ...pagination, onPageChange: (page) => setParams((p) => ({ ...p, page })) }
            : null
        }
      />
    </div>
  );
};

export default AuditPage;
