import { MouseEvent, useEffect } from "react";

interface EnrollmentSubmitConfirmModalProps {
  title: string;
  description: string;
  cancelLabel: string;
  confirmLabel: string;
  isSubmitting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function EnrollmentSubmitConfirmModal({
  title,
  description,
  cancelLabel,
  confirmLabel,
  isSubmitting,
  onCancel,
  onConfirm
}: EnrollmentSubmitConfirmModalProps): JSX.Element {
  useEffect(() => {
    function handleEscape(event: KeyboardEvent): void {
      if (event.key === "Escape" && !isSubmitting) {
        onCancel();
      }
    }

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isSubmitting, onCancel]);

  function handleOverlayClick(event: MouseEvent<HTMLDivElement>): void {
    if (event.target === event.currentTarget && !isSubmitting) {
      onCancel();
    }
  }

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" onClick={handleOverlayClick}>
      <div className="modal-card">
        <h2 className="section-heading">{title}</h2>
        <p className="subline">{description}</p>
        <div className="actions">
          <button
            type="button"
            className="button secondary"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            {cancelLabel}
          </button>
          <button type="button" className="button" onClick={onConfirm} disabled={isSubmitting}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
