'use client';

import { useState, type FormEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import { CONTACT_EMAIL } from '@/lib/siteConfig';
import { ApiError, enquiries } from '@/lib/api';
import type { AtelierType, EnquiryTopic } from '@/lib/types';
import styles from './ContactForm.module.css';

const TOPICS = [
  { value: 'prodotto', label: 'Informazioni su un prodotto' },
  { value: 'ordine', label: 'Il mio ordine' },
  { value: 'atelier', label: 'Gioiello su misura (Atelier)' },
  { value: 'altro', label: 'Altro' },
] as const;

type Topic = EnquiryTopic;

// Links such as /contact?oggetto=atelier-anelli pre-select the topic and message.
const ATELIER_PREFILL: Record<string, string> = {
  'atelier-anelli': 'Vorrei creare un anello su misura.',
  'atelier-collane': 'Vorrei creare una collana su misura.',
  'atelier-orecchini': 'Vorrei creare degli orecchini su misura.',
  atelier: 'Vorrei creare un gioiello su misura.',
};

function topicFromParam(param: string | null): Topic {
  if (!param) return 'prodotto';
  if (param.startsWith('atelier')) return 'atelier';
  const match = TOPICS.find((t) => t.value === param);
  return match ? match.value : 'altro';
}

function atelierTypeFromParam(param: string | null): AtelierType | undefined {
  const type = param?.startsWith('atelier-') ? param.slice('atelier-'.length) : '';
  return type === 'anelli' || type === 'collane' || type === 'orecchini'
    ? type
    : undefined;
}

export default function ContactForm() {
  const params = useSearchParams();
  const oggetto = params.get('oggetto');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [topic, setTopic] = useState<Topic>(topicFromParam(oggetto));
  const [message, setMessage] = useState(oggetto ? ATELIER_PREFILL[oggetto] ?? '' : '');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;

    const formData = new FormData(e.currentTarget);
    const atelierType = topic === 'atelier' ? atelierTypeFromParam(oggetto) : undefined;
    setSubmitting(true);
    setSuccess(false);
    setError(null);
    try {
      const website = String(formData.get('website') || '');
      await enquiries.create({
        name,
        email,
        topic,
        message,
        ...(atelierType ? { atelier_type: atelierType } : {}),
        website,
      });
      setSuccess(true);
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 429) {
        setError('Hai inviato troppe richieste. Riprova tra qualche minuto.');
      } else if (requestError instanceof ApiError && requestError.status === 400) {
        setError('Controlla i dati inseriti: l’indirizzo email o il messaggio non sono validi.');
      } else {
        setError('Non siamo riusciti a inviare il messaggio. Puoi contattarci direttamente via email.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form} aria-busy={submitting}>
      <div className={styles.row}>
        <div className={styles.field}>
          <label htmlFor="contact-name" className={styles.label}>Nome</label>
          <input
            id="contact-name"
            type="text"
            required
            maxLength={150}
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={styles.input}
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="contact-email" className={styles.label}>Email</label>
          <input
            id="contact-email"
            type="email"
            required
            maxLength={254}
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={styles.input}
          />
        </div>
      </div>

      <div className={styles.field}>
        <label htmlFor="contact-topic" className={styles.label}>Argomento</label>
        <select
          id="contact-topic"
          value={topic}
          onChange={(e) => setTopic(e.target.value as Topic)}
          className={styles.input}
        >
          {TOPICS.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      <div className={styles.field}>
        <label htmlFor="contact-message" className={styles.label}>Messaggio</label>
        <textarea
          id="contact-message"
          required
          rows={6}
          maxLength={5000}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className={`${styles.input} ${styles.textarea}`}
        />
      </div>

      <div className={styles.honeypot} aria-hidden="true">
        <label htmlFor="contact-website">Lascia vuoto questo campo</label>
        <input
          id="contact-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <button
        type="submit"
        className={`btn btn-primary ${styles.submit}`}
        disabled={submitting}
      >
        {submitting ? 'Invio in corso…' : 'Invia messaggio'}
      </button>

      <p className={styles.hint} role="status" aria-live="polite">
        {success
          ? 'Grazie, abbiamo ricevuto il tuo messaggio. Ti risponderemo al più presto.'
          : 'Ti risponderemo all’indirizzo email che hai indicato.'}
      </p>
      {error && (
        <p className={styles.error} role="alert">
          {error}{' '}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        </p>
      )}
    </form>
  );
}
