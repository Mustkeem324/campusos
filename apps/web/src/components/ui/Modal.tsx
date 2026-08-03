import React, { useEffect, useRef } from 'react';
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

  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      // Focus trap setup
      const focusableElements = modalRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusableElements && focusableElements.length > 0) {
        (focusableElements[0] as HTMLElement).focus();
      }
    } else if (previousFocusRef.current) {
      previousFocusRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleClose = () => {
    if (requireConfirmationOnClose) {
      if (window.confirm('You have unsaved changes. Are you sure you want to close?')) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  const handleOutsideClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-black/50 p-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:items-center sm:p-6"
      onClick={handleOutsideClick}
    >
      <div 
        ref={modalRef}
        role="dialog" 
        aria-modal="true" 
        aria-labelledby="modal-title"
        className="bg-surface my-auto flex max-h-[calc(100dvh-1.5rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))] w-full max-w-lg flex-col rounded-t-2xl shadow-xl sm:max-h-[calc(100dvh-3rem)] sm:rounded-2xl"
      >
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h2 id="modal-title" className="text-xl font-bold text-text-primary">
            {title}
          </h2>
          <button 
            onClick={handleClose}
            aria-label="Close modal"
            className="p-2 text-text-secondary hover:text-danger hover:bg-danger/10 rounded-lg transition"
          >
            <X size={20} />
          </button>
        </div>
        <div className="overflow-y-auto overscroll-contain p-4 sm:p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
