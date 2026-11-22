import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import PageShell from '@/components/ui/PageShell';
import PageHeader from '@/components/ui/PageHeader';
import { ATELIER_STEPS, ATELIER_TYPES, getAtelierType } from '@/lib/atelier';
import styles from '../atelier.module.css';

// Only anelli / collane / orecchini exist; any other value is a 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return ATELIER_TYPES.map((t) => ({ type: t.slug }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ type: string }> },
): Promise<Metadata> {
  const { type } = await params;
  const item = getAtelierType(type);
  if (!item) return {};
  return {
    title: `Atelier: ${item.title}`,
    description: `${item.lead} Gioielli su misura GLORYBELLE, realizzati a mano in oro 18K e argento 925.`,
  };
}

export default async function AtelierTypePage(
  { params }: { params: Promise<{ type: string }> },
) {
  const { type } = await params;
  const item = getAtelierType(type);
  if (!item) notFound();

  return (
    <PageShell>
      <PageHeader eyebrow="Atelier" title={item.title} lead={item.lead} />

      <h2 className={styles.sectionTitle}>Cosa puoi scegliere</h2>
      <dl className={styles.options}>
        {item.options.map((o) => (
          <div key={o.label} className={styles.option}>
            <dt className={styles.optionLabel}>{o.label}</dt>
            <dd className={styles.optionValues}>{o.values}</dd>
          </div>
        ))}
      </dl>

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
        <Link href={`/contact?oggetto=atelier-${item.slug}`} className="btn btn-primary">
          {item.cta}
        </Link>
        <Link href="/atelier" className="btn btn-secondary">Tutti i gioielli su misura</Link>
      </div>
    </PageShell>
  );
}
