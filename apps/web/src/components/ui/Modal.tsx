import React, { useCallback, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  requireConfirmationOnClose?: boolean;
}

export function Modal({ isOpen, onClose, title, children, requireConfirmationOnClose }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const handleClose = useCallback(() => {
    if (requireConfirmationOnClose) {
      if (window.confirm('You have unsaved changes. Are you sure you want to close?')) {
        onClose();
      }
      return;
    }

    onClose();
  }, [onClose, requireConfirmationOnClose]);

  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      const focusableElements = modalRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (focusableElements && focusableElements.length > 0) {
        (focusableElements[0] as HTMLElement).focus();
      }
      return;
    }

    previousFocusRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleClose, isOpen]);

  const handleOutsideClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-black/50 p-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:items-center sm:p-6"
      onClick={handleOutsideClick}
      role="presentation"
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="my-auto flex max-h-[calc(100dvh-1.5rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))] w-full max-w-lg flex-col rounded-t-2xl bg-surface shadow-xl sm:max-h-[calc(100dvh-3rem)] sm:rounded-2xl"
      >
        <div className="flex items-center justify-between border-b border-border p-6">
          <h2 id="modal-title" className="text-xl font-bold text-text-primary">
            {title}
          </h2>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close modal"
            className="rounded-lg p-2 text-text-secondary transition hover:bg-danger/10 hover:text-danger"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>
        <div className="overflow-y-auto overscroll-contain p-4 sm:p-6">{children}</div>
      </div>
    </div>
  );
}
