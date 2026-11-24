'use client';

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import Badge from '@/components/admin/Badge';
import Button from '@/components/admin/Button';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import EmptyState from '@/components/admin/EmptyState';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import {
  adminOrdersApi,
  formatAdminDate,
  formatAdminMoney,
  orderStatusLabels,
  type AdminOrder,
  type AdminOrderEvent,
  type AdminOrderNote,
  type OrderStatus,
} from '@/lib/adminOrders';
import styles from './page.module.css';

type DialogMode = 'cancel' | 'archive' | null;

function statusTone(status: OrderStatus): 'neutral' | 'success' | 'warning' | 'danger' | 'gold' {
  if (status === 'paid' || status === 'processing' || status === 'delivered') return 'success';
  if (status === 'shipped') return 'gold';
  if (status === 'cancelled') return 'danger';
  return 'warning';
}

function formatEventStatus(event: AdminOrderEvent): string {
  return event.status_display
    || orderStatusLabels[event.status as OrderStatus]
    || event.status;
}

export default function AdminOrderDetailPage() {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const router = useRouter();
  const { user } = useAdminAuth();
  const canRead = user?.permissions.includes('*') || user?.permissions.includes('orders:read');
  const [order, setOrder] = useState<AdminOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [statusSelection, setStatusSelection] = useState<OrderStatus | ''>('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [noteText, setNoteText] = useState('');
  const [savingStatus, setSavingStatus] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  const [dialog, setDialog] = useState<DialogMode>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [savingDialog, setSavingDialog] = useState(false);

  const loadOrder = useCallback(async () => {
    if (!canRead) return;
    setLoading(true);
    setLoadError(null);
    try {
      const result = await adminOrdersApi.detail(orderNumber);
      setOrder(result);
      setStatusSelection('');
      setTrackingNumber(result.tracking_number || '');
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Non è stato possibile caricare l’ordine.');
    } finally {
      setLoading(false);
    }
  }, [canRead, orderNumber]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadOrder(), 0);
    return () => window.clearTimeout(timer);
  }, [loadOrder]);

  const canManage = user?.role === 'manager' || user?.role === 'superuser';
  const canArchive = user?.role === 'superuser';
  const isPaid = order
    ? ['paid', 'processing', 'shipped', 'delivered'].includes(order.status)
      || ['paid', 'succeeded', 'completed', 'captured'].includes(order.payment_status?.toLowerCase() || '')
    : false;
  const allowedNextStatuses = useMemo((): OrderStatus[] => {
    if (!order) return [];
    if (order.status === 'pending') return ['paid'];
    if (order.status === 'paid') return ['processing'];
    if (order.status === 'processing') return ['shipped'];
    if (order.status === 'shipped') return ['delivered'];
    return [];
  }, [order]);

  async function submitStatus(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!order || !statusSelection) return;
    if (statusSelection === 'shipped' && !trackingNumber.trim()) {
      setActionError('Inserisci il numero di tracking per contrassegnare l’ordine come spedito.');
      return;
    }
    setSavingStatus(true);
    setActionError(null);
    try {
      await adminOrdersApi.changeStatus(order.order_number, statusSelection, trackingNumber.trim());
      setOrder((current) => current
        ? {
          ...current,
          status: statusSelection,
          status_display: orderStatusLabels[statusSelection],
          tracking_number: statusSelection === 'shipped' ? trackingNumber.trim() : current.tracking_number,
        }
        : current);
      setStatusSelection('');
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Non è stato possibile aggiornare lo stato.');
    } finally {
      setSavingStatus(false);
    }
  }

  async function submitNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!order || !noteText.trim()) return;
    const text = noteText.trim();
    const optimisticNote: AdminOrderNote = {
      id: `pending-${Date.now()}`,
      text,
      author_name: user?.name,
      created_at: new Date().toISOString(),
    };
    const previousNotes = order.notes || [];
    setOrder({ ...order, notes: [...previousNotes, optimisticNote] });
    setNoteText('');
    setSavingNote(true);
    setActionError(null);
    try {
      const savedNote = await adminOrdersApi.addNote(order.order_number, text);
      if (savedNote) {
        setOrder((current) => current
          ? {
            ...current,
            notes: (current.notes || []).map((note) => (
              note.id === optimisticNote.id ? savedNote : note
            )),
          }
          : current);
      }
    } catch (error) {
      setOrder((current) => current
        ? { ...current, notes: previousNotes }
        : current);
      setNoteText(text);
      setActionError(error instanceof Error ? error.message : 'Non è stato possibile aggiungere la nota.');
    } finally {
      setSavingNote(false);
    }
  }

  async function confirmDialogAction() {
    if (!order) return;
    setSavingDialog(true);
    setActionError(null);
    try {
      if (dialog === 'cancel') {
        if (!cancelReason.trim()) return;
        await adminOrdersApi.cancel(order.order_number, cancelReason.trim());
        setOrder((current) => current
          ? { ...current, status: 'cancelled', status_display: orderStatusLabels.cancelled }
          : current);
      } else if (dialog === 'archive') {
        await adminOrdersApi.archive(order.order_number);
        router.replace('/admin/ordini');
        return;
      }
      setDialog(null);
      setCancelReason('');
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Non è stato possibile completare l’azione.');
    } finally {
      setSavingDialog(false);
    }
  }

  if (!canRead) {
    return (
      <div className={styles.page}>
        <EmptyState
          title="Accesso non disponibile"
          description="Il tuo ruolo non dispone dei permessi necessari per consultare gli ordini."
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.page} aria-busy="true" aria-label="Caricamento ordine">
        <div className={styles.skeletonHeader} />
        <div className={styles.skeletonGrid}>
          <div className={styles.skeletonPanel} />
          <div className={styles.skeletonPanel} />
        </div>
      </div>
    );
  }

  if (loadError || !order) {
    return (
      <div className={styles.page}>
        <EmptyState
          title="Ordine non disponibile"
          description={loadError || 'L’ordine richiesto non è stato trovato.'}
          action={
            <div className={styles.errorActions}>
              <Button variant="secondary" onClick={() => void loadOrder()}>Riprova</Button>
              <Button variant="ghost" onClick={() => router.push('/admin/ordini')}>Torna agli ordini</Button>
            </div>
          }
        />
      </div>
    );
  }

  const customerName = [
    order.shipping_first_name,
    order.shipping_last_name,
  ].filter(Boolean).join(' ') || order.shipping_name || '—';
  const addressLine = order.shipping_line1 || order.shipping_address || '—';
  const timeline = order.status_history?.length
    ? [...order.status_history].sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at))
    : [{
      status: 'received',
      status_display: 'Ordine ricevuto',
      created_at: order.created_at,
      note: undefined,
    }];

  return (
    <div className={styles.page}>
      <Link href="/admin/ordini" className={styles.backLink}>← Torna agli ordini</Link>
      <header className={styles.heading}>
        <div>
          <span className="eyebrow eyebrow-line">Ordine</span>
          <h1>{order.order_number}</h1>
          <p>Creato il {formatAdminDate(order.created_at, true)}</p>
        </div>
        <Badge tone={statusTone(order.status)}>
          {order.status_display || orderStatusLabels[order.status] || order.status}
        </Badge>
      </header>

      {actionError && <p className={styles.actionError} role="alert">{actionError}</p>}

      <div className={styles.layout}>
        <main className={styles.main}>
          <section className={styles.card}>
            <h2>Articoli</h2>
            <div className={styles.items}>
              {order.items.map((item) => (
                <article className={styles.item} key={item.id}>
                  <div>
                    <h3>{item.product_name}</h3>
                    <p>{item.variant_metal_display || item.variant_info}
                      {item.variant_size ? ` · Misura ${item.variant_size}` : ''}</p>
                    {item.sku && <small>SKU: {item.sku}</small>}
                  </div>
                  <div className={styles.itemAmount}>
                    <span>×{item.quantity}</span>
                    <span>{formatAdminMoney(item.unit_price)}</span>
                    <strong>{formatAdminMoney(item.line_total)}</strong>
                  </div>
                </article>
              ))}
            </div>
            <div className={styles.totalRow}>
              <span>Totale ordine</span>
              <strong>{formatAdminMoney(order.total)}</strong>
            </div>
          </section>

          <section className={styles.card}>
            <h2>Stato ordine</h2>
            <ol className={styles.timeline}>
              {timeline.map((event, index) => (
                <li key={`${event.status}-${event.created_at}-${index}`}>
                  <span className={styles.timelineDot} />
                  <div>
                    <strong>{formatEventStatus(event)}</strong>
                    <time dateTime={event.created_at}>{formatAdminDate(event.created_at, true)}</time>
                    {event.note && <p>{event.note}</p>}
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className={styles.card}>
            <h2>Note interne</h2>
            {order.notes?.length ? (
              <ul className={styles.notes}>
                {order.notes.map((note) => (
                  <li key={note.id}>
                    <p>{note.text}</p>
                    <small>{note.author_name || 'Team'} · {formatAdminDate(note.created_at, true)}</small>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles.muted}>Nessuna nota interna.</p>
            )}
            {canManage && (
              <form className={styles.noteForm} onSubmit={submitNote}>
                <label htmlFor="internal-note">Aggiungi una nota</label>
                <textarea
                  id="internal-note"
                  value={noteText}
                  onChange={(event) => setNoteText(event.currentTarget.value)}
                  rows={3}
                  maxLength={2000}
                  required
                />
                <Button type="submit" disabled={!noteText.trim() || savingNote}>
                  {savingNote ? 'Salvataggio…' : 'Aggiungi nota'}
                </Button>
              </form>
            )}
          </section>
        </main>

        <aside className={styles.sidebar}>
          <section className={styles.card}>
            <h2>Cliente e spedizione</h2>
            <dl className={styles.details}>
              <div><dt>Cliente</dt><dd>{customerName}</dd></div>
              <div><dt>Email</dt><dd><a href={`mailto:${order.email}`}>{order.email}</a></dd></div>
              {order.phone && <div><dt>Telefono</dt><dd><a href={`tel:${order.phone}`}>{order.phone}</a></dd></div>}
              <div><dt>Indirizzo</dt><dd>{addressLine}</dd></div>
              {order.shipping_line2 && <div><dt>Indirizzo 2</dt><dd>{order.shipping_line2}</dd></div>}
              <div>
                <dt>Località</dt>
                <dd>
                  {[order.shipping_postal_code, order.shipping_city].filter(Boolean).join(' ')}
                  {order.shipping_province ? ` (${order.shipping_province})` : ''}
                </dd>
              </div>
              <div><dt>Paese</dt><dd>{order.shipping_country || '—'}</dd></div>
            </dl>
          </section>

          <section className={styles.card}>
            <h2>Pagamento</h2>
            <dl className={styles.details}>
              <div><dt>Importo</dt><dd>{formatAdminMoney(order.total)}</dd></div>
              <div><dt>Metodo</dt><dd>{order.payment_method || '—'}</dd></div>
              <div><dt>Stato pagamento</dt><dd>{order.payment_status || (isPaid ? 'Pagato' : 'In attesa')}</dd></div>
              {order.paid_at && <div><dt>Pagato il</dt><dd>{formatAdminDate(order.paid_at, true)}</dd></div>}
            </dl>
          </section>

          {canManage && (
            <section className={styles.card}>
              <h2>Azioni ordine</h2>
              {allowedNextStatuses.length > 0 && (
                <form className={styles.statusForm} onSubmit={submitStatus}>
                  <label htmlFor="next-status">Aggiorna stato</label>
                  <select
                    id="next-status"
                    value={statusSelection}
                    onChange={(event) => setStatusSelection(event.currentTarget.value as OrderStatus | '')}
                    required
                  >
                    <option value="">Seleziona uno stato</option>
                    {allowedNextStatuses.map((status) => (
                      <option key={status} value={status}>{orderStatusLabels[status]}</option>
                    ))}
                  </select>
                  {statusSelection === 'shipped' && (
                    <label>
                      Numero di tracking
                      <input
                        value={trackingNumber}
                        onChange={(event) => setTrackingNumber(event.currentTarget.value)}
                        required
                      />
                    </label>
                  )}
                  <Button type="submit" disabled={!statusSelection || savingStatus}>
                    {savingStatus ? 'Aggiornamento…' : 'Aggiorna stato'}
                  </Button>
                </form>
              )}
              {['pending', 'paid', 'processing'].includes(order.status) && (
                <Button
                  variant="danger"
                  onClick={() => {
                    setCancelReason('');
                    setDialog('cancel');
                  }}
                >
                  Annulla ordine
                </Button>
              )}
              {canArchive && ['cancelled', 'delivered', 'refunded'].includes(order.status) && (
                <Button variant="secondary" onClick={() => setDialog('archive')}>
                  Archivia
                </Button>
              )}
            </section>
          )}
        </aside>
      </div>

      <ConfirmDialog
        open={dialog !== null}
        title={dialog === 'cancel' ? 'Annullare questo ordine?' : 'Archiviare questo ordine?'}
        description={dialog === 'cancel'
          ? (isPaid
            ? 'L’ordine verrà annullato. Il pagamento risulta già incassato e verrà avviato il rimborso; l’accredito può richiedere alcuni giorni.'
            : 'L’ordine verrà annullato e non potrà proseguire nel flusso di evasione.')
          : 'L’ordine verrà archiviato e rimosso dalla gestione corrente.'}
        confirmLabel={dialog === 'cancel' ? 'Conferma annullamento' : 'Archivia ordine'}
        confirmDisabled={dialog === 'cancel' && !cancelReason.trim()}
        pending={savingDialog}
        onConfirm={() => void confirmDialogAction()}
        onCancel={() => {
          if (!savingDialog) setDialog(null);
        }}
      >
        {dialog === 'cancel' && (
          <label className={styles.reasonField}>
            Motivo dell’annullamento (obbligatorio)
            <textarea
              value={cancelReason}
              onChange={(event) => setCancelReason(event.currentTarget.value)}
              rows={3}
              maxLength={1000}
              required
            />
          </label>
        )}
      </ConfirmDialog>
    </div>
  );
}
