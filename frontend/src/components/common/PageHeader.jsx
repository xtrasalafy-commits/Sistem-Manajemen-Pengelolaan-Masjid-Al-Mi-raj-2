import cn from '../../utils/cn';

/**
 * Header halaman: judul, deskripsi, dan aksi (tombol) di kanan.
 */
const PageHeader = ({ title, subtitle = null, actions = null, icon: Icon = null, className = '' }) => (
  <div className={cn('mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between', className)}>
    <div className="flex items-center gap-3">
      {Icon && (
        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-primary-50">
          <Icon className="h-6 w-6 text-primary-600" aria-hidden />
        </div>
      )}
      <div className="min-w-0">
        <h1 className="page-title truncate">{title}</h1>
        {subtitle && <p className="page-subtitle mt-0.5">{subtitle}</p>}
      </div>
    </div>
    {actions && <div className="flex flex-shrink-0 flex-wrap items-center gap-2">{actions}</div>}
  </div>
);

export default PageHeader;
