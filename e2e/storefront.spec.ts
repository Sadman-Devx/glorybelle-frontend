/**
 * GLORYBELLE — storefront end-to-end tests (real browser, real Next.js, real API).
 *
 * What is real:  the Next.js app, the Django API, the database, cookies/sessions, JWT.
 * What is faked: ONLY Stripe.js (js.stripe.com is replaced by a tiny stub so no real
 *                card / internet is needed) and the Stripe webhook, which the test
 *                delivers itself with a correctly signed payload — exactly what Stripe
 *                would send after a successful payment.
 *
 * Prerequisites
 *   1. API running (production-like or local settings) with STRIPE_WEBHOOK_SECRET set
 *      and a Stripe API that answers PaymentIntent creation (real test key, or a mock).
 *   2. Storefront built/started with NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
 *   3. Seeded products in stock:  python manage.py seed_catalog && python manage.py seed_products
 *
 * Run
 *   E2E_STRIPE_WEBHOOK_SECRET=whsec_xxx npx playwright test e2e/storefront.spec.ts
 *
 * Env:  E2E_API_URL (default http://localhost:8000)
 *       E2E_STRIPE_WEBHOOK_SECRET (required for the purchase tests; they skip without it)
 *
 * NOTE: the login endpoint is rate limited (10/min per IP). The rate-limit test is
 * deliberately LAST; wait a minute between two full runs.
 */
import { createHmac, randomUUID } from 'node:crypto';
import { test, expect, type APIRequestContext, type Page } from '@playwright/test';

const API = process.env.E2E_API_URL || 'http://localhost:8000';
const WEBHOOK_SECRET = process.env.E2E_STRIPE_WEBHOOK_SECRET;
const PASSWORD = 'Str0ng!Passw0rd#1';

test.describe.configure({ mode: 'serial' });

/* ------------------------------------------------------------------ helpers */

const FAKE_STRIPE_JS = `
window.Stripe = function () {
  var made = {};
  function element() {
    return {
      mount: function (el) { el.innerHTML = '<div data-testid="fake-card">FAKE CARD FIELD</div>'; },
      on: function () {}, off: function () {}, update: function () {},
      destroy: function () {}, unmount: function () {}, focus: function () {}, blur: function () {}, clear: function () {}
    };
  }
  return {
    elements: function () {
      return {
        create: function (type) { made[type] = element(); return made[type]; },
        // real Stripe.js accepts the React component too (elements.getElement(CardElement))
        getElement: function (t) { var k = typeof t === 'function' ? t.__elementType : t; return made[k] || null; },
        update: function () {}, fetchUpdates: function () { return Promise.resolve({}); }
      };
    },
    confirmCardPayment: function (secret) {
      if (window.__stripeDecline) return Promise.resolve({ error: { message: 'Your card was declined.' } });
      return Promise.resolve({ paymentIntent: { id: secret.split('_secret')[0], status: 'succeeded' } });
    },
    // react-stripe-js only accepts an object that looks like a real Stripe instance
    createToken: function () { return Promise.resolve({}); },
    createPaymentMethod: function () { return Promise.resolve({}); },
    registerAppInfo: function () {}, _registerWrapper: function () {}
  };
};
window.Stripe.version = 'endive';`;

/** Next.js adds its own hidden role=alert route announcer — exclude it. */
const alertOf = (page: Page) => page.locator('[role="alert"]:not(#__next-route-announcer__)');

async function stubStripe(page: Page, opts: { decline?: boolean } = {}) {
  if (opts.decline) await page.addInitScript(() => { (window as unknown as Record<string, boolean>).__stripeDecline = true; });
  await page.route(/https:\/\/js\.stripe\.com\/.*/, (route) =>
    route.fulfill({ contentType: 'application/javascript', body: FAKE_STRIPE_JS }),
  );
}

interface Pick { slug: string; name: string }

async function pickInStockProduct(request: APIRequestContext, minStock = 3): Promise<Pick> {
  const list = await (await request.get(`${API}/api/products/?page_size=30`)).json();
  for (const item of list.results) {
    const detail = await (await request.get(`${API}/api/products/${item.slug}/`)).json();
    if (detail.variants?.some((v: { is_active: boolean; available_stock: number }) => v.is_active && v.available_stock >= minStock)) {
      return { slug: detail.slug, name: detail.name };
    }
  }
  throw new Error('No in-stock product found — seed the catalogue first.');
}

/** Two in-stock products with DIFFERENT prices (cheaper first). */
async function pickTwoPricedProducts(request: APIRequestContext): Promise<[Pick, Pick]> {
  const list = await (await request.get(`${API}/api/products/?page_size=30`)).json();
  const seen: Array<{ slug: string; name: string; price: number }> = [];
  for (const item of list.results) {
    const d = await (await request.get(`${API}/api/products/${item.slug}/`)).json();
    const v = d.variants?.find((x: { is_active: boolean; available_stock: number }) => x.is_active && x.available_stock >= 3);
    if (v) seen.push({ slug: d.slug, name: d.name, price: parseFloat(v.price) });
  }
  seen.sort((a, b) => a.price - b.price);
  const cheap = seen[0];
  const dear = seen[seen.length - 1];
  if (!cheap || !dear || cheap.price === dear.price) throw new Error('Need two products with different prices.');
  return [cheap, dear];
}

async function registerUser(request: APIRequestContext) {
  const id = randomUUID().slice(0, 8);
  const user = { username: `e2e_${id}`, email: `e2e_${id}@example.com` };
  const res = await request.post(`${API}/api/accounts/register/`, {
    data: { ...user, password: PASSWORD, password_confirm: PASSWORD, birth_date: '1990-05-05', first_name: 'E2E' },
  });
  expect(res.status(), await res.text()).toBe(201);
  return user;
}

async function addToCartViaUi(page: Page, product: Pick) {
  await page.goto(`/prodotti/${product.slug}`);
  await page.getByRole('button', { name: /Aggiungi al Carrello/ }).click();
  await expect(page.getByLabel(/^Carrello \(1 articoli\)/)).toBeVisible();
  // close the drawer that opens after adding
  await page.getByLabel('Chiudi carrello').click();
}

async function fillCheckout(page: Page, email: string) {
  // by name=: the footer newsletter box also has an "Email"-ish placeholder
  const field = (name: string) => page.locator(`input[name="${name}"]`);
  await field('email').fill(email);
  await field('firstName').fill('Mario');
  await field('lastName').fill('Rossi');
  await field('address').fill('Via Roma 1');
  await field('city').fill('Milano');
  await field('province').fill('MI');
  await field('postalCode').fill('20100');
}

/** Deliver the webhook Stripe would send after a successful payment. */
async function deliverPaymentSucceeded(request: APIRequestContext, paymentIntentId: string) {
  const body = JSON.stringify({
    id: `evt_${randomUUID().replace(/-/g, '').slice(0, 20)}`,
    object: 'event',
    type: 'payment_intent.succeeded',
    data: { object: { id: paymentIntentId, object: 'payment_intent' } },
  });
  const t = Math.floor(Date.now() / 1000);
  const sig = createHmac('sha256', WEBHOOK_SECRET!).update(`${t}.${body}`).digest('hex');
  const res = await request.post(`${API}/api/webhooks/stripe/`, {
    data: body,
    headers: { 'Content-Type': 'application/json', 'Stripe-Signature': `t=${t},v1=${sig}` },
  });
  expect(res.status(), await res.text()).toBe(200);
}

async function payAndConfirm(page: Page, request: APIRequestContext) {
  const checkout = page.waitForResponse((r) => r.url().endsWith('/api/checkout/') && r.request().method() === 'POST');
  await page.getByRole('button', { name: /^Paga €/ }).click();
  const payload = await (await checkout).json();
  await page.waitForURL(/\/checkout\/conferma\?order=/);
  await deliverPaymentSucceeded(request, payload.payment_intent_id);
  return payload as { order: { order_number: string; discount_amount: string; total: string }; payment_intent_id: string };
}

/* -------------------------------------------------------------------- tests */

test.describe('catalogue', () => {
  test('product list renders products coming from the API', async ({ page }) => {
    await page.goto('/prodotti');
    await expect(page.locator('a[href^="/prodotti/"]').first()).toBeVisible();
    expect(await page.locator('a[href^="/prodotti/"]').count()).toBeGreaterThan(1);
  });
});

test.describe('cart + guest checkout', () => {
  test.skip(!WEBHOOK_SECRET, 'set E2E_STRIPE_WEBHOOK_SECRET to run the purchase tests');

  test('guest: add, change quantity, pay, see confirmation, cart is emptied', async ({ page, request }) => {
    const product = await pickInStockProduct(request);
    await stubStripe(page);

    await addToCartViaUi(page, product);
    await page.getByLabel(/^Carrello/).first().click(); // reopen drawer from the header
    await page.getByLabel('Aumenta quantità').click();
    await expect(page.getByLabel(/^Carrello \(2 articoli\)/)).toBeVisible();

    await page.getByRole('link', { name: 'Procedi al Checkout' }).click();
    await expect(page).toHaveURL(/\/checkout$/);
    await expect(page.getByTestId('fake-card')).toBeVisible(); // Stripe card field mounted
    await fillCheckout(page, `guest_${randomUUID().slice(0, 8)}@example.com`);

    const order = await payAndConfirm(page, request);
    await expect(page.getByRole('heading', { name: 'Ordine confermato!' })).toBeVisible({ timeout: 25_000 });
    await expect(page.getByText(order.order.order_number)).toBeVisible();
    expect(parseFloat(order.order.discount_amount)).toBe(0); // guests get no first-purchase discount

    // the confirmation page empties the cart
    await expect(page.locator('header [aria-label^="Carrello"]')).toHaveAttribute('aria-label', 'Carrello', { timeout: 10_000 });
  });

  test('guest: empty shipping fields are rejected before any order is created', async ({ page, request }) => {
    const product = await pickInStockProduct(request);
    await stubStripe(page);
    await addToCartViaUi(page, product);
    await page.goto('/checkout');
    await expect(page.getByTestId('fake-card')).toBeVisible();

    let checkoutCalls = 0;
    page.on('request', (r) => { if (r.url().endsWith('/api/checkout/')) checkoutCalls++; });
    await page.getByRole('button', { name: /^Paga €/ }).click();
    await expect(alertOf(page)).toContainText('Compila tutti i campi');
    expect(checkoutCalls).toBe(0);
  });

  test('declined card: error is shown and the customer stays on checkout', async ({ page, request }) => {
    const product = await pickInStockProduct(request);
    await stubStripe(page, { decline: true });
    await addToCartViaUi(page, product);
    await page.goto('/checkout');
    await fillCheckout(page, `decl_${randomUUID().slice(0, 8)}@example.com`);
    await page.getByRole('button', { name: /^Paga €/ }).click();
    await expect(alertOf(page)).toContainText('declined');
    await expect(page).toHaveURL(/\/checkout$/);
  });

  test('empty cart: /checkout sends the visitor back to the shop', async ({ page }) => {
    await page.goto('/checkout');
    await expect(page).toHaveURL(/\/prodotti/);
  });
});

test.describe('guest cart without cookies', () => {
  test('cart survives deleting every cookie (storefront/API on different domains)', async ({ page, context, request }) => {
    const product = await pickInStockProduct(request);
    await addToCartViaUi(page, product);
    await expect(page.getByLabel(/^Carrello \(1 articoli\)/)).toBeVisible();

    await context.clearCookies();   // what a cross-site cookie ban does to the old design
    await page.reload();
    await expect(page.getByLabel(/^Carrello \(1 articoli\)/)).toBeVisible();   // token lives in localStorage

    const sent = page.waitForRequest((r) => r.url().includes('/api/cart/') && r.method() === 'GET');
    await page.reload();
    expect((await sent).headers()['x-cart-token']).toMatch(/^[0-9a-f]{32}$/);
  });
});

test.describe('welcome discount (10% on ONE product, automatic)', () => {
  test.skip(!WEBHOOK_SECRET, 'needs E2E_STRIPE_WEBHOOK_SECRET');

  test('shown automatically in cart + checkout, charged exactly, only on one product, once', async ({ page, request }) => {
    const [cheap, dear] = await pickTwoPricedProducts(request);
    const user = await registerUser(request);
    await stubStripe(page);

    // fill the cart as a GUEST first (2 x cheap, 1 x dear) — no discount for guests
    await page.goto(`/prodotti/${cheap.slug}`);
    await page.getByRole('button', { name: /Aggiungi al Carrello/ }).click();
    await page.getByLabel('Aumenta quantità').click();
    await page.getByLabel('Chiudi carrello').click();
    await page.goto(`/prodotti/${dear.slug}`);
    await page.getByRole('button', { name: /Aggiungi al Carrello/ }).click();
    await expect(page.getByTestId('cart-discount')).toHaveCount(0);
    await page.getByLabel('Chiudi carrello').click();

    // log in: the guest cart is merged and the discount appears by itself
    const merged = page.waitForResponse((r) => r.url().endsWith('/api/cart/merge/'));
    await page.goto('/login');
    await page.locator('#email').fill(user.email);
    await page.locator('#password').fill(PASSWORD);
    await page.getByRole('button', { name: 'Accedi' }).click();
    const cart = await (await merged).json();

    const unit = (i: { variant_detail: { price: string } }) => parseFloat(i.variant_detail.price);
    const maxUnit = Math.max(...cart.items.map(unit));
    const lines = cart.items.reduce((n: number, i: { quantity: number }) => n + i.quantity, 0);
    expect(lines).toBeGreaterThanOrEqual(3);
    expect(parseFloat(cart.discount.amount)).toBeCloseTo(Math.round(maxUnit * 10) / 100, 2);   // 10% of ONE unit …
    expect(parseFloat(cart.discount.amount)).toBeLessThan(parseFloat(cart.total) * 0.1);        // … NOT of the basket
    expect(cart.discount.product_name).toBe(dear.name);                                        // the most expensive product
    expect(parseFloat(cart.total_after_discount)).toBeCloseTo(parseFloat(cart.total) - parseFloat(cart.discount.amount), 2);

    // the drawer shows it; the checkout summary shows it; the Pay button charges it
    await page.getByLabel(/^Carrello/).first().click();
    await expect(page.getByTestId('cart-discount')).toContainText(dear.name);
    await page.getByLabel('Chiudi carrello').click();
    await page.goto('/checkout');
    await expect(page.getByTestId('checkout-discount')).toBeVisible();
    await expect(page.getByRole('button', { name: new RegExp(`^Paga €${parseFloat(cart.total_after_discount).toFixed(2)}$`) })).toBeVisible();

    await fillCheckout(page, user.email);
    const order = await payAndConfirm(page, request);
    expect(order.order.discount_amount).toBe(cart.discount.amount);
    expect(order.order.total).toBe(cart.total_after_discount);                 // charged == what the cart promised
    await expect(page.getByRole('heading', { name: 'Ordine confermato!' })).toBeVisible({ timeout: 25_000 });

    // the discount is used up: the next cart has none
    await addToCartViaUi(page, cheap);
    await page.getByLabel(/^Carrello/).first().click();
    await expect(page.getByTestId('cart-discount')).toHaveCount(0);
  });
});

test.describe('newsletter unsubscribe link', () => {
  test('a forged or missing token shows the invalid-link page and unsubscribes nobody', async ({ page }) => {
    await page.goto('/newsletter/annulla-iscrizione?token=not-a-real-token');
    await page.getByRole('button', { name: 'Conferma annullamento' }).click();
    await expect(page.getByRole('heading', { name: 'Link non valido' })).toBeVisible();

    await page.goto('/newsletter/annulla-iscrizione');
    await expect(page.getByRole('heading', { name: 'Link non valido' })).toBeVisible();
  });

  test('a real signed link unsubscribes after an explicit click', async ({ page }) => {
    const token = process.env.E2E_UNSUBSCRIBE_TOKEN;   // python manage.py shell -c "from apps.newsletter.tokens import make_unsubscribe_token as m; print(m('x@example.com'))"
    test.skip(!token, 'set E2E_UNSUBSCRIBE_TOKEN (signed token for an existing subscriber)');
    await page.goto(`/newsletter/annulla-iscrizione?token=${encodeURIComponent(token!)}`);
    await expect(page.getByRole('heading', { name: "Annulla l'iscrizione" })).toBeVisible();   // nothing happened yet
    await page.getByRole('button', { name: 'Conferma annullamento' }).click();
    await expect(page.getByRole('heading', { name: 'Iscrizione annullata' })).toBeVisible();
  });
});


test.describe('account', () => {
  test('login with a wrong password shows the right message', async ({ page, request }) => {
    const user = await registerUser(request);
    await page.goto('/login');
    await page.locator('#email').fill(user.email);
    await page.locator('#password').fill('definitely-wrong');
    await page.getByRole('button', { name: 'Accedi' }).click();
    await expect(alertOf(page)).toContainText('Email o password non corretti');
  });

  test('login with EMAIL merges the guest cart, 10% first-purchase discount, order history', async ({ page, request }) => {
    test.skip(!WEBHOOK_SECRET, 'needs E2E_STRIPE_WEBHOOK_SECRET');
    const user = await registerUser(request);
    const product = await pickInStockProduct(request);
    await stubStripe(page);

    await addToCartViaUi(page, product); // guest cart first
    await page.goto('/login');
    await page.locator('#email').fill(user.email.toUpperCase()); // case-insensitive
    await page.locator('#password').fill(PASSWORD);
    await page.getByRole('button', { name: 'Accedi' }).click();
    await expect(page).toHaveURL(/\/account/);
    await expect(page.getByLabel(/^Carrello \(1 articoli\)/)).toBeVisible(); // guest cart was merged

    await page.goto('/checkout');
    await fillCheckout(page, user.email);
    const order = await payAndConfirm(page, request);
    expect(parseFloat(order.order.discount_amount)).toBeGreaterThan(0);

    await expect(page.getByRole('heading', { name: 'Ordine confermato!' })).toBeVisible({ timeout: 25_000 });
    await page.goto('/account/ordini');
    await expect(page.getByRole('heading', { name: 'I miei ordini' })).toBeVisible();
    await expect(page.getByText(order.order.order_number)).toBeVisible();
  });

  test('wishlist: toggle persists across reload and appears on /wishlist', async ({ page, request }) => {
    const user = await registerUser(request);
    await page.goto('/login');
    await page.locator('#email').fill(user.email);
    await page.locator('#password').fill(PASSWORD);
    await page.getByRole('button', { name: 'Accedi' }).click();
    await expect(page).toHaveURL(/\/account/);

    await page.goto('/prodotti');
    await page.getByLabel('Aggiungi ai preferiti').first().click();
    await expect(page.getByLabel('Rimuovi dai preferiti').first()).toBeVisible();

    await page.reload();
    await expect(page.getByLabel('Rimuovi dai preferiti').first()).toBeVisible();
    await page.goto('/wishlist');
    await expect(page.getByRole('heading', { name: 'La tua Lista Desideri' })).toBeVisible();
    await expect(page.getByText('Lista desideri vuota')).toHaveCount(0);
  });

  test('logout revokes the session on the server (refresh token unusable)', async ({ page, request }) => {
    const user = await registerUser(request);
    await page.goto('/login');
    await page.locator('#email').fill(user.email);
    await page.locator('#password').fill(PASSWORD);
    await page.getByRole('button', { name: 'Accedi' }).click();
    await expect(page).toHaveURL(/\/account/);
    const refresh = await page.evaluate(() => localStorage.getItem('gb_refresh_token'));
    expect(refresh).toBeTruthy();

    await page.getByRole('button', { name: 'Esci' }).click();
    // logout() awaits the API call and only then redirects home — wait for that
    await expect(page).toHaveURL(/localhost:3000\/?$/);
    expect(await page.evaluate(() => localStorage.getItem('gb_refresh_token'))).toBeNull();
    const res = await request.post(`${API}/api/accounts/token/refresh/`, { data: { refresh } });
    expect(res.status()).toBe(401);
  });

  // KEEP LAST: this burns the per-IP login budget (10/min).
  test('rate limit: too many login attempts shows the dedicated message (not "wrong password")', async ({ page, request }) => {
    for (let i = 0; i < 12; i++) {
      await request.post(`${API}/api/accounts/login/`, { data: { email: 'nobody@example.com', password: `bad${i}` } });
    }
    await page.goto('/login');
    await page.locator('#email').fill('nobody@example.com');
    await page.locator('#password').fill('bad');
    await page.getByRole('button', { name: 'Accedi' }).click();
    await expect(alertOf(page)).toContainText('Troppi tentativi');
  });
});
