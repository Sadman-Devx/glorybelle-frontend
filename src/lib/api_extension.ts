/**
 * GLORYBELLE Frontend — API client extensions for first-purchase discount.
 *
 * Adds a new `auth.firstPurchaseDiscount()` method that calls the backend
 * /api/accounts/first-purchase-discount/ endpoint. Used by the cart drawer
 * + checkout to show the 10% discount offer to guests.
 */

// Append this to your existing src/lib/api.ts file:

// In the existing `auth` object, add this method:
//   firstPurchaseDiscount: () => apiFetch<FirstPurchaseDiscount>('/api/accounts/first-purchase-discount/'),

// And add this type to src/lib/types.ts:
//   export interface FirstPurchaseDiscount {
//     eligible: boolean;
//     percent: string;
//     message: string;
//   }

// Full updated auth section:

export const auth = {
  login: (email: string, password: string) =>
    apiFetch<AuthTokens>('/api/accounts/login/', {
      method: 'POST', body: JSON.stringify({ email, password }),
    }),
  register: (data: Record<string, unknown>) =>
    apiFetch<AuthTokens>('/api/accounts/register/', { method: 'POST', body: JSON.stringify(data) }),
  me: () => apiFetch<User>('/api/accounts/me/'),
  logout: (refreshToken: string) =>
    apiFetch<void>('/api/accounts/logout/', {
      method: 'POST',
      body: JSON.stringify({ refresh: refreshToken }),
    }),
  addresses: () => apiFetch<Address[]>('/api/accounts/addresses/'),
  createAddress: (data: Omit<Address, 'id'>) =>
    apiFetch<Address>('/api/accounts/addresses/', { method: 'POST', body: JSON.stringify(data) }),
  // NEW — first-purchase discount eligibility
  firstPurchaseDiscount: () =>
    apiFetch<FirstPurchaseDiscount>('/api/accounts/first-purchase-discount/'),
};

// Type definition (add to src/lib/types.ts):
// export interface FirstPurchaseDiscount {
//   eligible: boolean;
//   percent: string;
//   message: string;
// }
