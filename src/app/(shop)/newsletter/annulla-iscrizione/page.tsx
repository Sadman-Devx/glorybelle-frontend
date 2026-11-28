'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { newsletter, ApiError } from '@/lib/api';
import styles from './page.module.css';

type Status = 'idle' | 'working' | 'done' | 'invalid' | 'error';

/**
 * Target of the "Annulla l'iscrizione" link in every newsletter e-mail.
 * The link carries a SIGNED token (?token=...), so only the recipient of that e-mail can
 * unsubscribe that address. Unsubscribing needs an explicit click, so a mail scanner that
 * merely opens the link cannot unsubscribe anybody.
 */
function UnsubscribeContent() {
  const params = useSearchParams();
  const token = params.get('token');
  const [status, setStatus] = useState<Status>('idle');

  const confirm = async () => {
    if (!token) return;
    setStatus('working');
    try {
      await newsletter.unsubscribe(token);
      setStatus('done');
    } catch (err) {
      setStatus(err instanceof ApiError && err.status === 400 ? 'invalid' : 'error');
    }
  };

  if (!token || status === 'invalid') {
    return (
      <>
        <h1 className={styles.title}>Link non valido</h1>
        <p className={styles.text}>
          Questo link di annullamento non è valido o è stato modificato. Usa il link
          presente in fondo all&apos;ultima email che hai ricevuto da noi, oppure scrivici
          e ti aiuteremo volentieri.
        </p>
        <Link href="/contact" className="btn btn-secondary">Contattaci</Link>
      </>
    );
  }

  if (status === 'done') {
    return (
      <>
        <h1 className={styles.title}>Iscrizione annullata</h1>
        <p className={styles.text} role="status">
          Non riceverai più la newsletter di GLORYBELLE. Se cambi idea puoi iscriverti di
          nuovo in qualsiasi momento dal fondo del sito.
        </p>
        <Link href="/" className="btn btn-secondary">Torna al sito</Link>
      </>
    );
  }

  return (
    <>
      <h1 className={styles.title}>Annulla l&apos;iscrizione</h1>
      <p className={styles.text}>
        Vuoi smettere di ricevere la newsletter di GLORYBELLE? Conferma qui sotto.
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
        {status === 'working' ? 'Un momento…' : 'Conferma annullamento'}
      </button>
    </>
  );
}

export default function UnsubscribePage() {
  return (
    <div className="section">
      <div className={styles.card}>
        <Suspense fallback={<p className={styles.text}>Caricamento…</p>}>
          <UnsubscribeContent />
        </Suspense>
      </div>
    </div>
  );
}
