'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import styles from './page.module.css';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    passwordConfirm: '',
    first_name: '',
    last_name: '',
    birth_date: '',  // NEW — required field
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (form.password !== form.passwordConfirm) {
      setError('Le password non corrispondono.');
      return;
    }
    if (form.password.length < 8) {
      setError('La password deve avere almeno 8 caratteri.');
      return;
    }
    if (!form.birth_date) {
      setError('La data di nascita è obbligatoria.');
      return;
    }

    setLoading(true);
    try {
      await register({
        username: form.username,
        email: form.email,
        password: form.password,
        first_name: form.first_name,
        last_name: form.last_name,
        birth_date: form.birth_date,
      } as any);  // cast to any until RegisterSerializer type is updated
      router.push('/account');
    } catch (err: unknown) {
      const apiErr = err as { data?: Record<string, unknown> };
      const data = apiErr?.data;
      if (data && typeof data === 'object') {
        const firstKey = Object.keys(data)[0];
        const firstErr = data[firstKey];
        if (Array.isArray(firstErr)) {
          setError(`${firstKey}: ${firstErr[0]}`);
        } else {
          setError(String(firstErr) || 'Errore durante la registrazione.');
        }
      } else {
        setError('Errore durante la registrazione. Riprova.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`section ${styles.page}`}>
      <div className={`container ${styles.inner}`}>
        <h1 className={styles.title}>Crea un account</h1>
        <p className={styles.subtitle}>
          Registrati per accedere al tuo storico ordini, salvare i tuoi
          indirizzi e tenere traccia della tua lista desideri.
        </p>

        {/* Discount banner — quiet, editorial tone (not aggressive) */}
        <div className={styles.discountBanner}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4"/>
            <path d="M4 6v12c0 1.1.9 2 2 2h14v-4"/>
            <path d="M18 12a2 2 0 0 0-2 2c0 1.1.9 2 2 2h4v-4h-4z"/>
          </svg>
          <span>
            <strong>10% di sconto</strong> sul tuo primo ordine quando ti registri.
          </span>
        </div>

        {error && <div className={styles.error} role="alert">{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="first_name" className={styles.label}>Nome</label>
              <input
                id="first_name"
                name="first_name"
                type="text"
                value={form.first_name}
                onChange={handleChange}
                className={styles.input}
                autoComplete="given-name"
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="last_name" className={styles.label}>Cognome</label>
              <input
                id="last_name"
                name="last_name"
                type="text"
                value={form.last_name}
                onChange={handleChange}
                className={styles.input}
                autoComplete="family-name"
              />
            </div>
          </div>

          <div className={styles.field}>
            <label htmlFor="username" className={styles.label}>Username</label>
            <input
              id="username"
              name="username"
              type="text"
              required
              value={form.username}
              onChange={handleChange}
              className={styles.input}
              autoComplete="username"
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="email" className={styles.label}>Email</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={form.email}
              onChange={handleChange}
              className={styles.input}
              autoComplete="email"
            />
          </div>

          {/* NEW — birth_date field, required */}
          <div className={styles.field}>
            <label htmlFor="birth_date" className={styles.label}>
              Data di nascita
              <span className={styles.required} aria-hidden="true">*</span>
            </label>
            <input
              id="birth_date"
              name="birth_date"
              type="date"
              required
              value={form.birth_date}
              onChange={handleChange}
              className={styles.input}
              max={new Date().toISOString().split('T')[0]}
              autoComplete="bday"
            />
            <p className={styles.hint}>
              Usata per personalizzare la tua esperienza. Devi avere almeno 13 anni.
            </p>
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="password" className={styles.label}>Password</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={form.password}
                onChange={handleChange}
                className={styles.input}
                autoComplete="new-password"
                minLength={8}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="passwordConfirm" className={styles.label}>Conferma password</label>
              <input
                id="passwordConfirm"
                name="passwordConfirm"
                type="password"
                required
                value={form.passwordConfirm}
                onChange={handleChange}
                className={styles.input}
                autoComplete="new-password"
                minLength={8}
              />
            </div>
          </div>

          <button
            type="submit"
            className={`btn btn-primary ${styles.submit}`}
            disabled={loading}
          >
            {loading ? 'Registrazione…' : 'Registrati e ottieni il 10% di sconto'}
          </button>
        </form>

        <p className={styles.footer}>
          Hai già un account?{' '}
          <Link href="/login" className={styles.link}>Accedi</Link>
        </p>
      </div>
    </div>
  );
}
