import styles from './loading.module.css';

export default function AdminLoading() {
  return (
    <div className={styles.loading} role="status" aria-live="polite">
      <span className={styles.spinner} />
      <span>Caricamento…</span>
    </div>
  );
}
