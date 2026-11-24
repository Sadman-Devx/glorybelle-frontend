'use client';

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Badge from '@/components/admin/Badge';
import Button from '@/components/admin/Button';
import EmptyState from '@/components/admin/EmptyState';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import {
  adminOrdersApi,
  formatAdminDate,
  formatAdminMoney,
  orderStatusLabels,
  type AdminOrder,
} from '@/lib/adminOrders';
import styles from './page.module.css';

const pageSize = 25;

function statusTone(status: AdminOrder['status']): 'neutral' | 'success' | 'warning' | 'danger' | 'gold' {
  if (status === 'paid' || status === 'processing' || status === 'delivered') return 'success';
  if (status === 'shipped') return 'gold';
  if (status === 'cancelled' || status === 'refunded') return 'danger';
  return 'warning';
}

export default function OrdersList() {
  const { user } = useAdminAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [rows, setRows] = useState<AdminOrder[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState(0);
  const queryString = searchParams.toString();
  const params = useMemo(() => new URLSearchParams(queryString), [queryString]);
  const currentPage = Math.max(1, Number(params.get('page')) || 1);
  const ordering = params.get('ordering') || '-created_at';
  const canRead = user?.permissions.includes('*') || user?.permissions.includes('orders:read');

  const updateUrl = useCallback((updates: Record<string, string>) => {
    const next = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value) next.set(key, value);
      else next.delete(key);
    });
    if (!Object.prototype.hasOwnProperty.call(updates, 'page')) next.delete('page');
    const query = next.toString();
    router.replace(`/admin/ordini${query ? `?${query}` : ''}`, { scroll: false });
  }, [router, searchParams]);

  useEffect(() => {
    if (!canRead) return;
    let active = true;
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError(null);
      const query = new URLSearchParams(queryString);
      adminOrdersApi.list({
        status: query.get('status') || undefined,
        date_from: query.get('date_from') || undefined,
        date_to: query.get('date_to') || undefined,
        search: query.get('search') || undefined,
        page: Math.max(1, Number(query.get('page')) || 1),
        page_size: pageSize,
        ordering: query.get('ordering') || '-created_at',
      }).then((data) => {
        if (!active) return;
        if (Array.isArray(data)) {
          setRows(data);
          setCount(data.length);
        } else {
          setRows(data.results);
          setCount(data.count);
        }
      }).catch((requestError: unknown) => {
        if (active) {
          setError(requestError instanceof Error
            ? requestError.message
            : 'Non è stato possibile caricare gli ordini.');
        }
      }).finally(() => {
        if (active) setLoading(false);
      });
    }, 0);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [canRead, queryString, retryToken]);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    updateUrl({ search: String(formData.get('search') || '') });
  }

  function changeSort(field: string) {
    const key = ordering.replace(/^-/, '');
    updateUrl({ ordering: key === field && !ordering.startsWith('-') ? `-${field}` : field });
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

  const pageCount = Math.max(1, Math.ceil(count / pageSize));

  return (
    <div className={styles.page}>
      <header className={styles.heading}>
        <div>
          <span className="eyebrow eyebrow-line">Area riservata</span>
          <h1>Ordini</h1>
          <p>Consulta, filtra e gestisci gli ordini ricevuti.</p>
        </div>
        <Badge tone="gold">{count} ordini</Badge>
      </header>

      <form className={styles.filters} onSubmit={submitSearch} key={params.get('search') || ''}>
        <label className={styles.searchField}>
          <span>Numero ordine o email</span>
          <input
            type="search"
            name="search"
            placeholder="Es. GB-2026-001 o cliente@email.it"
            defaultValue={params.get('search') || ''}
          />
        </label>
        <label>
          <span>Stato</span>
          <select
            value={params.get('status') || ''}
            onChange={(event) => updateUrl({ status: event.currentTarget.value })}
          >
            <option value="">Tutti gli stati</option>
            {Object.entries(orderStatusLabels).map(([status, label]) => (
              <option value={status} key={status}>{label}</option>
            ))}
          </select>
        </label>
        <label>
          <span>Dal</span>
          <input
            type="date"
            value={params.get('date_from') || ''}
            onChange={(event) => updateUrl({ date_from: event.currentTarget.value })}
          />
        </label>
        <label>
          <span>Al</span>
          <input
            type="date"
            value={params.get('date_to') || ''}
            onChange={(event) => updateUrl({ date_to: event.currentTarget.value })}
          />
        </label>
        <Button type="submit">Cerca</Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.replace('/admin/ordini', { scroll: false })}
        >
          Azzera
        </Button>
      </form>

      {error ? (
        <div className={styles.error} role="alert">
          <EmptyState
            title="Ordini non disponibili"
            description={error}
            action={
              <Button variant="secondary" onClick={() => setRetryToken((value) => value + 1)}>
                Riprova
              </Button>
            }
          />
        </div>
      ) : (
        <div className={styles.tablePanel} aria-busy={loading}>
          {loading ? (
            <div className={styles.tableSkeleton} role="status">Caricamento ordini…</div>
          ) : rows.length ? (
            <>
              <div className={styles.tableScroll}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>
                        <button type="button" onClick={() => changeSort('order_number')}>
                          Ordine {ordering === 'order_number' ? '↑' : ordering === '-order_number' ? '↓' : '↕'}
                        </button>
                      </th>
                      <th>
                        <button type="button" onClick={() => changeSort('created_at')}>
                          Data {ordering === 'created_at' ? '↑' : ordering === '-created_at' ? '↓' : '↕'}
                        </button>
                      </th>
                      <th>Cliente</th>
                      <th>Stato</th>
                      <th className={styles.amount}>
                        <button type="button" onClick={() => changeSort('total')}>
                          Totale {ordering === 'total' ? '↑' : ordering === '-total' ? '↓' : '↕'}
                        </button>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((order) => (
                      <tr
                        key={order.id}
                        tabIndex={0}
                        role="link"
                        aria-label={`Apri ordine ${order.order_number}`}
                        onClick={() => router.push(`/admin/ordini/${encodeURIComponent(order.order_number)}`)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            router.push(`/admin/ordini/${encodeURIComponent(order.order_number)}`);
                          }
                        }}
                      >
                        <td><strong>{order.order_number}</strong></td>
                        <td>{formatAdminDate(order.created_at, true)}</td>
                        <td>
                          <span>{order.shipping_name || 'Cliente'}</span>
                          <small className={styles.email}>{order.email}</small>
                        </td>
                        <td>
                          <Badge tone={statusTone(order.status)}>
                            {order.status_display || orderStatusLabels[order.status] || order.status}
                          </Badge>
                        </td>
                        <td className={styles.amount}>{formatAdminMoney(order.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className={styles.pagination}>
                <span>{count ? `${(currentPage - 1) * pageSize + 1}–${Math.min(currentPage * pageSize, count)} di ${count}` : '0 risultati'}</span>
                <div>
                  <Button
                    variant="secondary"
                    disabled={currentPage <= 1}
                    onClick={() => updateUrl({ page: String(currentPage - 1) })}
                  >
                    Precedente
                  </Button>
                  <span>{currentPage} / {pageCount}</span>
                  <Button
                    variant="secondary"
                    disabled={currentPage >= pageCount}
                    onClick={() => updateUrl({ page: String(currentPage + 1) })}
                  >
                    Successiva
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <EmptyState
              title="Nessun ordine trovato"
              description="Modifica i filtri o la ricerca per visualizzare altri ordini."
            />
          )}
        </div>
      )}
    </div>
  );
}
