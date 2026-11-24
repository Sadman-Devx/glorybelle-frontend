'use client';

import { useEffect } from 'react';
import styles from './Toast.module.css';

export default function Toast({
  message,
  tone = 'info',
  onDismiss,
}: {
  message: string;
  tone?: 'info' | 'error' | 'success';
  onDismiss?: () => void;
}) {
  useEffect(() => {
    if (!onDismiss) return;
    const timer = window.setTimeout(onDismiss, 6000);
    return () => window.clearTimeout(timer);
  }, [message, onDismiss]);

  return (
    <div className={`${styles.toast} ${styles[tone]}`} role={tone === 'error' ? 'alert' : 'status'} aria-live="polite">
      <span>{message}</span>
      {onDismiss && (
        <button type="button" className={styles.dismiss} onClick={onDismiss} aria-label="Chiudi notifica">
          ×
        </button>
      )}
    </div>
  );
}
