import { useEffect, useRef } from "react";

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * @param {boolean} isOpen
 * @param {() => void} onClose
 * @param {{ initialFocusRef?: React.RefObject<HTMLElement> }} [options]
 */
export function useModalAccessibility(isOpen, onClose, options = {}) {
  const { initialFocusRef } = options;
  const containerRef = useRef(null);
  const previousFocusRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return undefined;

    previousFocusRef.current = document.activeElement;

    const container = containerRef.current;
    const initialFocus = initialFocusRef?.current;
    const markedFocus = container?.querySelector("[data-modal-initial-focus]");
    const firstFocusable = container?.querySelector(FOCUSABLE);
    const focusTarget = initialFocus || markedFocus || firstFocusable;

    if (focusTarget && typeof focusTarget.focus === "function") {
      focusTarget.focus();
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }

      if (event.key !== "Tab" || !containerRef.current) return;

      const focusableElements = Array.from(
        containerRef.current.querySelectorAll(FOCUSABLE),
      );
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      const previous = previousFocusRef.current;
      if (previous && typeof previous.focus === "function") {
        previous.focus();
      }
    };
  }, [isOpen, initialFocusRef]);

  return containerRef;
}
