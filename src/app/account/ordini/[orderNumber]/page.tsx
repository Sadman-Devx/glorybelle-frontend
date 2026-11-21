'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { orders } from '@/lib/api';
import type { Order } from '@/lib/types';
import styles from './page.module.css';

export default function OrderDetailPage() {
  const params = useParams();
  const orderNumber = params.orderNumber as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderNumber) return;
    orders.detail(orderNumber)
      .then((data) => setOrder(data))
      .catch(() => setError('Ordine non trovato.'))
      .finally(() => setLoading(false));
  }, [orderNumber]);

  if (loading) {
    return (
      <div className="section container">
        <div className={styles.skeleton}>
          <div className={styles.skeletonLine} style={{ width: '40%', height: '32px' }} />
          <div className={styles.skeletonLine} style={{ width: '60%', height: '20px' }} />
          <div className={styles.skeletonLine} style={{ width: '100%', height: '120px' }} />
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="section container" style={{ textAlign: 'center' }}>
        <h1 className="heading-section">{error || 'Ordine non trovato'}</h1>
        <Link href="/account/ordini" className="btn btn-primary" style={{ marginTop: '20px' }}>
          Vedi i miei ordini
        </Link>
      </div>
    );
  }

  return (
    <div className="section">
      <div className="container">
        <Link href="/account/ordini" className={styles.backLink}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Indietro agli ordini
        </Link>

        <header className={styles.header}>
          <div>
            <span className="eyebrow eyebrow-line">Ordine</span>
            <h1 className={styles.orderNumber}>{order.order_number}</h1>
            <p className={styles.date}>
              Effettuato il{' '}
              {new Date(order.created_at).toLocaleDateString('it-IT', {
                year: 'numeric', month: 'long', day: 'numeric',
              })}
            </p>
          </div>
          <div className={`${styles.statusBadge} ${styles[`status_${order.status}`]}`}>
            {order.status_display || order.status}
          </div>
        </header>

        <div className={styles.grid}>
          {/* Items */}
          <div className={styles.main}>
            <h2 className={styles.sectionTitle}>Articoli</h2>
            <ul className={styles.itemsList}>
              {order.items.map((item) => (
                <li key={item.id} className={styles.item}>
                  <div className={styles.itemInfo}>
                    <h3 className={styles.itemName}>{item.product_name}</h3>
                    <p className={styles.itemVariant}>
                      {item.variant_metal_display}
                      {item.variant_size ? ` · Misura ${item.variant_size}` : ''}
                    </p>
                    <p className={styles.itemSku}>SKU: {item.sku}</p>
                  </div>
                  <div className={styles.itemMeta}>
                    <span className={styles.itemQty}>×{item.quantity}</span>
                    <span className={styles.itemPrice}>€{parseFloat(item.unit_price).toFixed(2)}</span>
                    <span className={styles.itemTotal}>€{parseFloat(item.line_total).toFixed(2)}</span>
                  </div>
                </li>
              ))}
            </ul>

            {/* Shipping address — snapshotted at purchase time */}
            <h2 className={styles.sectionTitle}>Spedizione</h2>
            <div className={styles.addressCard}>
              <p className={styles.addressName}>
                {order.shipping_first_name} {order.shipping_last_name}
              </p>
              <p className={styles.addressLine}>{order.shipping_line1}</p>
              {order.shipping_line2 && <p className={styles.addressLine}>{order.shipping_line2}</p>}
              <p className={styles.addressLine}>
                {order.shipping_postal_code} {order.shipping_city} ({order.shipping_province})
              </p>
              <p className={styles.addressLine}>{order.shipping_country}</p>
            </div>
          </div>

          {/* Summary sidebar */}
          <aside className={styles.sidebar}>
            <div className={styles.summaryCard}>
              <h2 className={styles.sectionTitle}>Riepilogo</h2>
              <div className={styles.summaryRow}>
                <span>Subtotale</span>
                <span>€{parseFloat(order.subtotal).toFixed(2)}</span>
              </div>
              <div className={styles.summaryRow}>
                <span>Spedizione</span>
                <span>{parseFloat(order.shipping_cost) === 0 ? 'Gratuita' : `€${parseFloat(order.shipping_cost).toFixed(2)}`}</span>
              </div>
              <div className={styles.divider} />
              <div className={styles.summaryTotal}>
                <span>Totale</span>
                <span>€{parseFloat(order.total).toFixed(2)}</span>
              </div>
              <div className={styles.emailNote}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
                Conferma inviata a {order.email}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
