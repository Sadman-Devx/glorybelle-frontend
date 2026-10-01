'use client';

import { useState } from 'react';
import styles from './page.module.css';

type Tab = 'orders' | 'addresses';

export default function AccountPage() {
  const [activeTab, setActiveTab] = useState<Tab>('orders');

  return (
    <div className="section">
      <div className="container">
        <h1 className={styles.heading}>Il Mio Account</h1>

        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'orders' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            Ordini
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'addresses' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('addresses')}
          >
            Indirizzi
          </button>
        </div>

        {activeTab === 'orders' && (
          <div className={styles.panel}>
            <div className={styles.emptyState}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
              <h3>Nessun ordine</h3>
              <p>Non hai ancora effettuato ordini.</p>
              <a href="/shop" className="btn btn-primary">Vai allo Shop</a>
            </div>
          </div>
        )}

        {activeTab === 'addresses' && (
          <div className={styles.panel}>
            <div className={styles.emptyState}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              <h3>Nessun indirizzo salvato</h3>
              <p>Aggiungi un indirizzo per velocizzare il checkout.</p>
              <button className="btn btn-secondary">Aggiungi Indirizzo</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
