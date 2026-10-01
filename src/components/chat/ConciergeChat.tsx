'use client';

import { useState } from 'react';
import styles from './ConciergeChat.module.css';

export default function ConciergeChat() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Chat widget button */}
      <button
        className={styles.trigger}
        onClick={() => setOpen(!open)}
        aria-label={open ? 'Chiudi consulente' : 'Parla con un consulente'}
      >
        {open ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        )}
        <span className={styles.label}>Consulente</span>
      </button>

      {/* Chat window */}
      {open && (
        <div className={styles.window}>
          <div className={styles.windowHeader}>
            <div>
              <h4 className={styles.windowTitle}>Consulente GLORYBELLE</h4>
              <span className={styles.windowStatus}>Online</span>
            </div>
          </div>
          <div className={styles.windowBody}>
            <div className={styles.message}>
              <p>Buongiorno! Sono il tuo consulente personale GLORYBELLE. Come posso aiutarti nella scelta del gioiello perfetto?</p>
            </div>
          </div>
          <div className={styles.windowInput}>
            <input type="text" placeholder="Scrivi un messaggio..." className={styles.input} />
            <button className={styles.sendBtn} aria-label="Invia">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
