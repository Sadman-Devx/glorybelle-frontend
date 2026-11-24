import type { Metadata } from 'next';
import Link from 'next/link';
import PageShell from '@/components/ui/PageShell';
import PageHeader from '@/components/ui/PageHeader';
import Prose from '@/components/ui/Prose';
import styles from '@/components/ui/Prose.module.css';
import { CONTACT_EMAIL, SITE_NAME } from '@/lib/siteConfig';

export const metadata: Metadata = {
  title: 'Informativa sulla privacy',
  description: 'Come GLORYBELLE raccoglie, utilizza e protegge i tuoi dati personali (GDPR).',
};

/*
 * NOTE: this is a standard GDPR information notice written as a starting point.
 * It must be reviewed by whoever is legally responsible for the business
 * (company name, registered address, VAT number, real list of providers and
 * cookies/analytics actually in use) before the site goes live.
 */
export default function PrivacyPage() {
  return (
    <PageShell narrow>
      <PageHeader
        eyebrow="Informazioni legali"
        title="Informativa sulla privacy"
        lead="Ti spieghiamo in modo semplice quali dati personali trattiamo, perché lo facciamo e quali sono i tuoi diritti."
      />
      <p className={styles.meta}>Ultimo aggiornamento: novembre 2026</p>

      <Prose>
        <h2>1. Titolare del trattamento</h2>
        <p>
          Il titolare del trattamento è {SITE_NAME}. Per qualsiasi domanda sul trattamento dei tuoi
          dati puoi scriverci a <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </p>

        <h2>2. Quali dati raccogliamo</h2>
        <ul>
          <li>
            <strong>Dati dell&apos;account</strong>: nome, cognome, indirizzo email e password
            (conservata in forma protetta).
          </li>
          <li>
            <strong>Dati dell&apos;ordine e di spedizione</strong>: indirizzo di consegna, numero di
            telefono, prodotti acquistati e importo.
          </li>
          <li>
            <strong>Dati di pagamento</strong>: il pagamento è gestito da Stripe. Non vediamo né
            conserviamo i dati completi della tua carta.
          </li>
          <li>
            <strong>Newsletter</strong>: il tuo indirizzo email, se scegli di iscriverti.
          </li>
          <li>
            <strong>Messaggi</strong>: le informazioni che ci invii tramite la pagina Contatti o
            per richiedere un gioiello su misura.
          </li>
          <li>
            <strong>Dati tecnici</strong>: informazioni necessarie al funzionamento del sito (ad
            esempio il carrello e la sessione) e statistiche di utilizzo in forma aggregata.
          </li>
        </ul>

        <h2>3. Perché trattiamo i tuoi dati</h2>
        <ul>
          <li>
            <strong>Per eseguire il tuo ordine</strong> e gestire spedizioni, resi e assistenza
            (esecuzione del contratto).
          </li>
          <li>
            <strong>Per adempiere agli obblighi di legge</strong>, ad esempio fiscali e contabili.
          </li>
          <li>
            <strong>Per inviarti la newsletter</strong>, solo se hai dato il tuo consenso, che puoi
            revocare in qualsiasi momento.
          </li>
          <li>
            <strong>Per la sicurezza del sito</strong> e la prevenzione delle frodi (legittimo
            interesse).
          </li>
        </ul>

        <h2>4. Per quanto tempo conserviamo i dati</h2>
        <p>
          Conserviamo i dati degli ordini per il tempo richiesto dagli obblighi fiscali e contabili.
          I dati dell&apos;account restano finché non decidi di cancellarlo. L&apos;indirizzo email
          per la newsletter viene conservato fino alla revoca del consenso.
        </p>

        <h2>5. A chi comunichiamo i dati</h2>
        <p>
          Non vendiamo i tuoi dati. Li comunichiamo solo a fornitori che ci aiutano a erogare il
          servizio — ad esempio per i pagamenti (Stripe), le spedizioni, l&apos;hosting del sito e
          l&apos;invio delle email — che li trattano secondo le nostre istruzioni.
        </p>

        <h2>6. Cookie e strumenti simili</h2>
        <p>
          Utilizziamo strumenti tecnici necessari al funzionamento del sito, come l&apos;archiviazione
          locale del browser per mantenere la sessione e il carrello. Durante il pagamento, Stripe può
          impostare propri cookie per garantire la sicurezza della transazione.
        </p>

        <h2>7. I tuoi diritti</h2>
        <p>
          Hai il diritto di accedere ai tuoi dati, rettificarli, cancellarli, limitarne il
          trattamento, opporti al trattamento e richiedere la portabilità. Puoi inoltre revocare il
          consenso in qualsiasi momento. Per esercitare i tuoi diritti scrivici a{' '}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </p>
        <p>
          Se ritieni che il trattamento non sia corretto, puoi presentare reclamo al Garante per la
          protezione dei dati personali (<a href="https://www.garanteprivacy.it" target="_blank" rel="noopener noreferrer">garanteprivacy.it</a>).
        </p>

        <h2>8. Modifiche a questa informativa</h2>
        <p>
          Potremmo aggiornare questa informativa. La versione in vigore è sempre quella pubblicata
          in questa pagina, con la data di ultimo aggiornamento indicata in alto.
        </p>
        <p>
          Hai domande? <Link href="/contact">Contattaci</Link>.
        </p>
      </Prose>
    </PageShell>
  );
}
