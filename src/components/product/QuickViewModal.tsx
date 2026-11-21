'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { catalog } from '@/lib/api';
import { useCart } from '@/contexts/CartContext';
import type { Product, ProductVariant } from '@/lib/types';
import { lockBodyScroll } from '@/lib/scrollLock';
import styles from './QuickViewModal.module.css';

interface QuickViewModalProps {
  slug: string | null;
  onClose: () => void;
}

export default function QuickViewModal({ slug, onClose }: QuickViewModalProps) {
  const { addItem } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setProduct(null);
    setSelectedVariant(null);
    catalog.product(slug)
      .then((p) => {
        setProduct(p);
        // Pick first active variant with stock
        const firstActive = p.variants.find(v => v.is_active && v.available_stock > 0) || p.variants[0];
        if (firstActive) setSelectedVariant(firstActive);
      })
      .catch(() => {});
  }, [slug]);

  // ESC key + body scroll lock
  useEffect(() => {
    if (!slug) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const unlock = lockBodyScroll();
    return () => {
      document.removeEventListener('keydown', onKey);
      unlock();
    };
  }, [slug, onClose]);

  if (!slug) return null;

  const currentPrice = selectedVariant?.price_override || selectedVariant?.price || product?.base_price || '0';
  const primaryImage = product?.images.find(i => i.is_primary)?.image
    || product?.images[0]?.image
    || '/placeholder-product.svg';
  const outOfStock = selectedVariant ? selectedVariant.available_stock === 0 : false;

  const handleAddToCart = async () => {
    if (!selectedVariant) return;
    setAdding(true);
    await addItem(selectedVariant.id, 1);
    setAdding(false);
    onClose();
  };

  return (
    <div
      className={`${styles.backdrop} ${slug ? styles.backdropOpen : ''}`}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={product ? `Vista rapida: ${product.name}` : 'Vista rapida'}
    >
      <div
        className={`${styles.modal} ${slug ? styles.modalOpen : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button className={styles.closeBtn} onClick={onClose} aria-label="Chiudi">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>

        {!product ? (
          <div className={styles.loading}>
            <div className={styles.skeletonImage} />
            <div className={styles.skeletonInfo}>
              <div className={styles.skeletonLine} style={{ width: '40%' }} />
              <div className={styles.skeletonLine} style={{ width: '70%' }} />
              <div className={styles.skeletonLine} style={{ width: '90%' }} />
              <div className={styles.skeletonLine} style={{ width: '90%' }} />
            </div>
          </div>
        ) : (
          <div className={styles.grid}>
            {/* Image column */}
            <div className={styles.imageCol}>
              <Image
                src={primaryImage}
                alt={product.name}
                fill
                sizes="(max-width: 700px) 100vw, 440px"
                style={{ objectFit: 'cover' }}
                priority
              />
            </div>

            {/* Detail column */}
            <div className={styles.detailCol}>
              <span className="eyebrow eyebrow-line">{product.category?.name}</span>
              <h2 className={styles.modalName}>{product.name}</h2>
              <p className={styles.modalPrice}>
                EUR {parseFloat(currentPrice).toLocaleString('it-IT', { minimumFractionDigits: 2 })}
              </p>
              <p className={styles.modalDesc}>{product.description}</p>

              {/* Variant selector — design.md §4.6 row 8 + VariantSelector pattern */}
              {product.variants.filter(v => v.is_active).length > 0 && (
                <div className={styles.variants}>
                  <span className={styles.variantLabel}>
                    Variante
                    {selectedVariant && (
                      <span className={styles.variantValue}>
                        {selectedVariant.metal_display}
                        {selectedVariant.size ? ` · ${selectedVariant.size}` : ''}
                      </span>
                    )}
                  </span>
                  <div className={styles.variantRow}>
                    {product.variants.filter(v => v.is_active).map((v) => (
                      <button
                        key={v.id}
                        className={`${styles.variantBtn} ${selectedVariant?.id === v.id ? styles.variantActive : ''}`}
                        onClick={() => setSelectedVariant(v)}
                        disabled={v.available_stock === 0}
                        aria-pressed={selectedVariant?.id === v.id}
                      >
                        {v.metal_display}
                        {v.size && <span className={styles.variantSize}> · {v.size}</span>}
                        {v.available_stock === 0 && <span className={styles.variantOos}>ESAURITO</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Add to cart — now wired (P0 fix #8) */}
              <div className={styles.modalActions}>
                <button
                  className="btn btn-primary"
                  onClick={handleAddToCart}
                  disabled={!selectedVariant || outOfStock || adding}
                  style={{ flex: 1 }}
                >
                  {!selectedVariant
                    ? 'Seleziona una variante'
                    : outOfStock
                    ? 'Esaurito'
                    : adding
                    ? 'Aggiunta…'
                    : `Aggiungi al Carrello — EUR ${parseFloat(currentPrice).toLocaleString('it-IT', { minimumFractionDigits: 2 })}`}
                </button>
              </div>

              {/* Trust row inside modal — design.md §4.6 row 8 (was missing JSX, only CSS existed) */}
              <div className={styles.modalTrust}>
                <div className={styles.trustItem}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  <span>Certificato incluso</span>
                </div>
                <div className={styles.trustItem}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M1 4v6h6M23 20v-6h-6"/></svg>
                  <span>Reso 30gg</span>
                </div>
                <div className={styles.trustItem}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/></svg>
                  <span>Spedizione assicurata</span>
                </div>
              </div>

              <Link href={`/prodotti/${product.slug}`} className={styles.viewFull} onClick={onClose}>
                Vedi dettagli completi →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}