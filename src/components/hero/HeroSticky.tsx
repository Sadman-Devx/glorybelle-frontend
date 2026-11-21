'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import styles from './HeroSticky.module.css';

const HERO_IMAGES = [
  '/hero/hero-1.jpg',
  '/hero/hero-2.jpg',
  '/hero/hero-3.jpg',
];

export default function HeroSticky() {
  const [currentImage, setCurrentImage] = useState(0);
  const [scrollY, setScrollY] = useState(0);
  const heroRef = useRef<HTMLElement>(null);

  // 3-image crossfade slideshow
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Parallax drift — design.md §4.3 "Parallax drift"
  // Background drifts slower than scroll, creating depth without being jarring.
  // Maximum ~15-20% translate per the design system.
  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return;

    const onScroll = () => {
      if (heroRef.current) {
        const rect = heroRef.current.getBoundingClientRect();
        // Only update while hero is in viewport
        if (rect.bottom > 0 && rect.top < window.innerHeight) {
          setScrollY(window.scrollY);
        }
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Parallax transform — moves bg at 0.3x scroll speed, max 18% drift
  const parallaxOffset = Math.min(scrollY * 0.3, 180);

  return (
    <section ref={heroRef} className={styles.hero}>
      {/* Pinned background — design.md §1.1: "background stays fixed while hero
          content and stats rise over it". Uses position: sticky so the hero
          stays pinned at the top of the viewport while the next section
          scrolls up over it. */}
      <div
        className={styles.bgWrap}
        style={{ transform: `translate3d(0, ${parallaxOffset}px, 0)` }}
      >
        {HERO_IMAGES.map((src, i) => (
          <div
            key={src}
            className={`${styles.bgImage} ${i === currentImage ? styles.active : ''}`}
            style={{ backgroundImage: `url(${src})` }}
            role="img"
            aria-label="Gioielleria artigianale italiana"
          />
        ))}
        <div className={styles.overlay} />
      </div>

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

        {/* Scroll indicator — fades out as user scrolls, signals "scroll down" */}
        <div
          className={styles.scrollHint}
          style={{ opacity: scrollY < 100 ? 1 : 0 }}
          aria-hidden="true"
        >
          <span>Scorri</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12l7 7 7-7" />
          </svg>
        </div>
      </div>
    </section>
  );
}
