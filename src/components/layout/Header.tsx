'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useCart } from '@/contexts/CartContext';
import MegaMenu from '@/components/nav/MegaMenu';
import MobileNav from '@/components/nav/MobileNav';
import styles from './Header.module.css';

const ANNOUNCEMENTS = [
  'Artigianato italiano dal 1987 — Ogni pezzo racconta una storia',
  'Spedizione assicurata gratuita in tutta Italia',
  'Certificato di autenticità incluso con ogni acquisto',
];

// Categories with mega menu support (P1 fix #19)
const MEGA_CATEGORIES = [
  { slug: 'anelli', label: 'Anelli' },
  { slug: 'collane', label: 'Collane' },
  { slug: 'orecchini', label: 'Orecchini' },
  { slug: 'bracciali', label: 'Bracciali' },
];

export default function Header() {
  const [announcementIndex, setAnnouncementIndex] = useState(0);
  const [fade, setFade] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);          // MobileNav
  const [scrolled, setScrolled] = useState(false);
  const [megaOpen, setMegaOpen] = useState<string | null>(null);  // MegaMenu slug
  const [megaCloseTimer, setMegaCloseTimer] = useState<NodeJS.Timeout | null>(null);

  const { itemCount, openDrawer } = useCart();

  // Stable reference: MobileNav runs an effect on [pathname, onClose]. An inline
  // arrow here changed on every Header render (announcement ticks every 4s) and
  // closed the mobile menu by itself.
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setAnnouncementIndex((i) => (i + 1) % ANNOUNCEMENTS.length);
        setFade(true);
      }, 500);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Mega menu hover behavior — open on enter, close with delay on leave
  // (delay prevents flicker when moving mouse between trigger and menu)
  const openMega = (slug: string) => {
    if (megaCloseTimer) {
      clearTimeout(megaCloseTimer);
      setMegaCloseTimer(null);
    }
    setMegaOpen(slug);
  };

  const scheduleCloseMega = () => {
    if (megaCloseTimer) clearTimeout(megaCloseTimer);
    const timer = setTimeout(() => setMegaOpen(null), 200);
    setMegaCloseTimer(timer);
  };

  const closeMega = () => {
    if (megaCloseTimer) clearTimeout(megaCloseTimer);
    setMegaOpen(null);
  };

  return (
    <>
      <div className={styles.announcement}>
        <span className={`${styles.announcementText} ${fade ? styles.fadeIn : styles.fadeOut}`}>
          {ANNOUNCEMENTS[announcementIndex]}
        </span>
      </div>

      <header
        className={`${styles.header} ${scrolled ? styles.scrolled : ''}`}
        onMouseLeave={scheduleCloseMega}
      >
        <div className={`container ${styles.headerInner}`}>
          <nav className={styles.navLeft}>
            <Link href="/prodotti" className={styles.navLink}>Collezione</Link>
            {MEGA_CATEGORIES.slice(0, 2).map((cat) => (
              <Link
                key={cat.slug}
                href={`/prodotti?category=${cat.slug}`}
                className={`${styles.navLink} ${styles.megaTrigger}`}
                onMouseEnter={() => openMega(cat.slug)}
                onFocus={() => openMega(cat.slug)}
              >
                {cat.label}
              </Link>
            ))}
          </nav>

          <Link href="/" className={styles.logo}>
            <span className={styles.logoText}>GLORYBELLE</span>
          </Link>

          <nav className={styles.navRight}>
            {MEGA_CATEGORIES.slice(2).map((cat) => (
              <Link
                key={cat.slug}
                href={`/prodotti?category=${cat.slug}`}
                className={`${styles.navLink} ${styles.megaTrigger}`}
                onMouseEnter={() => openMega(cat.slug)}
                onFocus={() => openMega(cat.slug)}
              >
                {cat.label}
              </Link>
            ))}
            <div className={styles.icons}>
              <button className={styles.iconBtn} aria-label="Cerca">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              </button>
              <Link href="/account" className={styles.iconBtn} aria-label="Account">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </Link>
              <Link href="/wishlist" className={styles.iconBtn} aria-label="Lista desideri">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
              </Link>
              <button
                className={styles.iconBtn}
                onClick={openDrawer}
                aria-label={`Carrello${itemCount > 0 ? ` (${itemCount} articoli)` : ''}`}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                {itemCount > 0 && (
                  <span className={styles.badge} aria-hidden="true">{itemCount}</span>
                )}
              </button>
            </div>
          </nav>

          {/* Hamburger — below 1024px (tablets + mobile, per design.md §1.3.1) */}
          <button
            className={styles.hamburger}
            onClick={() => setMenuOpen(true)}
            aria-label="Apri menu"
            aria-expanded={menuOpen}
          >
            <span className={styles.hamburgerLine} />
            <span className={styles.hamburgerLine} />
            <span className={styles.hamburgerLine} />
          </button>
        </div>

        {/* Mega menu — one at a time, rendered for the active category */}
        {MEGA_CATEGORIES.map((cat) => (
          <MegaMenu
            key={cat.slug}
            categorySlug={cat.slug}
            categoryLabel={cat.label}
            isOpen={megaOpen === cat.slug}
            onClose={closeMega}
          />
        ))}
      </header>

      {/* Mobile nav drawer — below 1024px */}
      <MobileNav open={menuOpen} onClose={closeMenu} />
    </>
  );
}
