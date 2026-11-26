'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useCart } from '@/contexts/CartContext';
import StripeCheckoutForm from '@/components/stripe/StripeCheckoutForm';
import styles from './page.module.css';

interface CheckoutForm {
  email: string;
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  phone: string;
}

const EMPTY_FORM: CheckoutForm = {
  email: '', firstName: '', lastName: '',
  address: '', city: '', province: '', postalCode: '', country: 'IT', phone: '',
};

export default function CheckoutPage() {
  const { cart } = useCart();
  const router = useRouter();
  const [formData, setFormData] = useState<CheckoutForm>(EMPTY_FORM);

  const items = cart?.items || [];
  const total = cart?.total || '0.00';

  // Redirect to shop if the cart is empty — but only once it has LOADED
  // (cart is null while loading, which previously bounced every page refresh).
  useEffect(() => {
    if (cart && cart.items.length === 0) {
      router.push('/prodotti');
    }
  }, [cart, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="section">
      <div className={`container ${styles.checkout}`}>
        <div className={styles.formSection}>
          <h1 className={styles.title}>Checkout</h1>

          <div className={styles.form}>
            {/* Contact */}
            <div className={styles.formGroup}>
              <h3 className={styles.sectionTitle}>Contatto</h3>
              <input
                className={styles.input}
                name="email"
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            {/* Shipping address */}
            <div className={styles.formGroup}>
              <h3 className={styles.sectionTitle}>Spedizione</h3>
              <div className={styles.row}>
                <input className={styles.input} name="firstName" placeholder="Nome" value={formData.firstName} onChange={handleChange} required />
                <input className={styles.input} name="lastName" placeholder="Cognome" value={formData.lastName} onChange={handleChange} required />
              </div>
              <input className={styles.input} name="address" placeholder="Indirizzo" value={formData.address} onChange={handleChange} required />
              <div className={styles.row}>
                <input className={styles.input} name="city" placeholder="Città" value={formData.city} onChange={handleChange} required />
                <input className={styles.input} name="province" placeholder="Provincia" value={formData.province} onChange={handleChange} maxLength={2} />
              </div>
              <div className={styles.row}>
                <input className={styles.input} name="postalCode" placeholder="CAP" value={formData.postalCode} onChange={handleChange} required maxLength={5} />
                <input className={styles.input} name="phone" placeholder="Telefono" value={formData.phone} onChange={handleChange} type="tel" />
              </div>
            </div>

            {/* Payment — Stripe Elements card field + submit button.
                Order and PaymentIntent are created in a single POST /api/checkout/. */}
            <div className={styles.formGroup}>
              <h3 className={styles.sectionTitle}>Pagamento</h3>
              <StripeCheckoutForm formData={formData} />
            </div>
          </div>
        </div>

        {/* Order summary sidebar */}
        <div className={styles.summary}>
          <h3 className={styles.sectionTitle}>Riepilogo ordine</h3>
          {items.map((item) => (
            <div key={item.id} className={styles.summaryItem}>
              <div className={styles.summaryThumb}>
                <Image
                  src={item.variant.image_url || `/products/${item.variant.product_slug}.jpg`}
                  alt={item.variant.product_name}
                  fill
                  sizes="60px"
                  style={{ objectFit: 'cover' }}
                />
              </div>
              <div className={styles.summaryInfo}>
                <span className={styles.summaryName}>{item.variant.product_name}</span>
                <span className={styles.summaryVariant}>
                  {item.variant.metal_display}
                  {item.variant.size ? ` · ${item.variant.size}` : ''}
                  {' '}×{item.quantity}
                </span>
              </div>
              <span className={styles.summaryPrice}>
                EUR {parseFloat(item.line_total).toLocaleString('it-IT', { minimumFractionDigits: 2 })}
              </span>
            </div>
          ))}
          <div className={styles.divider} />
          <div className={styles.summaryTotal}>
            <span>Totale</span>
            <span>EUR {parseFloat(total).toLocaleString('it-IT', { minimumFractionDigits: 2 })}</span>
          </div>
          <div className={styles.summaryTrust}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            <span>Transazione sicura e crittografata</span>
          </div>
        </div>
      </div>
    </div>
  );
}