'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import Badge from '@/components/admin/Badge';
import Button from '@/components/admin/Button';
import EmptyState from '@/components/admin/EmptyState';
import {
  adminOrdersApi,
  formatAdminMoney,
  type AdminDashboardData,
} from '@/lib/adminOrders';
import styles from './page.module.css';

const statusNames: Record<string, string> = {
  pending: 'In attesa',
  paid: 'Pagato',
  processing: 'In preparazione',
  shipped: 'Spedito',
  delivered: 'Consegnato',
  cancelled: 'Annullato',
  refunded: 'Rimborsato',
};

function DashboardSkeleton() {
  return (
    <div className={styles.page} aria-label="Caricamento dashboard" aria-busy="true">
      <div className={styles.skeletonMetrics}>
        {[1, 2, 3].map((item) => <div className={styles.skeletonCard} key={item} />)}
      </div>
      <div className={styles.skeletonPanel} />
      <div className={styles.skeletonPanel} />
    </div>
  );
}

export default function AdminDashboardPage() {
  const [dashboard, setDashboard] = useState<AdminDashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setDashboard(await adminOrdersApi.dashboard());
    } catch (requestError) {
      setError(requestError instanceof Error
        ? requestError.message
        : 'Non è stato possibile caricare la dashboard.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadDashboard(), 0);
    return () => window.clearTimeout(timer);
  }, [loadDashboard]);

  if (loading) return <DashboardSkeleton />;

  return (
    <div className={styles.page}>
      <header className={styles.heading}>
        <div>
          <span className="eyebrow eyebrow-line">Area riservata</span>
          <h1>Dashboard</h1>
          <p>Riepilogo ordini, ricavi e disponibilità del catalogo.</p>
        </div>
        <Badge tone="gold">Panoramica</Badge>
      </header>

      {error ? (
        <div className={styles.error} role="alert">
          <EmptyState
            title="Dashboard non disponibile"
            description={error}
            action={<Button variant="secondary" onClick={() => void loadDashboard()}>Riprova</Button>}
          />
        </div>
      ) : dashboard ? (
        <>
          <section className={styles.metrics} aria-label="Indicatori principali">
            <article className={styles.metric}>
              <span>Ordini di oggi</span>
              <strong>{dashboard.today_orders}</strong>
              <small>Ordini ricevuti oggi</small>
            </article>
            <article className={styles.metric}>
              <span>Ricavi · 7 giorni</span>
              <strong>{formatAdminMoney(dashboard.revenue_last_7_days)}</strong>
              <small>Ultimi sette giorni</small>
            </article>
            <article className={styles.metric}>
              <span>Ricavi · 30 giorni</span>
              <strong>{formatAdminMoney(dashboard.revenue_last_30_days)}</strong>
              <small>Ultimi trenta giorni</small>
            </article>
          </section>

          <div className={styles.panels}>
            <section className={styles.panel} aria-labelledby="status-heading">
              <div className={styles.sectionHeading}>
                <div>
                  <h2 id="status-heading">Ordini per stato</h2>
                  <p>Distribuzione degli ordini registrati.</p>
                </div>
                <Link href="/admin/ordini">Tutti gli ordini</Link>
              </div>
              {dashboard.orders_by_status.length ? (
                <ul className={styles.statusList}>
                  {dashboard.orders_by_status.map((entry) => {
                    const maxCount = Math.max(...dashboard.orders_by_status.map((item) => item.count), 1);
                    return (
                      <li key={entry.status}>
                        <div className={styles.statusLabel}>
                          <span>{statusNames[entry.status] || entry.status}</span>
                          <strong>{entry.count}</strong>
                        </div>
                        <div className={styles.barTrack} aria-hidden="true">
                          <span style={{ width: `${(entry.count / maxCount) * 100}%` }} />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className={styles.emptyMessage}>Non ci sono ancora ordini.</p>
              )}
            </section>

            <section className={styles.panel} aria-labelledby="stock-heading">
              <div className={styles.sectionHeading}>
                <div>
                  <h2 id="stock-heading">Scorte in esaurimento</h2>
                  <p>Prodotti da controllare e riassortire.</p>
                </div>
                <Badge tone="warning">{dashboard.low_stock_variants.length}</Badge>
              </div>
              {dashboard.low_stock_variants.length ? (
                <ul className={styles.stockList}>
                  {dashboard.low_stock_variants.map((variant) => (
                    <li key={variant.id}>
                      <Link href="/admin/prodotti">
                        <span>{variant.product_name} · {variant.metal} {variant.size}</span>
                        <small>{variant.available_stock} disponibili · {variant.sku}</small>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={styles.emptyMessage}>Nessun prodotto sotto scorta.</p>
              )}
            </section>
          </div>
        </>
      ) : null}
    </div>
  );
}
