import type { Metadata } from 'next';
import { Suspense } from 'react';
import ProductList from './ProductList';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Prodotti',
};

function ProductListFallback() {
  return (
    <div className={styles.page} aria-busy="true" aria-label="Caricamento prodotti">
      <div className={styles.skeletonHeading} />
      <div className={styles.skeletonFilters} />
      <div className={styles.skeletonTable} />
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<ProductListFallback />}>
      <ProductList />
    </Suspense>
  );
}
