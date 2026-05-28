import { MouseEvent, useEffect } from "react";

interface EnrollmentSubmittedModalProps {
  title: string;
  description: string;
  closeLabel: string;
  onClose: () => void;
}

export function EnrollmentSubmittedModal({
  title,
  description,
  closeLabel,
  onClose
}: EnrollmentSubmittedModalProps): JSX.Element {
  useEffect(() => {
    function handleEscape(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  function handleOverlayClick(event: MouseEvent<HTMLDivElement>): void {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" onClick={handleOverlayClick}>
      <div className="modal-card">
        <div className="submitted-title-row">
          <span className="submitted-check-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path
                d="M6 12.5L10.2 16.7L18 8.9"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <h2 className="section-heading submitted-title">{title}</h2>
        </div>
        <p className="subline">{description}</p>
        <div className="actions">
          <button type="button" className="button" onClick={onClose}>
            {closeLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
