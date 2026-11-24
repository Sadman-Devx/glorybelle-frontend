import { Suspense } from 'react';
import RichiesteList from './RichiesteList';
import styles from './page.module.css';

function RichiesteFallback() {
  return (
    <div className={styles.page} aria-busy="true" aria-label="Caricamento richieste">
      <div className={styles.skeletonHeading} />
      <div className={styles.skeletonFilters} />
      <div className={styles.skeletonList} />
    </div>
  );
}

export default function EnquiriesPage() {
  return (
    <Suspense fallback={<RichiesteFallback />}>
      <RichiesteList />
    </Suspense>
  );
}
