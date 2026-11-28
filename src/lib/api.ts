import type {
  PaginatedResponse, Product, ProductListItem, Category, Cart, Order,
  User, Address, AuthTokens, WishlistItem, Review, CheckoutResponse, FirstPurchaseDiscount,
  EnquirySubmission, EnquirySubmissionResponse,
  PublicHeroImage, PublicInstagramGrid, PublicTestimonial,
} from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/* ---------------------------------------------------------------------------
   Guest cart token
   The guest cart is identified by a random token kept in localStorage and sent
   as the X-Cart-Token header — NOT by a cookie. A cookie set by the API is a
   third-party cookie when the storefront and the API are on different domains,
   which browsers drop or block (SameSite=Lax, Safari ITP, Firefox ETP).
   ------------------------------------------------------------------------- */
const CART_TOKEN_KEY = 'gb_cart_token';

export function getCartToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    let token = localStorage.getItem(CART_TOKEN_KEY);
    if (!token || !/^[0-9a-f]{32}$/.test(token)) {
      token = crypto.randomUUID().replace(/-/g, '');   // 122 random bits
      localStorage.setItem(CART_TOKEN_KEY, token);
    }
    return token;
  } catch {
    return null;   // storage blocked: the API falls back to its cookie session
  }
}

export function clearCartToken(): void {
  if (typeof window === 'undefined') return;
  try { localStorage.removeItem(CART_TOKEN_KEY); } catch { /* ignore */ }
}

/** Endpoints that act on the cart of the current visitor. */
const usesCartToken = (endpoint: string) =>
  endpoint.startsWith('/api/cart/') || endpoint.startsWith('/api/checkout/');

let accessToken: string | null = null;
export function setAccessToken(token: string | null) { accessToken = token; }
export function getAccessToken(): string | null { return accessToken; }

class ApiError extends Error {
  status: number;
  data: unknown;
  constructor(status: number, data: unknown) {
    super(`API Error ${status}`);
    this.status = status;
    this.data = data;
  }
}
export { ApiError };

/**
 * Turn any thrown error into one human readable string.
 * Understands both backend error shapes:
 *   { error: { code, detail } }                 (custom exception handler)
 *   { field: ["message", ...], ... }            (DRF validation errors)
 */
export function apiErrorMessage(err: unknown, fallback = 'Si è verificato un errore. Riprova.'): string {
  if (!(err instanceof ApiError)) return fallback;
  const data = err.data as Record<string, unknown> | null;
  if (!data || typeof data !== 'object') return fallback;
  const inner = (data as { error?: { detail?: unknown } }).error;
  if (inner && inner.detail !== undefined) {
    return Array.isArray(inner.detail) ? String(inner.detail[0]) : String(inner.detail);
  }
  const firstKey = Object.keys(data)[0];
  if (!firstKey) return fallback;
  const value = data[firstKey];
  const text = Array.isArray(value) ? String(value[0]) : String(value);
  return firstKey === 'detail' ? text : `${firstKey}: ${text}`;
}

async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = API_BASE + endpoint;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;
  if (usesCartToken(endpoint)) {
    const cartToken = getCartToken();
    if (cartToken) headers['X-Cart-Token'] = cartToken;
  }
  // credentials: 'include' is kept only for the legacy cookie fallback and the admin
  // session; guest carts no longer depend on it.
  const res = await fetch(url, { ...options, headers, credentials: 'include' });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new ApiError(res.status, data);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

/** DRF may or may not paginate a list endpoint — always hand the UI a plain array. */
function unwrap<T>(res: T[] | PaginatedResponse<T>): T[] {
  return Array.isArray(res) ? res : res.results ?? [];
}

export const catalog = {
  // DRF applies DEFAULT_PAGINATION_CLASS globally (config/settings/base.py),
  // so /api/categories/ returns { count, next, previous, results } — not a bare array.
  categories: async (): Promise<Category[]> => {
    const res = await apiFetch<Category[] | PaginatedResponse<Category>>('/api/categories/');
    return unwrap(res);
  },
  products: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiFetch<PaginatedResponse<ProductListItem>>(`/api/products/${qs}`);
  },
  product: (slug: string) => apiFetch<Product>(`/api/products/${slug}/`),
};

/* ---------------------------------------------------------------------------
   Cart
   Backend: /api/cart/, /api/cart/items/, /api/cart/items/{id}/, /api/cart/merge/
   The backend nests the variant under `variant_detail` and puts product_name /
   product_slug / primary_image on the item. The UI components expect everything
   under `item.variant`, so the response is normalised here (one place) instead
   of editing every component.
   ------------------------------------------------------------------------- */
interface RawCartItem {
  id: number;
  variant: number;
  variant_detail: {
    id: number;
    metal: string;
    metal_display: string;
    size: string;
    sku: string;
    price: string;
    available_stock: number;
    is_active: boolean;
  };
  product_name: string;
  product_slug: string;
  quantity: number;
  line_total: string;
  primary_image: string | null;
}
interface RawCart {
  id: number | null;
  items: RawCartItem[];
  total: string;
  item_count: number;
  discount?: Cart['discount'];
  total_after_discount?: string;
}

function normalizeCart(raw: RawCart): Cart {
  return {
    id: raw.id,
    total: raw.total,
    item_count: raw.item_count,
    discount: raw.discount ?? null,
    total_after_discount: raw.total_after_discount ?? raw.total,
    items: (raw.items ?? []).map((item) => ({
      id: item.id,
      quantity: item.quantity,
      line_total: item.line_total,
      reservation_expires_at: '',
      variant: {
        id: item.variant_detail.id,
        metal: item.variant_detail.metal as Cart['items'][number]['variant']['metal'],
        metal_display: item.variant_detail.metal_display,
        size: item.variant_detail.size,
        sku: item.variant_detail.sku,
        price: item.variant_detail.price,
        price_override: null,
        stock_quantity: item.variant_detail.available_stock,
        available_stock: item.variant_detail.available_stock,
        is_active: item.variant_detail.is_active,
        product_name: item.product_name,
        product_slug: item.product_slug,
        image_url: item.primary_image ?? undefined,
      },
    })),
  };
}

export const cart = {
  get: async (): Promise<Cart> => normalizeCart(await apiFetch<RawCart>('/api/cart/')),
  addItem: async (variantId: number, quantity: number): Promise<Cart> =>
    normalizeCart(await apiFetch<RawCart>('/api/cart/items/', {
      method: 'POST',
      body: JSON.stringify({ variant_id: variantId, quantity }),
    })),
  updateItem: async (itemId: number, quantity: number): Promise<Cart> =>
    normalizeCart(await apiFetch<RawCart>(`/api/cart/items/${itemId}/`, {
      method: 'PATCH',
      body: JSON.stringify({ quantity }),
    })),
  removeItem: async (itemId: number): Promise<Cart> =>
    normalizeCart(await apiFetch<RawCart>(`/api/cart/items/${itemId}/`, { method: 'DELETE' })),
  clear: async (): Promise<Cart> =>
    normalizeCart(await apiFetch<RawCart>('/api/cart/', { method: 'DELETE' })),
  /** Authenticated only. The guest cart is found via the session cookie. */
  merge: async (): Promise<Cart> => {
    const merged = normalizeCart(await apiFetch<RawCart>('/api/cart/merge/', {
      method: 'POST',
      body: JSON.stringify({}),
    }));
    // The guest cart now lives in the account: forget the guest token so the next
    // logged-out visit starts a fresh, empty guest cart.
    clearCartToken();
    return merged;
  },
};

/* ---------------------------------------------------------------------------
   Orders / checkout
   One call, POST /api/checkout/, creates the order AND the Stripe PaymentIntent
   and returns { order, client_secret, payment_intent_id }.
   ------------------------------------------------------------------------- */
export interface CheckoutPayload {
  email: string;
  idempotency_key?: string;
  notes?: string;
  shipping_address: {
    first_name: string;
    last_name: string;
    line1: string;
    line2?: string;
    city: string;
    province: string;
    postal_code: string;
    country: string;
    phone?: string;
  };
}

export const orders = {
  checkout: (data: CheckoutPayload) =>
    apiFetch<CheckoutResponse>('/api/checkout/', { method: 'POST', body: JSON.stringify(data) }),
  list: async (): Promise<Order[]> =>
    unwrap(await apiFetch<Order[] | PaginatedResponse<Order>>('/api/orders/')),
  detail: (orderNumber: string) => apiFetch<Order>(`/api/orders/${orderNumber}/`),
  /** For guests (no account): order number + the email used at checkout. */
  guestLookup: (orderNumber: string, email: string) =>
    apiFetch<Order>('/api/orders/lookup/', {
      method: 'POST',
      body: JSON.stringify({ order_number: orderNumber, email }),
    }),
};

export const auth = {
  // The backend accepts { email | username, password } on this endpoint.
  login: (email: string, password: string) =>
    apiFetch<AuthTokens>('/api/accounts/login/', {
      method: 'POST', body: JSON.stringify({ email, password }),
    }),
  register: (data: Record<string, string>) =>
    apiFetch<{ user: User; tokens: AuthTokens }>('/api/accounts/register/', {
      method: 'POST', body: JSON.stringify(data),
    }),
  // Needs the Bearer token, otherwise the backend answers 401 and never revokes the refresh token.
  logout: (refresh: string) =>
    apiFetch<void>('/api/accounts/logout/', { method: 'POST', body: JSON.stringify({ refresh }) }),
  me: () => apiFetch<User>('/api/accounts/me/'),
  addresses: async (): Promise<Address[]> =>
    unwrap(await apiFetch<Address[] | PaginatedResponse<Address>>('/api/accounts/addresses/')),
  createAddress: (data: Omit<Address, 'id' | 'created_at'>) =>
    apiFetch<Address>('/api/accounts/addresses/', { method: 'POST', body: JSON.stringify(data) }),
  firstPurchaseDiscount: () =>
    apiFetch<FirstPurchaseDiscount>('/api/accounts/first-purchase-discount/'),
  requestPasswordReset: (email: string) =>
    apiFetch<void>('/api/accounts/password/reset/', {
      method: 'POST', body: JSON.stringify({ email }),
    }),
  confirmPasswordReset: (
    uid: string,
    token: string,
    newPassword: string,
    newPasswordConfirm: string,
  ) =>
    apiFetch<{ detail: string }>('/api/accounts/password/reset/confirm/', {
      method: 'POST',
      body: JSON.stringify({
        uid,
        token,
        new_password: newPassword,
        new_password_confirm: newPasswordConfirm,
      }),
    }),
};

/* Wishlist — backend returns { id, product: <id>, product_detail: {...} } */
interface RawWishlistItem {
  id: number;
  product: number;
  product_detail: ProductListItem;
  created_at: string;
}

export const wishlist = {
  list: async (): Promise<WishlistItem[]> => {
    const rows = unwrap(await apiFetch<RawWishlistItem[] | PaginatedResponse<RawWishlistItem>>('/api/wishlist/'));
    return rows.map((row) => ({ id: row.id, created_at: row.created_at, product: row.product_detail }));
  },
  toggle: (productId: number) =>
    apiFetch<{ wishlisted: boolean; product_id: number }>('/api/wishlist/toggle/', {
      method: 'POST', body: JSON.stringify({ product_id: productId }),
    }),
};

/* Reviews — nested under the product slug on the backend */
interface RawReview {
  id: number;
  username: string;
  first_name: string;
  rating: Review['rating'];
  title: string;
  body: string;
  created_at: string;
}
const toReview = (r: RawReview): Review => ({
  id: r.id,
  user_name: r.first_name || r.username,
  rating: r.rating,
  title: r.title,
  body: r.body,
  created_at: r.created_at,
});

export const reviews = {
  list: async (productSlug: string): Promise<Review[]> =>
    unwrap(await apiFetch<RawReview[] | PaginatedResponse<RawReview>>(`/api/products/${productSlug}/reviews/`)).map(toReview),
  create: async (
    productSlug: string,
    data: { rating: number; title: string; body: string },
  ): Promise<Review> => {
    const res = await apiFetch<{ message: string; review: RawReview }>(
      `/api/products/${productSlug}/reviews/create/`,
      { method: 'POST', body: JSON.stringify(data) },
    );
    return toReview(res.review);
  },
};

export const newsletter = {
  subscribe: (email: string) =>
    apiFetch<{ message: string }>('/api/newsletter/subscribe/', {
      method: 'POST', body: JSON.stringify({ email }),
    }),
  /** `token` is the signed value from the unsubscribe link in a newsletter e-mail. */
  unsubscribe: (token: string) =>
    apiFetch<{ message: string }>('/api/newsletter/unsubscribe/', {
      method: 'POST', body: JSON.stringify({ token }),
    }),
};

export const enquiries = {
  create: (data: EnquirySubmission) =>
    apiFetch<EnquirySubmissionResponse>('/api/enquiries/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

export const siteContent = {
  hero: async (): Promise<PublicHeroImage[]> => {
    const response = await apiFetch<PaginatedResponse<PublicHeroImage>>(
      '/api/site-content/hero/?page_size=100&ordering=sort_order',
    );
    return response.results;
  },
  instagram: () => apiFetch<PublicInstagramGrid>('/api/site-content/instagram/'),
  testimonials: async (): Promise<PublicTestimonial[]> => {
    const response = await apiFetch<PaginatedResponse<PublicTestimonial>>(
      '/api/site-content/testimonials/?page_size=100',
    );
    return response.results;
  },
};
