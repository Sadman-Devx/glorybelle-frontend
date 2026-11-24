import HeroSticky from '@/components/hero/HeroSticky';
import HeroStats from '@/components/hero/HeroStats';
import TrustStrip from '@/components/ui/TrustStrip';
import BestsellerCarousel from '@/components/product/BestsellerCarousel';
import CollectionCards from '@/components/collection/CollectionCards';
import RevealOnScroll from '@/components/animation/RevealOnScroll';
import Link from 'next/link';
import Stamps from '@/components/ui/Stamps';
import Testimonials from '@/components/social/Testimonials';
import InstagramGrid from '@/components/social/InstagramGrid';
import styles from './page.module.css';

export default function HomePage() {
  return (
    <>
      {/* Stats live inside the hero wrapper so they rise over the pinned background */}
      <HeroSticky>
        <HeroStats />
      </HeroSticky>
      <TrustStrip />

      <section className={`section ${styles.collections}`}>
        <div className="container">
          <RevealOnScroll>
            <div className={styles.sectionHeader}>
              <span className="eyebrow eyebrow-line">Esplora</span>
              <h2 className="heading-section">Scopri le Collezioni</h2>
            </div>
          </RevealOnScroll>
          <RevealOnScroll delay={1}>
            <CollectionCards />
          </RevealOnScroll>
        </div>
      </section>

      <section className={`section ${styles.bestsellers}`}>
        <div className="container">
          <RevealOnScroll>
            <div className={styles.sectionHeader}>
              <span className="eyebrow eyebrow-line">I preferiti</span>
              <h2 className="heading-section">Più Venduti</h2>
            </div>
          </RevealOnScroll>
          <RevealOnScroll delay={1}>
            <BestsellerCarousel />
          </RevealOnScroll>
        </div>
      </section>

      <section className={`section ${styles.craft}`}>
        <div className="container">
          <RevealOnScroll>
            <div className={styles.craftInner}>
              <div className={styles.craftText}>
                <span className={`eyebrow eyebrow-line ${styles.craftEyebrow}`}>
                  La Nostra Arte
                </span>
                <h2 className={`heading-section ${styles.craftHeading}`}>
                  Tradizione Artigianale
                </h2>
                <p className={styles.craftDesc}>
                  Ogni gioiello GLORYBELLE nasce dalla passione e dalla maestria
                  di artigiani italiani. Dalla selezione dei materiali più pregiati
                  alla rifinitura finale, ogni passaggio è curato nei minimi
                  dettagli per creare pezzi che durano per sempre.
                </p>
                <Link href="/about" className="btn btn-gold">Scopri di più</Link>
              </div>
              <div className={styles.craftImage}>
                <div className={styles.craftImagePlaceholder}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                  <span>Foto artigianato</span>
                </div>
              </div>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* Process steps — Stamps (design.md §4.6 row 7) */}
      <section className={`section ${styles.process}`}>
        <div className="container">
          <RevealOnScroll>
            <div className={styles.sectionHeader}>
              <span className="eyebrow eyebrow-line">Come Lavoriamo</span>
              <h2 className="heading-section">Il Processo</h2>
            </div>
          </RevealOnScroll>
          <RevealOnScroll delay={1}>
            <Stamps />
          </RevealOnScroll>
        </div>
      </section>

      <section className={`section ${styles.ctaSection}`}>
        <div className={`container ${styles.ctaContainer}`}>
          <RevealOnScroll>
            <span className={`eyebrow eyebrow-line ${styles.ctaEyebrow}`}>
              Collezione Completa
            </span>
            <h2 className={`heading-section ${styles.ctaHeading}`}>
              Esplora Tutti i Gioielli
            </h2>
            <p className={styles.ctaDesc}>
              Scopri la nostra selezione completa di anelli, collane, orecchini e
              bracciali artigianali italiani.
            </p>
            <Link href="/prodotti" className="btn btn-primary">Vai allo Shop</Link>
          </RevealOnScroll>
        </div>
      </section>

      {/* Testimonials — dark split layout (design.md §4.6 row 5) */}
      <Testimonials />

      {/* Instagram grid — 4-col 0 radius (design.md §4.6 row 6) */}
      <InstagramGrid />
    </>
  );
}