'use client';

import { useCart } from '@/contexts/CartContext';
import Link from 'next/link';
import styles from './CartDrawer.module.css';

export default function CartDrawer() {
  const { cart, drawerOpen, closeDrawer, updateItem, removeItem, loading } = useCart();

  if (!drawerOpen) return null;

  const items = cart?.items || [];
  const total = cart?.total || '0.00';

  return (
    <div className={styles.overlay} onClick={closeDrawer}>
      <div className={styles.drawer} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h3 className={styles.title}>Carrello</h3>
          <button className={styles.closeBtn} onClick={closeDrawer} aria-label="Chiudi carrello">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {items.length === 0 ? (
          <div className={styles.empty}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
            <p>Il tuo carrello e vuoto</p>
            <button className="btn btn-primary" onClick={closeDrawer}>Continua lo shopping</button>
          </div>
        ) : (
          <>
            <div className={styles.items}>
              {items.map((item) => (
                <div key={item.id} className={styles.item}>
                  <div className={styles.itemThumb} />
                  <div className={styles.itemInfo}>
                    <h4 className={styles.itemName}>{item.variant.product_name}</h4>
                    <span className={styles.itemVariant}>
                      {item.variant.metal_display} {item.variant.size ? `- ${item.variant.size}` : ''}
                    </span>
                    <div className={styles.itemActions}>
                      <div className={styles.qty}>
                        <button
                          className={styles.qtyBtn}
                          onClick={() => updateItem(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1 || loading}
                        >-</button>
                        <span>{item.quantity}</span>
                        <button
                          className={styles.qtyBtn}
                          onClick={() => updateItem(item.id, item.quantity + 1)}
                          disabled={loading}
                        >+</button>
                      </div>
                      <button className={styles.removeBtn} onClick={() => removeItem(item.id)}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                      </button>
                    </div>
                  </div>
                  <span className={styles.itemPrice}>EUR {parseFloat(item.line_total).toLocaleString('it-IT', { minimumFractionDigits: 2 })}</span>
                </div>
              ))}
            </div>

            {/* Trust row */}
            <div className={styles.trust}>
              <div className={styles.trustItem}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                <span>Pagamento sicuro</span>
              </div>
              <div className={styles.trustItem}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M1 4v6h6M23 20v-6h-6"/></svg>
                <span>Reso gratuito 30gg</span>
              </div>
            </div>

            <div className={styles.footer}>
              <div className={styles.totalRow}>
                <span>Totale</span>
                <span className={styles.totalPrice}>EUR {parseFloat(total).toLocaleString('it-IT', { minimumFractionDigits: 2 })}</span>
              </div>
              <Link href="/checkout" className="btn btn-primary" style={{ width: '100%', textAlign: 'center' }} onClick={closeDrawer}>
                Procedi al Checkout
              </Link>
              <button className={styles.continueShopping} onClick={closeDrawer}>
                Continua lo shopping
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
