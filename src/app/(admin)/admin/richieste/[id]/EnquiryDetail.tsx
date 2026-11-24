'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import Badge from '@/components/admin/Badge';
import Button from '@/components/admin/Button';
import EmptyState from '@/components/admin/EmptyState';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import {
  adminEnquiriesApi,
  enquiryStatusLabels,
  type AdminEnquiry,
  type AdminEnquiryAssignee,
  type AdminEnquiryStatus,
} from '@/lib/adminEnquiries';
import { formatAdminDate } from '@/lib/adminOrders';
import styles from './page.module.css';

function isEnquiryStatus(value: string): value is AdminEnquiryStatus {
  return value === 'new'
    || value === 'in_progress'
    || value === 'answered'
    || value === 'closed';
}

function atelierTypeLabel(type: AdminEnquiry['atelier_type']): string {
  if (type === 'anelli') return 'Anelli';
  if (type === 'collane') return 'Collane';
  if (type === 'orecchini') return 'Orecchini';
  return 'Non specificato';
}

export default function EnquiryDetail({ enquiryId }: { enquiryId: string }) {
  const { user } = useAdminAuth();
  const canRead = user?.permissions.includes('*')
    || user?.permissions.includes('enquiries:read');
  const canManage = user?.role === 'manager' || user?.role === 'superuser';
  const id = Number(enquiryId);
  const validId = Number.isSafeInteger(id) && id > 0;
  const [enquiry, setEnquiry] = useState<AdminEnquiry | null>(null);
  const [assignees, setAssignees] = useState<AdminEnquiryAssignee[]>([]);
  const [statusDraft, setStatusDraft] = useState<AdminEnquiryStatus>('new');
  const [assigneeDraft, setAssigneeDraft] = useState('');
  const [noteText, setNoteText] = useState('');
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [assignmentError, setAssignmentError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [savingChanges, setSavingChanges] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    if (!canRead) return;
    let active = true;
    const timer = window.setTimeout(() => {
      if (!validId) {
        setLoadError('Il numero della richiesta non è valido.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setLoadError(null);
      setAssignmentError(null);
      void (async () => {
        try {
          const result = await adminEnquiriesApi.detail(id);
          if (!active) return;
          setEnquiry(result);
          setStatusDraft(result.status);
          setAssigneeDraft(result.assigned_to === null ? '' : String(result.assigned_to));

          if (canManage) {
            try {
              const response = await adminEnquiriesApi.assignees();
              if (active) setAssignees(response.results);
            } catch (requestError) {
              if (active) {
                setAssignmentError(requestError instanceof Error
                  ? requestError.message
                  : 'Non è stato possibile caricare il personale assegnabile.');
              }
            }
          }
        } catch (requestError) {
          if (active) {
            setLoadError(requestError instanceof Error
              ? requestError.message
              : 'Non è stato possibile caricare la richiesta.');
          }
        } finally {
          if (active) setLoading(false);
        }
      })();
    }, 0);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [canManage, canRead, id, retryToken, validId]);

  async function saveChanges(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!enquiry || !canManage) return;
    setSavingChanges(true);
    setActionError(null);
    setStatusMessage(null);
    try {
      const changes: { status: AdminEnquiryStatus; assigned_to?: number | null } = {
        status: statusDraft,
      };
      if (!assignmentError) {
        changes.assigned_to = assigneeDraft ? Number(assigneeDraft) : null;
      }
      const updated = await adminEnquiriesApi.update(enquiry.id, changes);
      setEnquiry(updated);
      setStatusDraft(updated.status);
      setAssigneeDraft(updated.assigned_to === null ? '' : String(updated.assigned_to));
      setStatusMessage('Modifiche salvate.');
      window.dispatchEvent(new Event('admin:enquiries-updated'));
    } catch (requestError) {
      setActionError(requestError instanceof Error
        ? requestError.message
        : 'Non è stato possibile salvare le modifiche.');
    } finally {
      setSavingChanges(false);
    }
  }

  async function addNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!enquiry || !canManage || !noteText.trim()) return;
    const body = noteText.trim();
    setSavingNote(true);
    setActionError(null);
    setStatusMessage(null);
    try {
      const note = await adminEnquiriesApi.addNote(enquiry.id, body);
      setEnquiry((current) => current
        ? { ...current, internal_notes: [...(current.internal_notes || []), note] }
        : current);
      setNoteText('');
      setStatusMessage('Nota interna aggiunta.');
    } catch (requestError) {
      setActionError(requestError instanceof Error
        ? requestError.message
        : 'Non è stato possibile aggiungere la nota.');
    } finally {
      setSavingNote(false);
    }
  }

  if (!canRead) {
    return (
      <div className={styles.page}>
        <EmptyState
          title="Accesso non disponibile"
          description="Il tuo ruolo non dispone dei permessi necessari per consultare le richieste."
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.page} aria-busy="true" aria-label="Caricamento richiesta">
        <div className={styles.skeletonHeader} />
        <div className={styles.skeletonGrid}>
          <div className={styles.skeletonCard} />
          <div className={styles.skeletonCard} />
        </div>
      </div>
    );
  }

  if (loadError || !enquiry) {
    return (
      <div className={styles.page}>
        <EmptyState
          title="Richiesta non disponibile"
          description={loadError || 'La richiesta non è stata trovata.'}
          action={
            <div className={styles.errorActions}>
              <Button variant="secondary" onClick={() => setRetryToken((value) => value + 1)}>
                Riprova
              </Button>
              <Link href="/admin/richieste" className={styles.backButton}>
                Torna alle richieste
              </Link>
            </div>
          }
        />
      </div>
    );
  }

  const notes = enquiry.internal_notes || [];
  const currentAssigneeMissing = enquiry.assigned_to !== null
    && !assignees.some((assignee) => assignee.id === enquiry.assigned_to);

  return (
    <div className={styles.page}>
      <Link href="/admin/richieste" className={styles.backLink}>← Torna alle richieste</Link>
      <header className={styles.heading}>
        <div>
          <span className="eyebrow eyebrow-line">{enquiry.topic_label}</span>
          <h1>Richiesta #{enquiry.id}</h1>
          <p>Ricevuta il {formatAdminDate(enquiry.created_at, true)}</p>
        </div>
        <Badge tone={enquiry.status === 'new' ? 'warning' : 'neutral'}>
          {enquiryStatusLabels[enquiry.status]}
        </Badge>
      </header>

      {actionError && <p className={styles.actionError} role="alert">{actionError}</p>}
      {assignmentError && <p className={styles.actionError} role="alert">{assignmentError}</p>}
      {statusMessage && <p className={styles.statusMessage} role="status">{statusMessage}</p>}

      <div className={styles.layout}>
        <main className={styles.main}>
          <section className={styles.card}>
            <h2>Messaggio</h2>
            <p className={styles.message}>{enquiry.message || 'Nessun messaggio.'}</p>
          </section>

          <section className={styles.card}>
            <h2>Note interne</h2>
            {notes.length ? (
              <ul className={styles.notes}>
                {notes.map((note) => (
                  <li key={note.id}>
                    <p>{note.body}</p>
                    <small>
                      {note.author_name || 'Team'} · {formatAdminDate(note.created_at, true)}
                    </small>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles.muted}>Nessuna nota interna.</p>
            )}
            {canManage && (
              <form className={styles.form} onSubmit={addNote}>
                <label htmlFor="enquiry-note">Aggiungi una nota</label>
                <textarea
                  id="enquiry-note"
                  value={noteText}
                  onChange={(event) => setNoteText(event.currentTarget.value)}
                  rows={4}
                  maxLength={5000}
                  required
                />
                <Button type="submit" disabled={!noteText.trim() || savingNote}>
                  {savingNote ? 'Salvataggio…' : 'Aggiungi nota'}
                </Button>
              </form>
            )}
          </section>

          {canManage && (
            <section className={styles.card}>
              <h2>Risposta facoltativa</h2>
              <p className={styles.muted}>
                La risposta si apre nel tuo programma email. Segna la richiesta come “Risposta inviata” solo dopo averla inviata.
              </p>
              <div className={styles.form}>
                <label htmlFor="enquiry-reply">Messaggio da inviare</label>
                <textarea
                  id="enquiry-reply"
                  value={replyText}
                  onChange={(event) => setReplyText(event.currentTarget.value)}
                  rows={5}
                  maxLength={5000}
                />
                {replyText.trim() ? (
                  <a
                    className={styles.replyLink}
                    href={`mailto:${enquiry.email}?subject=${encodeURIComponent('Re: Richiesta GLORYBELLE')}&body=${encodeURIComponent(`Ciao ${enquiry.name},\n\n${replyText.trim()}\n\nA presto,\nTeam GLORYBELLE`)}`}
                  >
                    Apri il programma email
                  </a>
                ) : (
                  <Button type="button" variant="secondary" disabled>
                    Scrivi una risposta per continuare
                  </Button>
                )}
              </div>
            </section>
          )}
        </main>

        <aside className={styles.sidebar}>
          <section className={styles.card}>
            <h2>Dettagli cliente</h2>
            <dl className={styles.details}>
              <div><dt>Nome</dt><dd>{enquiry.name}</dd></div>
              <div>
                <dt>Email</dt>
                <dd><a href={`mailto:${enquiry.email}`}>{enquiry.email}</a></dd>
              </div>
              <div><dt>Argomento</dt><dd>{enquiry.topic_label}</dd></div>
              <div><dt>Tipo Atelier</dt><dd>{atelierTypeLabel(enquiry.atelier_type)}</dd></div>
              <div><dt>Assegnata a</dt><dd>{enquiry.assigned_to_name || 'Non assegnata'}</dd></div>
              <div><dt>Ultimo aggiornamento</dt><dd>{formatAdminDate(enquiry.updated_at, true)}</dd></div>
            </dl>
          </section>

          {canManage && (
            <section className={styles.card}>
              <h2>Gestione richiesta</h2>
              <form className={styles.form} onSubmit={saveChanges}>
                <label htmlFor="enquiry-status">Stato</label>
                <select
                  id="enquiry-status"
                  value={statusDraft}
                  onChange={(event) => {
                    if (isEnquiryStatus(event.currentTarget.value)) {
                      setStatusDraft(event.currentTarget.value);
                    }
                  }}
                >
                  {Object.entries(enquiryStatusLabels).map(([status, label]) => (
                    <option value={status} key={status}>{label}</option>
                  ))}
                </select>

                <label htmlFor="enquiry-assignee">Assegna a</label>
                <select
                  id="enquiry-assignee"
                  value={assigneeDraft}
                  onChange={(event) => setAssigneeDraft(event.currentTarget.value)}
                  disabled={Boolean(assignmentError)}
                >
                  <option value="">Non assegnata</option>
                  {currentAssigneeMissing && (
                    <option value={String(enquiry.assigned_to)}>
                      {enquiry.assigned_to_name || 'Utente non disponibile'}
                    </option>
                  )}
                  {assignees.map((assignee) => (
                    <option value={String(assignee.id)} key={assignee.id}>
                      {assignee.name} · {assignee.email}
                    </option>
                  ))}
                </select>
                <Button type="submit" disabled={savingChanges || Boolean(assignmentError)}>
                  {savingChanges ? 'Salvataggio…' : 'Salva modifiche'}
                </Button>
              </form>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
