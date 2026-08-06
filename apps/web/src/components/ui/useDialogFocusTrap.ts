'use client';

import type { RefObject } from 'react';
import { useEffect } from 'react';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

type DialogFocusTrapOptions<Container extends HTMLElement, Initial extends HTMLElement = HTMLElement> = {
  active: boolean;
  containerRef: RefObject<Container>;
  initialFocusRef?: RefObject<Initial>;
};

function focusableElements(container: HTMLElement) {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter((element) => {
    if (element.getAttribute('aria-hidden') === 'true') return false;
    if (element.tabIndex < 0) return false;
    return element.getClientRects().length > 0;
  });
}

export function useDialogFocusTrap<Container extends HTMLElement, Initial extends HTMLElement = HTMLElement>({
  active,
  containerRef,
  initialFocusRef,
}: DialogFocusTrapOptions<Container, Initial>) {
  useEffect(() => {
    if (!active) return;
    const container = containerRef.current;
    if (!container) return;

    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const focusInitial = () => {
      const target = initialFocusRef?.current ?? focusableElements(container)[0] ?? container;
      target.focus();
    };
    const frame = window.requestAnimationFrame(focusInitial);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      const items = focusableElements(container);
      if (items.length === 0) {
        event.preventDefault();
        container.focus();
        return;
      }

      const first = items[0];
      const last = items[items.length - 1];
      const activeElement = document.activeElement;
      const focusOutside = !(activeElement instanceof Node) || !container.contains(activeElement);

      if (event.shiftKey && (activeElement === first || focusOutside)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (activeElement === last || focusOutside)) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener('keydown', onKeyDown);
      window.requestAnimationFrame(() => previousFocus?.focus());
    };
  }, [active, containerRef, initialFocusRef]);
}
