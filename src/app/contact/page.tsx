import type { Metadata } from 'next';
import { Suspense } from 'react';
import PageShell from '@/components/ui/PageShell';
import PageHeader from '@/components/ui/PageHeader';
import { CONTACT_EMAIL, CONTACT_PHONE, CONTACT_PHONE_HREF } from '@/lib/siteConfig';
import ContactForm from './ContactForm';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Contatti',
  description: 'Scrivici per informazioni sui gioielli, sul tuo ordine o per creare un gioiello su misura.',
};

export default function ContactPage() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="Contatti"
        title="Parliamone"
        lead="Una domanda su un gioiello, sul tuo ordine o un'idea da realizzare? Scrivici: ti rispondiamo volentieri."
      />

      <div className={styles.layout}>
        <aside className={styles.info}>
          <div className={styles.infoItem}>
            <h2 className={styles.infoLabel}>Email</h2>
            <a href={`mailto:${CONTACT_EMAIL}`} className={styles.infoValue}>{CONTACT_EMAIL}</a>
          </div>
          <div className={styles.infoItem}>
            <h2 className={styles.infoLabel}>Telefono</h2>
            <a href={CONTACT_PHONE_HREF} className={styles.infoValue}>{CONTACT_PHONE}</a>
          </div>
          <p className={styles.infoNote}>
            Per i resi, indica sempre il numero d&apos;ordine: ci aiuta a risponderti più in fretta.
          </p>
        </aside>

        <Suspense fallback={null}>
          <ContactForm />
        </Suspense>
      </div>
    </PageShell>
  );
}
