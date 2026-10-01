'use client';

import ProductCard from './ProductCard';
import type { ProductListItem } from '@/lib/types';
import styles from './ProductGrid.module.css';

interface ProductGridProps {
  products: ProductListItem[];
  onQuickView?: (slug: string) => void;
}

export default function ProductGrid({ products, onQuickView }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className={styles.empty}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <h3>Nessun prodotto trovato</h3>
        <p>Prova a cambiare i filtri di ricerca.</p>
      </div>
    );
  }

  return (
    <div className={styles.grid}>
      {products.map((product) => (
        <ProductCard
          key={product.id}
          name={product.name}
          slug={product.slug}
          price={product.min_price || product.base_price}
          primaryImage={product.primary_image}
          hoverImage={product.hover_image}
          metal={product.metal}
          metalDisplay={product.metal_display}
          onQuickView={() => onQuickView?.(product.slug)}
        />
      ))}
    </div>
  );
}
