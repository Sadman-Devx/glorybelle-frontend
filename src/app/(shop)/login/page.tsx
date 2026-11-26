'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { ApiError } from '@/lib/api';
import styles from './page.module.css';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      router.push('/account');
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) {
        // The backend allows 10 login attempts per minute
        setError('Troppi tentativi di accesso. Riprova tra un minuto.');
      } else if (err instanceof ApiError && err.status === 401) {
        setError('Email o password non corretti.');
      } else {
        setError('Impossibile accedere in questo momento. Riprova.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`section ${styles.page}`}>
      <div className={`container ${styles.inner}`}>
        <h1 className={styles.title}>Accedi</h1>
        <p className={styles.subtitle}>
          Bentornato su GLORYBELLE. Inserisci le tue credenziali per accedere
          al tuo account.
        </p>

        {error && <div className={styles.error} role="alert">{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="email" className={styles.label}>Email</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.input}
              autoComplete="email"
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="password" className={styles.label}>Password</label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={styles.input}
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className={`btn btn-primary ${styles.submit}`}
            disabled={loading}
          >
            {loading ? 'Accesso…' : 'Accedi'}
          </button>
        </form>

        <p className={styles.footer}>
          Non hai un account?{' '}
          <Link href="/register" className={styles.link}>Registrati</Link>
        </p>
        <p className={styles.footer}>
          <Link href="/password-reset" className={styles.link}>Password dimenticata?</Link>
        </p>
      </div>
    </div>
  );
}
