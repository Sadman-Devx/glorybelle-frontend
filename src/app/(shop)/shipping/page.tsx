import type { Metadata } from 'next';
import Link from 'next/link';
import PageShell from '@/components/ui/PageShell';
import PageHeader from '@/components/ui/PageHeader';
import Prose from '@/components/ui/Prose';
import { CONTACT_EMAIL } from '@/lib/siteConfig';

export const metadata: Metadata = {
  title: 'Spedizioni e resi',
  description:
    'Spedizione assicurata gratuita in tutta Italia e reso gratuito entro 30 giorni. Tutte le informazioni su consegna, resi e garanzia.',
};

/*
 * NOTE: policy text below uses only what the site already promises
 * (free insured shipping in Italy, free 30-day returns, certificate of
 * authenticity). Confirm delivery times and return conditions before launch.
 */
export default function ShippingPage() {
  return (
    <PageShell narrow>
      <PageHeader
        eyebrow="Informazioni"
        title="Spedizioni e resi"
        lead="Vogliamo che il tuo gioiello arrivi in sicurezza e che tu sia sempre sicuro della tua scelta."
      />

      <Prose>
        <h2>Spedizione</h2>
        <p>
          La <strong>spedizione assicurata è gratuita in tutta Italia</strong>. Ogni gioiello viene
          imballato con cura e spedito con assicurazione, così è protetto per tutto il viaggio.
        </p>
        <p>
          Dopo l&apos;ordine ricevi un&apos;email di conferma all&apos;indirizzo che hai indicato.
          Puoi consultare lo stato dei tuoi ordini nella sezione{' '}
          <Link href="/account/ordini">I miei ordini</Link>.
        </p>
        <p>
          Per informazioni sulle spedizioni verso altri Paesi, scrivici a{' '}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </p>

        <h2>Resi</h2>
        <p>
          Se il gioiello non ti convince, puoi restituirlo <strong>gratuitamente entro 30 giorni</strong>{' '}
          dalla consegna.
        </p>
        <ol>
          <li>
            <Link href="/contact">Contattaci</Link> indicando il numero d&apos;ordine e il motivo del
            reso.
          </li>
          <li>Ti spiegheremo come preparare e spedire il pacco.</li>
          <li>
            Restituisci il gioiello nelle condizioni originali, con la confezione e il certificato di
            autenticità.
          </li>
          <li>Una volta verificato il reso, ti rimborsiamo con lo stesso metodo di pagamento.</li>
        </ol>

        <h3>Gioielli su misura</h3>
        <p>
          I gioielli creati su misura nel nostro <Link href="/atelier">Atelier</Link> sono realizzati
          appositamente per te e, per legge, non rientrano nel diritto di recesso.
        </p>

        <h2>Autenticità e garanzia</h2>
        <p>
          Ogni gioiello GLORYBELLE è accompagnato da un certificato di autenticità. Se riscontri un
          difetto di fabbricazione, scrivici: ci occuperemo noi di trovare la soluzione migliore.
        </p>

        <h2>Hai ancora dubbi?</h2>
        <p>
          Siamo a tua disposizione: vai alla pagina <Link href="/contact">Contatti</Link> e scrivici.
        </p>
      </Prose>
    </PageShell>
  );
}
