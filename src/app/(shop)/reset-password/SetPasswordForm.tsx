'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { auth } from '@/lib/api';
import styles from './page.module.css';

type Status = 'idle' | 'loading' | 'success' | 'error';

export default function SetPasswordForm({
  uid,
  token,
}: {
  uid: string;
  token: string;
}) {
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!uid || !token) {
      setStatus('error');
      setErrorMessage('Il link non è valido o è scaduto. Richiedi un nuovo link.');
      return;
    }
    if (password !== passwordConfirm) {
      setStatus('error');
      setErrorMessage('Le password non corrispondono.');
      return;
    }

    setStatus('loading');
    setErrorMessage(null);
    try {
      await auth.confirmPasswordReset(uid, token, password, passwordConfirm);
      setStatus('success');
    } catch {
      setStatus('error');
      setErrorMessage(
        'Non è stato possibile impostare la password. Verifica che il link sia valido e che la password rispetti i requisiti.',
      );
    }
  }

  return (
    <div className={styles.page}>
      <div className={`container ${styles.inner}`}>
        <h1 className={styles.title}>Imposta la password</h1>
        {status === 'success' ? (
          <div className={styles.success} role="status">
            <p>La password è stata aggiornata. Ora puoi accedere al tuo account.</p>
            <div className={styles.links}>
              <Link href="/admin/login" className={styles.link}>Accedi all’area amministrativa</Link>
              <Link href="/login" className={styles.link}>Accedi al negozio</Link>
            </div>
          </div>
        ) : (
          <>
            <p className={styles.subtitle}>
              Scegli una password di almeno otto caratteri e confermala qui sotto.
            </p>
            {status === 'error' && errorMessage && (
              <p className={styles.error} role="alert">{errorMessage}</p>
            )}
            {uid && token ? (
              <form className={styles.form} onSubmit={(event) => void submit(event)}>
                <label className={styles.field}>
                  <span>Nuova password</span>
                  <input
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    required
                    value={password}
                    disabled={status === 'loading'}
                    onChange={(event) => setPassword(event.currentTarget.value)}
                  />
                </label>
                <label className={styles.field}>
                  <span>Conferma password</span>
                  <input
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    required
                    value={passwordConfirm}
                    disabled={status === 'loading'}
                    onChange={(event) => setPasswordConfirm(event.currentTarget.value)}
                  />
                </label>
                <button
                  type="submit"
                  className={`btn btn-primary ${styles.submit}`}
                  disabled={status === 'loading'}
                >
                  {status === 'loading' ? 'Salvataggio…' : 'Imposta password'}
                </button>
              </form>
            ) : (
              <p className={styles.error} role="alert">
                Il link non è valido o è scaduto.{' '}
                <Link href="/password-reset" className={styles.link}>Richiedi un nuovo link</Link>.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
