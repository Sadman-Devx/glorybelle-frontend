'use client';

import { useState } from 'react';
import type { Category } from '@/lib/types';
import styles from './ProductFilters.module.css';

interface ProductFiltersProps {
  categories: Category[];
  activeCategory: string | null;
  activeMetal: string | null;
  onCategoryChange: (slug: string | null) => void;
  onMetalChange: (metal: string | null) => void;
  onSortChange: (sort: string) => void;
  sort: string;
  /** When true, shows skeleton placeholders instead of the category list (during initial fetch). */
  loading?: boolean;
}

const METALS = [
  { value: 'gold', label: 'Oro Giallo' },
  { value: 'rose', label: 'Oro Rosa' },
  { value: 'silver', label: 'Argento' },
];

const SORTS = [
  { value: '-created_at', label: 'Più recenti' },
  { value: 'base_price', label: 'Prezzo crescente' },
  { value: '-base_price', label: 'Prezzo decrescente' },
  { value: 'name', label: 'Nome A-Z' },
];

// Filters not yet launched — design.md §1.6: show disabled with "Prossimamente" tag,
// don't hide them. This reads as intentional brand pacing, not a technical gap.
const COMING_SOON_FILTERS = [
  { label: 'Fascia di prezzo', tag: 'Prossimamente' },
  { label: 'Pietra preziosa', tag: 'Prossimamente' },
];

export default function ProductFilters({
  categories,
  activeCategory,
  activeMetal,
  onCategoryChange,
  onMetalChange,
  onSortChange,
  sort,
  loading = false,
}: ProductFiltersProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  // Active filter count — shown as a pill badge on the mobile trigger ("Filtra (2)")
  // per design.md §1.3.1 step 1.
  const activeCount = [
    activeCategory,
    activeMetal,
    sort !== '-created_at' ? sort : null,
  ].filter(Boolean).length;

  const filterContent = (
    <>
      {/* Categories */}
      <div className={styles.filterGroup}>
        <h4 className={styles.filterTitle}>Categoria</h4>
        {loading ? (
          // Skeleton — design.md §1.7: soft ivory pulsing blocks, not gray spinners
          <>
            <div className={styles.skeletonLine} />
            <div className={styles.skeletonLine} />
            <div className={styles.skeletonLine} />
            <div className={styles.skeletonLine} />
          </>
        ) : (
          <>
            <button
              className={`${styles.filterBtn} ${!activeCategory ? styles.active : ''}`}
              onClick={() => onCategoryChange(null)}
            >
              Tutte
            </button>
            {categories.map((cat) => (
              <button
                key={cat.slug}
                className={`${styles.filterBtn} ${activeCategory === cat.slug ? styles.active : ''}`}
                onClick={() => onCategoryChange(cat.slug)}
              >
                {cat.name}
              </button>
            ))}
          </>
        )}
      </div>

      {/* Metal */}
      <div className={styles.filterGroup}>
        <h4 className={styles.filterTitle}>Metallo</h4>
        <button
          className={`${styles.filterBtn} ${!activeMetal ? styles.active : ''}`}
          onClick={() => onMetalChange(null)}
        >
          Tutti
        </button>
        {METALS.map((m) => (
          <button
            key={m.value}
            className={`${styles.filterBtn} ${activeMetal === m.value ? styles.active : ''}`}
            onClick={() => onMetalChange(m.value)}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Sort */}
      <div className={styles.filterGroup}>
        <h4 className={styles.filterTitle}>Ordina per</h4>
        {SORTS.map((s) => (
          <button
            key={s.value}
            className={`${styles.filterBtn} ${sort === s.value ? styles.active : ''}`}
            onClick={() => onSortChange(s.value)}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Coming Soon filters — design.md §1.6: disabled, not hidden */}
      {COMING_SOON_FILTERS.map((f) => (
        <div key={f.label} className={styles.filterGroup}>
          <h4 className={`${styles.filterTitle} ${styles.disabled}`}>
            {f.label}
            <span className={styles.comingSoon}>{f.tag}</span>
          </h4>
        </div>
      ))}
    </>
  );

  return (
    <>
      {/* Desktop sidebar — design.md §1.3: always expanded beside the grid ≥1024px */}
      <aside className={styles.sidebar} aria-label="Filtri">
        {filterContent}
      </aside>

      {/* Mobile / tablet bottom-sheet trigger — design.md §1.3.1 step 1
          Pill-shaped "Filtra (N)" button, count badge when filters active */}
      <button
        className={styles.mobileToggle}
        onClick={() => setMobileOpen(true)}
        aria-label={`Apri filtri${activeCount > 0 ? ` (${activeCount} attivi)` : ''}`}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <line x1="4" y1="6" x2="20" y2="6" />
          <line x1="4" y1="12" x2="14" y2="12" />
          <line x1="4" y1="18" x2="18" y2="18" />
        </svg>
        Filtra{activeCount > 0 ? ` (${activeCount})` : ''}
      </button>

      {/* Mobile bottom-sheet — design.md §1.3.1 step 2
          Slides up from bottom, ~80-85% viewport height, leaves grid peeking above */}
      {mobileOpen && (
        <div
          className={styles.sheetOverlay}
          onClick={() => setMobileOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Pannello filtri"
        >
          <div
            className={styles.sheet}
            onClick={(e) => e.stopPropagation()}
          >
            {/* design.md §1.3.1 step 4: "Clear all" link top-left + close X top-right */}
            <div className={styles.sheetHeader}>
              <h3 className={styles.sheetTitle}>Filtri</h3>
              <button
                className={styles.sheetClose}
                onClick={() => setMobileOpen(false)}
                aria-label="Chiudi filtri"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* design.md §1.3.1 step 3: accordion (one section open at a time).
                For MVP, all sections render expanded — the sheet scrolls if needed. */}
            <div className={styles.sheetBody}>
              {filterContent}
            </div>

            {/* design.md §1.3.1 step 4: sticky footer with primary "Applica" button */}
            <div className={styles.sheetFooter}>
              <button
                className={styles.clearAll}
                onClick={() => {
                  onCategoryChange(null);
                  onMetalChange(null);
                  onSortChange('-created_at');
                }}
                disabled={activeCount === 0}
              >
                Cancella tutto
              </button>
              <button
                className={styles.applyBtn}
                onClick={() => setMobileOpen(false)}
              >
                Mostra risultati
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}