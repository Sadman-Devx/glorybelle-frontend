'use client';

import { useState, useEffect, type ReactNode } from 'react';
import Link from 'next/link';
import { siteContent } from '@/lib/api';
import styles from './HeroSticky.module.css';

const HERO_IMAGES = [
  '/hero/hero-1.jpg',
  '/hero/hero-2.jpg',
  '/hero/hero-3.jpg',
];

// Scroll distance (px) after which the "Scorri" hint fades out
const HINT_HIDE_AFTER = 100;

interface HeroStickyProps {
  /**
   * Content that must rise OVER the pinned background (the stats block).
   * It has to live inside the hero wrapper: `position: sticky` only pins an
   * element for as long as its parent is on screen, so the background and the
   * section that covers it need the same parent.
   */
  children?: ReactNode;
}

export default function HeroSticky({ children }: HeroStickyProps) {
  const [currentImage, setCurrentImage] = useState(0);
  const [heroImages, setHeroImages] = useState(HERO_IMAGES);
  const [hintVisible, setHintVisible] = useState(true);

  useEffect(() => {
    let active = true;
    siteContent.hero().then((images) => {
      if (active && images.length > 0) {
        setHeroImages(images.map((image) => image.image_url));
      }
    }).catch((error: unknown) => {
      console.error('Non è stato possibile caricare le immagini hero.', error);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (heroImages.length < 2) return undefined;
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % heroImages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [heroImages.length]);

  // Scroll hint — state only changes when the threshold is crossed,
  // so scrolling does not re-render the hero on every frame.
  useEffect(() => {
    const onScroll = () => setHintVisible(window.scrollY < HINT_HIDE_AFTER);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const activeImage = currentImage % heroImages.length;

  return (
    <section className={styles.hero}>
      {/* Pinned background — design.md §1.1: "background stays fixed while hero
          content and stats rise over it". ONLY this layer is sticky. */}
      <div className={styles.bg} aria-hidden="true">
        {heroImages.map((src, i) => (
          <div
            key={src}
            className={`${styles.bgImage} ${i === activeImage ? styles.active : ''}`}
            style={{ backgroundImage: `url(${src})` }}
          />
        ))}
        <div className={styles.overlay} />
      </div>

      {/* Hero content — normal flow, scrolls away with the page.
          Pulled up over the background with a negative margin. */}
      <div className={styles.stage}>
        <div className={`container ${styles.content}`}>
          <span className={`eyebrow eyebrow-line ${styles.eyebrow}`}>
            Gioielleria Artigianale
          </span>
          <h1 className={`heading-display ${styles.title}`}>
            L&apos;Arte della<br />Bellezza Italiana
          </h1>
          <p className={styles.subtitle}>
            Ogni pezzo racconta una storia di passione, precisione e tradizione
            artigianale tramandata da generazioni.
          </p>
          <div className={styles.ctas}>
            <Link href="/prodotti" className="btn btn-gold">Scopri la Collezione</Link>
            <Link href="/about" className={`btn btn-secondary ${styles.secondaryBtn}`}>
              La Nostra Storia
            </Link>
          </div>
        </div>

        {/* Scroll indicator — anchored to the bottom of the hero */}
        <div
          className={`${styles.scrollHint} ${hintVisible ? '' : styles.scrollHintHidden}`}
          aria-hidden="true"
        >
          <span>Scorri</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12l7 7 7-7" />
          </svg>
        </div>
      </div>

      {/* Rises over the pinned background (opaque, above it in z-order) */}
      {children && <div className={styles.rise}>{children}</div>}
    </section>
  );
}
