import { useEffect } from 'react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Удалить',
  cancelLabel = 'Отмена',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape' && !loading) {
        onCancel();
      }
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleEscape);
    };
  }, [loading, onCancel, open]);

  if (!open) {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={() => !loading && onCancel()} role="presentation">
      <section
        aria-modal="true"
        className="modal-card modal-card-small"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className="modal-header">
          <div>
            <h2>{title}</h2>
          </div>

          <button
            aria-label="Закрыть окно"
            className="icon-button"
            onClick={onCancel}
            type="button"
          >
            <svg fill="none" height="16" viewBox="0 0 16 16" width="16">
              <path
                d="M4 4l8 8M12 4l-8 8"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
              />
            </svg>
          </button>
        </div>

        <div className="modal-body modal-body-stack">
          <p className="modal-copy">{description}</p>

          <div className="actions-row">
            <button
              className="button button-danger"
              disabled={loading}
              onClick={onConfirm}
              type="button"
            >
              {loading ? 'Удаляем...' : confirmLabel}
            </button>
            <button
              className="button button-secondary"
              disabled={loading}
              onClick={onCancel}
              type="button"
            >
              {cancelLabel}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
