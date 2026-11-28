'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import { useCart } from '@/contexts/CartContext';
import Link from 'next/link';
import { lockBodyScroll } from '@/lib/scrollLock';
import styles from './CartDrawer.module.css';
import FirstPurchaseBanner from './FirstPurchaseBanner';

export default function CartDrawer() {
  const { cart, drawerOpen, closeDrawer, updateItem, removeItem, loading } = useCart();

  // ESC key closes the drawer — accessibility
  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeDrawer();
    };
    document.addEventListener('keydown', onKey);
    // Lock body scroll while drawer is open
    const unlock = lockBodyScroll();
    return () => {
      document.removeEventListener('keydown', onKey);
      unlock();
    };
  }, [drawerOpen, closeDrawer]);

  const items = cart?.items || [];
  const total = cart?.total || '0.00';
  const discount = cart?.discount ?? null;
  const payable = cart?.total_after_discount ?? total;
  const eur = (v: string) => parseFloat(v).toLocaleString('it-IT', { minimumFractionDigits: 2 });

  return (
    <>
      {/* Backdrop — design.md §1.4: overlay covers viewport */}
      <div
        className={`${styles.backdrop} ${drawerOpen ? styles.backdropOpen : ''}`}
        onClick={closeDrawer}
        aria-hidden={!drawerOpen}
      />

      {/* Drawer — slides in from the right */}
      <aside
        className={`${styles.drawer} ${drawerOpen ? styles.drawerOpen : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Carrello"
      >
        <div className={styles.header}>
          <h3 className={styles.title}>Il tuo carrello</h3>
          <button className={styles.closeBtn} onClick={closeDrawer} aria-label="Chiudi carrello">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {items.length === 0 ? (
          /* Empty state — design.md §1.7 */
          <div className={styles.empty}>
            <svg className={styles.emptyIcon} width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 0 1-8 0"/>
            </svg>
            <p className={styles.emptyText}>Il tuo carrello è vuoto</p>
            <p className={styles.emptySub}>Aggiungi un gioiello che ami.</p>
            <button className="btn btn-primary" onClick={closeDrawer}>Continua lo shopping</button>
          </div>
        ) : (
          <>
            {/* First Purchase Banner — shown above cart items.
                Quiet, editorial tone per design.md (NOT a popup).
                Calls /api/accounts/first-purchase-discount/ to check eligibility. */}
            <FirstPurchaseBanner />

            <div className={styles.items}>
              {items.map((item) => (
                <div key={item.id} className={styles.item}>
                  {/* Product thumbnail */}
                  <div className={styles.itemImage}>
                    <Image
                      src={item.variant.image_url || `/products/${item.variant.product_slug}.jpg`}
                      alt={item.variant.product_name}
                      fill
                      sizes="72px"
                      style={{ objectFit: 'cover' }}
                    />
                  </div>
                  <div className={styles.itemDetails}>
                    <h4 className={styles.itemName}>{item.variant.product_name}</h4>
                    <span className={styles.itemMeta}>
                      {item.variant.metal_display}{item.variant.size ? ` · ${item.variant.size}` : ''}
                    </span>
                    <div className={styles.itemQty}>
                      <button
                        className={styles.qtyBtn}
                        onClick={() => updateItem(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1 || loading}
                        aria-label="Diminuisci quantità"
                      >−</button>
                      <span className={styles.qtyValue}>{item.quantity}</span>
                      <button
                        className={styles.qtyBtn}
                        onClick={() => updateItem(item.id, item.quantity + 1)}
                        disabled={loading}
                        aria-label="Aumenta quantità"
                      >+</button>
                    </div>
                    <button
                      className={styles.removeBtn}
                      onClick={() => removeItem(item.id)}
                      disabled={loading}
                    >
                      Rimuovi
                    </button>
                  </div>
                  <span className={styles.itemPrice}>
                    EUR {parseFloat(item.line_total).toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ))}
            </div>

            {/* Trust row — design.md §1.4 (reassurance at the moment of hesitation) */}
            <div className={styles.trust}>
              <div className={styles.trustItem}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                <span>Pagamento sicuro</span>
              </div>
              <div className={styles.trustItem}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M1 4v6h6M23 20v-6h-6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 12M1 12l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
                <span>Reso gratuito 30gg</span>
              </div>
            </div>

            {/* Footer with subtotal + checkout CTA */}
            <div className={styles.footer}>
              <div className={styles.subtotal}>
                <span className={styles.subtotalLabel}>Subtotale</span>
                <span className={styles.subtotalValue}>EUR {eur(total)}</span>
              </div>
              {discount && (
                <>
                  <div className={`${styles.subtotal} ${styles.discountRow}`} data-testid="cart-discount">
                    <span className={styles.subtotalLabel}>
                      Sconto benvenuto {parseFloat(discount.percent)}% · {discount.product_name}
                    </span>
                    <span className={styles.subtotalValue}>− EUR {eur(discount.amount)}</span>
                  </div>
                  <div className={styles.subtotal}>
                    <span className={styles.subtotalLabel}>Totale</span>
                    <span className={styles.subtotalValue}>EUR {eur(payable)}</span>
                  </div>
                </>
              )}
              <p className={styles.sub}>Spedizione e tasse calcolate al checkout</p>
              <Link href="/checkout" className={`btn btn-primary ${styles.checkoutBtn}`} onClick={closeDrawer}>
                Procedi al Checkout
              </Link>
              <button className={styles.continueBtn} onClick={closeDrawer}>
                Continua lo shopping
              </button>
            </div>
          </>
        )}
      </aside>
    </>
  );
}