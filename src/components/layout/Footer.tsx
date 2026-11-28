'use client';

import { useState } from 'react';
import Link from 'next/link';
import { newsletter } from '@/lib/api';
import styles from './Footer.module.css';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    try {
      await newsletter.subscribe(email);
      setStatus('success');
      setEmail('');
    } catch {
      setStatus('error');
    }
  };

  return (
    <footer className={styles.footer}>
      <div className={`container ${styles.footerInner}`}>
        <div className={styles.col}>
          <span className={styles.brand}>GLORYBELLE</span>
          <p className={styles.brandDesc}>
            Gioielleria artigianale italiana. Ogni pezzo e realizzato a mano
            con passione e precisione, dal 1987.
          </p>
        </div>

        <div className={styles.col}>
          <h4 className={styles.colTitle}>Esplora</h4>
          <Link href="/prodotti" className={styles.footerLink}>Collezione</Link>
          <Link href="/prodotti?category=anelli" className={styles.footerLink}>Anelli</Link>
          <Link href="/prodotti?category=collane" className={styles.footerLink}>Collane</Link>
          <Link href="/prodotti?category=orecchini" className={styles.footerLink}>Orecchini</Link>
          <Link href="/prodotti?category=bracciali" className={styles.footerLink}>Bracciali</Link>
        </div>

        <div className={styles.col}>
          <h4 className={styles.colTitle}>Informazioni</h4>
          <Link href="/about" className={styles.footerLink}>Chi siamo</Link>
          <Link href="/contact" className={styles.footerLink}>Contattaci</Link>
          <Link href="/shipping" className={styles.footerLink}>Spedizioni e resi</Link>
          <Link href="/privacy" className={styles.footerLink}>Privacy</Link>
        </div>

        <div className={styles.col}>
          <h4 className={styles.colTitle}>Newsletter</h4>
          <p className={styles.nlDesc}>
            Scopri in anteprima le nuove collezioni. Dopo l&apos;iscrizione, controlla la
            tua email per confermare.
          </p>
          <form onSubmit={handleSubscribe} className={styles.nlForm}>
            <input
              type="email"
              placeholder="La tua email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.nlInput}
              required
            />
            <button
              type="submit"
              className={`btn btn-gold ${styles.nlBtn}`}
              disabled={status === 'submitting'}
            >
              {status === 'submitting' ? 'Invio…' : 'Iscriviti'}
            </button>
          </form>
          {status === 'success' && (
            <p className={styles.nlSuccess} role="status">
              Se l&apos;indirizzo può essere iscritto, controlla la tua casella di posta per
              confermare.
            </p>
          )}
          {status === 'error' && (
            <p className={styles.nlError} role="alert">
              Si è verificato un errore. Riprova.
            </p>
          )}
        </div>
      </div>

      <div className={styles.bottomBar}>
        <div className="container">
          <p className={styles.copyright}>
            &copy; {new Date().getFullYear()} GLORYBELLE. Tutti i diritti riservati.
          </p>
        </div>
      </div>
    </footer>
  );
}
