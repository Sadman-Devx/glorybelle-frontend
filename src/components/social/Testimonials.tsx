'use client';

import { useState } from 'react';
import RevealOnScroll from '@/components/animation/RevealOnScroll';
import styles from './Testimonials.module.css';

interface Testimonial {
  quote: string;
  name: string;
  role: string;
  photo: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    quote: "L'anello è arrivato esattamente come in foto — la garanzia e il certificato lo rendono un vero investimento, non solo un acquisto.",
    name: 'Francesca R.',
    role: 'Cliente, Milano',
    photo: '/testimonials/francesca.jpg',
  },
  {
    quote: "Ho ordinato la collana Cascade come regalo di anniversario. Anche solo la confezione sembrava quella di una vera gioielleria.",
    name: 'Marco T.',
    role: 'Cliente, Roma',
    photo: '/testimonials/marco.jpg',
  },
  {
    quote: "Il ridimensionamento gratuito mi ha salvato — l'anello non era della misura giusta e l'hanno sistemato in una settimana senza problemi.",
    name: 'Giulia N.',
    role: 'Cliente, Torino',
    photo: '/testimonials/giulia.jpg',
  },
];

export default function Testimonials() {
  const [idx, setIdx] = useState(0);
  const current = TESTIMONIALS[idx];
  const prev = () => setIdx((i) => (i - 1 + TESTIMONIALS.length) % TESTIMONIALS.length);
  const next = () => setIdx((i) => (i + 1) % TESTIMONIALS.length);

  return (
    <section className={styles.testi} id="reviews" aria-label="Recensioni clienti">
      <div className="container">
        <div className={styles.grid}>
          <RevealOnScroll>
            <div className={styles.text}>
              <span className={`eyebrow eyebrow-line ${styles.eyebrow}`}>
                Cosa dicono i clienti
              </span>
              <blockquote className={styles.quote}>
                &ldquo;{current.quote}&rdquo;
              </blockquote>
              <div className={styles.person}>
                <strong className={styles.name}>{current.name}</strong>
                <span className={styles.role}>{current.role}</span>
              </div>
              <div className={styles.arrows}>
                <button
                  className={styles.arrow}
                  onClick={prev}
                  aria-label="Recensione precedente"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 6l-6 6 6 6" />
                  </svg>
                </button>
                <button
                  className={styles.arrow}
                  onClick={next}
                  aria-label="Recensione successiva"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 6l6 6-6 6" />
                  </svg>
                </button>
              </div>
            </div>
          </RevealOnScroll>

          <RevealOnScroll delay={1}>
            <div className={styles.photoWrap}>
              <img
                src={current.photo}
                alt={current.name}
                className={styles.photo}
                loading="lazy"
              />
            </div>
          </RevealOnScroll>
        </div>
      </div>
    </section>
  );
}