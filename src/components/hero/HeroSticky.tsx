'use client';

import { useState, useEffect } from 'react';
import styles from './HeroSticky.module.css';

const HERO_IMAGES = [
  '/hero/hero-1.jpg',
  '/hero/hero-2.jpg',
  '/hero/hero-3.jpg',
];

export default function HeroSticky() {
  const [currentImage, setCurrentImage] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className={styles.hero}>
      <div className={styles.bgWrap}>
        {HERO_IMAGES.map((src, i) => (
          <div
            key={src}
            className={`${styles.bgImage} ${i === currentImage ? styles.active : ''}`}
            style={{ backgroundImage: `url(${src})` }}
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
          <a href="/shop" className="btn btn-gold">Scopri la Collezione</a>
          <a href="/about" className="btn btn-secondary" style={{ color: 'white', borderColor: 'rgba(255,255,255,0.4)' }}>
            La Nostra Storia
          </a>
        </div>
      </div>
    </section>
  );
}
