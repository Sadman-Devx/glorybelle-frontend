import { adminApi } from '@/lib/adminApi';
import type { PaginatedResponse } from '@/lib/types';

export type AdminEnquiryStatus = 'new' | 'in_progress' | 'answered' | 'closed';
export type AdminEnquiryTopic = 'prodotto' | 'ordine' | 'atelier' | 'altro';
export type AdminAtelierType = 'anelli' | 'collane' | 'orecchini';

export interface AdminEnquiryNote {
  id: number;
  body: string;
  author_id: number | null;
  author_name: string | null;
  created_at: string;
}

export interface AdminEnquiry {
  id: number;
  name: string;
  email: string;
  topic: AdminEnquiryTopic;
  topic_label: string;
  atelier_type: AdminAtelierType | '';
  status: AdminEnquiryStatus;
  status_label: string;
  assigned_to: number | null;
  assigned_to_name: string | null;
  created_at: string;
  updated_at: string;
  message?: string;
  internal_notes?: AdminEnquiryNote[];
}

export interface AdminEnquiryAssignee {
  id: number;
  name: string;
  email: string;
}

export interface AdminEnquiryListParams {
  status?: AdminEnquiryStatus;
  search?: string;
  page?: number;
  page_size?: number;
  ordering?: string;
}

function queryString(params: object): string {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && String(value).length > 0) query.set(key, String(value));
  });
  const result = query.toString();
  return result ? `?${result}` : '';
}

export const adminEnquiriesApi = {
  list: (params: AdminEnquiryListParams = {}) =>
    adminApi.request<PaginatedResponse<AdminEnquiry>>(
      `proxy/enquiries/${queryString(params)}`,
    ),
  detail: (id: number) =>
    adminApi.request<AdminEnquiry>(`proxy/enquiries/${id}/`),
  update: (id: number, data: { status?: AdminEnquiryStatus; assigned_to?: number | null }) =>
    adminApi.request<AdminEnquiry>(`proxy/enquiries/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  addNote: (id: number, body: string) =>
    adminApi.request<AdminEnquiryNote>(`proxy/enquiries/${id}/notes/`, {
      method: 'POST',
      body: JSON.stringify({ body }),
    }),
  assignees: (pageSize = 100) =>
    adminApi.request<PaginatedResponse<AdminEnquiryAssignee>>(
      `proxy/enquiries/assignees/${queryString({ page: 1, page_size: pageSize })}`,
    ),
  newCount: async () => {
    const response = await adminEnquiriesApi.list({
      status: 'new',
      page: 1,
      page_size: 1,
    });
    return response.count;
  },
};

export const enquiryStatusLabels: Record<AdminEnquiryStatus, string> = {
  new: 'Nuova',
  in_progress: 'In lavorazione',
  answered: 'Risposta inviata',
  closed: 'Chiusa',
};
