'use client';

import { Elements, CardElement, useElements, useStripe } from '@stripe/react-stripe-js';
import type { Stripe } from '@stripe/stripe-js';
import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import { orders, apiErrorMessage } from '@/lib/api';
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
  const { cart } = useCart();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const items = cart?.items || [];
  const total = cart?.total || '0.00';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements || items.length === 0) return;

    // Basic client-side validation (the shipping fields live in the parent page,
    // outside this <form>, so the browser's `required` checks do not cover them).
    const missing = (['email', 'firstName', 'lastName', 'address', 'city', 'postalCode'] as const)
      .some((key) => !formData[key].trim());
    if (missing) {
      setError('Compila tutti i campi obbligatori di contatto e spedizione.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      // Step 1: ONE call creates the pending Order AND the Stripe PaymentIntent.
      // Prices are resolved server-side — never trust a client total.
      const { order, client_secret: clientSecret } = await orders.checkout({
        email: formData.email.trim(),
        idempotency_key: crypto.randomUUID(),  // P1 fix #8 — idempotent checkout
        shipping_address: {
          first_name: formData.firstName.trim(),
          last_name: formData.lastName.trim(),
          line1: formData.address.trim(),
          city: formData.city.trim(),
          province: formData.province.trim(),
          postal_code: formData.postalCode.trim(),
          country: formData.country,
          phone: formData.phone.trim(),
        },
      });

      // Step 2: confirm the payment with Stripe using the CardElement
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
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

      // Remember who placed the order so a GUEST can read it back on /conferma
      // (kept in sessionStorage, not in the URL, to keep the email out of logs/history).
      try {
        sessionStorage.setItem(
          'gb_last_order',
          JSON.stringify({ order_number: order.order_number, email: formData.email.trim() }),
        );
      } catch {
        // storage unavailable — logged-in users can still read the order
      }

      // Status may be 'succeeded' or 'processing' — /conferma polls the backend,
      // because the Stripe webhook (not this redirect) is the source of truth.
      if (paymentIntent) {
        router.push(`/checkout/conferma?order=${order.order_number}`);
      }
    } catch (err) {
      setError(apiErrorMessage(err, 'Errore durante il checkout. Riprova.'));
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
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const [unavailable, setUnavailable] = useState(false);

  // Load Stripe on mount (client-only)
  useEffect(() => {
    const promise = getStripe();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Stripe.js must only load in the browser
    setStripePromise(promise);
    // A missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY resolves to null, and a blocked
    // js.stripe.com request rejects. Either way the card field can never appear —
    // say so instead of leaving an empty box.
    promise.then((s) => { if (!s) setUnavailable(true); }).catch(() => setUnavailable(true));
  }, []);

  if (unavailable) {
    return (
      <div className={styles.errorBanner} role="alert">
        Il pagamento online non è disponibile al momento. Riprova più tardi
        oppure contattaci per completare l&apos;ordine.
      </div>
    );
  }

  if (!stripePromise) {
    return <div className={styles.loading}>Caricamento Stripe…</div>;
  }

  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm {...props} />
    </Elements>
  );
}
