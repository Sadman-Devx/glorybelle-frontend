'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/admin/Button';
import FormField from '@/components/admin/FormField';
import Toast from '@/components/admin/Toast';
import { AdminApiError } from '@/lib/adminApi';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import styles from './page.module.css';

export default function AdminLoginPage() {
  const router = useRouter();
  const { login, verifyMfa, sessionExpired } = useAdminAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showExpired, setShowExpired] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [challenge, setChallenge] = useState<string | null>(null);
  const [purpose, setPurpose] = useState<'enroll' | 'verify' | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [provisioningUri, setProvisioningUri] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const result = await login(email, password);
      setChallenge(result.challenge);
      setPurpose(result.purpose);
      setSecret(result.secret ?? null);
      setProvisioningUri(result.provisioning_uri ?? null);
    } catch (loginError) {
      setError(
        loginError instanceof AdminApiError
          ? loginError.message
          : 'Accesso non disponibile. Riprova tra qualche istante.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleMfaSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!challenge) return;
    setError(null);
    setSubmitting(true);
    try {
      const result = await verifyMfa(challenge, code);
      if (result.recovery_codes?.length) {
        setRecoveryCodes(result.recovery_codes);
      } else {
        router.replace('/admin');
      }
    } catch (mfaError) {
      setError(
        mfaError instanceof AdminApiError
          ? mfaError.message
          : 'Verifica non disponibile. Riprova.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.brandMark} aria-hidden="true">G</div>
        <span className="eyebrow eyebrow-line">Area riservata</span>
        <h1>Accesso staff</h1>
        <p className={styles.intro}>
          Inserisci le credenziali del tuo account amministrativo GLORYBELLE.
        </p>

        {error && <div className={styles.error} role="alert">{error}</div>}

        {recoveryCodes ? (
          <div className={styles.mfaPanel}>
            <h2>Codici di recupero</h2>
            <p>Salvali ora in un luogo sicuro. Ogni codice può essere usato una sola volta.</p>
            <ul className={styles.recoveryCodes}>
              {recoveryCodes.map((recoveryCode) => <li key={recoveryCode}>{recoveryCode}</li>)}
            </ul>
            <Button type="button" className={styles.submit} onClick={() => router.replace('/admin')}>
              Ho salvato i codici
            </Button>
          </div>
        ) : challenge ? (
          <form className={styles.form} onSubmit={handleMfaSubmit}>
            {purpose === 'enroll' && (
              <div className={styles.mfaPanel}>
                <h2>Configura l’autenticazione a due fattori</h2>
                <p>Inserisci questo codice segreto nell’app di autenticazione:</p>
                <code className={styles.secret}>{secret}</code>
                {provisioningUri && <details><summary>Mostra link di configurazione</summary><code className={styles.uri}>{provisioningUri}</code></details>}
              </div>
            )}
            <FormField
              id="admin-totp-code"
              label="Codice di verifica o di recupero"
              name="code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              value={code}
              onChange={(event) => setCode(event.target.value)}
            />
            <Button type="submit" className={styles.submit} disabled={submitting}>
              {submitting ? 'Verifica in corso…' : 'Conferma e accedi'}
            </Button>
          </form>
        ) : (
          <form className={styles.form} onSubmit={handleSubmit}>
            <FormField
              id="admin-email"
              label="Email"
              name="email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <FormField
              id="admin-password"
              label="Password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <Button type="submit" className={styles.submit} disabled={submitting}>
              {submitting ? 'Verifica in corso…' : 'Accedi'}
            </Button>
          </form>
        )}

        <p className={styles.securityNote}>
          Accesso riservato ai membri autorizzati del team.
        </p>
      </div>

      {sessionExpired && showExpired && (
        <div className={styles.toast}>
          <Toast
            message="La sessione è scaduta. Accedi di nuovo per continuare."
            tone="info"
            onDismiss={() => setShowExpired(false)}
          />
        </div>
      )}
    </div>
  );
}
