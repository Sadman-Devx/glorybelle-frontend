import RevealOnScroll from '@/components/animation/RevealOnScroll';
import styles from './InstagramGrid.module.css';

interface InstaTile {
  image: string;
  alt: string;
}

const TILES: InstaTile[] = [
  { image: '/instagram/1.jpg', alt: 'Cliente con anello GLORYBELLE' },
  { image: '/instagram/2.jpg', alt: 'Collana indossata' },
  { image: '/instagram/3.jpg', alt: 'Dettaglio orecchini' },
  { image: '/instagram/4.jpg', alt: 'Bracciale al polso' },
  { image: '/instagram/5.jpg', alt: 'Gioiello in studio' },
  { image: '/instagram/6.jpg', alt: 'Cliente con collana' },
  { image: '/instagram/7.jpg', alt: 'Anello al dito' },
];

export default function InstagramGrid() {
  return (
    <section className={styles.section} aria-label="Seguici su Instagram">
      <div className={styles.grid}>
        {TILES.map((tile, i) => (
          <RevealOnScroll key={i} delay={(i % 4) as 0 | 1 | 2 | 3}>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.tile}
              aria-label={`Vedi su Instagram: ${tile.alt}`}
            >
              <img
                src={tile.image}
                alt={tile.alt}
                className={styles.img}
                loading="lazy"
              />
            </a>
          </RevealOnScroll>
        ))}

        {/* Last tile is the CTA, not a photo — design.md §4.6 row 6 */}
        <RevealOnScroll delay={3}>
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.ctaTile}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="5" />
              <circle cx="12" cy="12" r="4" />
              <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
            </svg>
            <span className={styles.ctaText}>
              Seguici su
              <br />
              Instagram
            </span>
            <span className={styles.ctaArrow} aria-hidden="true">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </span>
          </a>
        </RevealOnScroll>
      </div>
    </section>
  );
}