import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';

/**
 * Dialog konfirmasi (delete, aksi destruktif).
 */
const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Konfirmasi',
  message = 'Apakah Anda yakin ingin melanjutkan aksi ini?',
  confirmText = 'Ya, lanjutkan',
  cancelText = 'Batal',
  danger = true,
  loading = false,
}) => (
  <Modal isOpen={isOpen} onClose={onClose} size="sm">
    <div className="flex flex-col items-center gap-4 text-center">
      <div
        className={danger ? 'flex h-14 w-14 items-center justify-center rounded-full bg-red-100' : 'flex h-14 w-14 items-center justify-center rounded-full bg-primary-100'}
      >
        {danger ? (
          <AlertTriangle className="h-7 w-7 text-red-600" aria-hidden />
        ) : (
          <CheckCircle2 className="h-7 w-7 text-primary-600" aria-hidden />
        )}
      </div>
      <div className="space-y-1.5">
        <h2 className="text-lg font-bold text-dark-900">{title}</h2>
        <p className="text-sm text-dark-500">{message}</p>
      </div>
      <div className="mt-2 flex w-full gap-2">
        <Button variant="secondary" className="flex-1" onClick={onClose} disabled={loading}>
          {cancelText}
        </Button>
        <Button
          variant={danger ? 'danger' : 'primary'}
          className="flex-1"
          onClick={onConfirm}
          loading={loading}
          autoFocus
        >
          {confirmText}
        </Button>
      </div>
    </div>
  </Modal>
);

export default ConfirmDialog;
