'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './ProductCard.module.css';

interface ProductCardProps {
  name: string;
  slug: string;
  price: string;
  primaryImage: string | null;
  hoverImage: string | null;
  metal: string;
  metalDisplay: string;
  isWishlisted?: boolean;
  onWishlistToggle?: () => void;
  onQuickView?: () => void;
  compact?: boolean;
}

export default function ProductCard({
  name, slug, price, primaryImage, hoverImage, metalDisplay,
  isWishlisted = false, onWishlistToggle, onQuickView, compact = false,
}: ProductCardProps) {
  // Track which image is "pinned" by the user clicking a dot.
  // On desktop hover, the card automatically swaps to image 2 (demo HTML behavior).
  // On mobile (no hover), the dots let the user manually toggle.
  const [pinnedImage, setPinnedImage] = useState<0 | 1>(0);
  const [isHovering, setIsHovering] = useState(false);
  const hasSecondImage = !!hoverImage;

  const cardClass = compact ? `${styles.card} ${styles.compact}` : styles.card;
  const fallbackSrc = `/products/${slug}.jpg`;
  const imgSrc = primaryImage || fallbackSrc;
  const img2Src = hoverImage || '';

  // Demo HTML behavior:
  // - Desktop hover: crossfade img -> img2 (override the pinned dot temporarily)
  // - Mouse leave: revert to pinned image
  // - Mobile dots: pin image 0 or 1 (manual toggle, persists)
  const activeIdx = isHovering && hasSecondImage ? 1 : pinnedImage;

  return (
    <div
      className={cardClass}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div className={styles.mediaWrap}>
        <Link href={`/prodotti/${slug}`} className={styles.mediaLink}>
          <div className={styles.imageStack}>
            <Image
              src={imgSrc}
              alt={name}
              fill
              sizes={compact ? '220px' : '(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 33vw'}
              className={`${styles.image} ${styles.imagePrimary} ${activeIdx === 1 ? styles.imageHidden : ''}`}
              priority={!compact}
            />
            {hasSecondImage && (
              <Image
                src={img2Src}
                alt={`${name} - dettaglio`}
                fill
                sizes={compact ? '220px' : '(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 33vw'}
                className={`${styles.image} ${styles.imageAlt} ${activeIdx === 1 ? styles.imageVisible : ''}`}
              />
            )}
          </div>
        </Link>

        <div className={styles.hallmark} aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        </div>

        <button
          className={`${styles.wishlistBtn} ${isWishlisted ? styles.wishlisted : ''}`}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onWishlistToggle?.(); }}
          aria-label={isWishlisted ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti'}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill={isWishlisted ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.6">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </button>

        {!compact && (
          <button
            className={styles.quickView}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onQuickView?.(); }}
          >
            Vista rapida
          </button>
        )}

        {/* 6px dots — only show on touch devices (CSS hides them on hover-capable screens) */}
        {hasSecondImage && (
          <div className={styles.dots} role="tablist" aria-label="Seleziona immagine">
            <button
              className={`${styles.dot} ${pinnedImage === 0 ? styles.dotActive : ''}`}
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setPinnedImage(0); }}
              aria-label="Immagine 1"
              role="tab"
              aria-selected={pinnedImage === 0}
            />
            <button
              className={`${styles.dot} ${pinnedImage === 1 ? styles.dotActive : ''}`}
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setPinnedImage(1); }}
              aria-label="Immagine 2"
              role="tab"
              aria-selected={pinnedImage === 1}
            />
          </div>
        )}
      </div>

      <div className={styles.body}>
        <Link href={`/prodotti/${slug}`} className={styles.nameLink}>
          <h3 className={styles.name}>{name}</h3>
        </Link>
        <div className={styles.meta}>
          <span className={styles.metal}>{metalDisplay}</span>
          <span className={styles.price}>EUR {parseFloat(price).toLocaleString('it-IT', { minimumFractionDigits: 2 })}</span>
        </div>
      </div>
    </div>
  );
}