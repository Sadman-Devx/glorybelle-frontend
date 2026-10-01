'use client';

import { useState } from 'react';
import { useCart } from '@/contexts/CartContext';
import styles from './page.module.css';

export default function CheckoutPage() {
  const { cart } = useCart();
  const [formData, setFormData] = useState({
    email: '', firstName: '', lastName: '',
    address: '', city: '', province: '', postalCode: '', country: 'IT', phone: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const items = cart?.items || [];
  const total = cart?.total || '0.00';

  return (
    <div className="section">
      <div className={`container ${styles.checkout}`}>
        <div className={styles.formSection}>
          <h1 className={styles.title}>Checkout</h1>

          <div className={styles.formGroup}>
            <h3 className={styles.sectionTitle}>Contatto</h3>
            <input className={styles.input} name="email" type="email" placeholder="Email" value={formData.email} onChange={handleChange} required />
          </div>

          <div className={styles.formGroup}>
            <h3 className={styles.sectionTitle}>Spedizione</h3>
            <div className={styles.row}>
              <input className={styles.input} name="firstName" placeholder="Nome" value={formData.firstName} onChange={handleChange} required />
              <input className={styles.input} name="lastName" placeholder="Cognome" value={formData.lastName} onChange={handleChange} required />
            </div>
            <input className={styles.input} name="address" placeholder="Indirizzo" value={formData.address} onChange={handleChange} required />
            <div className={styles.row}>
              <input className={styles.input} name="city" placeholder="Citta" value={formData.city} onChange={handleChange} required />
              <input className={styles.input} name="province" placeholder="Provincia" value={formData.province} onChange={handleChange} />
            </div>
            <div className={styles.row}>
              <input className={styles.input} name="postalCode" placeholder="CAP" value={formData.postalCode} onChange={handleChange} required />
              <input className={styles.input} name="phone" placeholder="Telefono" value={formData.phone} onChange={handleChange} />
            </div>
          </div>

          <div className={styles.formGroup}>
            <h3 className={styles.sectionTitle}>Pagamento</h3>
            <div className={styles.stripeBox}>
              <p className={styles.stripePlaceholder}>
                Stripe Elements verranno integrati qui quando la chiave API sara configurata.
              </p>
            </div>
          </div>

          <button className="btn btn-primary" style={{ width: '100%', marginTop: '16px' }}>
            Completa Ordine — EUR {parseFloat(total).toLocaleString('it-IT', { minimumFractionDigits: 2 })}
          </button>
        </div>

        {/* Order summary sidebar */}
        <div className={styles.summary}>
          <h3 className={styles.sectionTitle}>Riepilogo ordine</h3>
          {items.map((item) => (
            <div key={item.id} className={styles.summaryItem}>
              <div className={styles.summaryThumb} />
              <div className={styles.summaryInfo}>
                <span className={styles.summaryName}>{item.variant.product_name}</span>
                <span className={styles.summaryVariant}>{item.variant.metal_display} x{item.quantity}</span>
              </div>
              <span className={styles.summaryPrice}>EUR {parseFloat(item.line_total).toLocaleString('it-IT', { minimumFractionDigits: 2 })}</span>
            </div>
          ))}
          <div className={styles.divider} />
          <div className={styles.summaryTotal}>
            <span>Totale</span>
            <span>EUR {parseFloat(total).toLocaleString('it-IT', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className={styles.summaryTrust}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            Transazione sicura e crittografata
          </div>
        </div>
      </div>
    </div>
  );
}
