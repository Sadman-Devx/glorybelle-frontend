import { Suspense } from 'react';
import OrdersList from './OrdersList';
import styles from './page.module.css';

function OrdersFallback() {
  return (
    <div className={styles.page} aria-busy="true" aria-label="Caricamento ordini">
      <div className={styles.skeletonHeading} />
      <div className={styles.skeletonFilters} />
      <div className={styles.skeletonTable} />
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<OrdersFallback />}>
      <OrdersList />
    </Suspense>
  );
}
