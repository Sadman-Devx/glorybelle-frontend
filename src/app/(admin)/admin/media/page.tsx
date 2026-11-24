import type { Metadata } from 'next';
import { Suspense } from 'react';
import MediaLibrary from './MediaLibrary';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Libreria media',
};

function MediaFallback() {
  return (
    <div className={styles.page} aria-busy="true" aria-label="Caricamento libreria media">
      <div className={styles.skeletonHeading} />
      <div className={styles.skeletonFilters} />
      <div className={styles.skeletonGrid}>
        {Array.from({ length: 8 }, (_, index) => <div key={index} />)}
      </div>
    </div>
  );
}

export default function MediaPage() {
  return (
    <Suspense fallback={<MediaFallback />}>
      <MediaLibrary />
    </Suspense>
  );
}
