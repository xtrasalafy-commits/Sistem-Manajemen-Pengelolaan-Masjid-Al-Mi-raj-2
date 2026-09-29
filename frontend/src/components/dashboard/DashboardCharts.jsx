import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

import { formatRupiah } from '../../utils/format';

const GREEN = '#0B6E4F';
const RED = '#dc2626';
const GOLD = '#D4A017';
const PIE_COLORS = ['#0B6E4F', '#D4A017', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

/** Tooltip kustom untuk format Rupiah */
const RupiahTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-dark-100 bg-white p-3 shadow-lg">
      <p className="mb-1.5 text-xs font-semibold text-dark-700">{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-dark-500">{entry.name}:</span>
          <span className="font-semibold text-dark-800">{formatRupiah(entry.value)}</span>
        </div>
      ))}
    </div>
  );
};

/**
 * Chart area: pemasukan vs pengeluaran per bulan.
 */
const TypeLine = ({ data = [] }) => {
  if (!data.length) {
    return (
      <div className="flex h-72 items-center justify-center text-sm text-dark-400">
        Belum ada data transaksi tahun ini
      </div>
    );
  }

  return (
    <div className="h-72 w-full p-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="gradMasuk" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={GREEN} stopOpacity={0.3} />
              <stop offset="95%" stopColor={GREEN} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradKeluar" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={RED} stopOpacity={0.25} />
              <stop offset="95%" stopColor={RED} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis
            dataKey="bulan"
            tick={{ fontSize: 11, fill: '#64748b' }}
            tickFormatter={(b) => {
              const [, m] = b.split('-');
              return ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'][Number(m) - 1] || b;
            }}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#64748b' }}
            tickFormatter={(v) => `${(v / 1000000).toFixed(0)}jt`}
            width={50}
          />
          <Tooltip content={<RupiahTooltip />} />
          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
          <Area
            type="monotone"
            dataKey="masuk"
            name="Pemasukan"
            stroke={GREEN}
            strokeWidth={2}
            fill="url(#gradMasuk)"
          />
          <Area
            type="monotone"
            dataKey="keluar"
            name="Pengeluaran"
            stroke={RED}
            strokeWidth={2}
            fill="url(#gradKeluar)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

/**
 * Chart donat: donasi per tujuan.
 */
const TypeDonut = ({ data = [] }) => {
  if (!data.length) {
    return (
      <div className="flex h-72 items-center justify-center text-sm text-dark-400">
        Belum ada data donasi tahun ini
      </div>
    );
  }

  return (
    <div className="h-72 w-full p-4">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="total"
            nameKey="tujuan"
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={3}
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value, name) => [formatRupiah(value), name]}
            contentStyle={{ borderRadius: '0.5rem', border: '1px solid #e2e8f0', fontSize: '0.75rem' }}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

/**
 * Chart bar kategori keuangan (opsional, dipakai di halaman keuangan).
 */
const TypeBar = ({ data = [], dataKeys = [], colors = [GREEN, RED] }) => {
  if (!data.length) return <div className="flex h-72 items-center justify-center text-sm text-dark-400">Belum ada data</div>;

  return (
    <div className="h-72 w-full p-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis dataKey="kategori" tick={{ fontSize: 10, fill: '#64748b' }} interval={0} angle={-20} textAnchor="end" height={60} />
          <YAxis tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}jt`} width={50} />
          <Tooltip content={<RupiahTooltip />} cursor={{ fill: '#f1f5f9' }} />
          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
          {dataKeys.map((key, i) => (
            <Bar key={key} dataKey={key} fill={colors[i % colors.length]} radius={[4, 4, 0, 0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

DashboardCharts.TypeLine = TypeLine;
DashboardCharts.TypeDonut = TypeDonut;
DashboardCharts.TypeBar = TypeBar;
DashboardCharts.GREEN = GREEN;
DashboardCharts.GOLD = GOLD;
DashboardCharts.PIE_COLORS = PIE_COLORS;

export default DashboardCharts;
