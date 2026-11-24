'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { orders as ordersApi } from '@/lib/api';
import type { Order } from '@/lib/types';
import styles from './page.module.css';

const STATUS_LABELS: Record<Order['status'], string> = {
  pending: 'In attesa',
  paid: 'Pagato',
  shipped: 'Spedito',
  delivered: 'Consegnato',
  cancelled: 'Annullato',
};

export default function OrdersPage() {
  // /account/* is already auth-gated by app/account/layout.tsx, so `user` is set here.
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!user) return;
    ordersApi.list()
      .then(setOrders)
      .catch(() => setError(true));
  }, [user]);

  const isLoading = orders === null && !error;

  return (
    <div className={styles.page}>
      <div className="container">
        <Link href="/account" className={styles.backLink}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Il mio account
        </Link>

        <h1 className={styles.heading}>I miei ordini</h1>

        {isLoading && (
          <div className={styles.list} aria-busy="true">
            {[0, 1, 2].map((i) => <div key={i} className={styles.skeleton} />)}
          </div>
        )}

        {error && (
          <div className={styles.message} role="alert">
            <p>Non siamo riusciti a caricare i tuoi ordini. Riprova tra qualche minuto.</p>
          </div>
        )}

        {orders && orders.length === 0 && (
          <div className={styles.message}>
            <h2 className={styles.messageTitle}>Nessun ordine</h2>
            <p>Non hai ancora effettuato ordini.</p>
            <Link href="/prodotti" className="btn btn-primary">Vai allo Shop</Link>
          </div>
        )}

        {orders && orders.length > 0 && (
          <ul className={styles.list}>
            {orders.map((order) => {
              const count = order.items.reduce((sum, item) => sum + item.quantity, 0);
              return (
                <li key={order.id}>
                  <Link href={`/account/ordini/${order.order_number}`} className={styles.order}>
                    <div className={styles.orderMain}>
                      <span className={styles.orderNumber}>{order.order_number}</span>
                      <span className={styles.orderMeta}>
                        {new Date(order.created_at).toLocaleDateString('it-IT', {
                          year: 'numeric', month: 'long', day: 'numeric',
                        })}
                        {' · '}
                        {count} {count === 1 ? 'articolo' : 'articoli'}
                      </span>
                    </div>
                    <span className={`${styles.status} ${styles[`status_${order.status}`] ?? ''}`}>
                      {order.status_display || STATUS_LABELS[order.status] || order.status}
                    </span>
                    <span className={styles.total}>€{parseFloat(order.total).toFixed(2)}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
