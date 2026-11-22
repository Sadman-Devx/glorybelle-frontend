'use client';

import { useState, type FormEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import { CONTACT_EMAIL } from '@/lib/siteConfig';
import styles from './ContactForm.module.css';

const TOPICS = [
  { value: 'prodotto', label: 'Informazioni su un prodotto' },
  { value: 'ordine', label: 'Il mio ordine' },
  { value: 'atelier', label: 'Gioiello su misura (Atelier)' },
  { value: 'altro', label: 'Altro' },
] as const;

type Topic = (typeof TOPICS)[number]['value'];

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

/**
 * Contact form. There is no backend endpoint for contact messages, so the form
 * opens the visitor's email client with the message pre-filled (mailto:).
 * To send through the API instead, replace the body of `handleSubmit`.
 */
export default function ContactForm() {
  const params = useSearchParams();
  const oggetto = params.get('oggetto');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [topic, setTopic] = useState<Topic>(topicFromParam(oggetto));
  const [message, setMessage] = useState(oggetto ? ATELIER_PREFILL[oggetto] ?? '' : '');
  const [opened, setOpened] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const topicLabel = TOPICS.find((t) => t.value === topic)?.label ?? 'Contatto';
    const subject = `[GLORYBELLE] ${topicLabel}`;
    const body = `${message}\n\n—\nNome: ${name}\nEmail: ${email}`;
    window.location.href =
      `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setOpened(true);
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.row}>
        <div className={styles.field}>
          <label htmlFor="contact-name" className={styles.label}>Nome</label>
          <input
            id="contact-name"
            type="text"
            required
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
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className={`${styles.input} ${styles.textarea}`}
        />
      </div>

      <button type="submit" className={`btn btn-primary ${styles.submit}`}>
        Invia messaggio
      </button>

      <p className={styles.hint} role="status">
        {opened
          ? <>Abbiamo aperto il tuo programma di posta con il messaggio pronto. Se non si è aperto, scrivici a <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.</>
          : 'Il messaggio si apre nel tuo programma di posta, pronto da inviare.'}
      </p>
    </form>
  );
}
