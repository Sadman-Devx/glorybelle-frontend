'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { catalog } from '@/lib/api';
import { useCart } from '@/contexts/CartContext';
import type { Product, ProductVariant } from '@/lib/types';
import styles from './page.module.css';

export default function ProductDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { addItem } = useCart();                   // P0 fix #8 — wire cart
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    catalog.product(slug)
      .then((p) => {
        setProduct(p);
        const firstActive = p.variants.find(v => v.is_active && v.available_stock > 0) || p.variants[0];
        if (firstActive) setSelectedVariant(firstActive);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  const handleAddToCart = async () => {
    if (!selectedVariant) return;
    setAdding(true);
    await addItem(selectedVariant.id, 1);
    setAdding(false);
  };

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
        <a href="/prodotti" className="btn btn-primary" style={{ marginTop: '24px' }}>Torna allo Shop</a>
      </div>
    );
  }

  const currentPrice = selectedVariant?.price_override || selectedVariant?.price || product.base_price;
  const outOfStock = selectedVariant ? selectedVariant.available_stock === 0 : false;
  const images = product.images.length > 0
    ? product.images
    : [{ id: 0, image: `/products/${product.slug}.jpg`, alt_text: product.name, is_primary: true, sort_order: 0, image_alt: null }];

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
                  aria-label={`Vedi immagine ${i + 1}`}
                >
                  <Image src={img.image} alt="" width={80} height={80} style={{ objectFit: 'cover' }} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product info */}
        <div className={styles.info}>
          <span className="eyebrow eyebrow-line">{product.category?.name}</span>
          <h1 className={styles.productName}>{product.name}</h1>
          <p className={styles.productPrice}>
            EUR {parseFloat(currentPrice).toLocaleString('it-IT', { minimumFractionDigits: 2 })}
          </p>

          <p className={styles.productDesc}>{product.description}</p>

          {/* Variant selector — design.md §4.6 row 8 + VariantSelector pattern */}
          {product.variants.filter(v => v.is_active).length > 0 && (
            <div className={styles.variants}>
              <h4 className={styles.variantLabel}>
                Variante
                {selectedVariant && (
                  <span className={styles.variantValue}>
                    {selectedVariant.metal_display}
                    {selectedVariant.size ? ` · ${selectedVariant.size}` : ''}
                  </span>
                )}
              </h4>
              <div className={styles.variantRow}>
                {product.variants.filter(v => v.is_active).map((v) => (
                  <button
                    key={v.id}
                    className={`${styles.variantBtn} ${selectedVariant?.id === v.id ? styles.variantActive : ''}`}
                    onClick={() => setSelectedVariant(v)}
                    disabled={v.available_stock === 0}
                    aria-pressed={selectedVariant?.id === v.id}
                  >
                    <span>{v.metal_display}</span>
                    {v.size && <span className={styles.variantSize}>{v.size}</span>}
                    {v.available_stock === 0 && (
                      <span className={styles.variantOos}>ESAURITO</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Add to cart — now wired (P0 fix #8) */}
          <button
            className="btn btn-primary"
            onClick={handleAddToCart}
            disabled={!selectedVariant || outOfStock || adding}
            style={{ width: '100%', marginTop: '24px' }}
          >
            {!selectedVariant
              ? 'Seleziona una variante'
              : outOfStock
              ? 'Esaurito'
              : adding
              ? 'Aggiunta…'
              : `Aggiungi al Carrello — EUR ${parseFloat(currentPrice).toLocaleString('it-IT', { minimumFractionDigits: 2 })}`}
          </button>

          {/* Trust signals */}
          <div className={styles.trust}>
            <div className={styles.trustItem}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              <span>Certificato di autenticità</span>
            </div>
            <div className={styles.trustItem}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M1 4v6h6M23 20v-6h-6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 12M1 12l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
              <span>Reso gratuito entro 30 giorni</span>
            </div>
            <div className={styles.trustItem}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/></svg>
              <span>Spedizione gratuita assicurata</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}