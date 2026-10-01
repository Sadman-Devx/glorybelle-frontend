'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { catalog } from '@/lib/api';
import type { Product, ProductVariant } from '@/lib/types';
import styles from './QuickViewModal.module.css';

interface QuickViewModalProps {
  slug: string | null;
  onClose: () => void;
}

export default function QuickViewModal({ slug, onClose }: QuickViewModalProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);

  useEffect(() => {
    if (!slug) return;
    catalog.product(slug).then((p) => {
      setProduct(p);
      if (p.variants.length > 0) setSelectedVariant(p.variants[0]);
    }).catch(() => {});
  }, [slug]);

  if (!slug) return null;

  const currentPrice = selectedVariant?.price_override || selectedVariant?.price || product?.base_price || '0';
  const primaryImage = product?.images.find(i => i.is_primary)?.image || '/placeholder-product.svg';

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.close} onClick={onClose} aria-label="Chiudi">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>

        {!product ? (
          <div className={styles.loading}>Caricamento...</div>
        ) : (
          <div className={styles.grid}>
            <div className={styles.imageWrap}>
              <Image src={primaryImage} alt={product.name} fill style={{ objectFit: 'cover' }} sizes="440px" />
            </div>
            <div className={styles.info}>
              <span className="eyebrow">{product.category?.name}</span>
              <h2 className={styles.name}>{product.name}</h2>
              <p className={styles.price}>
                EUR {parseFloat(currentPrice).toLocaleString('it-IT', { minimumFractionDigits: 2 })}
              </p>
              <p className={styles.desc}>{product.description}</p>

              {product.variants.length > 0 && (
                <div className={styles.variants}>
                  {product.variants.filter(v => v.is_active).map((v) => (
                    <button
                      key={v.id}
                      className={`${styles.variantBtn} ${selectedVariant?.id === v.id ? styles.active : ''}`}
                      onClick={() => setSelectedVariant(v)}
                    >
                      {v.metal_display} {v.size && `- ${v.size}`}
                    </button>
                  ))}
                </div>
              )}

              <button className="btn btn-primary" style={{ width: '100%' }}>
                Aggiungi al Carrello
              </button>

              <Link href={`/shop/${product.slug}`} className={styles.viewFull} onClick={onClose}>
                Vedi dettagli completi &rarr;
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
