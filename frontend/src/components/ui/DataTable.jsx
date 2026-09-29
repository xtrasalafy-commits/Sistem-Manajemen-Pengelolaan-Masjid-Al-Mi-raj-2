import { ArrowUpDown } from 'lucide-react';
import cn from '../../utils/cn';
import Pagination from './Pagination';
import EmptyState from './EmptyState';
import { LoadingSpinner } from './Loading';

/**
 * Tabel data generik.
 *
 * @param {object} props
 * @param {Array<{key:string, header:string, render?:(row)=>ReactNode, sortable?:boolean, className?:string}>} props.columns
 * @param {Array} props.data
 * @param {boolean} props.loading
 * @param {string} props.rowKey - field untuk key baris
 * @param {object} props.empty - { title, description, action }
 * @param {object} props.pagination - { page, limit, total, totalPages, onPageChange }
 * @param {function} [props.onSort] - (key) => void
 * @param {string} [props.sortBy] - key yang sedang di-sort
 * @param {string} [props.sortOrder] - 'asc' | 'desc'
 */
const DataTable = ({
  columns = [],
  data = [],
  loading = false,
  rowKey = 'id',
  empty = null,
  pagination = null,
  onSort = null,
  sortBy = null,
  sortOrder = 'asc',
  className = '',
}) => {
  const isEmpty = !loading && data.length === 0;

  return (
    <div className={cn('overflow-hidden rounded-xl border border-dark-100 bg-white', className)}>
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(col.className, col.sortable && onSort && 'cursor-pointer select-none')}
                  onClick={() => col.sortable && onSort?.(col.key)}
                  aria-sort={sortBy === col.key ? (sortOrder === 'asc' ? 'ascending' : 'descending') : undefined}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.header}
                    {col.sortable && onSort && (
                      <ArrowUpDown
                        className={cn(
                          'h-3 w-3 transition-colors',
                          sortBy === col.key ? 'text-primary-600' : 'text-dark-300'
                        )}
                        aria-hidden
                      />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-dark-100">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="py-12">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <LoadingSpinner size="lg" />
                    <p className="text-sm font-medium text-dark-500">Memuat data...</p>
                  </div>
                </td>
              </tr>
            ) : isEmpty ? (
              <tr>
                <td colSpan={columns.length}>
                  <EmptyState {...(empty || {})} />
                </td>
              </tr>
            ) : (
              data.map((row, rowIndex) => (
                <tr key={row[rowKey] ?? rowIndex} className="animate-fade-in">
                  {columns.map((col) => (
                    <td key={`${row[rowKey]}-${col.key}`} className={col.className}>
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && !isEmpty && (
        <div className="border-t border-dark-100">
          <Pagination
            page={pagination.page}
            limit={pagination.limit}
            total={pagination.total}
            totalPages={pagination.totalPages}
            onPageChange={pagination.onPageChange}
          />
        </div>
      )}
    </div>
  );
};

export default DataTable;
