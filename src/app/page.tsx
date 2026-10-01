import HeroSticky from '@/components/hero/HeroSticky';
import HeroStats from '@/components/hero/HeroStats';
import TrustStrip from '@/components/ui/TrustStrip';
import BestsellerCarousel from '@/components/product/BestsellerCarousel';
import CollectionCards from '@/components/collection/CollectionCards';
import RevealOnScroll from '@/components/animation/RevealOnScroll';
import styles from './page.module.css';

export default function HomePage() {
  return (
    <>
      <HeroSticky />
      <HeroStats />
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
              <h2 className="heading-section">Piu Venduti</h2>
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
                <span className="eyebrow eyebrow-line" style={{ color: 'var(--gold-light)' }}>
                  La Nostra Arte
                </span>
                <h2 className="heading-section" style={{ color: 'white' }}>
                  Tradizione Artigianale
                </h2>
                <p className={styles.craftDesc}>
                  Ogni gioiello GLORYBELLE nasce dalla passione e dalla maestria
                  di artigiani italiani. Dalla selezione dei materiali piu pregiati
                  alla rifinitura finale, ogni passaggio e curato nei minimi
                  dettagli per creare pezzi che durano per sempre.
                </p>
                <a href="/about" className="btn btn-gold">Scopri di piu</a>
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

      <section className={`section ${styles.ctaSection}`}>
        <div className="container" style={{ textAlign: 'center' as const }}>
          <RevealOnScroll>
            <span className="eyebrow eyebrow-line" style={{ justifyContent: 'center' }}>
              Collezione Completa
            </span>
            <h2 className="heading-section" style={{ marginTop: '16px' }}>
              Esplora Tutti i Gioielli
            </h2>
            <p style={{ maxWidth: '480px', margin: '16px auto 32px', color: 'rgba(46,26,71,0.65)' }}>
              Scopri la nostra selezione completa di anelli, collane, orecchini e
              bracciali artigianali italiani.
            </p>
            <a href="/shop" className="btn btn-primary">Vai allo Shop</a>
          </RevealOnScroll>
        </div>
      </section>
    </>
  );
}
