'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { catalog } from '@/lib/api';
import type { Product, ProductVariant } from '@/lib/types';
import styles from './page.module.css';

export default function ProductDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    catalog.product(slug)
      .then((p) => {
        setProduct(p);
        if (p.variants.length > 0) setSelectedVariant(p.variants[0]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className={`section container ${styles.skeleton}`}>
        <div className={styles.skeletonImage} />
        <div className={styles.skeletonInfo}>
          <div className={styles.skeletonLine} style={{ width: '60%', height: '28px' }} />
          <div className={styles.skeletonLine} style={{ width: '30%', height: '20px' }} />
          <div className={styles.skeletonLine} style={{ width: '100%', height: '80px' }} />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="section container" style={{ textAlign: 'center' }}>
        <h2 className="heading-section">Prodotto non trovato</h2>
        <a href="/shop" className="btn btn-primary" style={{ marginTop: '24px' }}>Torna allo Shop</a>
      </div>
    );
  }

  const currentPrice = selectedVariant?.price_override || selectedVariant?.price || product.base_price;
  const images = product.images.length > 0 ? product.images : [{ id: 0, image: '/placeholder-product.svg', alt_text: product.name, is_primary: true, sort_order: 0, image_alt: null }];

  return (
    <div className="section">
      <div className={`container ${styles.detail}`}>
        {/* Image gallery */}
        <div className={styles.gallery}>
          <div className={styles.mainImage}>
            <Image
              src={images[selectedImage]?.image || '/placeholder-product.svg'}
              alt={images[selectedImage]?.alt_text || product.name}
              fill
              sizes="(max-width: 767px) 100vw, 50vw"
              style={{ objectFit: 'cover' }}
              priority
            />
          </div>
          {images.length > 1 && (
            <div className={styles.thumbs}>
              {images.map((img, i) => (
                <button
                  key={img.id}
                  className={`${styles.thumb} ${i === selectedImage ? styles.thumbActive : ''}`}
                  onClick={() => setSelectedImage(i)}
                >
                  <Image src={img.image} alt="" width={80} height={80} style={{ objectFit: 'cover' }} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product info */}
        <div className={styles.info}>
          <span className="eyebrow">{product.category?.name}</span>
          <h1 className={styles.productName}>{product.name}</h1>
          <p className={styles.price}>
            EUR {parseFloat(currentPrice).toLocaleString('it-IT', { minimumFractionDigits: 2 })}
          </p>

          <p className={styles.description}>{product.description}</p>

          {/* Variant selector */}
          {product.variants.length > 0 && (
            <div className={styles.variants}>
              <h4 className={styles.variantTitle}>Variante</h4>
              <div className={styles.variantGrid}>
                {product.variants.filter(v => v.is_active).map((v) => (
                  <button
                    key={v.id}
                    className={`${styles.variantBtn} ${selectedVariant?.id === v.id ? styles.variantActive : ''}`}
                    onClick={() => setSelectedVariant(v)}
                    disabled={v.available_stock === 0}
                  >
                    <span>{v.metal_display}</span>
                    {v.size && <span className={styles.variantSize}>{v.size}</span>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Add to cart */}
          <button className="btn btn-primary" style={{ width: '100%', marginTop: '24px' }}>
            Aggiungi al Carrello
          </button>

          {/* Trust signals */}
          <div className={styles.trust}>
            <div className={styles.trustItem}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              <span>Certificato di autenticita</span>
            </div>
            <div className={styles.trustItem}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M1 4v6h6M23 20v-6h-6"/></svg>
              <span>Reso gratuito entro 30 giorni</span>
            </div>
            <div className={styles.trustItem}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/></svg>
              <span>Spedizione gratuita assicurata</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
