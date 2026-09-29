import cn from '../../utils/cn';

/**
 * Card container dengan header opsional.
 */
export const Card = ({ children, className = '', title = null, subtitle = null, action = null, noPadding = false, ...props }) => {
  const showHeader = Boolean(title || action);
  return (
    <div className={cn('rounded-xl border border-dark-100 bg-white shadow-card', className)} {...props}>
      {showHeader && (
        <div className="flex flex-col gap-2 border-b border-dark-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {title && <h3 className="font-semibold text-dark-900">{title}</h3>}
            {subtitle && <p className="text-xs text-dark-500">{subtitle}</p>}
          </div>
          {action && <div className="flex-shrink-0">{action}</div>}
        </div>
      )}
      <div className={noPadding ? '' : 'p-6'}>{children}</div>
    </div>
  );
};

export default Card;
