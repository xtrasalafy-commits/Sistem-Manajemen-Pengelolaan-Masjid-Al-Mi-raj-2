import { Inbox } from 'lucide-react';
import cn from '../../utils/cn';

/**
 * Empty state untuk list/tabel kosong.
 */
const EmptyState = ({ icon: Icon = Inbox, title = 'Tidak ada data', description = 'Data belum tersedia saat ini.', action = null, className = '' }) => (
  <div className={cn('flex flex-col items-center justify-center gap-3 py-12 text-center', className)}>
    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-50">
      <Icon className="h-8 w-8 text-primary-500" aria-hidden />
    </div>
    <div className="space-y-1">
      <h4 className="font-semibold text-dark-800">{title}</h4>
      <p className="max-w-sm text-sm text-dark-500">{description}</p>
    </div>
    {action && <div className="mt-2">{action}</div>}
  </div>
);

export default EmptyState;
