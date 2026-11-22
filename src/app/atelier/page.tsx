import type { Metadata } from 'next';
import Link from 'next/link';
import PageShell from '@/components/ui/PageShell';
import PageHeader from '@/components/ui/PageHeader';
import { ATELIER_STEPS, ATELIER_TYPES } from '@/lib/atelier';
import styles from './atelier.module.css';

export const metadata: Metadata = {
  title: 'Atelier: crea il tuo gioiello',
  description:
    'Crea un gioiello su misura con GLORYBELLE: anelli, collane e orecchini disegnati con te e realizzati a mano in oro 18K e argento 925.',
};

export default function AtelierPage() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="Atelier"
        title="Crea il tuo gioiello"
        lead="Un gioiello pensato solo per te: scegli il tipo, noi lo disegniamo con te e lo realizziamo a mano."
      />

      <ul className={styles.cards}>
        {ATELIER_TYPES.map((t) => (
          <li key={t.slug}>
            <Link href={`/atelier/${t.slug}`} className={styles.card}>
              <h2 className={styles.cardTitle}>{t.plural}</h2>
              <p className={styles.cardText}>{t.lead}</p>
              <span className={styles.cardLink}>Scopri di più →</span>
            </Link>
          </li>
        ))}
      </ul>

      <h2 className={styles.sectionTitle}>Come funziona</h2>
      <ol className={styles.steps}>
        {ATELIER_STEPS.map((s) => (
          <li key={s.title} className={styles.step}>
            <h3 className={styles.stepTitle}>{s.title}</h3>
            <p className={styles.stepText}>{s.text}</p>
          </li>
        ))}
      </ol>

      <div className={styles.cta}>
        <Link href="/contact?oggetto=atelier" className="btn btn-primary">Inizia il tuo progetto</Link>
        <Link href="/prodotti" className="btn btn-secondary">Vedi la collezione</Link>
      </div>
    </PageShell>
  );
}
