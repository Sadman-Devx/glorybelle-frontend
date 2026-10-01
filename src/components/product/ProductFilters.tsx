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
}

const METALS = [
  { value: 'gold', label: 'Oro Giallo' },
  { value: 'rose', label: 'Oro Rosa' },
  { value: 'silver', label: 'Argento' },
];

const SORTS = [
  { value: '-created_at', label: 'Piu recenti' },
  { value: 'base_price', label: 'Prezzo crescente' },
  { value: '-base_price', label: 'Prezzo decrescente' },
  { value: 'name', label: 'Nome A-Z' },
];

const COMING_SOON_FILTERS = [
  { label: 'Fascia di prezzo', tag: 'Prossimamente' },
  { label: 'Pietra preziosa', tag: 'Prossimamente' },
];

export default function ProductFilters({
  categories, activeCategory, activeMetal,
  onCategoryChange, onMetalChange, onSortChange, sort,
}: ProductFiltersProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const filterContent = (
    <>
      {/* Categories */}
      <div className={styles.filterGroup}>
        <h4 className={styles.filterTitle}>Categoria</h4>
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

      {/* Coming Soon filters (design.md §1.6) */}
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
      {/* Desktop sidebar */}
      <aside className={styles.sidebar}>
        {filterContent}
      </aside>

      {/* Mobile bottom-sheet trigger */}
      <button className={styles.mobileToggle} onClick={() => setMobileOpen(true)}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="14" y2="12"/><line x1="4" y1="18" x2="18" y2="18"/></svg>
        Filtri
      </button>

      {/* Mobile bottom-sheet (design.md §1.3.1) */}
      {mobileOpen && (
        <div className={styles.sheetOverlay} onClick={() => setMobileOpen(false)}>
          <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
            <div className={styles.sheetHeader}>
              <h3>Filtri</h3>
              <button onClick={() => setMobileOpen(false)} aria-label="Chiudi">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div className={styles.sheetBody}>
              {filterContent}
            </div>
            <button className="btn btn-primary" style={{ width: '100%', marginTop: '16px' }} onClick={() => setMobileOpen(false)}>
              Applica Filtri
            </button>
          </div>
        </div>
      )}
    </>
  );
}
