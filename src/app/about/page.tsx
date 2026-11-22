import type { Metadata } from 'next';
import Link from 'next/link';
import PageShell from '@/components/ui/PageShell';
import PageHeader from '@/components/ui/PageHeader';
import Prose from '@/components/ui/Prose';
import styles from './page.module.css';

export const metadata: Metadata = {
  title: 'Chi siamo',
  description:
    'GLORYBELLE: gioielleria artigianale italiana dal 1987. Gioielli fatti a mano in oro 18K e argento 925, con pietre tracciabili.',
};

const VALUES = [
  {
    title: 'Fatto a mano',
    text: 'Ogni gioiello è realizzato a mano da artigiani italiani, dalla selezione dei materiali alla rifinitura finale.',
  },
  {
    title: 'Materiali tracciabili',
    text: 'Oro 18K, argento 925 e pietre di cui conosciamo la provenienza: perché un gioiello bello deve anche essere trasparente.',
  },
  {
    title: 'Garanzia di autenticità',
    text: 'Ogni pezzo è accompagnato da un certificato di autenticità, con spedizione assicurata e reso gratuito entro 30 giorni.',
  },
];

export default function AboutPage() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="Chi siamo"
        title="Gioielli italiani, fatti a mano dal 1987"
        lead="GLORYBELLE nasce dalla passione per l'arte orafa italiana: pezzi pensati per durare, da indossare ogni giorno e da tramandare."
      />

      <div className={styles.story}>
        <Prose>
          <p>
            Dal 1987 lavoriamo con una convinzione semplice: un gioiello è fatto per accompagnare
            una vita, non una stagione. Per questo ogni creazione GLORYBELLE nasce da un disegno
            attento, prende forma tra le mani di artigiani italiani e passa attraverso ogni
            passaggio — dalla fusione del metallo alla rifinitura finale — con la stessa cura.
          </p>
          <p>
            Scegliamo con attenzione i materiali: oro 18K e argento 925, insieme a pietre di cui
            conosciamo l&apos;origine. Ci piace che chi indossa un nostro gioiello sappia da dove
            viene e come è stato fatto.
          </p>
          <p>
            Che tu stia cercando un regalo, un anniversario da celebrare o un pezzo da sentire
            davvero tuo, siamo qui per aiutarti a trovarlo — o a crearlo insieme, nel nostro
            Atelier.
          </p>
        </Prose>
      </div>

      <ul className={styles.values}>
        {VALUES.map((v) => (
          <li key={v.title} className={styles.value}>
            <h2 className={styles.valueTitle}>{v.title}</h2>
            <p className={styles.valueText}>{v.text}</p>
          </li>
        ))}
      </ul>

      <div className={styles.cta}>
        <Link href="/prodotti" className="btn btn-primary">Scopri la collezione</Link>
        <Link href="/atelier" className="btn btn-secondary">Crea il tuo gioiello</Link>
      </div>
    </PageShell>
  );
}
