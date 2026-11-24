'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { auth } from '@/lib/api';
import styles from './page.module.css';

type Status = 'idle' | 'loading' | 'sent' | 'error';

export default function PasswordResetPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    try {
      await auth.requestPasswordReset(email);
      setStatus('sent');
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className={styles.page}>
      <div className={`container ${styles.inner}`}>
        <h1 className={styles.title}>Recupera la password</h1>

        {status === 'sent' ? (
          <div className={styles.success} role="status">
            <p>
              Se l&apos;indirizzo <strong>{email}</strong> è associato a un account, riceverai a breve
              un&apos;email con le istruzioni per scegliere una nuova password.
            </p>
            <p>Controlla anche la cartella dello spam.</p>
          </div>
        ) : (
          <>
            <p className={styles.subtitle}>
              Inserisci l&apos;email con cui ti sei registrato: ti invieremo le istruzioni per
              reimpostare la password.
            </p>

            {status === 'error' && (
              <div className={styles.error} role="alert">
                Non siamo riusciti a inviare la richiesta. Riprova tra qualche minuto oppure{' '}
                <Link href="/contact" className={styles.errorLink}>contattaci</Link>.
              </div>
            )}

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.field}>
                <label htmlFor="reset-email" className={styles.label}>Email</label>
                <input
                  id="reset-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={styles.input}
                />
              </div>
              <button
                type="submit"
                className={`btn btn-primary ${styles.submit}`}
                disabled={status === 'loading'}
              >
                {status === 'loading' ? 'Invio…' : 'Invia istruzioni'}
              </button>
            </form>
          </>
        )}

        <p className={styles.footer}>
          <Link href="/login" className={styles.link}>Torna all&apos;accesso</Link>
        </p>
      </div>
    </div>
  );
}
