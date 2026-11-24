import { createHmac } from 'node:crypto';
import { expect, test, type Page } from '@playwright/test';

const adminEmail = process.env.E2E_ADMIN_EMAIL;
const adminPassword = process.env.E2E_ADMIN_PASSWORD;
const adminTotpSecret = process.env.E2E_ADMIN_TOTP_SECRET;
const viewerEmail = process.env.E2E_VIEWER_EMAIL;
const viewerPassword = process.env.E2E_VIEWER_PASSWORD;
const viewerTotpSecret = process.env.E2E_VIEWER_TOTP_SECRET;
const usedTotpSteps = new Map<string, number>();

function decodeBase32(secret: string): Buffer {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];
  for (const character of secret.replace(/[\s=-]/g, '').toUpperCase()) {
    const digit = alphabet.indexOf(character);
    if (digit < 0) throw new Error('E2E TOTP secret must be Base32.');
    value = (value << 5) | digit;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

async function nextTotpCode(secret: string): Promise<string> {
  let step = Math.floor(Date.now() / 30_000);
  const previous = usedTotpSteps.get(secret) ?? -1;
  while (step <= previous) {
    await new Promise((resolve) => setTimeout(resolve, 500));
    step = Math.floor(Date.now() / 30_000);
  }
  usedTotpSteps.set(secret, step);
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(step));
  const digest = createHmac('sha1', decodeBase32(secret)).update(counter).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const binary = digest.readUInt32BE(offset) & 0x7fffffff;
  return String(binary % 1_000_000).padStart(6, '0');
}

async function loginAs(
  page: Page,
  credentials: { email?: string; password?: string; totp?: string },
) {
  if (!credentials.email || !credentials.password || !credentials.totp) {
    test.skip(true, 'Configura le credenziali E2E e il secret TOTP staff.');
  }
  const email = credentials.email!;
  const password = credentials.password!;
  const totpSecret = credentials.totp!;
  await page.goto('/admin/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Accedi' }).click();
  const codeField = page.getByLabel('Codice di verifica o di recupero');
  await expect(codeField).toBeVisible();
  await codeField.fill(await nextTotpCode(totpSecret));
  await page.getByRole('button', { name: 'Conferma e accedi' }).click();
  await expect(page).toHaveURL(/\/admin\/?$/);
}

test('first enrollment confirms TOTP and reveals one-time recovery codes', async ({ page }) => {
  await page.route('**/api/admin/me', (route) => route.fulfill({
    status: 401,
    contentType: 'application/json',
    body: JSON.stringify({ error: { detail: 'Sessione amministrativa scaduta.' } }),
  }));
  await page.route('**/api/admin/login', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      mfa_required: true,
      purpose: 'enroll',
      challenge: 'test-enrollment-challenge',
      secret: 'JBSWY3DPEHPK3PXP',
      provisioning_uri: 'otpauth://totp/GLORYBELLE:test',
    }),
  }));
  await page.route('**/api/admin/mfa/verify', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      user: {
        id: 1,
        email: 'manager@glorybelle.test',
        name: 'Manager test',
        role: 'manager',
        permissions: ['orders:read', 'orders:write'],
      },
      recovery_codes: ['AAAAAA-BBBBBB', 'CCCCCC-DDDDDD'],
    }),
  }));

  const response = await page.goto('/admin/login');
  expect(response?.headers()['content-security-policy']).toContain("frame-ancestors 'none'");
  await page.getByLabel('Email').fill('manager@glorybelle.test');
  await page.getByLabel('Password').fill('password-di-test');
  await page.getByRole('button', { name: 'Accedi' }).click();
  await expect(page.getByText('JBSWY3DPEHPK3PXP')).toBeVisible();
  await page.getByLabel('Codice di verifica o di recupero').fill('123456');
  await page.getByRole('button', { name: 'Conferma e accedi' }).click();
  await expect(page.getByRole('heading', { name: 'Codici di recupero' })).toBeVisible();
  await expect(page.getByText('AAAAAA-BBBBBB')).toBeVisible();
});

test('staff login requires and accepts a TOTP code', async ({ page }) => {
  await loginAs(page, {
    email: adminEmail,
    password: adminPassword,
    totp: adminTotpSecret,
  });
  await expect(page.getByRole('link', { name: 'Ordini' })).toBeVisible();
});

test('manager changes an order status', async ({ page }) => {
  test.skip(!process.env.E2E_ORDER_NUMBER, 'Configura E2E_ORDER_NUMBER con un ordine pending di test.');
  await loginAs(page, {
    email: adminEmail,
    password: adminPassword,
    totp: adminTotpSecret,
  });
  await page.goto(`/admin/ordini/${encodeURIComponent(process.env.E2E_ORDER_NUMBER!)}`);
  await page.getByLabel('Aggiorna stato').selectOption('paid');
  await page.getByRole('button', { name: 'Aggiorna stato' }).click();
  await expect(page.getByText('Pagato').first()).toBeVisible();
});

test('paid test order cancellation requests a Stripe test-mode refund', async ({ page }) => {
  test.skip(
    !process.env.E2E_REFUND_ORDER_NUMBER
      || !process.env.E2E_STRIPE_SECRET_KEY?.startsWith('sk_test_'),
    'Richiede un ordine pagato di test e E2E_STRIPE_SECRET_KEY in modalità test.',
  );
  await loginAs(page, {
    email: adminEmail,
    password: adminPassword,
    totp: adminTotpSecret,
  });
  await page.goto(`/admin/ordini/${encodeURIComponent(process.env.E2E_REFUND_ORDER_NUMBER!)}`);
  await page.getByRole('button', { name: 'Annulla ordine' }).click();
  await page.getByLabel('Motivo dell’annullamento (obbligatorio)').fill(
    'Test E2E: rimborso in modalità Stripe test.',
  );
  await page.getByRole('button', { name: 'Conferma annullamento' }).click();
  await expect(page.getByText('Annullato').first()).toBeVisible();
});

test('manager uploads a product image', async ({ page }) => {
  await loginAs(page, {
    email: adminEmail,
    password: adminPassword,
    totp: adminTotpSecret,
  });
  await page.goto('/admin/prodotti/nuovo');
  await page.getByLabel('Seleziona immagini da caricare').setInputFiles({
    name: 'e2e-test.png',
    mimeType: 'image/png',
    buffer: Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lS8AAAAASUVORK5CYII=',
      'base64',
    ),
  });
  await expect(page.getByRole('status', { name: 'Caricata' })).toBeVisible({
    timeout: 120_000,
  });
});

test('viewer cannot access the superuser staff endpoint', async ({ page }) => {
  await loginAs(page, {
    email: viewerEmail,
    password: viewerPassword,
    totp: viewerTotpSecret,
  });
  const response = await page.request.get('/api/admin/proxy/staff/');
  expect(response.status()).toBe(403);
});
