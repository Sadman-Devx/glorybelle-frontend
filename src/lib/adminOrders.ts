import { adminApi } from '@/lib/adminApi';
import type { PaginatedResponse } from '@/lib/types';

export type OrderStatus =
  | 'pending'
  | 'paid'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export interface AdminOrderItem {
  id: number;
  product_name: string;
  variant_info: string;
  variant_metal_display?: string;
  variant_size?: string;
  sku?: string;
  quantity: number;
  unit_price: string;
  line_total: string;
}

export interface AdminOrderNote {
  id: string | number;
  text: string;
  author_name?: string;
  created_at: string;
}

export interface AdminOrderEvent {
  status: string;
  status_display?: string;
  note?: string;
  created_at: string;
}

export interface AdminOrder {
  id: number;
  order_number: string;
  status: OrderStatus;
  status_display?: string;
  total: string;
  email: string;
  created_at: string;
  items: AdminOrderItem[];
  shipping_name?: string;
  shipping_first_name?: string;
  shipping_last_name?: string;
  shipping_address?: string;
  shipping_line1?: string;
  shipping_line2?: string;
  shipping_city?: string;
  shipping_postal_code?: string;
  shipping_province?: string;
  shipping_country?: string;
  phone?: string;
  payment_method?: string;
  payment_status?: string;
  paid_at?: string;
  tracking_number?: string;
  notes?: AdminOrderNote[];
  status_history?: AdminOrderEvent[];
}

export interface AdminOrderListParams {
  status?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
  page: number;
  page_size: number;
  ordering: string;
}

export interface AdminDashboardData {
  today_orders: number;
  revenue_last_7_days: string | number;
  revenue_last_30_days: string | number;
  orders_by_status: Array<{ status: string; count: number }>;
  low_stock_variants: Array<{
    id: number;
    sku: string;
    product_name: string;
    metal: string;
    size: string;
    stock_quantity: number;
    reserved_quantity: number;
    available_stock: number;
  }>;
}

export const adminOrdersApi = {
  dashboard: () => adminApi.request<AdminDashboardData>('proxy/dashboard/'),
  list: (params: AdminOrderListParams) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) query.set(key, String(value));
    });
    return adminApi.request<PaginatedResponse<AdminOrder> | AdminOrder[]>(
      `proxy/orders/?${query.toString()}`,
    );
  },
  detail: (orderNumber: string) =>
    adminApi.request<AdminOrder>(`proxy/orders/${encodeURIComponent(orderNumber)}/`),
  changeStatus: (orderNumber: string, status: OrderStatus, trackingNumber?: string) =>
    adminApi.request<void>(`proxy/orders/${encodeURIComponent(orderNumber)}/status/`, {
      method: 'PATCH',
      body: JSON.stringify({
        status,
        ...(trackingNumber ? { tracking_number: trackingNumber } : {}),
      }),
    }),
  cancel: (orderNumber: string, reason: string) =>
    adminApi.request<void>(`proxy/orders/${encodeURIComponent(orderNumber)}/cancel/`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
  addNote: (orderNumber: string, text: string) =>
    adminApi.request<AdminOrderNote>(`proxy/orders/${encodeURIComponent(orderNumber)}/notes/`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    }),
  archive: (orderNumber: string) =>
    adminApi.request<void>(`proxy/orders/${encodeURIComponent(orderNumber)}/archive/`, {
      method: 'POST',
    }),
};

export const orderStatusLabels: Record<OrderStatus, string> = {
  pending: 'In attesa',
  paid: 'Pagato',
  processing: 'In preparazione',
  shipped: 'Spedito',
  delivered: 'Consegnato',
  cancelled: 'Annullato',
  refunded: 'Rimborsato',
};

export function formatAdminMoney(value: string | number): string {
  const amount = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(amount)) return '—';
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

export function formatAdminDate(value: string, includeTime = false): string {
  return new Intl.DateTimeFormat('it-IT', {
    timeZone: 'Europe/Rome',
    dateStyle: 'medium',
    ...(includeTime ? { timeStyle: 'short' as const } : {}),
  }).format(new Date(value));
}
