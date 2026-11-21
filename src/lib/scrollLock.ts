/**
 * Shared body scroll lock.
 *
 * Several overlays (mobile menu, cart drawer, quick view, filter sheet) lock
 * page scroll. If each one writes `body.style.overflow` on its own, the first
 * one to close unlocks the page while another overlay is still open.
 * This keeps a counter: the page unlocks only when the LAST lock is released.
 *
 * Usage inside an effect:
 *   const unlock = lockBodyScroll();
 *   return () => unlock();
 */
let activeLocks = 0;
let previousOverflow = '';

export function lockBodyScroll(): () => void {
  if (typeof document === 'undefined') return () => {};

  if (activeLocks === 0) {
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
  }
  activeLocks += 1;

  let released = false;
  return () => {
    if (released) return;           // safe against double-cleanup (React Strict Mode)
    released = true;
    activeLocks -= 1;
    if (activeLocks === 0) {
      document.body.style.overflow = previousOverflow;
    }
  };
}
