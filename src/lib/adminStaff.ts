import { adminApi } from '@/lib/adminApi';
import type { AdminRole } from '@/lib/adminApi';
import type { PaginatedResponse } from '@/lib/types';

export type StaffRole = Extract<AdminRole, 'manager' | 'viewer'>;

export interface AdminStaffUser {
  id: number;
  email: string;
  name: string;
  role: AdminRole | null;
  is_active: boolean;
  is_superuser: boolean;
  date_joined: string;
}

export interface AdminStaffInvite {
  email: string;
  first_name: string;
  last_name: string;
  role: StaffRole;
}

export interface StaffRoleAudit {
  id: number;
  target_email: string;
  from_role: string;
  to_role: string;
  changed_by_email: string;
  created_at: string;
}

function queryString(params: Record<string, string | number | undefined>) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') query.set(key, String(value));
  });
  return query.toString();
}

export const adminStaffApi = {
  list: (search: string, isActive: string, page: number) => {
    const query = queryString({
      search,
      is_active: isActive,
      page,
      page_size: 25,
      ordering: 'email',
    });
    return adminApi.request<PaginatedResponse<AdminStaffUser>>(
      `proxy/staff/?${query}`,
    );
  },
  invite: (data: AdminStaffInvite) =>
    adminApi.request<AdminStaffUser>('proxy/staff/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  changeRole: (id: number, role: StaffRole) =>
    adminApi.request<AdminStaffUser>(`proxy/staff/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    }),
  deactivate: (id: number) =>
    adminApi.request<AdminStaffUser>(`proxy/staff/${id}/deactivate/`, {
      method: 'POST',
    }),
  sendPasswordLink: (id: number) =>
    adminApi.request<{ detail: string }>(`proxy/staff/${id}/password-link/`, {
      method: 'POST',
    }),
  roleAudit: (search: string, page: number) => {
    const query = queryString({
      search,
      page,
      page_size: 10,
      ordering: '-created_at',
    });
    return adminApi.request<PaginatedResponse<StaffRoleAudit>>(
      `proxy/staff/role-audit/?${query}`,
    );
  },
};
