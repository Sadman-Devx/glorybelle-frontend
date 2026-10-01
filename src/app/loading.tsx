import styles from './loading.module.css';

export default function Loading() {
  return (
    <div className={styles.loadingWrap}>
      <div className={styles.spinner} />
    </div>
  );
}
