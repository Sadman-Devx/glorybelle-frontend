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
  const [activeImage, setActiveImage] = useState(0);
  const hasSecondImage = !!hoverImage;
  const cardClass = compact ? `${styles.card} ${styles.compact}` : styles.card;
  const placeholderSrc = '/placeholder-product.svg';
  const imgSrc = primaryImage || placeholderSrc;
  const img2Src = hoverImage || '';

  return (
    <div className={cardClass}>
      <div className={styles.mediaWrap}>
        <Link href={`/shop/${slug}`} className={styles.mediaLink}>
          <div className={styles.imageStack}>
            <Image
              src={imgSrc}
              alt={name}
              fill
              sizes={compact ? '220px' : '(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 33vw'}
              className={`${styles.image} ${styles.imagePrimary} ${activeImage === 1 ? styles.imageHidden : ''}`}
            />
            {hasSecondImage && (
              <Image
                src={img2Src}
                alt={`${name} - dettaglio`}
                fill
                sizes={compact ? '220px' : '(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 33vw'}
                className={`${styles.image} ${styles.imageAlt} ${activeImage === 1 ? styles.imageVisible : ''}`}
              />
            )}
          </div>
        </Link>

        <div className={styles.hallmark}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
        </div>

        <button
          className={`${styles.wishlistBtn} ${isWishlisted ? styles.wishlisted : ''}`}
          onClick={(e) => { e.preventDefault(); onWishlistToggle?.(); }}
          aria-label={isWishlisted ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti'}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill={isWishlisted ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.6"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        </button>

        {!compact && (
          <button className={styles.quickView} onClick={onQuickView}>Vista rapida</button>
        )}

        {hasSecondImage && (
          <div className={styles.dots}>
            <button className={`${styles.dot} ${activeImage === 0 ? styles.dotActive : ''}`} onClick={() => setActiveImage(0)} aria-label="Immagine 1" />
            <button className={`${styles.dot} ${activeImage === 1 ? styles.dotActive : ''}`} onClick={() => setActiveImage(1)} aria-label="Immagine 2" />
          </div>
        )}
      </div>

      <div className={styles.body}>
        <Link href={`/shop/${slug}`} className={styles.nameLink}>
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
