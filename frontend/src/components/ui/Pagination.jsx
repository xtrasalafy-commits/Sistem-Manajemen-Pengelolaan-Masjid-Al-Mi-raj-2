import { ChevronLeft, ChevronRight } from 'lucide-react';
import cn from '../../utils/cn';

/**
 * Komponen pagination untuk tabel/list.
 */
const Pagination = ({ page, limit, total, totalPages, onPageChange, className = '' }) => {
  if (total === 0 || !totalPages) return null;

  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  // Tentukan range halaman yang ditampilkan (maks 5)
  const range = [];
  const start = Math.max(1, Math.min(page - 2, totalPages - 4));
  const end = Math.min(totalPages, start + 4);
  for (let i = start; i <= end; i++) range.push(i);

  return (
    <div className={cn('flex flex-col items-center justify-between gap-3 px-4 py-3 sm:flex-row', className)}>
      <p className="text-sm text-dark-500">
        Menampilkan <span className="font-medium text-dark-700">{from}</span>–
        <span className="font-medium text-dark-700">{to}</span> dari{' '}
        <span className="font-medium text-dark-700">{total}</span> data
      </p>

      <nav className="flex items-center gap-1" aria-label="Pagination">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-dark-200 bg-white text-dark-600 transition-colors hover:bg-dark-50 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Halaman sebelumnya"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {start > 1 && (
          <span className="px-1 text-sm text-dark-400" aria-hidden>
            ...
          </span>
        )}

        {range.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            aria-current={p === page ? 'page' : undefined}
            className={cn(
              'inline-flex h-8 min-w-[2rem] items-center justify-center rounded-lg px-2 text-sm font-medium transition-colors',
              p === page
                ? 'bg-primary-600 text-white'
                : 'border border-dark-200 bg-white text-dark-600 hover:bg-dark-50'
            )}
          >
            {p}
          </button>
        ))}

        {end < totalPages && (
          <span className="px-1 text-sm text-dark-400" aria-hidden>
            ...
          </span>
        )}

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-dark-200 bg-white text-dark-600 transition-colors hover:bg-dark-50 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Halaman berikutnya"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </nav>
    </div>
  );
};

export default Pagination;
