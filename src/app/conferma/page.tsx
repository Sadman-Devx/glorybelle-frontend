import Link from 'next/link';
import styles from './page.module.css';

export default function ConfermaPage() {
  return (
    <div className={`section ${styles.page}`}>
      <div className="container" style={{ textAlign: 'center', maxWidth: '560px' }}>
        <div className={styles.icon}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        </div>
        <h1 className={styles.heading}>Ordine Confermato!</h1>
        <p className={styles.message}>
          Grazie per il tuo acquisto. Riceverai una email di conferma con i dettagli
          del tuo ordine e le informazioni di spedizione.
        </p>
        <div className={styles.ctas}>
          <Link href="/account" className="btn btn-secondary">I miei ordini</Link>
          <Link href="/shop" className="btn btn-primary">Continua lo shopping</Link>
        </div>
      </div>
    </div>
  );
}
