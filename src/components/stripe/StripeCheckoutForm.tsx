'use client';

import { Elements, CardElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import { orders, payments } from '@/lib/api';
import { getStripe } from '@/lib/stripe';
import styles from './StripeCheckoutForm.module.css';

interface CheckoutFormProps {
  formData: {
    email: string;
    firstName: string;
    lastName: string;
    address: string;
    city: string;
    province: string;
    postalCode: string;
    country: string;
    phone: string;
  };
}

function CheckoutForm({ formData }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const { cart, addItem: _addItem } = useCart();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const items = cart?.items || [];
  const total = cart?.total || '0.00';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements || items.length === 0) return;

    setSubmitting(true);
    setError(null);

    try {
      // Step 1: Create Order on backend (status=pending)
      // Backend resolves prices server-side — never trust client total
      const order = await orders.create({
        email: formData.email,
        idempotency_key: crypto.randomUUID(),  // P1 fix #8 — idempotent checkout
        shipping_address: {
          first_name: formData.firstName,
          last_name: formData.lastName,
          line1: formData.address,
          city: formData.city,
          province: formData.province,
          postal_code: formData.postalCode,
          country: formData.country,
          phone: formData.phone,
        },
      });

      // Step 2: Create Stripe PaymentIntent on backend
      const intent = await payments.createIntent(order.id);

      // Step 3: Confirm payment with Stripe using CardElement
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        intent.client_secret,
        {
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
        }
      );

      if (stripeError) {
        setError(stripeError.message || 'Errore nel pagamento.');
        setSubmitting(false);
        return;
      }

      if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Redirect to confirmation page
        // The backend webhook (not this redirect) is the source of truth for
        // payment status — /conferma polls the backend to confirm
        router.push(`/checkout/conferma?order=${order.order_number}`);
      } else if (paymentIntent) {
        // Status may be 'processing' or 'requires_capture' — poll on /conferma
        router.push(`/checkout/conferma?order=${order.order_number}`);
      }
    } catch (err) {
      const apiErr = err as { data?: Record<string, unknown> };
      const data = apiErr?.data;
      if (data && typeof data === 'object') {
        const firstKey = Object.keys(data)[0];
        const firstErr = data[firstKey];
        if (Array.isArray(firstErr)) {
          setError(`${firstKey}: ${firstErr[0]}`);
        } else {
          setError(String(firstErr));
        }
      } else {
        setError('Errore durante il checkout. Riprova.');
      }
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      {error && (
        <div className={styles.errorBanner} role="alert">
          {error}
        </div>
      )}

      <div className={styles.field}>
        <label className={styles.label}>Dati della carta</label>
        <div className={styles.cardElementWrap}>
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '14px',
                  color: '#14201C',
                  fontFamily: 'Manrope, sans-serif',
                  '::placeholder': {
                    color: 'rgba(20, 32, 28, 0.4)',
                  },
                },
                invalid: {
                  color: '#7A3226',
                },
              },
              hidePostalCode: true,
            }}
          />
        </div>
        <p className={styles.hint}>
          Pagamento sicuro tramite Stripe. I dati della tua carta non vengono mai
          archiviati sui nostri server.
        </p>
      </div>

      <button
        type="submit"
        className={`btn btn-primary ${styles.submitBtn}`}
        disabled={!stripe || submitting || items.length === 0}
      >
        {submitting
          ? 'Elaborazione…'
          : `Paga €${parseFloat(total).toFixed(2)}`}
      </button>
    </form>
  );
}

/**
 * Stripe Elements wrapper — mounts CardElement inside <Elements> provider.
 * Lazy-loaded so Stripe.js only loads on the checkout page (not site-wide).
 */
export default function StripeCheckoutForm(props: CheckoutFormProps) {
  const [stripePromise, setStripePromise] = useState<Promise<any>>(null);

  // Load Stripe on mount (client-only)
  useEffect(() => {
    setStripePromise(getStripe());
  }, []);

  if (!stripePromise) {
    return <div className={styles.loading}>Caricamento Stripe…</div>;
  }

  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm {...props} />
    </Elements>
  );
}

// Import moved to top of file via useEffect — placeholder for actual hook import
import { useEffect, useState } from 'react';
