'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './MegaMenu.module.css';

interface MegaMenuProps {
  /** Category slug that triggers this mega menu (e.g. "anelli") */
  categorySlug: string;
  /** Display name (e.g. "Anelli") */
  categoryLabel: string;
  /** Trigger element — the parent hover area */
  isOpen: boolean;
  onClose: () => void;
}

const METALS = [
  { slug: 'gold', label: 'Oro Giallo' },
  { slug: 'rose', label: 'Oro Rosa' },
  { slug: 'silver', label: 'Argento 925' },
];

const PRICE_BUCKETS = [
  { max: '100', label: 'Sotto €100' },
  { min: '100', max: '200', label: '€100 – €200' },
  { min: '200', label: 'Oltre €200' },
];

const PROMO_IMAGES: Record<string, string> = {
  anelli: '/collections/anelli.jpg',
  collane: '/collections/collane.jpg',
  orecchini: '/collections/orecchini.jpg',
  bracciali: '/collections/anelli.jpg', // fallback
};

export default function MegaMenu({
  categorySlug,
  categoryLabel,
  isOpen,
  onClose,
}: MegaMenuProps) {
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Build a filter URL for a specific metal + category combo
  const buildUrl = (metal?: string, price?: { min?: string; max?: string }) => {
    const params = new URLSearchParams();
    params.set('category', categorySlug);
    if (metal) params.set('metal', metal);
    if (price?.min) params.set('min_price', price.min);
    if (price?.max) params.set('max_price', price.max);
    return `/prodotti?${params.toString()}`;
  };

  // ESC key closes the menu
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim().length >= 2) {
      router.push(`/prodotti?search=${encodeURIComponent(searchQuery.trim())}`);
      onClose();
    }
  };

  if (!isOpen) return null;

  const promoImage = PROMO_IMAGES[categorySlug] || '/collections/anelli.jpg';

  return (
    <>
      {/* Backdrop — click outside to close */}
      <div className={styles.backdrop} onClick={onClose} aria-hidden="true" />

      {/* Mega menu panel */}
      <div
        ref={menuRef}
        className={styles.menu}
        role="menu"
        aria-label={`Menu ${categoryLabel}`}
      >
        <div className={styles.inner}>
          {/* Column 1 — Quick search */}
          <div className={styles.col}>
            <h5 className={styles.colTitle}>Cerca</h5>
            <form onSubmit={handleSearch} className={styles.searchForm}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cerca gioielli…"
                className={styles.searchInput}
                aria-label="Cerca gioielli"
              />
              <button type="submit" className={styles.searchBtn} aria-label="Cerca">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </button>
            </form>
            <Link href={`/prodotti?category=${categorySlug}`} className={styles.seeAll} onClick={onClose}>
              Vedi tutti i {categoryLabel.toLowerCase()} →
            </Link>
          </div>

          {/* Column 2 — By metal */}
          <div className={styles.col}>
            <h5 className={styles.colTitle}>Per Metallo</h5>
            <ul className={styles.linkList}>
              {METALS.map((m) => (
                <li key={m.slug}>
                  <Link
                    href={buildUrl(m.slug)}
                    className={styles.link}
                    onClick={onClose}
                  >
                    <span className={styles.swatch} data-metal={m.slug} aria-hidden="true" />
                    {m.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3 — By price */}
          <div className={styles.col}>
            <h5 className={styles.colTitle}>Per Prezzo</h5>
            <ul className={styles.linkList}>
              {PRICE_BUCKETS.map((p, i) => (
                <li key={i}>
                  <Link
                    href={buildUrl(undefined, p)}
                    className={styles.link}
                    onClick={onClose}
                  >
                    {p.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4 — Promo image */}
          <div className={styles.promoCol}>
            <Link
              href={`/prodotti?category=${categorySlug}`}
              className={styles.promoCard}
              onClick={onClose}
              style={{ backgroundImage: `url(${promoImage})` }}
            >
              <div className={styles.promoOverlay} />
              <div className={styles.promoText}>
                <span className={styles.promoEyebrow}>Novità</span>
                <h4 className={styles.promoTitle}>Collezione {categoryLabel}</h4>
                <span className={styles.promoCta}>Esplora →</span>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
