'use client';

import { useState } from 'react';
import { Fragment } from 'react';
import ProductCard from './ProductCard';
import AtelierCard from './AtelierCard';
import type { ProductListItem } from '@/lib/types';
import styles from './ProductGrid.module.css';

interface ProductGridProps {
  products: ProductListItem[];
  onQuickView?: (slug: string) => void;
  /** When true (default), insert an AtelierCard after the 4th product (design.md §4.6 row 4). */
  showAtelierCta?: boolean;
  /** Active category slug — picks a matching Atelier CTA variant. */
  activeCategory?: string;
}

// Atelier "create your own" CTA variants — picked based on active category.
const ATELIER_CTAS: Record<string, { title: string; subtitle: string; href: string; icon: 'ring' | 'necklace' | 'earrings' }> = {
  anelli:     { title: 'Crea il tuo anello',    subtitle: 'Personalizza ogni dettaglio', href: '/atelier/anelli',     icon: 'ring' },
  collane:    { title: 'Crea la tua collana',   subtitle: 'Il tuo pezzo unico',         href: '/atelier/collane',    icon: 'necklace' },
  orecchini:  { title: 'Crea i tuoi orecchini', subtitle: 'Scegli pietra e montatura',  href: '/atelier/orecchini',  icon: 'earrings' },
};
const DEFAULT_ATELIER = {
  title: 'Crea il tuo gioiello',
  subtitle: 'Personalizza ogni dettaglio',
  href: '/atelier',
  icon: 'ring' as const,
};

const ATELIER_INSERT_INDEX = 4;  // design.md §4.6 row 4 — interrupts the grid rhythm

export default function ProductGrid({
  products,
  onQuickView,
  showAtelierCta = true,
  activeCategory,
}: ProductGridProps) {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // ── Empty state (design.md §1.6 — branded "coming soon", never generic 404) ──
  if (products.length === 0) {
    const heading = activeCategory
      ? `La collezione ${activeCategory} sta arrivando`
      : 'Nessun gioiello corrisponde a questi filtri';
    const subline = activeCategory
      ? 'Stiamo lavorando a qualcosa di speciale.'
      : 'Prova a rimuovere uno dei filtri attivi.';

    return (
      <div className={styles.empty} role="status">
        <svg
          className={styles.emptyIcon}
          width="64"
          height="64"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="14" r="7" />
          <polygon points="12,3 15,8 9,8" />
        </svg>
        <h3 className={styles.emptyTitle}>{heading}</h3>
        <p className={styles.emptyDesc}>{subline}</p>

        {!activeCategory && (
          <p className={styles.emptyHint}>
            Oppure{' '}
            <button className={styles.emptyLink} onClick={() => window.history.back()}>
              torna alla collezione precedente
            </button>
            .
          </p>
        )}

        {activeCategory && (
          <form
            className={styles.waitlist}
            onSubmit={(e) => {
              e.preventDefault();
              if (email) setSubmitted(true);
            }}
          >
            <label htmlFor="waitlist-email" className={styles.waitlistLabel}>
              Avvisami quando sarà disponibile
            </label>
            {submitted ? (
              <p className={styles.waitlistSuccess} role="status">
                Grazie — ti scriveremo non appena la collezione sarà pronta.
              </p>
            ) : (
              <div className={styles.waitlistRow}>
                <input
                  id="waitlist-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tuaemail@esempio.it"
                  className={styles.waitlistInput}
                />
                <button type="submit" className={styles.waitlistBtn}>Avvisami</button>
              </div>
            )}
          </form>
        )}
      </div>
    );
  }

  // ── Pick Atelier CTA variant ──
  const atelier = (activeCategory && ATELIER_CTAS[activeCategory]) || DEFAULT_ATELIER;

  return (
    <div className={styles.grid}>
      {products.map((product, i) => (
        <Fragment key={product.id}>
          <ProductCard
            productId={product.id}
            name={product.name}
            slug={product.slug}
            price={product.min_price || product.base_price}
            primaryImage={product.primary_image}
            hoverImage={product.hover_image}
            metal={product.metal}
            metalDisplay={product.metal_display}
            onQuickView={() => onQuickView?.(product.slug)}
          />
          {showAtelierCta && i === ATELIER_INSERT_INDEX - 1 && (
            <AtelierCard
              title={atelier.title}
              subtitle={atelier.subtitle}
              href={atelier.href}
              icon={atelier.icon}
            />
          )}
        </Fragment>
      ))}
    </div>
  );
}