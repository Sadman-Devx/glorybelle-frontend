'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useCart } from '@/contexts/CartContext';
import { orders, payments } from '@/lib/api';
import { getStripe } from '@/lib/stripe';
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
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const items = cart?.items || [];
  const total = cart?.total || '0.00';

  // Redirect to shop if cart is empty
  useEffect(() => {
    if (items.length === 0) {
      router.push('/prodotti');
    }
  }, [items.length, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    setSubmitting(true);
    setError(null);

    try {
      // Step 0: make sure the payment CAN be taken before creating anything on the
      // backend — otherwise a failed attempt leaves an orphan "pending" order.
      const stripe = await getStripe();
      if (!stripe) {
        setError('Stripe non è configurato. Impossibile procedere al pagamento.');
        setSubmitting(false);
        return;
      }
      const cardElement = stripe.elements().getElement('card');
      if (!cardElement) {
        // The card field is not mounted on this page yet (see the TODO in the Payment
        // section below), so no payment can be made. Nothing has been created or charged.
        setError('Il pagamento con carta non è ancora attivo. Nessun ordine è stato creato e nessun importo è stato addebitato.');
        setSubmitting(false);
        return;
      }

      // Step 1: create Order on the backend (status=pending)
      // Backend resolves prices from ProductVariant server-side — never trust client total
      const order = await orders.create({
        email: formData.email,
        shipping_address: {
          recipient_name: `${formData.firstName} ${formData.lastName}`,
          street_address: formData.address,
          city: formData.city,
          province: formData.province,
          postal_code: formData.postalCode,
          country: formData.country,
          phone: formData.phone,
        },
      });

      // Step 2: create Stripe PaymentIntent
      const intent = await payments.createIntent(order.id);

      // Step 3: confirm payment with Stripe
      const { error: stripeError } = await stripe.confirmCardPayment(intent.client_secret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: `${formData.firstName} ${formData.lastName}`,
            email: formData.email,
            address: {
              line1: formData.address,
              city: formData.city,
              state: formData.province,
              postal_code: formData.postalCode,
              country: formData.country,
            },
          },
        },
      });

      if (stripeError) {
        setError(stripeError.message || 'Errore nel pagamento');
        setSubmitting(false);
        return;
      }

      // Step 4: redirect to confirmation
      // The backend webhook (not this redirect) is the source of truth for payment success
      router.push(`/checkout/conferma?order=${order.order_number}`);
    } catch (err: unknown) {
      setError(err instanceof Error && err.message ? err.message : 'Errore durante il checkout. Riprova.');
      setSubmitting(false);
    }
  };

  return (
    <div className="section">
      <div className={`container ${styles.checkout}`}>
        <div className={styles.formSection}>
          <h1 className={styles.title}>Checkout</h1>

          {error && (
            <div className={styles.errorBanner} role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className={styles.form}>
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

            {/* Payment — Stripe Elements placeholder.
                Replace with actual <CardElement /> when Stripe Elements UI is wired. */}
            <div className={styles.formGroup}>
              <h3 className={styles.sectionTitle}>Pagamento</h3>
              <div className={styles.stripeBox}>
                <p className={styles.stripeNote}>
                  Pagamento sicuro tramite Stripe. I dati della tua carta non vengono mai
                  archiviati sui nostri server.
                </p>
                {/* TODO: mount <CardElement /> from @stripe/react-stripe-js here.
                    For now we rely on stripe.confirmCardPayment with a payment_method
                    that needs to be created from the card form. */}
              </div>
            </div>

            <button
              type="submit"
              className={`btn btn-primary ${styles.submitBtn}`}
              disabled={submitting || items.length === 0}
            >
              {submitting
                ? 'Elaborazione…'
                : `Completa Ordine — EUR ${parseFloat(total).toLocaleString('it-IT', { minimumFractionDigits: 2 })}`}
            </button>
          </form>
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