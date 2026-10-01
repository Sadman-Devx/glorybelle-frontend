'use client';

import { useEffect, useState } from 'react';
import { catalog } from '@/lib/api';
import type { ProductListItem } from '@/lib/types';
import ProductCard from './ProductCard';
import styles from './BestsellerCarousel.module.css';

export default function BestsellerCarousel() {
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    catalog.products({ featured: 'true', page_size: '8' })
      .then((data) => setProducts(data.results))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className={styles.skeleton}>
        {[...Array(4)].map((_, i) => (
          <div key={i} className={styles.skeletonCard} />
        ))}
      </div>
    );
  }

  if (products.length === 0) return null;

  return (
    <div className={styles.rail}>
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
          compact
        />
      ))}
    </div>
  );
}
