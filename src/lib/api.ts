import type {
  PaginatedResponse, Product, ProductListItem, Category, Cart, Order,
  User, Address, AuthTokens, WishlistItem, Review, PaymentIntent,
} from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

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

async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = API_BASE + endpoint;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;
  const res = await fetch(url, { ...options, headers, credentials: 'include' });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new ApiError(res.status, data);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const catalog = {
  categories: () => apiFetch<Category[]>('/api/categories/'),
  products: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiFetch<PaginatedResponse<ProductListItem>>(`/api/products/${qs}`);
  },
  product: (slug: string) => apiFetch<Product>(`/api/products/${slug}/`),
};

export const cart = {
  get: (sessionKey?: string) => {
    const qs = sessionKey ? `?session_key=${sessionKey}` : '';
    return apiFetch<Cart>(`/api/cart/${qs}`);
  },
  addItem: (variantId: number, quantity: number, sessionKey?: string) =>
    apiFetch<Cart>('/api/cart/add/', {
      method: 'POST',
      body: JSON.stringify({ variant_id: variantId, quantity, session_key: sessionKey }),
    }),
  updateItem: (itemId: number, quantity: number) =>
    apiFetch<Cart>(`/api/cart/update/${itemId}/`, {
      method: 'PATCH', body: JSON.stringify({ quantity }),
    }),
  removeItem: (itemId: number) =>
    apiFetch<Cart>(`/api/cart/remove/${itemId}/`, { method: 'DELETE' }),
  merge: (sessionKey: string) =>
    apiFetch<Cart>('/api/cart/merge/', {
      method: 'POST', body: JSON.stringify({ session_key: sessionKey }),
    }),
};

export const orders = {
  create: (data: Record<string, unknown>) =>
    apiFetch<Order>('/api/orders/create/', { method: 'POST', body: JSON.stringify(data) }),
  list: () => apiFetch<Order[]>('/api/orders/'),
  detail: (orderNumber: string) => apiFetch<Order>(`/api/orders/${orderNumber}/`),
};

export const payments = {
  createIntent: (orderId: number) =>
    apiFetch<PaymentIntent>('/api/payments/create-intent/', {
      method: 'POST', body: JSON.stringify({ order_id: orderId }),
    }),
};

export const auth = {
  login: (email: string, password: string) =>
    apiFetch<AuthTokens>('/api/accounts/login/', {
      method: 'POST', body: JSON.stringify({ email, password }),
    }),
  register: (data: Record<string, string>) =>
    apiFetch<AuthTokens>('/api/accounts/register/', { method: 'POST', body: JSON.stringify(data) }),
  me: () => apiFetch<User>('/api/accounts/me/'),
  addresses: () => apiFetch<Address[]>('/api/accounts/addresses/'),
  createAddress: (data: Omit<Address, 'id'>) =>
    apiFetch<Address>('/api/accounts/addresses/', { method: 'POST', body: JSON.stringify(data) }),
};

export const wishlist = {
  list: () => apiFetch<WishlistItem[]>('/api/wishlist/'),
  toggle: (productId: number) =>
    apiFetch<{ status: string }>(`/api/wishlist/toggle/${productId}/`, { method: 'POST' }),
};

export const reviews = {
  list: (productSlug: string) => apiFetch<Review[]>(`/api/reviews/?product=${productSlug}`),
  create: (data: { product: number; rating: number; title: string; body: string }) =>
    apiFetch<Review>('/api/reviews/', { method: 'POST', body: JSON.stringify(data) }),
};

export const newsletter = {
  subscribe: (email: string) =>
    apiFetch<{ status: string }>('/api/newsletter/subscribe/', {
      method: 'POST', body: JSON.stringify({ email }),
    }),
};
