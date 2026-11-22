/**
 * GLORYBELLE — Atelier (made-to-measure jewellery) content.
 * One entry per jewellery type; the slug is the URL: /atelier/<slug>.
 * ProductGrid's "Create your own jewel" card links to these paths.
 */
export interface AtelierType {
  slug: string;
  plural: string;        // "Anelli"
  title: string;
  cta: string;           // button label
  lead: string;
  options: { label: string; values: string }[];
}

export const ATELIER_TYPES: AtelierType[] = [
  {
    slug: 'anelli',
    plural: 'Anelli',
    title: 'Crea il tuo anello',
    cta: 'Richiedi il tuo anello',
    lead: "Dal solitario alla fascia, disegniamo con te l'anello che racconta la tua storia.",
    options: [
      { label: 'Metallo', values: 'Oro giallo 18K, oro rosa 18K, argento 925' },
      { label: 'Pietra', values: 'Diamante, rubino, zaffiro' },
      { label: 'Personalizzazione', values: 'Misura, incisione interna' },
    ],
  },
  {
    slug: 'collane',
    plural: 'Collane',
    title: 'Crea la tua collana',
    cta: 'Richiedi la tua collana',
    lead: 'Una catena sottile, un ciondolo con una pietra speciale: scegliamo insieme ogni dettaglio.',
    options: [
      { label: 'Metallo', values: 'Oro giallo 18K, oro rosa 18K, argento 925' },
      { label: 'Pietra', values: 'Diamante, rubino, zaffiro' },
      { label: 'Personalizzazione', values: 'Lunghezza della catena, incisione sul ciondolo' },
    ],
  },
  {
    slug: 'orecchini',
    plural: 'Orecchini',
    title: 'Crea i tuoi orecchini',
    cta: 'Richiedi i tuoi orecchini',
    lead: 'Punti luce o pendenti: progettiamo la coppia perfetta per il tuo stile.',
    options: [
      { label: 'Metallo', values: 'Oro giallo 18K, oro rosa 18K, argento 925' },
      { label: 'Pietra', values: 'Diamante, rubino, zaffiro' },
      { label: 'Personalizzazione', values: 'Forma e dimensione, tipo di chiusura' },
    ],
  },
];

export const ATELIER_STEPS = [
  { title: "Raccontaci l'idea", text: 'Scrivici cosa immagini: anche un semplice schizzo o un riferimento è un ottimo punto di partenza.' },
  { title: 'Disegno e preventivo', text: 'Ti proponiamo un progetto e ti indichiamo materiali e costo, prima di iniziare.' },
  { title: 'Realizzazione a mano', text: 'I nostri artigiani danno forma al tuo gioiello, curando ogni dettaglio.' },
  { title: 'Consegna', text: 'Ricevi il gioiello con certificato di autenticità, in spedizione assicurata.' },
];

export function getAtelierType(slug: string): AtelierType | undefined {
  return ATELIER_TYPES.find((t) => t.slug === slug);
}
