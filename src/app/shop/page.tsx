'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { catalog } from '@/lib/api';
import type { ProductListItem, Category } from '@/lib/types';
import ProductGrid from '@/components/product/ProductGrid';
import ProductFilters from '@/components/product/ProductFilters';
import styles from './page.module.css';

function ShopContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  const activeCategory = searchParams.get('category');
  const activeMetal = searchParams.get('metal');
  const sort = searchParams.get('sort') || '-created_at';

  const updateParams = useCallback((key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push('/shop?' + params.toString());
  }, [searchParams, router]);

  useEffect(() => {
    catalog.categories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params: Record<string, string> = { ordering: sort };
    if (activeCategory) params.category = activeCategory;
    if (activeMetal) params.metal = activeMetal;

    catalog.products(params)
      .then((data) => {
        setProducts(data.results);
        setTotalCount(data.count);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [activeCategory, activeMetal, sort]);

  const activeFilters = [
    activeCategory && { key: 'category', label: categories.find(c => c.slug === activeCategory)?.name || activeCategory },
    activeMetal && { key: 'metal', label: activeMetal === 'gold' ? 'Oro Giallo' : activeMetal === 'rose' ? 'Oro Rosa' : 'Argento' },
  ].filter(Boolean) as { key: string; label: string }[];

  return (
    <div className="container">
      <div className={styles.shopHeader}>
        <h1 className="heading-section">Collezione</h1>
        <p className={styles.count}>{totalCount} prodotti</p>
      </div>

      {activeFilters.length > 0 && (
        <div className={styles.chips}>
          {activeFilters.map((f) => (
            <button key={f.key} className={styles.chip} onClick={() => updateParams(f.key, null)}>
              {f.label}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          ))}
        </div>
      )}

      <div className={styles.layout}>
        <ProductFilters
          categories={categories}
          activeCategory={activeCategory}
          activeMetal={activeMetal}
          onCategoryChange={(v) => updateParams('category', v)}
          onMetalChange={(v) => updateParams('metal', v)}
          onSortChange={(v) => updateParams('sort', v)}
          sort={sort}
        />
        <div className={styles.gridWrap}>
          {loading ? (
            <div className={styles.skeletonGrid}>
              {[...Array(6)].map((_, i) => <div key={i} className={styles.skeletonCard} />)}
            </div>
          ) : (
            <ProductGrid products={products} />
          )}
        </div>
      </div>
    </div>
  );
}

export default function ShopPage() {
  return (
    <div className="section">
      <Suspense fallback={<div className="container"><p>Caricamento...</p></div>}>
        <ShopContent />
      </Suspense>
    </div>
  );
}
