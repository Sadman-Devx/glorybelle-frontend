'use client';

import { useCart } from '@/contexts/CartContext';
import styles from './Toast.module.css';

export default function Toast() {
  const { toast } = useCart();
  if (!toast) return null;

  // Apply .toastVisible whenever toast is non-null (CartContext already auto-dismisses after 2.6s)
  return (
    <div
      className={`${styles.toast} ${styles.toastVisible}`}
      role="status"
      aria-live="polite"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
      {toast}
    </div>
  );
}