import { adminApi } from '@/lib/adminApi';
import type { PaginatedResponse } from '@/lib/types';

export type AdminMetal = 'gold' | 'rose' | 'silver';
export type AdminGem =
  | 'diamond'
  | 'emerald'
  | 'ruby'
  | 'sapphire'
  | 'amethyst'
  | 'none';

export interface AdminCategory {
  id: number;
  name: string;
  slug: string;
  is_active: boolean;
}

export interface AdminProductImage {
  id: number;
  media_id: number | null;
  image: string | null;
  image_alt: string | null;
  alt_text: string;
  is_primary: boolean;
  sort_order: number;
}

export interface AdminProductVariant {
  id: number;
  product_id: number;
  metal: AdminMetal;
  size: string;
  sku: string;
  price_override: string | null;
  price: string;
  stock_quantity: number;
  reserved_quantity: number;
  available_stock: number;
  is_active: boolean;
}

export interface AdminProduct {
  id: number;
  name: string;
  slug: string;
  description: string;
  category: number;
  category_name: string;
  base_price: string;
  metal: AdminMetal;
  gem: AdminGem;
  purity: string;
  is_active: boolean;
  is_featured: boolean;
  variants: AdminProductVariant[];
  images: AdminProductImage[];
}

export interface AdminMediaAsset {
  id: number;
  url_400: string;
  url_800: string;
  url_1600: string;
  original_size_bytes: number;
  width: number;
  height: number;
  alt_text: string;
  usage_count: number;
  created_at: string;
}

export interface AdminProductListParams {
  search?: string;
  category?: string;
  is_active?: string;
  page: number;
  page_size: number;
  ordering: string;
}

export interface AdminMediaPresign {
  upload_id: number;
  upload_url: string;
  method: 'PUT';
  headers: Record<string, string>;
  expires_in: number;
}

export interface AdminProductWrite {
  name: string;
  slug: string;
  description: string;
  category: number;
  base_price: string;
  metal: AdminMetal;
  gem: AdminGem;
  purity: string;
  is_active: boolean;
  is_featured: boolean;
}

export interface AdminVariantWrite {
  metal: AdminMetal;
  size: string;
  sku: string;
  price_override: string | null;
  stock_quantity: number;
  is_active: boolean;
}

function queryString(params: object) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (typeof value === 'string' && value) query.set(key, value);
    else if (typeof value === 'number') query.set(key, String(value));
  });
  return query.toString();
}

export const adminProductsApi = {
  categories: () =>
    adminApi.request<PaginatedResponse<AdminCategory>>(
      'proxy/categories/?page_size=100&ordering=name',
    ),
  list: (params: AdminProductListParams) => {
    const query = queryString(params);
    return adminApi.request<PaginatedResponse<AdminProduct>>(
      `proxy/products/${query ? `?${query}` : ''}`,
    );
  },
  detail: (id: number) => adminApi.request<AdminProduct>(`proxy/products/${id}/`),
  create: (product: AdminProductWrite) =>
    adminApi.request<AdminProduct>('proxy/products/', {
      method: 'POST',
      body: JSON.stringify(product),
    }),
  update: (id: number, product: AdminProductWrite) =>
    adminApi.request<AdminProduct>(`proxy/products/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(product),
    }),
  setActive: (id: number, isActive: boolean) =>
    adminApi.request<AdminProduct>(`proxy/products/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify({ is_active: isActive }),
    }),
  createVariant: (productId: number, variant: AdminVariantWrite) =>
    adminApi.request<AdminProductVariant>(`proxy/products/${productId}/variants/`, {
      method: 'POST',
      body: JSON.stringify(variant),
    }),
  updateVariant: (productId: number, variantId: number, variant: AdminVariantWrite) =>
    adminApi.request<AdminProductVariant>(
      `proxy/products/${productId}/variants/${variantId}/`,
      {
        method: 'PATCH',
        body: JSON.stringify(variant),
      },
    ),
  removeVariant: (productId: number, variantId: number) =>
    adminApi.request<void>(`proxy/products/${productId}/variants/${variantId}/`, {
      method: 'DELETE',
    }),
  setGallery: (productId: number, mediaIds: number[], primaryMediaId: number | null) =>
    adminApi.request<AdminProductImage[]>(
      `proxy/products/${productId}/images/`,
      {
        method: 'PUT',
        body: JSON.stringify({
          media_ids: mediaIds,
          primary_media_id: primaryMediaId,
        }),
      },
    ),
  listMedia: (search: string, page: number) => {
    const query = queryString({
      search: search || undefined,
      page: String(page),
      page_size: '24',
      ordering: '-created_at',
    });
    return adminApi.request<PaginatedResponse<AdminMediaAsset>>(
      `proxy/media/?${query}`,
    );
  },
  deleteMedia: (id: number) =>
    adminApi.request<void>(`proxy/media/${id}/`, { method: 'DELETE' }),
  presign: (contentType: string, sizeBytes: number) =>
    adminApi.request<AdminMediaPresign>('proxy/media/presign/', {
      method: 'POST',
      body: JSON.stringify({ content_type: contentType, size_bytes: sizeBytes }),
    }),
  registerUpload: (uploadId: number, altText: string) =>
    adminApi.request<AdminMediaAsset>('proxy/media/', {
      method: 'POST',
      body: JSON.stringify({ upload_id: uploadId, alt_text: altText }),
    }),
};

export function formatProductMoney(value: string | number): string {
  const amount = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(amount)) return '—';
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}
