'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { lockBodyScroll } from '@/lib/scrollLock';
import styles from './MobileNav.module.css';

interface MobileNavProps {
  open: boolean;
  onClose: () => void;
}

const NAV_LINKS = [
  { href: '/prodotti', label: 'Tutti i gioielli' },
  { href: '/prodotti?category=anelli', label: 'Anelli' },
  { href: '/prodotti?category=collane', label: 'Collane' },
  { href: '/prodotti?category=orecchini', label: 'Orecchini' },
  { href: '/prodotti?category=bracciali', label: 'Bracciali' },
];

const METAL_LINKS = [
  { href: '/prodotti?metal=gold', label: 'Oro Giallo' },
  { href: '/prodotti?metal=rose', label: 'Oro Rosa' },
  { href: '/prodotti?metal=silver', label: 'Argento 925' },
];

export default function MobileNav({ open, onClose }: MobileNavProps) {
  const pathname = usePathname();
  const [openSection, setOpenSection] = useState<string | null>('categories');

  // Close drawer on route change
  useEffect(() => {
    onClose();
  }, [pathname, onClose]);

  // ESC key + body scroll lock
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const unlock = lockBodyScroll();
    return () => {
      document.removeEventListener('keydown', onKey);
      unlock();
    };
  }, [open, onClose]);

  if (!open) return null;

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <aside
        className={styles.drawer}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Menu di navigazione"
      >
        {/* Header */}
        <div className={styles.header}>
          <Link href="/" className={styles.logo}>
            GLORYBELLE
          </Link>
          <button
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Chiudi menu"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body — accordion of sections */}
        <div className={styles.body}>
          {/* Categories */}
          <div className={styles.accordion}>
            <button
              className={styles.accordionHeader}
              onClick={() => toggleSection('categories')}
              aria-expanded={openSection === 'categories'}
            >
              Categorie
              <svg className={openSection === 'categories' ? styles.chevronOpen : styles.chevron} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
            {openSection === 'categories' && (
              <ul className={styles.linkList}>
                {NAV_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className={styles.link}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Metals */}
          <div className={styles.accordion}>
            <button
              className={styles.accordionHeader}
              onClick={() => toggleSection('metals')}
              aria-expanded={openSection === 'metals'}
            >
              Metalli
              <svg className={openSection === 'metals' ? styles.chevronOpen : styles.chevron} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
            {openSection === 'metals' && (
              <ul className={styles.linkList}>
                {METAL_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className={styles.link}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Account / Wishlist — direct links (no accordion) */}
          <div className={styles.staticLinks}>
            <Link href="/account" className={styles.staticLink}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              Il mio account
            </Link>
            <Link href="/wishlist" className={styles.staticLink}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              Lista desideri
            </Link>
          </div>
        </div>

        {/* Footer — contact info */}
        <div className={styles.footer}>
          <p className={styles.contactLabel}>Hai bisogno di aiuto?</p>
          <a href="tel:+390212345678" className={styles.contactLink}>
            +39 02 1234 5678
          </a>
          <span className={styles.contactHours}>
            Lun – Sab, 9:00 – 19:00
          </span>
        </div>
      </aside>
    </div>
  );
}
