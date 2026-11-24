'use client';

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Badge from '@/components/admin/Badge';
import Button from '@/components/admin/Button';
import EmptyState from '@/components/admin/EmptyState';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import {
  adminEnquiriesApi,
  enquiryStatusLabels,
  type AdminEnquiry,
  type AdminEnquiryStatus,
} from '@/lib/adminEnquiries';
import { formatAdminDate } from '@/lib/adminOrders';
import styles from './page.module.css';

const pageSize = 25;

function isEnquiryStatus(value: string | null): value is AdminEnquiryStatus {
  return value === 'new'
    || value === 'in_progress'
    || value === 'answered'
    || value === 'closed';
}

function statusTone(status: AdminEnquiryStatus): 'neutral' | 'success' | 'warning' | 'gold' {
  if (status === 'answered') return 'success';
  if (status === 'closed') return 'neutral';
  if (status === 'in_progress') return 'gold';
  return 'warning';
}

function atelierTypeLabel(type: AdminEnquiry['atelier_type']): string {
  if (type === 'anelli') return 'Anelli';
  if (type === 'collane') return 'Collane';
  if (type === 'orecchini') return 'Orecchini';
  return '—';
}

export default function RichiesteList() {
  const { user } = useAdminAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [rows, setRows] = useState<AdminEnquiry[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState(0);
  const queryString = searchParams.toString();
  const params = useMemo(() => new URLSearchParams(queryString), [queryString]);
  const currentPage = Math.max(1, Number(params.get('page')) || 1);
  const search = params.get('search') || '';
  const statusParam = params.get('status');
  const selectedStatus: AdminEnquiryStatus | '' = isEnquiryStatus(statusParam)
    ? statusParam
    : '';
  const canRead = user?.permissions.includes('*')
    || user?.permissions.includes('enquiries:read');

  const updateUrl = useCallback((updates: Record<string, string>) => {
    const next = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value) next.set(key, value);
      else next.delete(key);
    });
    if (!Object.prototype.hasOwnProperty.call(updates, 'page')) next.delete('page');
    const query = next.toString();
    router.replace(`/admin/richieste${query ? `?${query}` : ''}`, { scroll: false });
  }, [router, searchParams]);

  useEffect(() => {
    if (!canRead) return;
    let active = true;
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError(null);
      const query = new URLSearchParams(queryString);
      const status = query.get('status');
      adminEnquiriesApi.list({
        status: isEnquiryStatus(status) ? status : undefined,
        search: query.get('search') || undefined,
        page: Math.max(1, Number(query.get('page')) || 1),
        page_size: pageSize,
        ordering: '-created_at',
      }).then((data) => {
        if (!active) return;
        setRows(data.results);
        setCount(data.count);
      }).catch((requestError: unknown) => {
        if (active) {
          setError(requestError instanceof Error
            ? requestError.message
            : 'Non è stato possibile caricare le richieste.');
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

  const pageCount = Math.max(1, Math.ceil(count / pageSize));

  return (
    <div className={styles.page}>
      <header className={styles.heading}>
        <div>
          <span className="eyebrow eyebrow-line">Area riservata</span>
          <h1>Richieste</h1>
          <p>Messaggi di contatto e richieste per l’Atelier.</p>
        </div>
        <Badge tone="gold">{count} richieste</Badge>
      </header>

      <form className={styles.filters} onSubmit={submitSearch} key={search}>
        <label className={styles.searchField}>
          <span>Cerca nelle richieste</span>
          <input
            type="search"
            name="search"
            placeholder="Nome, email o messaggio"
            defaultValue={search}
          />
        </label>
        <label>
          <span>Stato</span>
          <select
            value={selectedStatus}
            onChange={(event) => updateUrl({ status: event.currentTarget.value })}
          >
            <option value="">Tutti gli stati</option>
            {Object.entries(enquiryStatusLabels).map(([status, label]) => (
              <option value={status} key={status}>{label}</option>
            ))}
          </select>
        </label>
        <Button type="submit">Cerca</Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.replace('/admin/richieste', { scroll: false })}
        >
          Azzera
        </Button>
      </form>

      {error ? (
        <div className={styles.error} role="alert">
          <EmptyState
            title="Richieste non disponibili"
            description={error}
            action={
              <Button variant="secondary" onClick={() => setRetryToken((value) => value + 1)}>
                Riprova
              </Button>
            }
          />
        </div>
      ) : (
        <section className={styles.tablePanel} aria-busy={loading} aria-label="Elenco richieste">
          {loading ? (
            <div className={styles.tableSkeleton} role="status">Caricamento richieste…</div>
          ) : rows.length ? (
            <>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th scope="col">Cliente</th>
                    <th scope="col">Argomento</th>
                    <th scope="col">Tipo Atelier</th>
                    <th scope="col">Ricevuta</th>
                    <th scope="col">Stato</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((enquiry) => (
                    <tr
                      key={enquiry.id}
                      className={enquiry.status === 'new' ? styles.unread : undefined}
                    >
                      <td data-label="Cliente">
                        <Link
                          href={`/admin/richieste/${enquiry.id}`}
                          className={styles.nameLink}
                        >
                          {enquiry.name}
                        </Link>
                        <a className={styles.email} href={`mailto:${enquiry.email}`}>
                          {enquiry.email}
                        </a>
                      </td>
                      <td data-label="Argomento">{enquiry.topic_label}</td>
                      <td data-label="Tipo Atelier">{atelierTypeLabel(enquiry.atelier_type)}</td>
                      <td data-label="Ricevuta">{formatAdminDate(enquiry.created_at, true)}</td>
                      <td data-label="Stato">
                        <Badge tone={statusTone(enquiry.status)}>
                          {enquiryStatusLabels[enquiry.status]}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className={styles.pagination}>
                <span>
                  {`${(currentPage - 1) * pageSize + 1}–${Math.min(currentPage * pageSize, count)} di ${count}`}
                </span>
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
              title="Nessuna richiesta trovata"
              description="Modifica i filtri o la ricerca per visualizzare altri messaggi."
            />
          )}
        </section>
      )}
    </div>
  );
}
