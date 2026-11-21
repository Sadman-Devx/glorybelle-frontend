'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useWishlist } from '@/lib/hooks/useWishlist';
import ProductCard from '@/components/product/ProductCard';
import styles from './page.module.css';

export default function WishlistPage() {
  const { items, loading, refresh } = useWishlist();

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <div className="section">
      <div className="container">
        <div className={styles.header}>
          <span className="eyebrow eyebrow-line">Salvati per dopo</span>
          <h1 className={styles.title}>La tua Lista Desideri</h1>
          <p className={styles.subtitle}>
            {items.length === 0
              ? 'Non hai ancora salvato nessun gioiello. Torna allo shop e tocca il cuore sui pezzi che ti piacciono.'
              : `${items.length} ${items.length === 1 ? 'gioiello salvato' : 'gioielli salvati'}`}
          </p>
        </div>

        {loading ? (
          <div className={styles.grid}>
            {[...Array(3)].map((_, i) => (
              <div key={i} className={styles.skeleton} />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className={styles.empty}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            <h2 className={styles.emptyTitle}>Lista desideri vuota</h2>
            <p className={styles.emptyText}>
              Esplora la collezione e salva qui i gioielli che ami.
            </p>
            <Link href="/prodotti" className="btn btn-primary">
              Esplora la collezione
            </Link>
          </div>
        ) : (
          <div className={styles.grid}>
            {items.map((item) => (
              <ProductCard
                key={item.id}
                name={item.product.name}
                slug={item.product.slug}
                price={item.product.min_price || item.product.base_price}
                primaryImage={item.product.primary_image}
                hoverImage={item.product.hover_image}
                metal={item.product.metal}
                metalDisplay={item.product.metal_display}
                isWishlisted
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
