'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './Header.module.css';

const ANNOUNCEMENTS = [
  'Artigianato italiano dal 1987 — Ogni pezzo racconta una storia',
  'Spedizione assicurata gratuita in tutta Italia',
  'Certificato di autenticita incluso con ogni acquisto',
];

export default function Header() {
  const [announcementIndex, setAnnouncementIndex] = useState(0);
  const [fade, setFade] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

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

  return (
    <>
      <div className={styles.announcement}>
        <span className={`${styles.announcementText} ${fade ? styles.fadeIn : styles.fadeOut}`}>
          {ANNOUNCEMENTS[announcementIndex]}
        </span>
      </div>

      <header className={`${styles.header} ${scrolled ? styles.scrolled : ''}`}>
        <div className={`container ${styles.headerInner}`}>
          <nav className={styles.navLeft}>
            <Link href="/shop" className={styles.navLink}>Collezione</Link>
            <Link href="/shop?category=anelli" className={styles.navLink}>Anelli</Link>
            <Link href="/shop?category=collane" className={styles.navLink}>Collane</Link>
          </nav>

          <Link href="/" className={styles.logo}>
            <span className={styles.logoText}>GLORYBELLE</span>
          </Link>

          <nav className={styles.navRight}>
            <Link href="/shop?category=orecchini" className={styles.navLink}>Orecchini</Link>
            <Link href="/shop?category=bracciali" className={styles.navLink}>Bracciali</Link>
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
              <button className={styles.iconBtn} aria-label="Carrello">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
              </button>
            </div>
          </nav>

          <button className={styles.hamburger} onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
            <span className={`${styles.hamburgerLine} ${menuOpen ? styles.open : ''}`} />
            <span className={`${styles.hamburgerLine} ${menuOpen ? styles.open : ''}`} />
            <span className={`${styles.hamburgerLine} ${menuOpen ? styles.open : ''}`} />
          </button>
        </div>

        {menuOpen && (
          <div className={styles.mobileMenu}>
            <Link href="/shop" className={styles.mobileLink} onClick={() => setMenuOpen(false)}>Collezione</Link>
            <Link href="/shop?category=anelli" className={styles.mobileLink} onClick={() => setMenuOpen(false)}>Anelli</Link>
            <Link href="/shop?category=collane" className={styles.mobileLink} onClick={() => setMenuOpen(false)}>Collane</Link>
            <Link href="/shop?category=orecchini" className={styles.mobileLink} onClick={() => setMenuOpen(false)}>Orecchini</Link>
            <Link href="/shop?category=bracciali" className={styles.mobileLink} onClick={() => setMenuOpen(false)}>Bracciali</Link>
          </div>
        )}
      </header>
    </>
  );
}
