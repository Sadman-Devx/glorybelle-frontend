import { adminApi } from '@/lib/adminApi';
import type { AdminMediaAsset } from '@/lib/adminProducts';
import type { PaginatedResponse } from '@/lib/types';

export type AdminContentMedia = Pick<
  AdminMediaAsset,
  'id' | 'url_400' | 'url_800' | 'url_1600' | 'alt_text'
>;

export interface AdminHeroImage {
  id: number;
  media_asset_id: number;
  media: AdminContentMedia;
  sort_order: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdminInstagramSlot {
  media_asset_id: number;
  media: AdminContentMedia;
}

export interface AdminInstagramGrid {
  link: string;
  images: (AdminInstagramSlot | null)[];
}

export interface AdminTestimonial {
  id: number;
  name: string;
  quote: string;
  photo_asset_id: number;
  photo: AdminContentMedia;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdminTestimonialWrite {
  name: string;
  quote: string;
  photo_asset_id: number;
  active: boolean;
}

function queryString(params: Record<string, string | number | undefined>) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') query.set(key, String(value));
  });
  return query.toString();
}

export const adminSiteContentApi = {
  heroes: (search: string, page: number) => {
    const query = queryString({
      search,
      page,
      page_size: 25,
      ordering: 'sort_order',
    });
    return adminApi.request<PaginatedResponse<AdminHeroImage>>(
      `proxy/content/hero/?${query}`,
    );
  },
  createHero: (data: { media_asset_id: number; active: boolean; sort_order?: number }) =>
    adminApi.request<AdminHeroImage>('proxy/content/hero/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateHero: (id: number, data: Partial<Pick<AdminHeroImage, 'media_asset_id' | 'sort_order' | 'active'>>) =>
    adminApi.request<AdminHeroImage>(`proxy/content/hero/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteHero: (id: number) =>
    adminApi.request<void>(`proxy/content/hero/${id}/`, { method: 'DELETE' }),
  instagram: () => adminApi.request<AdminInstagramGrid>('proxy/content/instagram/'),
  saveInstagram: (link: string, imageAssetIds: (number | null)[]) =>
    adminApi.request<AdminInstagramGrid>('proxy/content/instagram/', {
      method: 'PUT',
      body: JSON.stringify({ link, image_asset_ids: imageAssetIds }),
    }),
  testimonials: (search: string, page: number) => {
    const query = queryString({
      search,
      page,
      page_size: 25,
      ordering: '-created_at',
    });
    return adminApi.request<PaginatedResponse<AdminTestimonial>>(
      `proxy/content/testimonials/?${query}`,
    );
  },
  createTestimonial: (data: AdminTestimonialWrite) =>
    adminApi.request<AdminTestimonial>('proxy/content/testimonials/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateTestimonial: (id: number, data: Partial<AdminTestimonialWrite>) =>
    adminApi.request<AdminTestimonial>(`proxy/content/testimonials/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteTestimonial: (id: number) =>
    adminApi.request<void>(`proxy/content/testimonials/${id}/`, { method: 'DELETE' }),
};
