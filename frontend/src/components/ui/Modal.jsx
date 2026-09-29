import { useEffect } from 'react';
import { X } from 'lucide-react';
import cn from '../../utils/cn';

/**
 * Modal reusable dengan a11y (role=dialog, aria-modal, esc to close).
 */
const Modal = ({ isOpen, onClose, title = null, description = null, children, footer = null, size = 'md', className = '' }) => {
  // Lock body scroll & close on Escape
  useEffect(() => {
    if (!isOpen) return undefined;
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    '2xl': 'max-w-6xl',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-dark-900/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      {/* Panel */}
      <div
        className={cn(
          'relative z-10 w-full overflow-hidden rounded-2xl bg-white shadow-2xl animate-slide-up',
          sizes[size],
          className
        )}
      >
        {(title || onClose) && (
          <div className="flex items-start justify-between gap-4 border-b border-dark-100 px-6 py-4">
            <div className="space-y-0.5">
              {title && <h2 className="text-lg font-bold text-dark-900">{title}</h2>}
              {description && <p className="text-sm text-dark-500">{description}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex-shrink-0 rounded-lg p-1.5 text-dark-400 transition-colors hover:bg-dark-100 hover:text-dark-700"
              aria-label="Tutup dialog"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}

        <div className="max-h-[calc(100vh-14rem)] overflow-y-auto px-6 py-5">{children}</div>

        {footer && (
          <div className="flex items-center justify-end gap-2 border-t border-dark-100 bg-dark-50/50 px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
