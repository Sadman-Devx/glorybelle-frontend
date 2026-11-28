'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ApiError, newsletter } from '@/lib/api';
import styles from '../annulla-iscrizione/page.module.css';

type Status = 'idle' | 'working' | 'confirmed' | 'invalid' | 'expired' | 'error';

function ConfirmationContent() {
  const params = useSearchParams();
  const token = params.get('token');
  const [status, setStatus] = useState<Status>('idle');

  const confirm = async () => {
    if (!token) return;
    setStatus('working');
    try {
      await newsletter.confirm(token);
      setStatus('confirmed');
    } catch (err) {
      if (err instanceof ApiError && err.status === 410) {
        setStatus('expired');
      } else if (err instanceof ApiError && err.status === 400) {
        setStatus('invalid');
      } else {
        setStatus('error');
      }
    }
  };

  if (!token || status === 'invalid') {
    return (
      <>
        <h1 className={styles.title}>Link non valido</h1>
        <p className={styles.text} role="alert">
          Il link di conferma non è valido. Iscriviti di nuovo dal fondo del sito per
          ricevere un nuovo link.
        </p>
        <Link href="/" className="btn btn-secondary">Torna al sito</Link>
      </>
    );
  }

  if (status === 'expired') {
    return (
      <>
        <h1 className={styles.title}>Link scaduto</h1>
        <p className={styles.text} role="alert">
          Il link di conferma è scaduto dopo 7 giorni. Iscriviti di nuovo per ricevere
          un nuovo link.
        </p>
        <Link href="/" className="btn btn-secondary">Torna al sito</Link>
      </>
    );
  }

  if (status === 'confirmed') {
    return (
      <>
        <h1 className={styles.title}>Iscrizione confermata</h1>
        <p className={styles.text} role="status">
          Grazie! Riceverai le novità e le offerte della newsletter GLORYBELLE.
        </p>
        <Link href="/" className="btn btn-secondary">Torna al sito</Link>
      </>
    );
  }

  return (
    <>
      <h1 className={styles.title}>Conferma l&apos;iscrizione</h1>
      <p className={styles.text}>
        Per completare l&apos;iscrizione alla newsletter GLORYBELLE, conferma qui sotto.
      </p>
      {status === 'error' && (
        <p className={styles.error} role="alert">
          Qualcosa è andato storto. Riprova tra qualche istante.
        </p>
      )}
      <button
        type="button"
        className="btn btn-primary"
        onClick={confirm}
        disabled={status === 'working'}
      >
        {status === 'working' ? 'Un momento…' : 'Conferma iscrizione'}
      </button>
    </>
  );
}

export default function NewsletterConfirmationPage() {
  return (
    <div className="section">
      <div className={styles.card}>
        <Suspense fallback={<p className={styles.text}>Caricamento…</p>}>
          <ConfirmationContent />
        </Suspense>
      </div>
    </div>
  );
}
