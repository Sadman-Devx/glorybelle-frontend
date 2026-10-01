import Link from 'next/link';
import styles from './not-found.module.css';

export default function NotFound() {
  return (
    <div className={styles.page}>
      <div className="container" style={{ textAlign: 'center' }}>
        <span className="eyebrow eyebrow-line" style={{ justifyContent: 'center' }}>Errore 404</span>
        <h1 className={styles.heading}>Pagina Non Trovata</h1>
        <p className={styles.message}>
          La pagina che stai cercando non esiste o e stata spostata.
        </p>
        <Link href="/" className="btn btn-primary">Torna alla Home</Link>
      </div>
    </div>
  );
}
