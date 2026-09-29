import cn from '../../utils/cn';

const COLOR_VARIANTS = {
  green: { bg: 'bg-primary-50', text: 'text-primary-700', ring: 'ring-primary-100' },
  gold: { bg: 'bg-accent-50', text: 'text-accent-600', ring: 'ring-accent-100' },
  blue: { bg: 'bg-blue-50', text: 'text-blue-700', ring: 'ring-blue-100' },
  red: { bg: 'bg-red-50', text: 'text-red-700', ring: 'ring-red-100' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-700', ring: 'ring-purple-100' },
  gray: { bg: 'bg-dark-100', text: 'text-dark-600', ring: 'ring-dark-200' },
};

/**
 * Kartu statistik untuk dashboard.
 */
const StatCard = ({ title, value, subtitle = null, icon: Icon = null, color = 'green', trend = null, className = '' }) => {
  const colors = COLOR_VARIANTS[color] || COLOR_VARIANTS.green;

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border border-dark-100 bg-white p-5 shadow-card transition-shadow hover:shadow-soft',
        className
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <p className="truncate text-sm font-medium text-dark-500">{title}</p>
          <p className="text-2xl font-bold text-dark-900">{value}</p>
          {subtitle && <p className="truncate text-xs text-dark-400">{subtitle}</p>}
        </div>
        {Icon && (
          <div className={cn('flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ring-4', colors.bg, colors.ring)}>
            <Icon className={cn('h-6 w-6', colors.text)} aria-hidden />
          </div>
        )}
      </div>

      {trend && (
        <div className="mt-3 flex items-center gap-1.5 text-xs">
          <span className={cn('font-semibold', trend.positive ? 'text-primary-600' : 'text-red-600')}>
            {trend.positive ? '▲' : '▼'} {trend.value}
          </span>
          <span className="text-dark-400">{trend.label}</span>
        </div>
      )}
    </div>
  );
};

export default StatCard;
