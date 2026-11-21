'use client';

import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { orders } from '@/lib/api';
import type { Order } from '@/lib/types';
import styles from './page.module.css';

function ConfirmContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get('order');
  const [order, setOrder] = useState<Order | null>(null);
  const [polling, setPolling] = useState(true);

  // Poll the backend order status — the Stripe webhook (not the client redirect)
  // is the source of truth for payment success (architecture.md §1.3).
  // The order may still be "pending" when the customer lands here if the
  // webhook hasn't fired yet; we poll until it becomes "paid".
  useEffect(() => {
    if (!orderNumber) {
      setPolling(false);
      return;
    }
    let attempts = 0;
    const maxAttempts = 10;
    const interval = setInterval(async () => {
      attempts++;
      try {
        const data = await orders.detail(orderNumber);
        if (data.status === 'paid' || data.status === 'shipped' || data.status === 'delivered') {
          setOrder(data);
          setPolling(false);
          clearInterval(interval);
        } else if (attempts >= maxAttempts) {
          // Still pending after 10 attempts (~20s) — show pending state to customer
          setOrder(data);
          setPolling(false);
          clearInterval(interval);
        }
      } catch {
        if (attempts >= maxAttempts) {
          setPolling(false);
          clearInterval(interval);
        }
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [orderNumber]);

  if (!orderNumber) {
    return (
      <div className={`section ${styles.confirm}`}>
        <div className={`container ${styles.inner}`}>
          <div className={styles.icon}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h1 className={styles.title}>Nessun ordine trovato</h1>
          <p className={styles.desc}>
            Non siamo riusciti a trovare il tuo ordine. Controlla la mail di conferma
            o contattaci se il problema persiste.
          </p>
          <div className={styles.ctas}>
            <Link href="/prodotti" className="btn btn-primary">Continua lo shopping</Link>
          </div>
        </div>
      </div>
    );
  }

  if (polling) {
    return (
      <div className={`section ${styles.confirm}`}>
        <div className={`container ${styles.inner}`}>
          <div className={styles.spinner} aria-label="Caricamento" />
          <h1 className={styles.title}>Stiamo confermando il tuo ordine…</h1>
          <p className={styles.desc}>
            Ordine <strong>{orderNumber}</strong>. Attendi mentre verifichiamo
            il pagamento con la banca.
          </p>
        </div>
      </div>
    );
  }

  const isPaid = order && (order.status === 'paid' || order.status === 'shipped' || order.status === 'delivered');

  return (
    <div className={`section ${styles.confirm}`}>
      <div className={`container ${styles.inner}`}>
        <div className={`${styles.icon} ${isPaid ? styles.iconSuccess : styles.iconPending}`}>
          {isPaid ? (
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          ) : (
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          )}
        </div>

        <h1 className={styles.title}>
          {isPaid ? 'Ordine confermato!' : 'Pagamento in elaborazione'}
        </h1>

        <p className={styles.orderNumber}>
          Ordine <strong>{orderNumber}</strong>
        </p>

        <p className={styles.desc}>
          {isPaid ? (
            <>
              Grazie per il tuo acquisto. Riceverai un&apos;email di conferma con i
              dettagli del tuo ordine e le informazioni di spedizione entro pochi minuti.
            </>
          ) : (
            <>
              Il tuo pagamento è in fase di elaborazione. Riceverai un&apos;email non
              appena sarà confermato. Se non ricevi conferma entro 10 minuti,
              contattaci indicando il numero d&apos;ordine.
            </>
          )}
        </p>

        {isPaid && order && (
          <div className={styles.orderSummary}>
            <div className={styles.summaryRow}>
              <span>Totale</span>
              <strong>EUR {parseFloat(order.total).toLocaleString('it-IT', { minimumFractionDigits: 2 })}</strong>
            </div>
            <div className={styles.summaryRow}>
              <span>Stato</span>
              <strong className={styles.statusPaid}>{order.status}</strong>
            </div>
          </div>
        )}

        <div className={styles.ctas}>
          <Link href="/account" className="btn btn-secondary">I miei ordini</Link>
          <Link href="/prodotti" className="btn btn-primary">Continua lo shopping</Link>
        </div>
      </div>
    </div>
  );
}

export default function ConfermaPage() {
  return (
    <Suspense fallback={<div className="section container"><p>Caricamento…</p></div>}>
      <ConfirmContent />
    </Suspense>
  );
}